import { normalizeText, slugify, unique } from "./utils.js";

const includeKeywords = [
  "law",
  "legal",
  "intern",
  "internship",
  "litigation",
  "advocate",
  "corporate",
  "compliance",
  "research",
  "arbitration",
  "contract",
  "ipr",
  "intellectual property"
];

const excludeKeywords = [
  "software engineer",
  "developer",
  "marketing",
  "sales",
  "nurse",
  "graphic designer",
  "data entry",
  "full stack"
];

const indiaKeywords = [
  "india",
  "delhi",
  "mumbai",
  "bengaluru",
  "bangalore",
  "kolkata",
  "chennai",
  "hyderabad",
  "pune",
  "gurugram",
  "noida",
  "remote"
];

const paidKeywords = ["stipend", "paid", "monthly", "per month", "rs", "₹"];

export const detectPaidStipend = (value = "") => {
  const normalized = normalizeText(value);
  const numeric = Number(String(value).replace(/[^\d.]/g, ""));
  return paidKeywords.some((keyword) => normalized.includes(keyword)) || numeric > 0;
};

export const isRelevantOpportunity = (candidate) => {
  const haystack = normalizeText(
    [candidate.title, candidate.company, candidate.summary, candidate.description].join(" ")
  );
  const hasIncludeKeyword = includeKeywords.some((keyword) => haystack.includes(keyword));
  const hasExcludeKeyword = excludeKeywords.some((keyword) => haystack.includes(keyword));
  return hasIncludeKeyword && !hasExcludeKeyword;
};

export const isIndiaOpportunity = (candidate) => {
  const haystack = normalizeText(
    [candidate.location, candidate.title, candidate.summary, candidate.description].join(" ")
  );
  return indiaKeywords.some((keyword) => haystack.includes(keyword));
};

export const normalizeCandidate = (candidate) => {
  const normalizedTitle = candidate.title?.trim() || "Law Internship Opportunity";
  const normalizedCompany = candidate.company?.trim() || "Verified Employer";
  return {
    ...candidate,
    title: normalizedTitle,
    company: normalizedCompany,
    slug:
      candidate.slug ||
      slugify(`${normalizedTitle}-${normalizedCompany}-${candidate.location || "india"}`),
    location: candidate.location || "India",
    tags: unique(candidate.tags || []),
    is_paid:
      typeof candidate.is_paid === "boolean"
        ? candidate.is_paid
        : detectPaidStipend(candidate.stipend || ""),
    posted_at: candidate.posted_at || candidate.created_at || new Date().toISOString(),
    created_at: candidate.created_at || new Date().toISOString()
  };
};

export const dedupeListings = (items) => {
  const seen = new Set();
  return items.filter((item) => {
    const signature = normalizeText(
      item.link || `${item.title}-${item.company}-${item.location}`
    );
    if (seen.has(signature)) return false;
    seen.add(signature);
    return true;
  });
};

export const scoreOpportunity = (candidate) => {
  let score = 0;
  const haystack = normalizeText(
    [candidate.title, candidate.company, candidate.summary, candidate.description].join(" ")
  );

  includeKeywords.forEach((keyword) => {
    if (haystack.includes(keyword)) score += 8;
  });

  if (isIndiaOpportunity(candidate)) score += 16;
  if (candidate.source_type === "law-firm") score += 20;
  if (candidate.source_type === "telegram-forward") score += 10;
  if (candidate.is_paid) score += 7;
  if (normalizeText(candidate.work_mode || "").includes("remote")) score += 6;

  const ageHours =
    (Date.now() - new Date(candidate.posted_at || candidate.created_at).getTime()) / 3600000;
  if (!Number.isNaN(ageHours)) {
    score += Math.max(0, 20 - ageHours);
  }

  return Math.min(100, Math.round(score));
};

export const inferPracticeArea = (candidate) => {
  const haystack = normalizeText(
    [candidate.title, candidate.summary, candidate.description].join(" ")
  );
  if (haystack.includes("corporate") || haystack.includes("contract")) return "Corporate Law";
  if (haystack.includes("litigation") || haystack.includes("advocate")) return "Litigation";
  if (haystack.includes("research")) return "Research";
  if (
    haystack.includes("ipr") ||
    haystack.includes("intellectual property") ||
    haystack.includes("privacy") ||
    haystack.includes("technology") ||
    haystack.includes("tech ")
  ) {
    return "Tech / IP";
  }
  if (haystack.includes("policy") || haystack.includes("human rights")) return "Policy / Rights";
  return "General";
};

export const inferWorkMode = (candidate) => {
  const haystack = normalizeText([candidate.location, candidate.summary].join(" "));
  if (haystack.includes("remote") || haystack.includes("wfh")) return "Remote";
  if (haystack.includes("hybrid")) return "Hybrid";
  return "On-site";
};

export const deriveUrgencyTag = (candidate) => {
  const deadline = new Date(candidate.deadline);
  if (!Number.isNaN(deadline.getTime())) {
    const daysLeft = (deadline.getTime() - Date.now()) / 86400000;
    if (daysLeft <= 3) return "Closing Soon";
  }
  const posted = new Date(candidate.posted_at || candidate.created_at);
  if (!Number.isNaN(posted.getTime())) {
    const hours = (Date.now() - posted.getTime()) / 3600000;
    if (hours <= 24) return "New";
  }
  return "";
};
