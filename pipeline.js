import {
  dedupeListings,
  inferPracticeArea,
  inferWorkMode,
  isIndiaOpportunity,
  isRelevantOpportunity,
  normalizeCandidate,
  scoreOpportunity
} from "../../lib/filters.js";
import { addAutomationCandidates } from "../../lib/store.js";
import {
  fetchGoogleCustomSearchResults,
  fetchLawFirmCareerPages,
  fetchManualCurationFeed,
  fetchTelegramForwardJsonFeeds
} from "./sources.js";

const enrichCandidate = (candidate) => {
  const normalized = normalizeCandidate(candidate);
  return {
    ...normalized,
    practice_area: normalized.practice_area || inferPracticeArea(normalized),
    work_mode: normalized.work_mode || inferWorkMode(normalized),
    auto_score: scoreOpportunity(normalized)
  };
};

export const runAutomationPipeline = async () => {
  const batches = await Promise.all([
    fetchGoogleCustomSearchResults(),
    fetchLawFirmCareerPages(),
    fetchTelegramForwardJsonFeeds(),
    fetchManualCurationFeed()
  ]);

  const raw = batches.flat().map(enrichCandidate);
  const filtered = dedupeListings(
    raw.filter((candidate) => isRelevantOpportunity(candidate) && isIndiaOpportunity(candidate))
  ).sort((a, b) => b.auto_score - a.auto_score);

  const created = await addAutomationCandidates(filtered);

  return {
    fetched: raw.length,
    shortlisted: filtered.length,
    created: created.length,
    approved: created.filter((item) => item.status === "approved").length,
    pending: created.filter((item) => item.status === "pending").length,
    items: created
  };
};

