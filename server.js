import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { URL } from "node:url";
import { pathToFileURL } from "node:url";
import { config } from "./lib/config.js";
import { createSignedCookie, clearCookie, readSignedCookie } from "./lib/session.js";
import {
  createInternship,
  findUser,
  getAdminSummary,
  getInternshipBySlug,
  getInternships,
  listInternships,
  approveInternship
} from "./lib/store.js";
import {
  parseFormBody,
  parseJsonBody,
  readRequestBody,
  sendJson,
  sendRedirect
} from "./lib/utils.js";
import { renderAdminPage } from "./pages/admin.js";
import { renderDetailPage } from "./pages/detail.js";
import { renderHomePage } from "./pages/home.js";
import { renderInternshipsPage } from "./pages/internships.js";
import { renderPremiumPage } from "./pages/premium.js";
import { handlePaymentWebhook, activatePremium, verifyRazorpaySignature } from "./services/monetization.js";
import { runAutomationPipeline } from "./services/automation/pipeline.js";
import { processTelegramUpdate } from "./services/telegram.js";

const serveStatic = async (response, pathname) => {
  const safePath = path.normalize(path.join(config.publicDir, pathname.replace(/^\/+/, "")));
  if (!safePath.startsWith(config.publicDir)) {
    response.writeHead(403);
    response.end("Forbidden");
    return true;
  }

  try {
    const buffer = await fs.readFile(safePath);
    const extension = path.extname(safePath);
    const contentType =
      {
        ".css": "text/css; charset=utf-8",
        ".js": "application/javascript; charset=utf-8",
        ".svg": "image/svg+xml"
      }[extension] || "application/octet-stream";
    response.writeHead(200, { "Content-Type": contentType });
    response.end(buffer);
    return true;
  } catch {
    return false;
  }
};

const sendHtml = (response, html) => {
  response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  response.end(html);
};

const sendNotFound = (response) => {
  response.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
  response.end("<h1>Not found</h1>");
};

const getMemberTier = (request) =>
  readSignedCookie(request.headers.cookie, "lexintern_member")?.tier || "free";

const isAdmin = (request) =>
  readSignedCookie(request.headers.cookie, "lexintern_admin")?.role === "admin";

const filterOptionsFromItems = (items) => ({
  locations: [...new Set(items.map((item) => item.location))].sort(),
  practiceAreas: [...new Set(items.map((item) => item.practice_area))].sort(),
  workModes: [...new Set(items.map((item) => item.work_mode))].sort()
});

const getStats = async () => {
  const items = await getInternships();
  return {
    students: 500,
    approved: items.filter((item) => item.status === "approved").length,
    sources: 18
  };
};

