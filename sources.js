import { config } from "../../lib/config.js";
import { getManualFeed } from "../../lib/store.js";
import { normalizeText, stripHtml } from "../../lib/utils.js";

const extractAnchors = (html, sourceUrl) => {
  const matches = [...html.matchAll(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
  return matches
    .map((match) => {
      const link = new URL(match[1], sourceUrl).toString();
      const title = stripHtml(match[2]);
      return { link, title };
    })
    .filter((item) => item.title && item.link);
};

const inferLocationFromText = (value) => {
  const haystack = normalizeText(value);
  if (haystack.includes("remote")) return "Remote / India";
  if (haystack.includes("delhi")) return "Delhi NCR";
  if (haystack.includes("mumbai")) return "Mumbai, Maharashtra";
  if (haystack.includes("bengaluru") || haystack.includes("bangalore")) return "Bengaluru, Karnataka";
  if (haystack.includes("hyderabad")) return "Hyderabad, Telangana";
  if (haystack.includes("gurugram") || haystack.includes("gurgaon")) return "Gurugram, Haryana";
  return "India";
};

export const fetchLawFirmCareerPages = async () => {
  const results = [];
  for (const url of config.lawFirmCareerUrls) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      const html = await response.text();
      const anchors = extractAnchors(html, url)
        .filter((item) =>
          /(law|legal|intern|litigation|research|associate)/i.test(item.title)
        )
        .slice(0, 12)
        .map((item) => ({
          title: item.title,
          company: new URL(url).hostname.replace("www.", "").split(".")[0].toUpperCase(),
          location: inferLocationFromText(item.title),
          stipend: "As per policy",
          deadline: "",
          link: item.link,
          source: url,
          source_type: "law-firm",
          summary: "Imported from a law firm careers page.",
          description: `Career page mention captured from ${url}.`,
          tags: ["Verified Source"]
        }));

      results.push(...anchors);
    } catch {
      continue;
    }
  }
  return results;
};

export const fetchGoogleCustomSearchResults = async () => {
  if (!config.googleApiKey || !config.googleCseId) return [];
  const queries = [
    "law internship India apply",
    "legal internship India remote",
    "law internship India site:firm"
  ];
  const results = [];

  for (const query of queries) {
    const url = new URL("https://www.googleapis.com/customsearch/v1");
    url.searchParams.set("key", config.googleApiKey);
    url.searchParams.set("cx", config.googleCseId);
    url.searchParams.set("q", query);
    url.searchParams.set("num", "10");

    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      const payload = await response.json();
      const items = payload.items || [];

      results.push(
        ...items.map((item) => ({
          title: item.title,
          company: item.displayLink || "Search Discovery",
          location: inferLocationFromText(`${item.title} ${item.snippet}`),
          stipend: "Check listing",
          deadline: "",
          link: item.link,
          source: "google-custom-search",
          source_type: "search",
          summary: item.snippet,
          description: item.snippet,
          tags: ["Search Discovery"]
        }))
      );
    } catch {
      continue;
    }
  }

  return results;
};

export const fetchTelegramForwardJsonFeeds = async () => {
  const results = [];

  for (const url of config.telegramForwardJsonUrls) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      const payload = await response.json();
      const items = Array.isArray(payload) ? payload : payload.items || [];
      results.push(
        ...items.map((item) => ({
          title: item.title,
          company: item.company || "Telegram Source",
          location: item.location || inferLocationFromText(item.text || item.title),
          stipend: item.stipend || "Mentioned in post",
          deadline: item.deadline || "",
          link: item.link,
          source: url,
          source_type: "telegram-forward",
          summary: item.text || item.summary || "",
          description: item.text || item.summary || "",
          tags: ["Telegram Forward"]
        }))
      );
    } catch {
      continue;
    }
  }

  return results;
};

export const fetchManualCurationFeed = async () => {
  const items = await getManualFeed();
  return items.map((item) => ({
    title: item.title,
    company: item.company,
    location: item.location || inferLocationFromText(item.title),
    stipend: item.stipend || "Check listing",
    deadline: item.deadline || "",
    link: item.link,
    source: item.source || "manual-curation",
    source_type: "manual-feed",
    summary: item.summary || "",
    description: item.description || item.summary || "",
    tags: ["Curated"]
  }));
};

