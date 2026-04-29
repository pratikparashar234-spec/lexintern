import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(currentFile), "..", "..");

const parseList = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export const config = {
  rootDir,
  port: Number(process.env.PORT || 3000),
  siteName: process.env.SITE_NAME || "LexIntern",
  siteUrl: process.env.SITE_URL || "http://localhost:3000",
  telegramJoinUrl: process.env.TELEGRAM_JOIN_URL || "https://t.me/lexinternalerts",
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || "",
  telegramFreeChatId: process.env.TELEGRAM_FREE_CHAT_ID || "",
  telegramPremiumChatId: process.env.TELEGRAM_PREMIUM_CHAT_ID || "",
  freeAlertDelayMinutes: Number(process.env.FREE_ALERT_DELAY_MINUTES || 90),
  adminToken: process.env.ADMIN_TOKEN || "change-me",
  sessionSecret: process.env.SESSION_SECRET || "replace-with-a-random-secret",
  paymentLinkUrl:
    process.env.PAYMENT_LINK_URL || "https://rzp.io/rzp/lexintern-premium",
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || "",
  googleApiKey: process.env.GOOGLE_API_KEY || "",
  googleCseId: process.env.GOOGLE_CSE_ID || "",
  lawFirmCareerUrls: parseList(process.env.LAW_FIRM_CAREER_URLS),
  telegramForwardJsonUrls: parseList(process.env.TELEGRAM_FORWARD_JSON_URLS),
  publicDir: path.join(rootDir, "public"),
  dataDir: path.join(rootDir, "data")
};

