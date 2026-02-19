import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CREATE_NOTE_ERROR_MESSAGE, SAVE_NOTE_ERROR_MESSAGE } from "@/src/lib/notes/constants";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/src/lib/session", () => ({
  requireSessionOrRedirect: vi.fn(),
}));

vi.mock("@/src/lib/notes/sharing", () => ({
  buildShareUrl: vi.fn(),
  generateShareToken: vi.fn(),
  hashShareToken: vi.fn(),
}));

vi.mock("@/src/lib/notes/repository", () => ({
  createNoteRecord: vi.fn(),
  updateNoteRecord: vi.fn(),
  deleteNoteRecord: vi.fn(),
  enableNoteShareRecord: vi.fn(),
  disableNoteShareRecord: vi.fn(),
}));

import { revalidatePath } from "next/cache";
import {
  createNoteRecord,
  deleteNoteRecord,
  disableNoteShareRecord,
  enableNoteShareRecord,
  updateNoteRecord,
} from "@/src/lib/notes/repository";
import { buildShareUrl, generateShareToken, hashShareToken } from "@/src/lib/notes/sharing";
import { requireSessionOrRedirect } from "@/src/lib/session";
import {
  createNoteAction,
  deleteNoteAction,
  disableShareAction,
  enableShareAction,
  updateNoteAction,
} from "@/src/lib/notes/actions";

const fixedNow = new Date("2026-01-01T00:00:00.000Z");
const validContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

type MockedSession = Awaited<ReturnType<typeof requireSessionOrRedirect>>;

