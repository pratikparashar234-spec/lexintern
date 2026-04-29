import { config } from "../lib/config.js";
import { getInternships, getUsers, markAlertSent, upsertUser } from "../lib/store.js";
import { formatCurrency, formatDate } from "../lib/utils.js";

const apiBase = config.telegramBotToken
  ? `https://api.telegram.org/bot${config.telegramBotToken}`
  : "";

const withTelegramFallback = async (path, payload) => {
  if (!apiBase) {
    return { ok: false, skipped: true, reason: "Missing TELEGRAM_BOT_TOKEN" };
  }

  const response = await fetch(`${apiBase}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return response.json();
};

export const buildInternshipMessage = (internship, options = {}) => {
  const visibilityLine = internship.is_premium
    ? "⭐ Premium-first listing"
    : "🟢 Posted to Telegram first";

  const detailUrl = `${config.siteUrl}/internships/${internship.slug}`;
  const ctaLink = internship.is_premium && options.tier !== "premium" ? `${config.siteUrl}/premium` : internship.link;

  return [
    `📌 ${internship.title} at ${internship.company}`,
    `📍 Location: ${internship.location}`,
    `💰 Stipend: ${formatCurrency(internship.stipend)}`,
    `⏳ Deadline: ${formatDate(internship.deadline)}`,
    visibilityLine,
    "",
    `🔗 Apply: ${ctaLink}`,
    `🌐 Details: ${detailUrl}`,
    "",
    options.tier === "premium"
      ? "⚡ You received this early because you are on Premium."
      : `🚀 Get faster alerts: ${config.telegramJoinUrl}`
  ].join("\n");
};

export const sendTelegramMessage = async (chatId, text) =>
  withTelegramFallback("/sendMessage", {
    chat_id: chatId,
    text,
    disable_web_page_preview: false
  });

export const broadcastDueAlerts = async () => {
  const internships = await getInternships();
  const users = await getUsers();
  const approved = internships.filter((item) => item.status === "approved");
  const sent = [];

  for (const internship of approved) {
    const createdAt = new Date(internship.created_at || internship.posted_at).getTime();
    const ageMinutes = (Date.now() - createdAt) / 60000;
    const premiumPending = !internship.alerts?.premium_sent_at;
    const freePending =
      !internship.alerts?.free_sent_at && ageMinutes >= config.freeAlertDelayMinutes;

    if (premiumPending) {
      const targets = [
        config.telegramPremiumChatId,
        ...users.filter((user) => user.tier === "premium" && user.chat_id).map((user) => user.chat_id)
      ].filter(Boolean);

      if (targets.length && apiBase) {
        for (const chatId of targets) {
          await sendTelegramMessage(chatId, buildInternshipMessage(internship, { tier: "premium" }));
        }

        await markAlertSent(internship.id, "premium");
        sent.push({ id: internship.id, tier: "premium" });
      }
    }

    if (freePending && !internship.is_premium) {
      const targets = [
        config.telegramFreeChatId,
        ...users.filter((user) => user.tier !== "premium" && user.chat_id).map((user) => user.chat_id)
      ].filter(Boolean);

      if (targets.length && apiBase) {
        for (const chatId of targets) {
          await sendTelegramMessage(chatId, buildInternshipMessage(internship, { tier: "free" }));
        }

        await markAlertSent(internship.id, "free");
        sent.push({ id: internship.id, tier: "free" });
      }
    }
  }

  return sent;
};

export const handleTelegramCommand = async (command, tier = "free") => {
  const internships = await getInternships();
  const latest = internships
    .filter((item) => item.status === "approved" && (tier === "premium" || !item.is_premium))
    .slice(0, 5);

  if (command === "/latest") {
    return latest.map((item, index) => `${index + 1}. ${item.title} - ${item.company}`).join("\n");
  }

  if (command === "/premium") {
    return [
      "Premium unlocks:",
      "• 1-2 hour early alerts",
      "• Premium-only internship drops",
      "• Resume templates and application guides",
      `Upgrade: ${config.siteUrl}/premium`
    ].join("\n");
  }

  return [
    "Welcome to LexIntern.",
    "Get verified Indian law internships faster than the usual job hunt.",
    `Join the updates channel: ${config.telegramJoinUrl}`,
    `Browse the website: ${config.siteUrl}`
  ].join("\n");
};

export const processTelegramUpdate = async (update) => {
  const message = update?.message || update?.edited_message;
  if (!message?.text || !message.chat?.id) return { ok: true, ignored: true };
  const users = await getUsers();
  const existing =
    users.find(
      (user) =>
        String(user.chat_id) === String(message.chat.id) ||
        (message.from?.username &&
          user.telegram_handle?.toLowerCase() === message.from.username.toLowerCase())
    ) || null;

  await upsertUser({
    ...(existing || {}),
    name: [message.from?.first_name, message.from?.last_name].filter(Boolean).join(" ").trim(),
    telegram_handle: message.from?.username || existing?.telegram_handle || "",
    chat_id: String(message.chat.id),
    tier: existing?.tier || "free",
    tags: existing?.tags || ["telegram"]
  });

  const responseText = await handleTelegramCommand(
    message.text.split(" ")[0],
    existing?.tier || "free"
  );
  return sendTelegramMessage(message.chat.id, responseText);
};
