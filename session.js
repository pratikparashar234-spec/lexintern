import crypto from "node:crypto";
import { config } from "./config.js";

const encode = (value) => Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
const decode = (value) =>
  JSON.parse(Buffer.from(value, "base64url").toString("utf8"));

const sign = (payload) =>
  crypto.createHmac("sha256", config.sessionSecret).update(payload).digest("base64url");

export const createSignedCookie = (name, value, options = {}) => {
  const payload = encode(value);
  const signature = sign(payload);
  const maxAge = options.maxAge || 60 * 60 * 24 * 7;
  const parts = [
    `${name}=${payload}.${signature}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`
  ];
  if (options.secure) parts.push("Secure");
  return parts.join("; ");
};

export const clearCookie = (name) =>
  `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;

export const parseCookies = (cookieHeader = "") =>
  cookieHeader.split(";").reduce((accumulator, part) => {
    const [key, ...rest] = part.trim().split("=");
    if (!key) return accumulator;
    accumulator[key] = rest.join("=");
    return accumulator;
  }, {});

export const readSignedCookie = (cookieHeader, name) => {
  const cookies = parseCookies(cookieHeader);
  const raw = cookies[name];
  if (!raw) return null;
  const [payload, signature] = raw.split(".");
  if (!payload || !signature) return null;
  if (sign(payload) !== signature) return null;
  try {
    return decode(payload);
  } catch {
    return null;
  }
};

