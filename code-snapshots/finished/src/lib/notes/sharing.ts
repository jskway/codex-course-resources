import { createHash } from "node:crypto";

const SHARE_TOKEN_BYTES = 32;
const SHARE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function generateShareToken(): string {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(SHARE_TOKEN_BYTES))).toString(
    "base64url",
  );
}

export function hashShareToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function buildShareUrl(token: string): string {
  const appUrl = process.env.APP_URL?.trim() || "http://localhost:3000";
  const normalizedBase = appUrl.endsWith("/") ? appUrl.slice(0, -1) : appUrl;

  return `${normalizedBase}/s/${token}`;
}

export function isValidShareToken(token: string): boolean {
  return SHARE_TOKEN_PATTERN.test(token);
}
