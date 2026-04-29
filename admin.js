import { layout } from "../lib/render.js";
import { escapeHtml, formatDate } from "../lib/utils.js";

export const renderAdminPage = ({ authenticated, summary, pending, recent }) =>
  layout({
    title: "LexIntern Admin",
    description: "Manage manual listings and approve automated opportunities.",
    pathname: "/admin",
    tier: "premium",
    content: authenticated
      ? `
      <section class="shell page-hero narrow reveal">
        <span class="eyebrow">Admin panel</span>
        <h1>Approve automation and add listings manually</h1>
        <p>This keeps the hybrid pipeline clean: automation discovers, admin approves, Telegram distributes.</p>
      </section>

      <section class="shell admin-stats">
        <article class="stat-card"><strong>${summary.totalInternships}</strong><span>Total listings</span></article>
        <article class="stat-card"><strong>${summary.approvedInternships}</strong><span>Approved</span></article>
        <article class="stat-card"><strong>${summary.pendingInternships}</strong><span>Pending approval</span></article>
        <article class="stat-card"><strong>${summary.premiumUsers}</strong><span>Premium users</span></article>
      </section>

      <section class="shell admin-layout">
        <article class="glass-panel admin-panel reveal">
          <div class="section-head compact">
            <div>
              <span class="eyebrow">Manual add</span>
              <h2>Publish a listing</h2>
            </div>
          </div>
          <form id="admin-create-form" class="admin-form">
            <input name="title" placeholder="Title" required />
            <input name="company" placeholder="Firm / Organization" required />
            <input name="location" placeholder="Location" required />
            <input name="stipend" placeholder="Stipend" />
            <input name="deadline" placeholder="Deadline (YYYY-MM-DD)" />
            <input name="link" placeholder="Apply link" required />
            <input name="practice_area" placeholder="Practice area" />
            <input name="work_mode" placeholder="Remote / Hybrid / On-site" />
            <textarea name="summary" placeholder="Short summary"></textarea>
            <textarea name="description" placeholder="Description"></textarea>
            <label class="toggle">
              <input type="checkbox" name="is_premium" value="true" />
              <span>Premium-only listing</span>
            </label>
            <button class="button button-primary" type="submit">Publish listing</button>
          </form>
          <div id="admin-create-message" class="form-message" aria-live="polite"></div>
        </article>

        <article class="glass-panel admin-panel reveal">
          <div class="section-head compact">
            <div>
              <span class="eyebrow">Automation queue</span>
              <h2>Pending approvals</h2>
            </div>
            <button class="button button-secondary" id="run-automation-button">Run sync now</button>
          </div>
          <div id="automation-message" class="form-message" aria-live="polite"></div>
          <div class="admin-list">
            ${
              pending.length
                ? pending
                    .map(
                      (item) => `
                    <article class="admin-item">
                      <div>
                        <strong>${escapeHtml(item.title)}</strong>
                        <p>${escapeHtml(item.company)} • ${escapeHtml(item.location)} • score ${item.auto_score}</p>
                        <small>Source: ${escapeHtml(item.source)} • Deadline ${escapeHtml(formatDate(item.deadline))}</small>
                      </div>
                      <button class="button button-primary approve-button" data-id="${escapeHtml(item.id)}">Approve</button>
                    </article>
                  `
                    )
                    .join("")
                : "<p>No pending listings right now.</p>"
            }
          </div>
        </article>
      </section>

      <section class="shell glass-panel admin-panel reveal">
        <div class="section-head compact">
          <div>
            <span class="eyebrow">Recent listings</span>
            <h2>Latest published opportunities</h2>
          </div>
          <form method="post" action="/admin/logout">
            <button class="button button-secondary" type="submit">Log out</button>
          </form>
        </div>
        <div class="admin-list">
          ${recent
            .map(
              (item) => `
              <article class="admin-item">
                <div>
                  <strong>${escapeHtml(item.title)}</strong>
                  <p>${escapeHtml(item.company)} • ${escapeHtml(item.location)}</p>
                  <small>${escapeHtml(item.status)} • ${escapeHtml(item.source_type || "manual")}</small>
                </div>
                <a class="button button-secondary" href="/internships/${escapeHtml(item.slug)}">View</a>
              </article>
            `
            )
            .join("")}
        </div>
      </section>
      `
      : `
      <section class="shell login-shell reveal">
        <article class="glass-panel login-card">
          <span class="eyebrow">Protected area</span>
          <h1>Admin access</h1>
          <p>Enter the admin token to add listings and approve automation results.</p>
          <form method="post" action="/admin/login" class="admin-form">
            <input type="password" name="token" placeholder="Admin token" required />
            <button class="button button-primary" type="submit">Enter admin panel</button>
          </form>
        </article>
      </section>
      `
  });

