import type { JSONContent } from "@tiptap/react";

export const MAX_NOTE_CONTENT_BYTES = 256 * 1024;
export const MAX_NOTE_TITLE_LENGTH = 160;

const encoder = new TextEncoder();

export function createEmptyTiptapContent(): JSONContent {
  return {
    content: [
      {
        type: "paragraph",
      },
    ],
    type: "doc",
  };
}

export function getNoteDisplayTitle(title: string): string {
  const trimmedTitle = title.trim();

  return trimmedTitle === "" ? "Untitled note" : trimmedTitle;
}

export function normalizeNoteTitle(title: unknown): string {
  if (typeof title !== "string") {
    return "";
  }

  return title.trim().slice(0, MAX_NOTE_TITLE_LENGTH);
}

export function parseTiptapContent(serializedContent: string): JSONContent {
  const parsedContent: unknown = JSON.parse(serializedContent);

  if (!isTiptapContent(parsedContent)) {
    throw new Error("Stored note content is not valid Tiptap JSON.");
  }

  return parsedContent;
}

export function serializeTiptapContent(contentJson: unknown): string | null {
  if (!isTiptapContent(contentJson)) {
    return null;
  }

  const serializedContent = JSON.stringify(contentJson);

  if (serializedContent.length === 0) {
    return null;
  }

  if (encoder.encode(serializedContent).byteLength > MAX_NOTE_CONTENT_BYTES) {
    return null;
  }

  return serializedContent;
}

function isTiptapContent(value: unknown): value is JSONContent {
  return isRecord(value) && typeof value.type === "string";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
