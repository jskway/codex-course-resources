import { expect, type Page } from "@playwright/test";

export type CreateNoteInput = {
  title?: string;
  bodyText?: string;
};

export type CreatedNote = {
  noteId: string;
  url: string;
};

function hasNativeCreateFormQuery(url: string) {
  return url.includes("/notes/new?") && (url.includes("title=") || url.includes("content="));
}

export async function createNote(page: Page, input: CreateNoteInput = {}): Promise<CreatedNote> {
  await page.goto("/notes/new");

  if (input.title !== undefined) {
    await page.getByLabel("Title").fill(input.title);
  }

  if (input.bodyText !== undefined) {
    const editor = page.locator("div[contenteditable='true']").first();
    await editor.click();
    await editor.fill(input.bodyText);
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.waitForTimeout(300);
    await page.getByRole("button", { name: "Save" }).click();
    await page.waitForLoadState("networkidle");

    if (!hasNativeCreateFormQuery(page.url())) {
      break;
    }
  }

  await expect(page).toHaveURL(/\/notes\/[^/]+$/);
  await expect(page.getByRole("heading", { name: "Edit note" })).toBeVisible();

  const noteId = page.url().split("/notes/")[1];
  if (!noteId) {
    throw new Error(`Could not derive note id from URL: ${page.url()}`);
  }

  return {
    noteId,
    url: page.url(),
  };
}
