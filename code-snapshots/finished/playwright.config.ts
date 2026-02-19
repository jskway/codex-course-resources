import os from "node:os";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

const appPort = 3100;
const baseUrl = `http://127.0.0.1:${appPort}`;
const e2eDbPath = path.join(os.tmpdir(), `tinynotes-e2e-${Date.now()}.db`);
const authSecret =
  process.env.AUTH_SECRET?.trim() || "tinynotes-e2e-auth-secret-value-with-32-plus-chars";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? "html" : "list",
  use: {
    baseURL: baseUrl,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `bun run migrate:up && bun run build && bun run start -- --port ${appPort}`,
    url: baseUrl,
    reuseExistingServer: false,
    env: {
      ...process.env,
      APP_URL: baseUrl,
      AUTH_SECRET: authSecret,
      DB_PATH: e2eDbPath,
    },
  },
});
