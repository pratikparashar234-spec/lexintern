import fs from "node:fs/promises";
import path from "node:path";
import { config } from "./config.js";
import {
  dedupeListings,
  detectPaidStipend,
  deriveUrgencyTag,
  inferPracticeArea,
  inferWorkMode,
  normalizeCandidate,
  scoreOpportunity
} from "./filters.js";
import { buildId, unique } from "./utils.js";

const filePath = (name) => path.join(config.dataDir, name);

const readJson = async (name, fallback) => {
  try {
    const content = await fs.readFile(filePath(name), "utf8");
    return JSON.parse(content);
  } catch {
    return fallback;
  }
};

const writeJson = async (name, value) => {
  const target = filePath(name);
  const temp = `${target}.tmp`;
  await fs.writeFile(temp, JSON.stringify(value, null, 2), "utf8");
  await fs.rename(temp, target);
};

export const getInternships = async () => {
  const internships = await readJson("internships.json", []);
  return internships
    .map((item) => ({
      ...item,
      practice_area: item.practice_area || inferPracticeArea(item),
      work_mode: item.work_mode || inferWorkMode(item),
      auto_score: item.auto_score || scoreOpportunity(item),
      badge: item.badge || deriveUrgencyTag(item),
      is_paid: item.is_paid || detectPaidStipend(item.stipend),
      tags: unique(item.tags || [])
    }))
    .sort((a, b) => new Date(b.posted_at || b.created_at) - new Date(a.posted_at || a.created_at));
};

export const saveInternships = async (items) => writeJson("internships.json", dedupeListings(items));

export const getUsers = async () => readJson("users.json", []);
export const saveUsers = async (items) => writeJson("users.json", items);
export const getManualFeed = async () => readJson("manual-feed.json", []);
export const saveManualFeed = async (items) => writeJson("manual-feed.json", items);

export const listInternships = async (filters = {}) => {
  const internships = await getInternships();
  const filtered = internships.filter((item) => {
    if (filters.status && item.status !== filters.status) return false;
    if (filters.location && item.location !== filters.location) return false;
    if (filters.practice_area && item.practice_area !== filters.practice_area) return false;
    if (filters.work_mode && item.work_mode !== filters.work_mode) return false;
    if (filters.paid === "paid" && !item.is_paid) return false;
    if (filters.paid === "unpaid" && item.is_paid) return false;
    if (!filters.includePremium && item.is_premium && filters.tier !== "premium") return false;
    return true;
  });

  const page = Number(filters.page || 1);
  const limit = Number(filters.limit || 9);
  const start = (page - 1) * limit;
  const items = filtered.slice(start, start + limit);

  return {
    items,
    total: filtered.length,
    page,
    hasMore: start + limit < filtered.length
  };
};

export const getInternshipBySlug = async (slug) => {
  const internships = await getInternships();
  return internships.find((item) => item.slug === slug) || null;
};

export const createInternship = async (input, options = {}) => {
  const internships = await getInternships();
  const normalized = normalizeCandidate({
    ...input,
    id: input.id || buildId("intern"),
    source: input.source || options.source || "manual-curation",
    source_type: input.source_type || options.source_type || "manual",
    status: input.status || options.status || "approved",
    practice_area: input.practice_area || inferPracticeArea(input),
    work_mode: input.work_mode || inferWorkMode(input),
    auto_score: input.auto_score || scoreOpportunity(input),
    badge: input.badge || deriveUrgencyTag(input),
    alerts: input.alerts || {
      premium_sent_at: null,
      free_sent_at: null
    }
  });

  internships.unshift(normalized);
  await saveInternships(internships);
  return normalized;
};

export const updateInternship = async (id, updates) => {
  const internships = await getInternships();
  const updated = internships.map((item) =>
    item.id === id
      ? normalizeCandidate({
          ...item,
          ...updates,
          updated_at: new Date().toISOString()
        })
      : item
  );
  await saveInternships(updated);
  return updated.find((item) => item.id === id) || null;
};

export const approveInternship = async (id) =>
  updateInternship(id, { status: "approved", approved_at: new Date().toISOString() });

export const addAutomationCandidates = async (candidates) => {
  const internships = await getInternships();
  const existingKeys = new Set(
    internships.map((item) => (item.link || `${item.title}-${item.company}`).toLowerCase())
  );
  const created = [];

  for (const candidate of candidates) {
    const key = (candidate.link || `${candidate.title}-${candidate.company}`).toLowerCase();
    if (existingKeys.has(key)) continue;
    const score = candidate.auto_score || scoreOpportunity(candidate);
    const sourceType = candidate.source_type || "search";
    const status = sourceType === "law-firm" || score >= 88 ? "approved" : "pending";

    const normalized = normalizeCandidate({
      ...candidate,
      id: buildId("intern"),
      source_type: sourceType,
      status,
      practice_area: inferPracticeArea(candidate),
      work_mode: inferWorkMode(candidate),
      auto_score: score,
      badge: deriveUrgencyTag(candidate),
      alerts: { premium_sent_at: null, free_sent_at: null }
    });

    created.push(normalized);
    internships.unshift(normalized);
    existingKeys.add(key);
  }

  if (created.length) await saveInternships(internships);
  return created;
};

export const markAlertSent = async (id, tier) => {
  const internships = await getInternships();
  const now = new Date().toISOString();
  const updated = internships.map((item) => {
    if (item.id !== id) return item;
    return {
      ...item,
      alerts: {
        ...item.alerts,
        [tier === "premium" ? "premium_sent_at" : "free_sent_at"]: now
      }
    };
  });
  await saveInternships(updated);
};

export const getAdminSummary = async () => {
  const internships = await getInternships();
  const users = await getUsers();
  return {
    totalInternships: internships.length,
    approvedInternships: internships.filter((item) => item.status === "approved").length,
    pendingInternships: internships.filter((item) => item.status === "pending").length,
    premiumListings: internships.filter((item) => item.is_premium).length,
    premiumUsers: users.filter((user) => user.tier === "premium").length,
    freeUsers: users.filter((user) => user.tier !== "premium").length
  };
};

export const findUser = async ({ email, telegram_handle }) => {
  const users = await getUsers();
  return (
    users.find(
      (user) =>
        (email && user.email?.toLowerCase() === email.toLowerCase()) ||
        (telegram_handle &&
          user.telegram_handle?.toLowerCase() === telegram_handle.toLowerCase())
    ) || null
  );
};

export const upsertUser = async (input) => {
  const users = await getUsers();
  const existingIndex = users.findIndex(
    (user) =>
      (input.email && user.email?.toLowerCase() === input.email.toLowerCase()) ||
      (input.telegram_handle &&
        user.telegram_handle?.toLowerCase() === input.telegram_handle.toLowerCase())
  );

  const normalized = {
    id: input.id || buildId("user"),
    tier: "free",
    tags: [],
    created_at: new Date().toISOString(),
    ...input
  };

  if (existingIndex >= 0) {
    users[existingIndex] = { ...users[existingIndex], ...normalized, updated_at: new Date().toISOString() };
  } else {
    users.unshift(normalized);
  }

  await saveUsers(users);
  return existingIndex >= 0 ? users[existingIndex] : normalized;
};
