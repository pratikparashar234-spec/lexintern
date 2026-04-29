import test from "node:test";
import assert from "node:assert/strict";
import {
  detectPaidStipend,
  dedupeListings,
  inferPracticeArea,
  isIndiaOpportunity,
  isRelevantOpportunity,
  scoreOpportunity
} from "./filters.js";

test("isRelevantOpportunity keeps law internships", () => {
  assert.equal(
    isRelevantOpportunity({
      title: "Legal Research Internship",
      summary: "Research support for law students"
    }),
    true
  );
});

test("isRelevantOpportunity rejects unrelated jobs", () => {
  assert.equal(
    isRelevantOpportunity({
      title: "Software Engineer Intern",
      summary: "JavaScript and React role"
    }),
    false
  );
});

test("isIndiaOpportunity detects Indian listings", () => {
  assert.equal(
    isIndiaOpportunity({
      title: "Corporate Law Internship",
      location: "Delhi NCR"
    }),
    true
  );
});

test("dedupeListings removes duplicate links", () => {
  const items = dedupeListings([
    { title: "A", company: "B", link: "https://example.com/1" },
    { title: "A", company: "B", link: "https://example.com/1" }
  ]);
  assert.equal(items.length, 1);
});

test("detectPaidStipend identifies numeric stipend values", () => {
  assert.equal(detectPaidStipend("12000"), true);
});

test("inferPracticeArea maps corporate content", () => {
  assert.equal(
    inferPracticeArea({
      title: "Corporate Contract Law Internship"
    }),
    "Corporate Law"
  );
});

test("inferPracticeArea maps privacy work to tech and IP", () => {
  assert.equal(
    inferPracticeArea({
      title: "Data Privacy and Technology Law Internship"
    }),
    "Tech / IP"
  );
});

test("scoreOpportunity favors trusted and recent items", () => {
  const score = scoreOpportunity({
    title: "Legal Internship",
    location: "Mumbai, India",
    source_type: "law-firm",
    posted_at: new Date().toISOString()
  });
  assert.equal(score > 40, true);
});