export const server = http.createServer(async (request, response) => {
  const currentUrl = new URL(request.url, config.siteUrl);
  const pathname = currentUrl.pathname;
  const tier = getMemberTier(request);

  if (pathname.startsWith("/styles.css") || pathname.startsWith("/app.js") || pathname.startsWith("/favicon.svg")) {
    const served = await serveStatic(response, pathname);
    if (served) return;
  }

  if (pathname === "/robots.txt") {
    response.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    response.end(`User-agent: *\nAllow: /\nSitemap: ${config.siteUrl}/sitemap.xml`);
    return;
  }

  if (pathname === "/sitemap.xml") {
    const internships = await getInternships();
    const urls = [
      "",
      "/internships",
      "/premium",
      ...internships.filter((item) => item.status === "approved").map((item) => `/internships/${item.slug}`)
    ];
    response.writeHead(200, { "Content-Type": "application/xml; charset=utf-8" });
    response.end(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `<url><loc>${config.siteUrl}${url}</loc></url>`).join("")}
</urlset>`);
    return;
  }

  if (pathname === "/health") {
    return sendJson(response, 200, { ok: true, service: "lexintern" });
  }

  if (request.method === "GET" && pathname === "/") {
    const latest = await listInternships({
      status: "approved",
      page: 1,
      limit: 6,
      tier,
      includePremium: true
    });
    const stats = await getStats();
    return sendHtml(response, renderHomePage({ latest: latest.items, stats, tier }));
  }

  if (request.method === "GET" && pathname === "/internships") {
    const filters = {
      status: "approved",
      page: 1,
      limit: 9,
      location: currentUrl.searchParams.get("location") || "",
      practice_area: currentUrl.searchParams.get("practice_area") || "",
      work_mode: currentUrl.searchParams.get("work_mode") || "",
      paid: currentUrl.searchParams.get("paid") || "",
      tier,
      includePremium: true
    };
    const result = await listInternships(filters);
    const filterOptions = filterOptionsFromItems(
      (await getInternships()).filter((item) => item.status === "approved")
    );
    return sendHtml(
      response,
      renderInternshipsPage({
        ...result,
        filters,
        filterOptions,
        tier
      })
    );
  }

  if (request.method === "GET" && pathname.startsWith("/internships/")) {
    const slug = pathname.split("/").pop();
    const internship = await getInternshipBySlug(slug);
    if (!internship || internship.status !== "approved") return sendNotFound(response);
    const related = (
      await listInternships({
        status: "approved",
        page: 1,
        limit: 3,
        tier,
        includePremium: true
      })
    ).items.filter((item) => item.slug !== internship.slug);
    return sendHtml(response, renderDetailPage({ internship, related, tier }));
  }

  if (request.method === "GET" && pathname === "/premium") {
    const stats = await getAdminSummary();
    return sendHtml(response, renderPremiumPage({ stats, tier }));
  }

  if (request.method === "GET" && pathname === "/admin") {
    const authenticated = isAdmin(request);
    const summary = authenticated ? await getAdminSummary() : null;
    const all = authenticated ? await getInternships() : [];
    return sendHtml(
      response,
      renderAdminPage({
        authenticated,
        summary,
        pending: all.filter((item) => item.status === "pending").slice(0, 8),
        recent: all.slice(0, 8)
      })
    );
  }

  if (request.method === "POST" && pathname === "/admin/login") {
    const form = await parseFormBody(request);
    if (form.token !== config.adminToken) {
      return sendRedirect(response, "/admin");
    }
    response.writeHead(302, {
      Location: "/admin",
      "Set-Cookie": createSignedCookie("lexintern_admin", { role: "admin" })
    });
    response.end();
    return;
  }

  if (request.method === "POST" && pathname === "/admin/logout") {
    response.writeHead(302, {
      Location: "/admin",
      "Set-Cookie": clearCookie("lexintern_admin")
    });
    response.end();
    return;
  }

  if (request.method === "GET" && pathname === "/api/internships") {
    const filters = {
      status: "approved",
      page: Number(currentUrl.searchParams.get("page") || 1),
      limit: Number(currentUrl.searchParams.get("limit") || 9),
      location: currentUrl.searchParams.get("location") || "",
      practice_area: currentUrl.searchParams.get("practice_area") || "",
      work_mode: currentUrl.searchParams.get("work_mode") || "",
      paid: currentUrl.searchParams.get("paid") || "",
      tier,
      includePremium: true
    };
    const result = await listInternships(filters);
    return sendJson(response, 200, result);
  }

  if (request.method === "POST" && pathname === "/api/admin/internships") {
    if (!isAdmin(request)) return sendJson(response, 401, { ok: false, message: "Unauthorized" });
    const body = await parseJsonBody(request);
    const internship = await createInternship({
      ...body,
      is_premium: body.is_premium === true || body.is_premium === "true",
      is_paid: body.is_paid === true || body.is_paid === "true",
      tags: body.tags || []
    });
    return sendJson(response, 201, { ok: true, internship });
  }

  if (request.method === "POST" && pathname.startsWith("/api/admin/internships/") && pathname.endsWith("/approve")) {
    if (!isAdmin(request)) return sendJson(response, 401, { ok: false, message: "Unauthorized" });
    const id = pathname.split("/")[4];
    const internship = await approveInternship(id);
    return sendJson(response, 200, { ok: true, internship });
  }

  if (request.method === "POST" && pathname === "/api/automation/run") {
    if (!isAdmin(request)) return sendJson(response, 401, { ok: false, message: "Unauthorized" });
    const summary = await runAutomationPipeline();
    return sendJson(response, 200, { ok: true, summary });
  }

  if (request.method === "POST" && pathname === "/api/telegram/webhook") {
    const body = await parseJsonBody(request);
    const result = await processTelegramUpdate(body);
    return sendJson(response, 200, { ok: true, result });
  }

  if (request.method === "POST" && pathname === "/api/premium/access") {
    const body = await parseJsonBody(request);
    const user = await findUser({
      email: body.email || "",
      telegram_handle: body.telegram_handle || ""
    });

    if (!user || user.tier !== "premium") {
      return sendJson(response, 404, {
        ok: false,
        message: "Premium record not found yet. Use the same email or Telegram handle from checkout."
      });
    }

    response.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Set-Cookie": createSignedCookie("lexintern_member", {
        tier: "premium",
        email: user.email || "",
        telegram_handle: user.telegram_handle || ""
      })
    });
    response.end(JSON.stringify({ ok: true, message: "Premium access activated." }));
    return;
  }

  if (request.method === "POST" && pathname === "/api/payments/razorpay") {
    const payloadBuffer = await readRequestBody(request);
    const signature = request.headers["x-razorpay-signature"];
    if (!verifyRazorpaySignature(payloadBuffer, signature)) {
      return sendJson(response, 401, { ok: false, message: "Invalid signature" });
    }
    const payload = JSON.parse(payloadBuffer.toString("utf8") || "{}");
    const result = await handlePaymentWebhook(payload);
    return sendJson(response, result.ok ? 200 : 400, result);
  }

  if (request.method === "POST" && pathname === "/api/premium/manual-activate") {
    if (!isAdmin(request)) return sendJson(response, 401, { ok: false, message: "Unauthorized" });
    const body = await parseJsonBody(request);
    const user = await activatePremium(body);
    return sendJson(response, 200, { ok: true, user });
  }

  return sendNotFound(response);
});

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  server.listen(config.port, () => {
    console.log(`LexIntern running on ${config.siteUrl.replace(/:\d+$/, `:${config.port}`)}`);
  });
}
