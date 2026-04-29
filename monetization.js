import crypto from "node:crypto";
import { config } from "../lib/config.js";
import { findUser, upsertUser } from "../lib/store.js";

export const getUpgradeUrl = (user = {}) => {
  const url = new URL(config.paymentLinkUrl);
  if (user.email) url.searchParams.set("email", user.email);
  if (user.telegram_handle) url.searchParams.set("telegram", user.telegram_handle);
  return url.toString();
};

export const activatePremium = async ({ email, telegram_handle, name }) => {
  const existing = await findUser({ email, telegram_handle });
  return upsertUser({
    ...(existing || {}),
    name: name || existing?.name || "",
    email: email || existing?.email || "",
    telegram_handle: telegram_handle || existing?.telegram_handle || "",
    tier: "premium",
    tags: ["premium", "priority-alerts"],
    paid_until: new Date(Date.now() + 30 * 86400000).toISOString()
  });
};

export const verifyRazorpaySignature = (payloadBuffer, signatureHeader) => {
  if (!config.razorpayWebhookSecret) return true;
  const digest = crypto
    .createHmac("sha256", config.razorpayWebhookSecret)
    .update(payloadBuffer)
    .digest("hex");
  return digest === signatureHeader;
};

export const handlePaymentWebhook = async (payload) => {
  const entity =
    payload?.payload?.payment_link?.entity ||
    payload?.payload?.payment?.entity ||
    payload?.payment_link?.entity ||
    {};

  const notes = entity.notes || {};
  const customer = entity.customer || {};
  const email = notes.email || customer.email || payload?.email || "";
  const telegram_handle = notes.telegram || notes.telegram_handle || payload?.telegram_handle || "";
  const name = notes.name || customer.name || payload?.name || "";

  if (!email && !telegram_handle) {
    return { ok: false, reason: "No user identity found in webhook payload." };
  }

  const user = await activatePremium({ email, telegram_handle, name });
  return { ok: true, user };
};

