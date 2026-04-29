const state = {
  loading: false
};

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const icon = {
  location:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s6-5.4 6-11a6 6 0 1 0-12 0c0 5.6 6 11 6 11Z" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="10" r="2.2" fill="currentColor"/></svg>',
  stipend:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2v20M17 6.5c0-1.9-2-3.5-5-3.5S7 4.6 7 6.5s1.6 2.9 5 3.5 5 1.6 5 3.5S15 17 12 17s-5-1.6-5-3.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
  deadline:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v3M17 3v3M4 10h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>'
};

const formatTimeAgo = (value) => {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.floor(diff / 60000));
  if (minutes < 60) return `Posted ${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Posted ${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `Posted ${days} day${days === 1 ? "" : "s"} ago`;
};

const renderCard = (item) => {
  const locked = item.is_premium && window.__LEXINTERN__.tier !== "premium";
  const tags = [...(item.tags || []), item.work_mode].filter(Boolean).slice(0, 4);
  const badge = item.badge || (item.is_premium ? "HOT" : "NEW");
  return `
    <article class="internship-card reveal">
      <div class="card-badges">
        <span class="badge ${badge === "Closing Soon" ? "badge-warn" : ""}">${escapeHtml(badge)}</span>
        ${item.is_premium ? '<span class="badge badge-premium">Premium</span>' : ""}
      </div>
      <div class="card-topline">${escapeHtml(formatTimeAgo(item.posted_at || item.created_at))}</div>
      <h3>${escapeHtml(item.title)}</h3>
      <p class="card-company">${escapeHtml(item.company)}</p>
      <div class="card-meta">
        <span>${icon.location} ${escapeHtml(item.location)}</span>
        <span>${icon.stipend} ${escapeHtml(item.stipend || "Unspecified")}</span>
        <span>${icon.deadline} ${escapeHtml(item.deadline || "Rolling")}</span>
      </div>
      <div class="card-tags">${tags
        .map((tag) => `<span class="tag-chip">${escapeHtml(tag)}</span>`)
        .join("")}</div>
      <p class="card-summary">${escapeHtml(
        item.summary || "Verified opportunity curated for Indian law students."
      )}</p>
      <div class="card-actions">
        <a class="button button-secondary" href="/internships/${escapeHtml(item.slug)}">View Details</a>
        <a class="button ${locked ? "button-premium" : "button-primary"}" href="${
    locked ? "/premium" : escapeHtml(item.link)
  }" ${locked ? "" : 'target="_blank" rel="noreferrer"'}>${locked ? "Unlock Premium" : "Apply Now"}</a>
      </div>
    </article>
  `;
};

const listingGrid = document.querySelector("#listing-grid");
const loadMoreButton = document.querySelector("#load-more-button");
const filterForm = document.querySelector("#listing-filters");

const loadMore = async () => {
  if (!listingGrid || state.loading || listingGrid.dataset.hasMore !== "true") return;
  state.loading = true;
  const currentPage = Number(listingGrid.dataset.page || "1");
  const nextPage = currentPage + 1;
  const url = new URL(window.location.origin + listingGrid.dataset.endpoint);
  const params = new URLSearchParams(window.location.search);
  params.set("page", nextPage);
  params.forEach((value, key) => url.searchParams.set(key, value));
  const response = await fetch(url);
  const payload = await response.json();
  listingGrid.insertAdjacentHTML("beforeend", payload.items.map(renderCard).join(""));
  listingGrid.dataset.page = String(payload.page);
  listingGrid.dataset.hasMore = String(payload.hasMore);
  if (!payload.hasMore && loadMoreButton) loadMoreButton.hidden = true;
  state.loading = false;
};

loadMoreButton?.addEventListener("click", loadMore);

if (listingGrid) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && listingGrid.dataset.hasMore === "true") {
          loadMore().catch(() => {});
        }
      });
    },
    { rootMargin: "200px" }
  );
  observer.observe(loadMoreButton || listingGrid);
}

filterForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(filterForm);
  const params = new URLSearchParams();
  for (const [key, value] of formData.entries()) {
    if (value) params.set(key, value);
  }
  window.location.search = params.toString();
});

const premiumAccessForm = document.querySelector("#premium-access-form");
const premiumAccessMessage = document.querySelector("#premium-access-message");

premiumAccessForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(premiumAccessForm).entries());
  const response = await fetch("/api/premium/access", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const result = await response.json();
  premiumAccessMessage.textContent = result.message;
  premiumAccessMessage.className = `form-message ${result.ok ? "success" : "error"}`;
  if (result.ok) window.location.reload();
});

const adminCreateForm = document.querySelector("#admin-create-form");
const adminCreateMessage = document.querySelector("#admin-create-message");

adminCreateForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(adminCreateForm).entries());
  payload.is_premium = payload.is_premium === "true";
  const response = await fetch("/api/admin/internships", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const result = await response.json();
  adminCreateMessage.textContent = result.ok ? "Listing published." : result.message || "Failed to publish.";
  adminCreateMessage.className = `form-message ${result.ok ? "success" : "error"}`;
  if (result.ok) adminCreateForm.reset();
});

document.querySelectorAll(".approve-button").forEach((button) => {
  button.addEventListener("click", async () => {
    const response = await fetch(`/api/admin/internships/${button.dataset.id}/approve`, {
      method: "POST"
    });
    const result = await response.json();
    if (result.ok) {
      button.closest(".admin-item")?.remove();
    }
  });
});

const runAutomationButton = document.querySelector("#run-automation-button");
const automationMessage = document.querySelector("#automation-message");

runAutomationButton?.addEventListener("click", async () => {
  runAutomationButton.disabled = true;
  const response = await fetch("/api/automation/run", { method: "POST" });
  const result = await response.json();
  if (automationMessage) {
    automationMessage.textContent = result.ok
      ? `Fetched ${result.summary.fetched}, shortlisted ${result.summary.shortlisted}, created ${result.summary.created}.`
      : result.message || "Automation failed.";
    automationMessage.className = `form-message ${result.ok ? "success" : "error"}`;
  }
  runAutomationButton.disabled = false;
});

const notification = document.createElement("div");
notification.className = "flash-toast";
notification.innerHTML = `<strong>New internship just posted</strong><span>Get alerts faster on Telegram before public delay kicks in.</span>`;
document.body.appendChild(notification);
setTimeout(() => notification.classList.add("visible"), 1200);
setTimeout(() => notification.classList.remove("visible"), 7200);
