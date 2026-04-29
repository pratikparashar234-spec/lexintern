import { layout, renderListingCard } from "../lib/render.js";
import { escapeHtml } from "../lib/utils.js";

export const renderInternshipsPage = ({
  items,
  total,
  hasMore,
  filters,
  filterOptions,
  tier
}) =>
  layout({
    title: "All Law Internships | LexIntern",
    description:
      "Browse verified law internships in India by location, type, remote work, and stipend. Mobile-first listings with fast apply links.",
    pathname: "/internships",
    tier,
    schema: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Law internships in India",
      description: "Verified law internship listings and opportunities for Indian students."
    },
    content: `
      <section class="shell page-hero narrow reveal">
        <span class="eyebrow">Verified listings</span>
        <h1>Browse Law Internships</h1>
        <p>Filter by city, work mode, or stipend status. Listings load automatically as students scroll.</p>
      </section>

      <section class="shell">
        <form class="filter-bar glass-panel" id="listing-filters">
          <select name="location">
            <option value="">All locations</option>
            ${filterOptions.locations
              .map(
                (location) =>
                  `<option value="${escapeHtml(location)}" ${
                    filters.location === location ? "selected" : ""
                  }>${escapeHtml(location)}</option>`
              )
              .join("")}
          </select>
          <select name="practice_area">
            <option value="">All categories</option>
            ${filterOptions.practiceAreas
              .map(
                (area) =>
                  `<option value="${escapeHtml(area)}" ${
                    filters.practice_area === area ? "selected" : ""
                  }>${escapeHtml(area)}</option>`
              )
              .join("")}
          </select>
          <select name="work_mode">
            <option value="">All modes</option>
            ${filterOptions.workModes
              .map(
                (mode) =>
                  `<option value="${escapeHtml(mode)}" ${
                    filters.work_mode === mode ? "selected" : ""
                  }>${escapeHtml(mode)}</option>`
              )
              .join("")}
          </select>
          <select name="paid">
            <option value="">Paid + unpaid</option>
            <option value="paid" ${filters.paid === "paid" ? "selected" : ""}>Paid</option>
            <option value="unpaid" ${filters.paid === "unpaid" ? "selected" : ""}>Unpaid</option>
          </select>
          <button type="submit" class="button button-primary">Apply filters</button>
        </form>

        <div class="listing-topline">
          <p><strong>${total}</strong> opportunities live. Telegram members often see these first.</p>
          <a href="/premium" class="ghost-link">See premium access</a>
        </div>

        <div
          id="listing-grid"
          class="listing-grid"
          data-page="1"
          data-has-more="${hasMore ? "true" : "false"}"
          data-endpoint="/api/internships"
        >
          ${items.map((item) => renderListingCard(item, { tier })).join("")}
        </div>
        <div class="load-more-wrap">
          <button class="button button-secondary" id="load-more-button" ${hasMore ? "" : "hidden"}>Load more</button>
        </div>
      </section>
    `
  });

