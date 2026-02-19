import { expect, type Page } from "@playwright/test";

export const DEFAULT_PASSWORD = "Tinynotes!Pass123";

export type TestCredentials = {
  email: string;
  password: string;
};

export const sharedUsers = {
  owner: {
    email: "owner-e2e@example.com",
    password: DEFAULT_PASSWORD,
  },
  outsider: {
    email: "outsider-e2e@example.com",
    password: DEFAULT_PASSWORD,
  },
} satisfies Record<"owner" | "outsider", TestCredentials>;

function uniqueSuffix() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function hasNativeFormQuery(url: string) {
  return url.includes("?email=") || url.includes("&email=") || url.includes("?password=");
}

export async function submitCredentialsForm(page: Page, submitLabel: "Register" | "Login") {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.waitForTimeout(300);
    await page.getByRole("button", { name: submitLabel }).click();
    await page.waitForLoadState("networkidle");

    if (!hasNativeFormQuery(page.url())) {
      return;
    }
  }
}

export function createCredentials(prefix: string): TestCredentials {
  return {
    email: `${prefix}-${uniqueSuffix()}@example.com`,
    password: DEFAULT_PASSWORD,
  };
}

export async function register(page: Page, credentials: TestCredentials): Promise<TestCredentials> {
  await page.goto("/register");
  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Password").fill(credentials.password);
  await submitCredentialsForm(page, "Register");
  await expect(page).toHaveURL(/\/notes$/);
  return credentials;
}

export async function login(page: Page, credentials: TestCredentials) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.goto("/login");

    if (page.url().endsWith("/notes")) {
      return;
    }

    await page.getByLabel("Email").fill(credentials.email);
    await page.getByLabel("Password").fill(credentials.password);
    await submitCredentialsForm(page, "Login");

    try {
      await page.waitForURL(/\/notes$/, { timeout: 4_000 });
      return;
    } catch {
      if (attempt < 2) {
        await page.waitForTimeout(1_000);
        continue;
      }
    }
  }

  const errorMessage = (await page.locator("p[role='alert']").first().textContent())?.trim();
  throw new Error(
    `Login failed for ${credentials.email}. URL: ${page.url()}${errorMessage ? ` (${errorMessage})` : ""}`,
  );
}

export async function ensureUserExists(page: Page, credentials: TestCredentials) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Password").fill(credentials.password);
  await submitCredentialsForm(page, "Login");

  if (page.url().endsWith("/notes")) {
    return credentials;
  }

  const invalidCredentialsAlert = page
    .locator("p[role='alert']")
    .filter({ hasText: "Invalid email or password." });

  if (await invalidCredentialsAlert.isVisible()) {
    return register(page, credentials);
  }

  throw new Error(
    `Unexpected auth state while ensuring test user ${credentials.email}. Current URL: ${page.url()}`,
  );
}

export async function logout(page: Page) {
  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page).toHaveURL(/\/login$/);
}
