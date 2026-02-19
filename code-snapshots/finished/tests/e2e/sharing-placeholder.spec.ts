import { expect, test } from "@playwright/test";
import { login, sharedUsers } from "./helpers/auth";
import { createNote } from "./helpers/notes";

test.describe("public note sharing", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, sharedUsers.owner);
  });

  test("owner can enable sharing and unauthenticated user can read via /s/[token]", async ({
    page,
    context,
  }) => {
    await createNote(page, {
      title: `Shared title ${Date.now()}`,
      bodyText: "Shared body text",
    });

    await page.getByRole("button", { name: "Enable sharing" }).click();

    const shareUrlInput = page.locator("#share-url");
    await expect(shareUrlInput).toBeVisible();
    const shareUrl = await shareUrlInput.inputValue();
    expect(shareUrl).toContain("/s/");

    const publicPage = await context.newPage();
    await publicPage.goto(shareUrl);
    await expect(publicPage.getByRole("heading", { name: /Shared title/i })).toBeVisible();
    await expect(publicPage.getByText("Shared body text")).toBeVisible();
  });

  test("disable and regenerate invalidate old public links", async ({ page, context }) => {
    await createNote(page, {
      title: `Rotating title ${Date.now()}`,
      bodyText: "Rotating body text",
    });

    await page.getByRole("button", { name: "Enable sharing" }).click();
    const firstUrl = await page.locator("#share-url").inputValue();

    await page.getByRole("button", { name: "Regenerate link" }).click();
    const secondUrl = await page.locator("#share-url").inputValue();
    expect(secondUrl).not.toBe(firstUrl);

    const publicPage = await context.newPage();
    await publicPage.goto(firstUrl);
    await expect(
      publicPage.getByRole("heading", { name: "404 - Resource Not Found" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Disable sharing" }).click();

    await publicPage.goto(secondUrl);
    await expect(
      publicPage.getByRole("heading", { name: "404 - Resource Not Found" }),
    ).toBeVisible();
  });

  test("invalid and unknown tokens both return custom 404", async ({ page }) => {
    await page.goto("/s/not-a-valid-token");
    await expect(page.getByRole("heading", { name: "404 - Resource Not Found" })).toBeVisible();

    await page.goto("/s/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
    await expect(page.getByRole("heading", { name: "404 - Resource Not Found" })).toBeVisible();
  });
});
