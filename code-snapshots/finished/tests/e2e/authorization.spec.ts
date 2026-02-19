import { expect, test } from "@playwright/test";
import { login, logout, sharedUsers } from "./helpers/auth";
import { createNote } from "./helpers/notes";

test.describe("note authorization", () => {
  test("prevents one user from opening another user's note", async ({ page }) => {
    await login(page, sharedUsers.owner);
    const createdNote = await createNote(page, {
      title: "Owner-only note",
      bodyText: "Private content",
    });

    await logout(page);
    await login(page, sharedUsers.outsider);
    await page.goto(`/notes/${createdNote.noteId}`);

    await expect(page.getByRole("heading", { name: "404 - Resource Not Found" })).toBeVisible();
  });

  test("shows custom 404 for unknown note ids", async ({ page }) => {
    await login(page, sharedUsers.outsider);
    await page.goto(`/notes/missing-${Date.now()}`);

    await expect(page.getByRole("heading", { name: "404 - Resource Not Found" })).toBeVisible();
    await expect(page.getByText("The requested page or resource does not exist.")).toBeVisible();
  });
});
