import { beforeEach, describe, expect, test, vi } from "vitest";
import { createNoteAction, updateNoteAction } from "@/app/(authenticated)/notes/actions";

const mocks = vi.hoisted(() => ({
  createNoteForUser: vi.fn(),
  requireSession: vi.fn(),
  revalidatePath: vi.fn(),
  updateNoteForUser: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("@/lib/notes", () => ({
  createNoteForUser: mocks.createNoteForUser,
  updateNoteForUser: mocks.updateNoteForUser,
}));

vi.mock("@/lib/session", () => ({
  requireSession: mocks.requireSession,
}));

const contentJson = {
  content: [
    {
      content: [{ text: "Body", type: "text" }],
      type: "paragraph",
    },
  ],
  type: "doc",
};

describe("note actions", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.requireSession.mockResolvedValue({ user: { id: "user-1" } });
  });

  test("creates a note for the current user and revalidates the notes list", async () => {
    const note = { id: "note-1", updatedAt: "2026-05-22T12:00:00.000Z" };
    const input = { contentJson, title: "First note" };
    mocks.createNoteForUser.mockReturnValue(note);

    const result = await createNoteAction(input);

    expect(mocks.createNoteForUser).toHaveBeenCalledWith("user-1", input);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/notes");
    expect(result).toEqual({ note, ok: true });
  });

  test("returns a generic create error and skips revalidation when persistence rejects input", async () => {
    mocks.createNoteForUser.mockReturnValue(null);

    const result = await createNoteAction({ contentJson, title: "Invalid note" });

    expect(result).toEqual({
      error: "Unable to save this note right now.",
      ok: false,
    });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  test("returns a generic create error and skips revalidation when persistence throws", async () => {
    mocks.createNoteForUser.mockImplementation(() => {
      throw new Error("SQLITE_BUSY");
    });

    const result = await createNoteAction({ contentJson, title: "Busy note" });

    expect(result).toEqual({
      error: "Unable to save this note right now.",
      ok: false,
    });
    if (result.ok) {
      throw new Error("Expected create note action to fail.");
    }
    expect(result.error).not.toContain("SQLITE_BUSY");
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  test("updates a note for the current user and revalidates affected routes", async () => {
    const note = { id: "note-1", updatedAt: "2026-05-22T13:00:00.000Z" };
    const input = { contentJson, id: "note-1", title: "Updated note" };
    mocks.updateNoteForUser.mockReturnValue(note);

    const result = await updateNoteAction(input);

    expect(mocks.updateNoteForUser).toHaveBeenCalledWith("user-1", input);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/notes");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/notes/note-1");
    expect(result).toEqual({ note, ok: true });
  });

  test("returns a generic update error and skips revalidation when the note is missing", async () => {
    mocks.updateNoteForUser.mockReturnValue(null);

    const result = await updateNoteAction({ contentJson, id: "missing-note", title: "Missing" });

    expect(result).toEqual({
      error: "Unable to save this note right now.",
      ok: false,
    });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  test("returns a generic update error and skips revalidation when persistence throws", async () => {
    mocks.updateNoteForUser.mockImplementation(() => {
      throw new Error("database locked");
    });

    const result = await updateNoteAction({ contentJson, id: "note-1", title: "Failure" });

    expect(result).toEqual({
      error: "Unable to save this note right now.",
      ok: false,
    });
    if (result.ok) {
      throw new Error("Expected update note action to fail.");
    }
    expect(result.error).not.toContain("database locked");
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});
