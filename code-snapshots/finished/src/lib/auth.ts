import { betterAuth } from "better-auth";
import { db } from "@/src/lib/db";

function resolveAuthSecret() {
  const authSecret = process.env.AUTH_SECRET?.trim() || process.env.BETTER_AUTH_SECRET?.trim();

  if (!authSecret) {
    throw new Error(
      "Missing AUTH_SECRET (or BETTER_AUTH_SECRET). Set AUTH_SECRET in your environment.",
    );
  }

  return authSecret;
}

function resolveBaseUrl() {
  return (
    process.env.APP_URL?.trim() || process.env.BETTER_AUTH_URL?.trim() || "http://localhost:3000"
  );
}

export const auth = betterAuth({
  database: db,
  secret: resolveAuthSecret(),
  baseURL: resolveBaseUrl(),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
    autoSignIn: true,
  },
});
