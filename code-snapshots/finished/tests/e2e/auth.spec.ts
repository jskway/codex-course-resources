import { expect, test } from "@playwright/test";
import {
  createCredentials,
  login,
  logout,
  register,
  sharedUsers,
  submitCredentialsForm,
} from "./helpers/auth";

test.describe("authentication and route protection", () => {
  test("redirects unauthenticated users to login for protected routes", async ({ page }) => {
    await page.goto("/notes");

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
  });

  test("registers a user and allows logout", async ({ page }) => {
    await register(page, sharedUsers.owner);
    await expect(page.getByRole("heading", { name: "Your notes" })).toBeVisible();
    await expect(
      page.getByLabel("Primary navigation").getByRole("link", { name: "New note" }),
    ).toBeVisible();

    await logout(page);
    await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
  });

  test("shows a generic error for invalid login credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(createCredentials("invalid-login").email);
    await page.getByLabel("Password").fill("wrong-password");
    await submitCredentialsForm(page, "Login");

    await expect(page.locator("p[role='alert']")).toContainText("Invalid email or password.");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("redirects authenticated users away from login and register pages", async ({ page }) => {
    await register(page, sharedUsers.outsider);
    await page.goto("/login");
    await expect(page).toHaveURL(/\/notes$/);

    await page.goto("/register");
    await expect(page).toHaveURL(/\/notes$/);

    await logout(page);
    await login(page, sharedUsers.outsider);
    await expect(page.getByRole("heading", { name: "Your notes" })).toBeVisible();
  });
});
