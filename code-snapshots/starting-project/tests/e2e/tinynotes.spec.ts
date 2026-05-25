import { expect, test, type Page } from "@playwright/test";

const password = "Password123!";

test.describe.configure({ mode: "serial" });

test("redirects logged-out users to login", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();

  await page.goto("/notes");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
});

test("registers, logs out, and logs back in", async ({ page }) => {
  const email = uniqueEmail("auth-flow");

  await registerUser(page, email, "Auth Flow User");
  await expect(page.getByRole("heading", { name: "Your notes" })).toBeVisible();
  await expect(page.getByText("No notes yet")).toBeVisible();

  await logout(page);
  await loginUser(page, email);

  await expect(page).toHaveURL(/\/notes$/);
  await expect(page.getByRole("heading", { name: "Your notes" })).toBeVisible();
});

test("shows generic authentication errors", async ({ page }) => {
  const email = uniqueEmail("duplicate");

  await page.goto("/login");
  await page.getByLabel("Email").fill(uniqueEmail("missing"));
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByText("Invalid email or password.")).toBeVisible();

  await registerUser(page, email, "Duplicate User");
  await logout(page);

  await page.goto("/register");
  await page.getByLabel("Name").fill("Duplicate User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign up" }).click();
  await expect(page.getByText("Unable to create an account with those details.")).toBeVisible();
});

test("creates a note and lists it for the current user", async ({ page }) => {
  const email = uniqueEmail("create-note");
  const title = "Launch checklist";
  const body = "Confirm telemetry, migrations, and rollback notes.";

  await registerUser(page, email, "Create Note User");
  const noteUrl = await createNote(page, title, body);

  await expect(page.getByLabel("Note title")).toHaveValue(title);
  await expect(getEditor(page)).toContainText(body);

  await page.getByRole("link", { exact: true, name: "Notes" }).click();
  await expect(page).toHaveURL(/\/notes$/);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();

  await page.getByRole("link", { name: new RegExp(title) }).click();
  await expect(page).toHaveURL(noteUrl);
  await expect(getEditor(page)).toContainText(body);
});

test("edits and persists an existing note", async ({ page }) => {
  const email = uniqueEmail("edit-note");
  const updatedTitle = "Revised research notes";
  const updatedBody = "Updated body after reviewing the product behavior.";

  await registerUser(page, email, "Edit Note User");
  const noteUrl = await createNote(page, "Draft research notes", "Initial body");

  await page.goto(noteUrl);
  await page.getByLabel("Note title").fill(updatedTitle);
  await getEditor(page).fill(updatedBody);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Saved")).toBeVisible();

  await page.goto("/notes");
  await page.getByRole("link", { name: new RegExp(updatedTitle) }).click();
  await expect(page).toHaveURL(noteUrl);
  await expect(page.getByLabel("Note title")).toHaveValue(updatedTitle);
  await expect(getEditor(page)).toContainText(updatedBody);
});

test("clears a note and persists the untitled state", async ({ page }) => {
  const email = uniqueEmail("clear-note");

  await registerUser(page, email, "Clear Note User");
  const noteUrl = await createNote(page, "Temporary note", "Temporary body");

  await page.goto(noteUrl);
  await page.getByRole("button", { name: "Clear" }).click();
  await expect(page.getByLabel("Note title")).toHaveValue("");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Saved")).toBeVisible();

  await page.goto("/notes");
  await expect(page.getByRole("heading", { name: "Untitled note" })).toBeVisible();
});

test("prevents a different user from opening another user's note", async ({ page }) => {
  const ownerTitle = "Owner-only note";

  await registerUser(page, uniqueEmail("owner"), "Owner User");
  const noteUrl = await createNote(page, ownerTitle, "Private body");
  await logout(page);

  await registerUser(page, uniqueEmail("intruder"), "Intruder User");
  await page.goto(noteUrl);

  await expect(page.getByRole("heading", { name: "Dummy not found page" })).toBeVisible();
  await expect(page.getByText(ownerTitle)).toHaveCount(0);
});

test("renders the custom 404 page for unknown routes", async ({ page }) => {
  await page.goto("/missing-route");

  await expect(page.getByRole("heading", { name: "Dummy not found page" })).toBeVisible();
  await expect(page.getByText("Placeholder for missing pages and resources.")).toBeVisible();
});

async function registerUser(page: Page, email: string, name: string): Promise<void> {
  await page.goto("/register");
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign up" }).click();
  await expect(page).toHaveURL(/\/notes$/);
}

async function loginUser(page: Page, email: string): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/notes$/);
}

async function logout(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page).toHaveURL(/\/login$/);
}

async function createNote(page: Page, title: string, body: string): Promise<string> {
  await page.goto("/notes/new");
  await expect(page.getByText("New note")).toBeVisible();
  await page.getByLabel("Note title").fill(title);
  await getEditor(page).fill(body);
  await page.getByRole("button", { name: "Create note" }).click();
  await expect(page).toHaveURL(/\/notes\/[0-9a-f-]{36}$/);

  return page.url();
}

function getEditor(page: Page) {
  return page.getByRole("textbox", { name: "Note content" });
}

function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}
