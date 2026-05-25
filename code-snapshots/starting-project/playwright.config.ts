import { defineConfig, devices } from "@playwright/test";

const e2ePort = 3100;
const baseURL = `http://localhost:${e2ePort}`;
const e2eDbPath = "./data/tinynotes-e2e.db";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? "dot" : "html",
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  webServer: {
    command:
      "bun run scripts/reset-e2e-db.ts && bun run db:migrate && bun run --bun next build && bun run --bun next start --port 3100",
    env: {
      APP_URL: baseURL,
      AUTH_SECRET: "test-only-tinynotes-auth-secret-change-me",
      BETTER_AUTH_URL: baseURL,
      DB_PATH: e2eDbPath,
      NEXT_TELEMETRY_DISABLED: "1",
    },
    reuseExistingServer: false,
    stderr: "pipe",
    stdout: "pipe",
    timeout: 180 * 1000,
    url: baseURL,
  },
});
