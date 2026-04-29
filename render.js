import { config } from "./config.js";
import { escapeHtml, formatCurrency, formatDate, timeAgo } from "./utils.js";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/internships", label: "Internships" },
  { href: "/premium", label: "Premium" },
  { href: "/admin", label: "Admin" }
];

const icon = (name) => {
  const icons = {
    arrow:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    location:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s6-5.4 6-11a6 6 0 1 0-12 0c0 5.6 6 11 6 11Z" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="10" r="2.2" fill="currentColor"/></svg>',
    stipend:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2v20M17 6.5c0-1.9-2-3.5-5-3.5S7 4.6 7 6.5s1.6 2.9 5 3.5 5 1.6 5 3.5S15 17 12 17s-5-1.6-5-3.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    deadline:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v3M17 3v3M4 10h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    shield:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5 6v5c0 5.3 2.9 8.8 7 10 4.1-1.2 7-4.7 7-10V6l-7-3Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
    flash:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
    crown:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 8 4.2 5L12 6l4.8 7L21 8l-2 11H5L3 8Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
    lock:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V8a5 5 0 0 1 10 0v2M6 10h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
    spark:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>'
  };
  return icons[name] || icons.spark;
};

export const renderListingCard = (internship, options = {}) => {
  const isLocked = internship.is_premium && options.tier !== "premium";
  const tagMarkup = (internship.tags || [])
    .slice(0, 3)
    .map((tag) => `<span class="tag-chip">${escapeHtml(tag)}</span>`)
    .join("");
  const badge = internship.badge || (internship.is_premium ? "HOT" : "NEW");
  const actionHref = isLocked ? "/premium" : internship.link;
  const actionLabel = isLocked ? "Unlock Premium" : "Apply Now";

  return `
    <article class="internship-card reveal">
      <div class="card-badges">
        <span class="badge ${badge === "Closing Soon" ? "badge-warn" : ""}">${escapeHtml(badge)}</span>
        ${internship.is_premium ? '<span class="badge badge-premium">Premium</span>' : ""}
      </div>
      <div class="card-topline">${timeAgo(internship.posted_at || internship.created_at)}</div>
      <h3>${escapeHtml(internship.title)}</h3>
      <p class="card-company">${escapeHtml(internship.company)}</p>
      <div class="card-meta">
        <span>${icon("location")} ${escapeHtml(internship.location)}</span>
        <span>${icon("stipend")} ${escapeHtml(formatCurrency(internship.stipend))}</span>
        <span>${icon("deadline")} ${escapeHtml(formatDate(internship.deadline))}</span>
      </div>
      <div class="card-tags">
        ${tagMarkup}
        ${internship.work_mode ? `<span class="tag-chip">${escapeHtml(internship.work_mode)}</span>` : ""}
      </div>
      <p class="card-summary">${escapeHtml(
        internship.summary || "Verified opportunity curated for Indian law students."
      )}</p>
      <div class="card-actions">
        <a class="button button-secondary" href="/internships/${escapeHtml(internship.slug)}">View Details</a>
        <a class="button ${isLocked ? "button-premium" : "button-primary"}" href="${escapeHtml(actionHref)}" ${
    isLocked ? "" : 'target="_blank" rel="noreferrer"'
  }>${isLocked ? icon("lock") : icon("arrow")} ${actionLabel}</a>
      </div>
    </article>
  `;
};

export const layout = ({
  title,
  description,
  pathname = "/",
  content,
  schema,
  tier = "free"
}) => {
  const canonical = `${config.siteUrl}${pathname}`;
  const jsonLd = schema
    ? `<script type="application/ld+json">${JSON.stringify(schema)}</script>`
    : "";

  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${escapeHtml(title)}</title>
      <meta name="description" content="${escapeHtml(description)}" />
      <meta property="og:title" content="${escapeHtml(title)}" />
      <meta property="og:description" content="${escapeHtml(description)}" />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="${escapeHtml(canonical)}" />
      <link rel="canonical" href="${escapeHtml(canonical)}" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
      <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet" />
      <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      <link rel="stylesheet" href="/styles.css" />
      <script>window.__LEXINTERN__={tier:${JSON.stringify(tier)},telegramJoinUrl:${JSON.stringify(
        config.telegramJoinUrl
      )}};</script>
      ${jsonLd}
    </head>
    <body>
      <div class="page-bg">
        <div class="orb orb-one"></div>
        <div class="orb orb-two"></div>
        <div class="orb orb-three"></div>
      </div>
      <header class="site-header">
        <a class="brand" href="/">
          <span class="brand-mark">${icon("spark")}</span>
          <span>
            <strong>${config.siteName}</strong>
            <small>Law opportunities, faster</small>
          </span>
        </a>
        <nav class="site-nav">
          ${navLinks
            .map(
              (link) =>
                `<a href="${link.href}" class="${pathname === link.href ? "active" : ""}">${link.label}</a>`
            )
            .join("")}
        </nav>
        <div class="header-actions">
          <a class="button button-secondary desktop-only" href="/internships">Browse</a>
          <a class="button button-primary" href="${config.telegramJoinUrl}" target="_blank" rel="noreferrer">${icon(
            "flash"
          )} Join Telegram</a>
        </div>
      </header>
      <main>
        ${content}
      </main>
      <a class="floating-telegram" href="${config.telegramJoinUrl}" target="_blank" rel="noreferrer">
        ${icon("flash")}
        <span>Instant Telegram Alerts</span>
      </a>
      <div class="sticky-mobile-cta">
        <a class="button button-primary button-full" href="${config.telegramJoinUrl}" target="_blank" rel="noreferrer">${icon(
          "flash"
        )} Join Telegram for Instant Alerts</a>
      </div>
      <footer class="site-footer">
        <div>
          <h3>${config.siteName}</h3>
          <p>Verified Indian law internships, curated for students who do not want to miss the next opening.</p>
        </div>
        <div class="footer-links">
          <a href="/internships">All Internships</a>
          <a href="/premium">Premium</a>
          <a href="${config.telegramJoinUrl}" target="_blank" rel="noreferrer">Telegram</a>
        </div>
        <a class="button button-secondary" href="${config.telegramJoinUrl}" target="_blank" rel="noreferrer">Join Telegram</a>
      </footer>
      <script src="/app.js" defer></script>
    </body>
  </html>`;
};

