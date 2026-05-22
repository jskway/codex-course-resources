import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET ?? process.env.BETTER_AUTH_SECRET;

  if (secret !== undefined) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET or BETTER_AUTH_SECRET must be set in production.");
  }

  return "development-only-tinynotes-auth-secret-change-me";
}

export const auth = betterAuth({
  baseURL: process.env.APP_URL ?? process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  database: db,
  emailAndPassword: {
    enabled: true,
  },
  plugins: [nextCookies()],
  secret: getAuthSecret(),
});