describe("note actions", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(fixedNow);
    vi.resetAllMocks();
    vi.mocked(requireSessionOrRedirect).mockResolvedValue({
      user: { id: "user-1" },
    } as MockedSession);
    vi.mocked(generateShareToken).mockReturnValue("token-abc");
    vi.mocked(hashShareToken).mockReturnValue("hashed-token-abc");
    vi.mocked(buildShareUrl).mockReturnValue("http://localhost:3000/s/token-abc");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("createNoteAction", () => {
    it("returns validation errors for invalid input", async () => {
      const response = await createNoteAction({
        contentJson: validContent,
      } as never);

      expect(response).toEqual({
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Please provide a valid note title.",
        },
      });
    });

    it("returns validation errors for invalid content", async () => {
      const response = await createNoteAction({
        title: "Example",
        contentJson: { type: "paragraph" },
      } as never);

      expect(response).toEqual({
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "The note content is invalid.",
        },
      });
    });

    it("returns an internal error when the session user id is missing", async () => {
      vi.mocked(requireSessionOrRedirect).mockResolvedValue({
        user: {},
      } as MockedSession);

      const response = await createNoteAction({
        title: "Example",
        contentJson: validContent,
      });

      expect(response).toEqual({
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Authentication is currently unavailable.",
        },
      });
    });

    it("returns an internal error when note creation fails", async () => {
      vi.mocked(createNoteRecord).mockImplementation(() => {
        throw new Error("database unavailable");
      });

      const response = await createNoteAction({
        title: "Example",
        contentJson: validContent,
      });

      expect(response).toEqual({
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message: CREATE_NOTE_ERROR_MESSAGE,
        },
      });
    });

    it("creates a note and revalidates notes routes", async () => {
      const response = await createNoteAction({
        title: "  New note title  ",
        contentJson: validContent,
      });

      expect(response.ok).toBe(true);
      if (!response.ok) {
        return;
      }

      const createdRecord = vi.mocked(createNoteRecord).mock.calls[0]?.[0];
      expect(createdRecord).toMatchObject({
        userId: "user-1",
        title: "New note title",
        serializedContent: JSON.stringify(validContent),
        createdAt: fixedNow.toISOString(),
        updatedAt: fixedNow.toISOString(),
      });
      expect(createdRecord?.id).toBe(response.data.noteId);
      expect(response.data.updatedAt).toBe(fixedNow.toISOString());
      expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith("/notes");
      expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith(`/notes/${response.data.noteId}`);
    });
  });

  describe("updateNoteAction", () => {
    it("returns validation errors for invalid input", async () => {
      const response = await updateNoteAction({
        id: "note-1",
        contentJson: validContent,
      } as never);

      expect(response).toEqual({
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Please provide valid note data.",
        },
      });
    });

    it("returns validation errors for invalid content", async () => {
      const response = await updateNoteAction({
        id: "note-1",
        title: "Updated title",
        reason: "manual",
        contentJson: { type: "paragraph" },
      } as never);

      expect(response).toEqual({
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "The note content is invalid.",
        },
      });
    });

    it("returns not found when updating a note outside user scope", async () => {
      vi.mocked(updateNoteRecord).mockReturnValue(false);

      const response = await updateNoteAction({
        id: "note-1",
        title: "Updated title",
        contentJson: validContent,
        reason: "manual",
      });

      expect(response).toEqual({
        ok: false,
        error: {
          code: "NOT_FOUND",
          message: "The requested note could not be found.",
        },
      });
    });

    it("returns an internal error when update persistence fails", async () => {
      vi.mocked(updateNoteRecord).mockImplementation(() => {
        throw new Error("database unavailable");
      });

      const response = await updateNoteAction({
        id: "note-1",
        title: "Updated title",
        contentJson: validContent,
        reason: "autosave",
      });

      expect(response).toEqual({
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message: SAVE_NOTE_ERROR_MESSAGE,
        },
      });
    });

    it("updates a note and revalidates notes routes", async () => {
      vi.mocked(updateNoteRecord).mockReturnValue(true);

      const response = await updateNoteAction({
        id: "note-1",
        title: "  Updated title  ",
        contentJson: validContent,
        reason: "manual",
      });

      expect(response).toEqual({
        ok: true,
        data: {
          updatedAt: fixedNow.toISOString(),
        },
      });
      expect(vi.mocked(updateNoteRecord)).toHaveBeenCalledWith({
        id: "note-1",
        userId: "user-1",
        title: "Updated title",
        serializedContent: JSON.stringify(validContent),
        updatedAt: fixedNow.toISOString(),
      });
      expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith("/notes");
      expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith("/notes/note-1");
    });
  });

  describe("deleteNoteAction", () => {
    it("returns validation errors for invalid input", async () => {
      const response = await deleteNoteAction({
        id: "",
      });

      expect(response).toEqual({
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Please provide valid note data.",
        },
      });
    });

    it("returns not found when note is outside owner scope", async () => {
      vi.mocked(deleteNoteRecord).mockReturnValue(false);

      const response = await deleteNoteAction({ id: "note-1" });

      expect(response).toEqual({
        ok: false,
        error: {
          code: "NOT_FOUND",
          message: "The requested note could not be found.",
        },
      });
    });

    it("returns internal error when repository throws", async () => {
      vi.mocked(deleteNoteRecord).mockImplementation(() => {
        throw new Error("database unavailable");
      });

      const response = await deleteNoteAction({ id: "note-1" });

      expect(response).toEqual({
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Unable to delete note. Please try again.",
        },
      });
    });

    it("deletes a note and revalidates detail/list routes", async () => {
      vi.mocked(deleteNoteRecord).mockReturnValue(true);

      const response = await deleteNoteAction({ id: "note-1" });

      expect(response).toEqual({
        ok: true,
        data: {
          deleted: true,
        },
      });
      expect(vi.mocked(deleteNoteRecord)).toHaveBeenCalledWith({
        id: "note-1",
        userId: "user-1",
      });
      expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith("/notes");
      expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith("/notes/note-1");
    });
  });

  describe("enableShareAction", () => {
    it("returns validation errors for invalid input", async () => {
      const response = await enableShareAction({
        id: "",
      });

      expect(response).toEqual({
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Please provide valid note data.",
        },
      });
    });

    it("returns not found when note is outside owner scope", async () => {
      vi.mocked(enableNoteShareRecord).mockReturnValue(false);

      const response = await enableShareAction({ id: "note-1" });

      expect(response).toEqual({
        ok: false,
        error: {
          code: "NOT_FOUND",
          message: "The requested note could not be found.",
        },
      });
    });

    it("returns internal error when share enable fails", async () => {
      vi.mocked(enableNoteShareRecord).mockImplementation(() => {
        throw new Error("database unavailable");
      });

      const response = await enableShareAction({ id: "note-1" });

      expect(response).toEqual({
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Unable to update sharing. Please try again.",
        },
      });
    });

    it("enables sharing and returns a share url", async () => {
      vi.mocked(enableNoteShareRecord).mockReturnValue(true);

      const response = await enableShareAction({ id: "note-1" });

      expect(response).toEqual({
        ok: true,
        data: {
          shareToken: "token-abc",
          shareUrl: "http://localhost:3000/s/token-abc",
        },
      });
      expect(vi.mocked(enableNoteShareRecord)).toHaveBeenCalledWith({
        id: "note-1",
        userId: "user-1",
        shareId: expect.any(String),
        tokenHash: "hashed-token-abc",
        now: fixedNow.toISOString(),
      });
      expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith("/notes");
      expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith("/notes/note-1");
      expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith("/s/token-abc");
    });
  });

  describe("disableShareAction", () => {
    it("returns validation errors for invalid input", async () => {
      const response = await disableShareAction({ id: "" });

      expect(response).toEqual({
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Please provide valid note data.",
        },
      });
    });

    it("returns not found when note is outside owner scope", async () => {
      vi.mocked(disableNoteShareRecord).mockReturnValue(false);

      const response = await disableShareAction({ id: "note-1" });

      expect(response).toEqual({
        ok: false,
        error: {
          code: "NOT_FOUND",
          message: "The requested note could not be found.",
        },
      });
    });

    it("returns internal error when share disable fails", async () => {
      vi.mocked(disableNoteShareRecord).mockImplementation(() => {
        throw new Error("database unavailable");
      });

      const response = await disableShareAction({ id: "note-1" });

      expect(response).toEqual({
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Unable to update sharing. Please try again.",
        },
      });
    });

    it("disables sharing and revalidates token path when provided", async () => {
      vi.mocked(disableNoteShareRecord).mockReturnValue(true);

      const response = await disableShareAction({ id: "note-1", shareToken: "token-abc" });

      expect(response).toEqual({
        ok: true,
        data: {
          disabled: true,
        },
      });
      expect(vi.mocked(disableNoteShareRecord)).toHaveBeenCalledWith({
        id: "note-1",
        userId: "user-1",
        now: fixedNow.toISOString(),
      });
      expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith("/notes");
      expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith("/notes/note-1");
      expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith("/s/token-abc");
    });
  });
});
