import { config } from "../lib/config.js";
import { layout, renderListingCard } from "../lib/render.js";
import { escapeHtml } from "../lib/utils.js";

const categoryCards = [
  { title: "Corporate Law", icon: "🏢", detail: "M&A, contracts, due diligence" },
  { title: "Litigation", icon: "⚖️", detail: "Courts, chambers, drafting" },
  { title: "Research", icon: "🔎", detail: "Think tanks and policy desks" },
  { title: "Remote", icon: "🌐", detail: "WFH roles across India" },
  { title: "Tech / IP", icon: "🧠", detail: "IPR, data, privacy, AI law" }
];

const trustItems = [
  {
    title: "Real-time updates",
    detail: "Hybrid automation fetches every few hours so students see fresh openings fast."
  },
  {
    title: "Manual verification",
    detail: "No noisy job board clutter. Suspicious or irrelevant listings stay out."
  },
  {
    title: "Telegram-first delivery",
    detail: "The fastest way to catch high-demand internships before they disappear."
  }
];

export const renderHomePage = ({ latest, stats, tier }) =>
  layout({
    title: "LexIntern | Find Law Internships Before Everyone Else",
    description:
      "Find verified law internships and opportunities across India with Telegram-first alerts, premium early access, and student-friendly filters.",
    pathname: "/",
    tier,
    schema: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: config.siteName,
      url: config.siteUrl,
      potentialAction: {
        "@type": "SearchAction",
        target: `${config.siteUrl}/internships?q={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    },
    content: `
      <section class="hero shell">
        <div class="hero-copy reveal">
          <span class="eyebrow">INDIA'S LAW INTERNSHIP EDGE</span>
          <h1>Find Law Internships <span>Before Everyone Else</span></h1>
          <p>
            Real-time discovery, smart verification, and Telegram-first delivery for Indian law students
            who refuse to miss deadlines.
          </p>
          <div class="hero-actions">
            <a class="button button-primary" href="${config.telegramJoinUrl}" target="_blank" rel="noreferrer">Join Telegram</a>
            <a class="button button-secondary" href="/internships">Browse Internships</a>
          </div>
          <div class="stat-row">
            <div class="stat-card"><strong>${stats.students}+</strong><span>students already joined</span></div>
            <div class="stat-card"><strong>${stats.approved}+</strong><span>verified listings live</span></div>
            <div class="stat-card"><strong>${stats.sources}+</strong><span>sources monitored</span></div>
          </div>
        </div>
        <div class="hero-visual reveal">
          <div class="hero-showcase">
            <div class="showcase-glow"></div>
            <div class="showcase-card">
              <span class="eyebrow eyebrow-dark">Telegram-first feed</span>
              <h2>New internship just posted</h2>
              <p>Students on Premium see this 1-2 hours earlier with priority alerts and exclusive drops.</p>
              <div class="mini-timeline">
                <span>Premium now</span>
                <span>Free after ${Math.round(config.freeAlertDelayMinutes / 60)}h</span>
              </div>
            </div>
            <div class="premium-panel">
              <div class="panel-header">
                <span class="panel-badge">Premium</span>
                <strong>Why students upgrade</strong>
              </div>
              <ul>
                <li>Early access alerts</li>
                <li>Exclusive internships</li>
                <li>Resume templates</li>
                <li>Priority notification flow</li>
              </ul>
              <a class="button button-accent button-full" href="/premium">Upgrade from ₹49/month</a>
            </div>
          </div>
        </div>
      </section>

      <section class="shell section-grid">
        <div class="section-head">
          <div>
            <span class="eyebrow">Popular categories</span>
            <h2>Explore opportunities by category</h2>
          </div>
          <a href="/internships" class="section-link">View all</a>
        </div>
        <div class="category-grid">
          ${categoryCards
            .map(
              (item) => `
              <article class="category-card reveal">
                <div class="category-icon">${item.icon}</div>
                <h3>${escapeHtml(item.title)}</h3>
                <p>${escapeHtml(item.detail)}</p>
              </article>
            `
            )
            .join("")}
        </div>
      </section>

      <section class="shell section-grid">
        <div class="section-head">
          <div>
            <span class="eyebrow">Latest verified opportunities</span>
            <h2>Fresh internships with one-click apply links</h2>
          </div>
          <a href="/internships" class="section-link">Browse all</a>
        </div>
        <div class="listing-grid">
          ${latest.map((item) => renderListingCard(item, { tier })).join("")}
        </div>
      </section>

      <section class="shell trust-band reveal">
        <div class="trust-intro">
          <span class="eyebrow eyebrow-light">Why LexIntern works</span>
          <h2>Built for speed, trust, and student FOMO</h2>
          <p>We combine automation with curation so students spend less time searching and more time applying.</p>
        </div>
        <div class="trust-grid">
          ${trustItems
            .map(
              (item) => `
              <article class="trust-card">
                <div class="trust-icon">✓</div>
                <h3>${escapeHtml(item.title)}</h3>
                <p>${escapeHtml(item.detail)}</p>
              </article>
            `
            )
            .join("")}
        </div>
      </section>

      <section class="shell premium-banner reveal">
        <div>
          <span class="eyebrow">Premium advantage</span>
          <h2>Only posted on Telegram first</h2>
          <p>Premium members receive earlier alerts, premium-only drops, and faster access to application links.</p>
        </div>
        <div class="pricing-card">
          <div class="price">₹49<span>/month</span></div>
          <ul>
            <li>1-2 hour early access</li>
            <li>Exclusive listings</li>
            <li>Resume + cover letter templates</li>
          </ul>
          <a class="button button-accent button-full" href="/premium">Unlock Premium</a>
        </div>
      </section>

      <section class="shell newsletter-strip reveal">
        <div>
          <span class="eyebrow">Never miss a deadline again</span>
          <h2>Get alerts faster on Telegram</h2>
          <p>500+ law students already use the faster alert lane.</p>
        </div>
        <div class="newsletter-actions">
          <a class="button button-primary" href="${config.telegramJoinUrl}" target="_blank" rel="noreferrer">Join Telegram</a>
          <a class="button button-secondary" href="/premium">See Premium</a>
        </div>
      </section>
    `
  });

