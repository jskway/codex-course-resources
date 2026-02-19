import { expect, test } from "@playwright/test";
import { login, sharedUsers } from "./helpers/auth";
import { createNote } from "./helpers/notes";

function assertBoundingBox(
  value: { x: number; y: number; width: number; height: number } | null,
): asserts value is { x: number; y: number; width: number; height: number } {
  if (!value) {
    throw new Error("Expected bounding box to be available.");
  }
}

function assertDefined<T>(value: T | null, errorMessage: string): asserts value is T {
  if (!value) {
    throw new Error(errorMessage);
  }
}

test.describe("notes workflows", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, sharedUsers.owner);
  });

  test("renders create actions row on the right of title controls on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/notes/new");

    const titleInput = page.getByLabel("Title");
    const statusText = page.getByText("Unsaved changes");
    const clearButton = page.getByRole("button", { name: "Clear" });
    const saveButton = page.getByRole("button", { name: "Save" });

    await expect(statusText).toBeVisible();
    await expect(clearButton).toBeVisible();
    await expect(saveButton).toBeVisible();

    const titleBox = await titleInput.boundingBox();
    const statusBox = await statusText.boundingBox();
    const clearBox = await clearButton.boundingBox();
    const saveBox = await saveButton.boundingBox();

    assertBoundingBox(titleBox);
    assertBoundingBox(statusBox);
    assertBoundingBox(clearBox);
    assertBoundingBox(saveBox);

    expect(Math.abs(statusBox.y - titleBox.y)).toBeLessThan(70);
    expect(Math.abs(clearBox.y - titleBox.y)).toBeLessThan(70);
    expect(Math.abs(saveBox.y - titleBox.y)).toBeLessThan(70);
    expect(clearBox.x).toBeGreaterThan(titleBox.x);
    expect(saveBox.x).toBeGreaterThan(clearBox.x);
  });

  test("stacks title and actions rows on mobile create page", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/notes/new");

    const titleInput = page.getByLabel("Title");
    const statusText = page.getByText("Unsaved changes");
    const clearButton = page.getByRole("button", { name: "Clear" });
    const saveButton = page.getByRole("button", { name: "Save" });

    await expect(statusText).toBeVisible();
    await expect(clearButton).toBeVisible();
    await expect(saveButton).toBeVisible();

    const titleBox = await titleInput.boundingBox();
    const statusBox = await statusText.boundingBox();
    const clearBox = await clearButton.boundingBox();
    const saveBox = await saveButton.boundingBox();

    assertBoundingBox(titleBox);
    assertBoundingBox(statusBox);
    assertBoundingBox(clearBox);
    assertBoundingBox(saveBox);

    expect(statusBox.y).toBeGreaterThan(titleBox.y + titleBox.height);
    expect(clearBox.y).toBeGreaterThan(titleBox.y + titleBox.height);
    expect(saveBox.y).toBeGreaterThan(titleBox.y + titleBox.height);
  });

  test("keeps title input width stable across save status changes", async ({ page }) => {
    const { noteId } = await createNote(page, {
      title: "Width baseline",
      bodyText: "Width baseline body",
    });

    await expect(page).toHaveURL(new RegExp(`/notes/${noteId}$`));

    const titleInput = page.getByLabel("Title");
    const saveStatus = page
      .locator("p")
      .filter({ hasText: /^(Saved|Unsaved changes|Saving|Error)$/ })
      .first();

    await expect(saveStatus).toContainText("Saved");

    const initialSavedBox = await titleInput.boundingBox();
    assertBoundingBox(initialSavedBox);

    await titleInput.fill(`Width transition ${Date.now()}`);
    await expect(saveStatus).toContainText("Unsaved changes");

    const unsavedBox = await titleInput.boundingBox();
    assertBoundingBox(unsavedBox);
    expect(Math.abs(unsavedBox.width - initialSavedBox.width)).toBeLessThanOrEqual(1);

    await expect(saveStatus).toContainText("Saved", { timeout: 10_000 });

    const finalSavedBox = await titleInput.boundingBox();
    assertBoundingBox(finalSavedBox);
    expect(Math.abs(finalSavedBox.width - initialSavedBox.width)).toBeLessThanOrEqual(1);
  });

  test("renders visible styles for heading, quote, and bullet list formatting", async ({
    page,
  }) => {
    await page.goto("/notes/new");

    const editor = page.locator("div[contenteditable='true']").first();
    await editor.click();
    await editor.fill("Heading style check");
    await page.getByRole("button", { name: "H2" }).click();

    await editor.press("Enter");
    await editor.type("Quote style check");
    await page.getByRole("button", { name: "Quote" }).click();

    await editor.press("Enter");
    await editor.type("List style check");
    await page.getByRole("button", { name: "Bullet" }).click();

    await expect(page.locator(".note-editor-content h2")).toHaveCount(1);
    await expect(page.locator(".note-editor-content blockquote")).toHaveCount(1);
    await expect(page.locator(".note-editor-content ul li")).toHaveCount(1);

    const styleMetrics = await page.evaluate(() => {
      const root = document.querySelector(".note-editor-content");

      if (!root) {
        return null;
      }

      const heading = root.querySelector("h2");
      const paragraph = Array.from(root.querySelectorAll("p")).find(
        (node) => !node.closest("blockquote"),
      );
      const blockquote = root.querySelector("blockquote");
      const unorderedList = root.querySelector("ul");

      if (!heading || !paragraph || !blockquote || !unorderedList) {
        return null;
      }

      const headingStyles = window.getComputedStyle(heading);
      const paragraphStyles = window.getComputedStyle(paragraph);
      const blockquoteStyles = window.getComputedStyle(blockquote);
      const listStyles = window.getComputedStyle(unorderedList);

      return {
        headingFontSize: Number.parseFloat(headingStyles.fontSize),
        headingFontWeight: Number.parseFloat(headingStyles.fontWeight),
        paragraphFontSize: Number.parseFloat(paragraphStyles.fontSize),
        paragraphFontWeight: Number.parseFloat(paragraphStyles.fontWeight),
        blockquoteBorderLeftWidth: Number.parseFloat(blockquoteStyles.borderLeftWidth),
        blockquotePaddingLeft: Number.parseFloat(blockquoteStyles.paddingLeft),
        listStyleType: listStyles.listStyleType,
        listPaddingLeft: Number.parseFloat(listStyles.paddingLeft),
      };
    });

    assertDefined(styleMetrics, "Expected style metrics to be available for editor content.");

    expect(styleMetrics.headingFontSize).toBeGreaterThan(styleMetrics.paragraphFontSize);
    expect(styleMetrics.headingFontWeight).toBeGreaterThan(styleMetrics.paragraphFontWeight);
    expect(styleMetrics.blockquoteBorderLeftWidth).toBeGreaterThan(0);
    expect(styleMetrics.blockquotePaddingLeft).toBeGreaterThan(0);
    expect(styleMetrics.listStyleType).not.toBe("none");
    expect(styleMetrics.listPaddingLeft).toBeGreaterThan(0);
  });

  test("creates a note and shows it in the notes list", async ({ page }) => {
    const noteTitle = `Playwright note ${Date.now()}`;

    const { noteId } = await createNote(page, {
      title: noteTitle,
      bodyText: "Initial body text",
    });

    await page.getByRole("link", { name: "Back to notes" }).click();
    await expect(page).toHaveURL(/\/notes$/);
    await expect(page.getByRole("link", { name: new RegExp(noteTitle) })).toBeVisible();

    await page.getByRole("link", { name: new RegExp(noteTitle) }).click();
    await expect(page).toHaveURL(new RegExp(`/notes/${noteId}$`));
    await expect(page.getByLabel("Title")).toHaveValue(noteTitle);
  });

  test("renders blank-titled notes as untitled in the notes list", async ({ page }) => {
    await createNote(page, {
      title: "",
      bodyText: "Body for untitled note",
    });

    await page.getByRole("link", { name: "Back to notes" }).click();
    await expect(page).toHaveURL(/\/notes$/);
    await expect(page.getByRole("link", { name: /Untitled note/i })).toBeVisible();
  });

  test("persists manual save and autosave updates across reloads", async ({ page }) => {
    const manualTitle = `Manual save title ${Date.now()}`;
    const autosavedBody = `Autosaved body ${Date.now()}`;

    const { noteId } = await createNote(page, {
      title: "Original title",
      bodyText: "Original body",
    });

    await page.getByLabel("Title").fill(manualTitle);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Saved")).toBeVisible({ timeout: 10_000 });

    const editor = page.locator("div[contenteditable='true']").first();
    await editor.click();
    await editor.fill(autosavedBody);

    await expect(page.getByText("Unsaved changes")).toBeVisible();
    await expect(page.getByText(/^Saved$/)).toBeVisible({ timeout: 10_000 });

    await page.reload();

    await expect(page).toHaveURL(new RegExp(`/notes/${noteId}$`));
    await expect(page.getByLabel("Title")).toHaveValue(manualTitle);
    await expect(page.locator("div[contenteditable='true']").first()).toContainText(autosavedBody);
  });

  test("deletes a note from editor and returns custom 404 on direct URL", async ({ page }) => {
    const noteTitle = `Delete me ${Date.now()}`;
    const { noteId } = await createNote(page, {
      title: noteTitle,
      bodyText: "Body to delete",
    });

    page.once("dialog", (dialog) => {
      dialog.accept();
    });

    await page.getByRole("button", { name: "Delete note" }).click();
    await expect(page).toHaveURL(/\/notes$/);
    await expect(page.getByRole("link", { name: new RegExp(noteTitle) })).toHaveCount(0);

    await page.goto(`/notes/${noteId}`);
    await expect(page).toHaveURL(new RegExp(`/notes/${noteId}$`));
    await expect(page.getByRole("heading", { name: "404 - Resource Not Found" })).toBeVisible();
  });
});
