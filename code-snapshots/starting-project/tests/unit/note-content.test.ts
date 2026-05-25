import { describe, expect, test } from "vitest";
import {
  createEmptyTiptapContent,
  getNoteDisplayTitle,
  MAX_NOTE_CONTENT_BYTES,
  MAX_NOTE_TITLE_LENGTH,
  normalizeNoteTitle,
  parseTiptapContent,
  serializeTiptapContent,
} from "@/lib/note-content";

describe("note content helpers", () => {
  test("creates an empty Tiptap document", () => {
    expect(createEmptyTiptapContent()).toEqual({
      content: [
        {
          type: "paragraph",
        },
      ],
      type: "doc",
    });
  });

  test("uses a fallback display title for blank titles", () => {
    expect(getNoteDisplayTitle("")).toBe("Untitled note");
    expect(getNoteDisplayTitle("   ")).toBe("Untitled note");
    expect(getNoteDisplayTitle("  Weekly plan  ")).toBe("Weekly plan");
  });

  test("normalizes titles by trimming, truncating, and rejecting non-strings", () => {
    expect(normalizeNoteTitle("  Project notes  ")).toBe("Project notes");
    expect(normalizeNoteTitle(undefined)).toBe("");
    expect(normalizeNoteTitle(null)).toBe("");
    expect(normalizeNoteTitle(42)).toBe("");
    expect(normalizeNoteTitle("x".repeat(MAX_NOTE_TITLE_LENGTH + 25))).toHaveLength(
      MAX_NOTE_TITLE_LENGTH,
    );
  });

  test("parses valid serialized Tiptap content", () => {
    const content = {
      content: [
        {
          content: [{ text: "Hello", type: "text" }],
          type: "paragraph",
        },
      ],
      type: "doc",
    };

    expect(parseTiptapContent(JSON.stringify(content))).toEqual(content);
  });

  test("throws when stored content is not valid Tiptap JSON", () => {
    expect(() => parseTiptapContent("[]")).toThrow("Stored note content is not valid Tiptap JSON.");
    expect(() => parseTiptapContent('"plain text"')).toThrow(
      "Stored note content is not valid Tiptap JSON.",
    );
  });

  test("serializes only valid content within the size limit", () => {
    const content = {
      content: [
        {
          content: [{ text: "Serializable note", type: "text" }],
          type: "paragraph",
        },
      ],
      type: "doc",
    };

    expect(serializeTiptapContent(content)).toBe(JSON.stringify(content));
    expect(serializeTiptapContent(null)).toBeNull();
    expect(serializeTiptapContent({ content: [] })).toBeNull();
    expect(serializeTiptapContent([])).toBeNull();
  });

  test("rejects oversized content", () => {
    const oversizedContent = {
      content: [
        {
          content: [{ text: "x".repeat(MAX_NOTE_CONTENT_BYTES), type: "text" }],
          type: "paragraph",
        },
      ],
      type: "doc",
    };

    expect(serializeTiptapContent(oversizedContent)).toBeNull();
  });
});
