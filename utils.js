export const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export const slugify = (value = "") =>
  String(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const formatCurrency = (value = "") => {
  if (!value) return "Unspecified";
  if (/[₹$]/.test(value)) return value;
  const numeric = Number(String(value).replace(/[^\d.]/g, ""));
  if (Number.isNaN(numeric) || numeric <= 0) return value;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(numeric);
};

export const formatDate = (value) => {
  if (!value) return "Rolling";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date);
};

export const timeAgo = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently posted";
  const diff = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.floor(diff / 60000));
  if (minutes < 60) return `Posted ${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Posted ${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `Posted ${days} day${days === 1 ? "" : "s"} ago`;
};

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const groupBy = (items, selector) =>
  items.reduce((accumulator, item) => {
    const key = selector(item);
    accumulator[key] ||= [];
    accumulator[key].push(item);
    return accumulator;
  }, {});

export const normalizeText = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

export const stripHtml = (value = "") =>
  String(value).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

export const toSentenceCase = (value = "") =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : "";

export const buildId = (prefix = "id") =>
  `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

export const unique = (items) => [...new Set(items.filter(Boolean))];

export const parseJsonBody = async (request) => {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  return JSON.parse(raw);
};

export const parseFormBody = async (request) => {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return Object.fromEntries(new URLSearchParams(raw));
};

export const sendJson = (response, statusCode, payload) => {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(payload));
};

export const sendRedirect = (response, location) => {
  response.writeHead(302, { Location: location });
  response.end();
};

export const readRequestBody = async (request) => {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
};

