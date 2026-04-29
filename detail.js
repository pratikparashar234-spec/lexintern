import { config } from "../lib/config.js";
import { layout, renderListingCard } from "../lib/render.js";
import { escapeHtml, formatCurrency, formatDate } from "../lib/utils.js";

export const renderDetailPage = ({ internship, related, tier }) =>
  layout({
    title: `${internship.title} at ${internship.company} | LexIntern`,
    description:
      internship.summary ||
      `Apply for ${internship.title} at ${internship.company} through LexIntern.`,
    pathname: `/internships/${internship.slug}`,
    tier,
    schema: {
      "@context": "https://schema.org",
      "@type": "JobPosting",
      title: internship.title,
      hiringOrganization: {
        "@type": "Organization",
        name: internship.company
      },
      employmentType: "INTERN",
      datePosted: internship.posted_at || internship.created_at,
      validThrough: internship.deadline || undefined,
      jobLocationType: internship.work_mode === "Remote" ? "TELECOMMUTE" : undefined,
      applicantLocationRequirements: "IN"
    },
    content: `
      <section class="shell detail-layout">
        <article class="detail-main reveal">
          <span class="eyebrow">${escapeHtml(internship.practice_area || "Law Opportunity")}</span>
          <h1>${escapeHtml(internship.title)}</h1>
          <p class="detail-subtitle">${escapeHtml(
            internship.summary || "Verified opportunity curated for Indian law students."
          )}</p>
          <div class="detail-meta glass-panel">
            <div><strong>Firm</strong><span>${escapeHtml(internship.company)}</span></div>
            <div><strong>Location</strong><span>${escapeHtml(internship.location)}</span></div>
            <div><strong>Stipend</strong><span>${escapeHtml(formatCurrency(internship.stipend))}</span></div>
            <div><strong>Deadline</strong><span>${escapeHtml(formatDate(internship.deadline))}</span></div>
          </div>
          <div class="detail-tags">
            ${(internship.tags || [])
              .map((tag) => `<span class="tag-chip">${escapeHtml(tag)}</span>`)
              .join("")}
            <span class="tag-chip">${escapeHtml(internship.work_mode || "On-site")}</span>
            ${internship.is_premium ? '<span class="tag-chip tag-premium">Premium first</span>' : ""}
          </div>
          <div class="detail-body glass-panel">
            <h2>Opportunity overview</h2>
            <p>${escapeHtml(
              internship.description ||
                "This listing was added to help law students act quickly on verified opportunities."
            )}</p>
            <p>Source: <a href="${escapeHtml(internship.source)}" target="_blank" rel="noreferrer">${escapeHtml(
      internship.source
    )}</a></p>
          </div>
        </article>

        <aside class="detail-sidebar reveal">
          <div class="sidebar-card premium-sidebar">
            <span class="eyebrow eyebrow-light">Fast lane</span>
            <h2>Get faster alerts on Telegram</h2>
            <p>Premium users receive high-intent listings before the public feed and avoid deadline rush.</p>
            <div class="sidebar-actions">
              <a class="button button-primary button-full" href="${config.telegramJoinUrl}" target="_blank" rel="noreferrer">Join Telegram</a>
              <a class="button button-accent button-full" href="${internship.is_premium && tier !== "premium" ? "/premium" : internship.link}" ${
      internship.is_premium && tier !== "premium" ? "" : 'target="_blank" rel="noreferrer"'
    }>${internship.is_premium && tier !== "premium" ? "Unlock to Apply" : "Apply Now"}</a>
            </div>
          </div>
          <div class="sidebar-card">
            <h3>Students use LexIntern because</h3>
            <ul class="sidebar-list">
              <li>Opportunity links open in one tap</li>
              <li>Urgent deadlines are highlighted automatically</li>
              <li>Premium-first alerts reduce FOMO</li>
            </ul>
          </div>
        </aside>
      </section>

      <section class="shell section-grid">
        <div class="section-head">
          <div>
            <span class="eyebrow">More opportunities</span>
            <h2>Related internships</h2>
          </div>
          <a href="/internships" class="section-link">View all</a>
        </div>
        <div class="listing-grid">
          ${related.map((item) => renderListingCard(item, { tier })).join("")}
        </div>
      </section>
    `
  });

