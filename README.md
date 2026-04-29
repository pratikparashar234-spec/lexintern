# LexIntern

LexIntern is a lean MVP for an Indian law internship and opportunity platform with three connected layers:

1. A fast, SEO-friendly website
2. A Telegram alert bot with free vs premium timing logic
3. A hybrid automation pipeline for search discovery, career pages, Telegram forwards, and manual curation

## Stack

- Runtime: Node.js 24+
- Frontend: server-rendered HTML + CSS + vanilla JS
- Backend: native `http` server with JSON APIs
- Storage: JSON data files for low-maintenance MVP ops
- Payments: simple payment-link flow + Razorpay-style webhook activation
- Scheduling: cron or platform schedulers

This codebase intentionally avoids external packages so it can run immediately in low-friction environments and stay cheap to maintain.

## Folder Structure

```text
lexintern/
  data/
    internships.json
    manual-feed.json
    users.json
  public/
    app.js
    favicon.svg
    styles.css
  scripts/
    dispatch-alerts.js
    register-webhook.js
    sync-jobs.js
  src/
    lib/
    pages/
    services/
      automation/
    server.js
```

## What Is Implemented

### Website

- `/` high-converting landing page
- `/internships` listing page with filters + infinite scroll
- `/internships/:slug` detail page
- `/premium` pricing, benefits, and premium activation
- `/admin` token-protected admin panel
- `/robots.txt`, `/sitemap.xml`, `/health`

### Telegram

- `/start` welcome flow
- `/latest` latest 5 listings
- `/premium` premium upsell
- Premium channel/users receive approved listings first
- Free channel/users receive delayed alerts based on `FREE_ALERT_DELAY_MINUTES`

### Hybrid Automation

- Google Custom Search API source when API keys are available
- Law-firm career page crawling via fetch + HTML anchor extraction
- Telegram forward JSON feed ingestion
- Manual curation feed ingestion
- Relevance filtering
- India-only filtering
- Deduplication
- Auto-score
- Trusted-source auto-approval and pending-review fallback

## Required Environment Variables

Copy `.env.example` to `.env` and fill these first:

```bash
PORT=3000
SITE_URL=https://your-domain.com
TELEGRAM_BOT_TOKEN=...
TELEGRAM_FREE_CHAT_ID=...
TELEGRAM_PREMIUM_CHAT_ID=...
ADMIN_TOKEN=...
SESSION_SECRET=...
PAYMENT_LINK_URL=https://rzp.io/rzp/your-link
```

Optional automation inputs:

```bash
GOOGLE_API_KEY=...
GOOGLE_CSE_ID=...
LAW_FIRM_CAREER_URLS=https://firm-a.com/careers,https://firm-b.com/careers
TELEGRAM_FORWARD_JSON_URLS=https://example.com/feed.json
```

## Run Locally

```bash
node src/server.js
```

Then open:

- `http://localhost:3000/`
- `http://localhost:3000/admin`

Default admin token is read from `.env`.

## Bot Setup

1. Create a bot in BotFather.
2. Put the token in `TELEGRAM_BOT_TOKEN`.
3. Deploy the app to a public URL.
4. Register the webhook:

```bash
node scripts/register-webhook.js
```

Webhook endpoint:

```text
POST /api/telegram/webhook
```

Supported commands:

- `/start`
- `/latest`
- `/premium`

## Automation Schedule

Run these on a scheduler:

```bash
node scripts/sync-jobs.js
node scripts/dispatch-alerts.js
```

Recommended cadence:

- `sync-jobs.js` every 2-3 hours
- `dispatch-alerts.js` every 10-15 minutes

### Suggested Cron

```cron
0 */3 * * * cd /app && node scripts/sync-jobs.js
*/15 * * * * cd /app && node scripts/dispatch-alerts.js
```

## Admin Workflow

1. Automation collects candidate listings.
2. Trusted sources may auto-approve.
3. Low-confidence sources remain pending.
4. Admin approves pending items from `/admin`.
5. Approved items appear on the site and enter Telegram dispatch logic.

## Premium Flow

1. Student clicks payment link on `/premium`.
2. Razorpay payment link or UPI checkout captures email / Telegram handle.
3. Payment webhook calls:

```text
POST /api/payments/razorpay
```

4. Premium status is activated in `data/users.json`.
5. Student activates session on `/premium`.
6. Premium-only apply links unlock on the website.

## Deployment

### Option 1: Railway / Render / Fly.io

- Deploy as a Node app or Docker app
- Set environment variables
- Add recurring jobs for:
  - `node scripts/sync-jobs.js`
  - `node scripts/dispatch-alerts.js`

### Option 2: VPS

1. Copy files to server
2. Set `.env`
3. Run:

```bash
docker build -t lexintern .
docker run -d --restart unless-stopped -p 3000:3000 --env-file .env lexintern
```

4. Put Nginx or Caddy in front for HTTPS
5. Add cron jobs for sync and alert dispatch

## Scaling Path

When the MVP gets traction, upgrade in this order:

1. Replace JSON storage with PostgreSQL
2. Move automation logs into a queue
3. Add user auth and dashboard
4. Add source-specific parsers for Internshala / Indeed
5. Add admin approval analytics and source hit-rates

## Notes

- The current design is mobile-first and optimized for fast rendering.
- The website uses clean URLs and server-rendered metadata for SEO.
- The current MVP is intentionally lightweight and practical rather than framework-heavy.
