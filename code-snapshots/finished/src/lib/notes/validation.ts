import type { JSONContent } from "@tiptap/core";
import {
  INVALID_NOTE_INPUT_MESSAGE,
  MAX_NOTE_CONTENT_BYTES,
  MAX_NOTE_TITLE_LENGTH,
} from "@/src/lib/notes/constants";

export type ContentValidationResult =
  | {
      ok: true;
      contentJson: JSONContent;
      serializedContent: string;
    }
  | {
      ok: false;
      message: string;
    };

function isObjectValue(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isDocContent(value: unknown): value is JSONContent {
  return isObjectValue(value) && value.type === "doc";
}

function byteLength(value: string) {
  return new TextEncoder().encode(value).byteLength;
}

export function createEmptyNoteContent(): JSONContent {
  return {
    type: "doc",
    content: [{ type: "paragraph" }],
  };
}

export function normalizeNoteTitle(value: string): string {
  return value.trim().slice(0, MAX_NOTE_TITLE_LENGTH);
}

export function serializeNoteDraft(title: string, contentJson: JSONContent): string {
  return JSON.stringify({
    title: normalizeNoteTitle(title),
    contentJson,
  });
}

export function parseStoredContent(value: string): JSONContent {
  try {
    const parsed = JSON.parse(value) as unknown;

    if (isDocContent(parsed)) {
      return parsed;
    }
  } catch (error) {
    console.error("Invalid note content in database", error);
  }

  return createEmptyNoteContent();
}

export function validateNoteContent(contentJson: unknown): ContentValidationResult {
  if (!isDocContent(contentJson)) {
    return {
      ok: false,
      message: INVALID_NOTE_INPUT_MESSAGE,
    };
  }

  let serializedContent: string;

  try {
    serializedContent = JSON.stringify(contentJson);
  } catch (error) {
    console.error("Failed to serialize note content", error);
    return {
      ok: false,
      message: INVALID_NOTE_INPUT_MESSAGE,
    };
  }

  if (byteLength(serializedContent) > MAX_NOTE_CONTENT_BYTES) {
    return {
      ok: false,
      message: "The note is too large.",
    };
  }

  return {
    ok: true,
    contentJson,
    serializedContent,
  };
}
