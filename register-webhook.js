import { config } from "../src/lib/config.js";

if (!config.telegramBotToken) {
  console.log("Skipped: TELEGRAM_BOT_TOKEN is missing.");
  process.exit(0);
}

const url = `https://api.telegram.org/bot${config.telegramBotToken}/setWebhook`;
const response = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    url: `${config.siteUrl}/api/telegram/webhook`
  })
});

console.log(await response.text());
