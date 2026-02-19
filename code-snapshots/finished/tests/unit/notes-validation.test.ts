import { describe, expect, it, vi } from "vitest";
import {
  INVALID_NOTE_INPUT_MESSAGE,
  MAX_NOTE_CONTENT_BYTES,
  MAX_NOTE_TITLE_LENGTH,
} from "@/src/lib/notes/constants";
import {
  createEmptyNoteContent,
  normalizeNoteTitle,
  parseStoredContent,
  serializeNoteDraft,
  validateNoteContent,
} from "@/src/lib/notes/validation";

describe("notes validation helpers", () => {
  it("creates empty note content as a valid TipTap doc", () => {
    expect(createEmptyNoteContent()).toEqual({
      type: "doc",
      content: [{ type: "paragraph" }],
    });
  });

  it("normalizes note titles by trimming and truncating", () => {
    const longTitle = `   ${"a".repeat(MAX_NOTE_TITLE_LENGTH + 25)}   `;

    const normalizedTitle = normalizeNoteTitle(longTitle);

    expect(normalizedTitle).toHaveLength(MAX_NOTE_TITLE_LENGTH);
    expect(normalizedTitle.startsWith(" ")).toBe(false);
    expect(normalizedTitle.endsWith(" ")).toBe(false);
  });

  it("serializes a draft with a normalized title", () => {
    const content = createEmptyNoteContent();

    const draft = JSON.parse(serializeNoteDraft("  Example title  ", content)) as {
      title: string;
      contentJson: unknown;
    };

    expect(draft.title).toBe("Example title");
    expect(draft.contentJson).toEqual(content);
  });

  it("accepts valid TipTap doc content", () => {
    const content = createEmptyNoteContent();

    const result = validateNoteContent(content);

    expect(result.ok).toBe(true);
    expect(result).toMatchObject({
      ok: true,
      contentJson: content,
      serializedContent: JSON.stringify(content),
    });
  });

  it("rejects non-doc content", () => {
    const result = validateNoteContent({ type: "paragraph" });

    expect(result).toEqual({
      ok: false,
      message: INVALID_NOTE_INPUT_MESSAGE,
    });
  });

  it("rejects content that cannot be serialized", () => {
    const circularDoc = { type: "doc" } as Record<string, unknown>;
    circularDoc.self = circularDoc;
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = validateNoteContent(circularDoc);

    expect(result).toEqual({
      ok: false,
      message: INVALID_NOTE_INPUT_MESSAGE,
    });
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it("rejects content larger than the maximum size", () => {
    const oversizedContent = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "x".repeat(MAX_NOTE_CONTENT_BYTES + 1024) }],
        },
      ],
    };

    const result = validateNoteContent(oversizedContent);

    expect(result).toEqual({
      ok: false,
      message: "The note is too large.",
    });
  });

  it("parses valid stored JSON content", () => {
    const content = {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "hello" }] }],
    };

    expect(parseStoredContent(JSON.stringify(content))).toEqual(content);
  });

  it("falls back to empty content for invalid JSON values", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const parsed = parseStoredContent("not valid json");

    expect(parsed).toEqual(createEmptyNoteContent());
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it("falls back to empty content for non-doc JSON values", () => {
    const parsed = parseStoredContent(JSON.stringify({ type: "paragraph" }));

    expect(parsed).toEqual(createEmptyNoteContent());
  });
});
