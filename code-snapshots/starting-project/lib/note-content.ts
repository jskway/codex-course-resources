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

export function renderPublicNoteHtml(content: JSONContent): string {
  return renderNode(content);
}

function renderNode(node: JSONContent | null | undefined): string {
  if (!node || typeof node.type !== "string") return "";
  const children = (node.content ?? []).map((child) => renderNode(child)).join("");
  switch (node.type) {
    case "doc":
      return children;
    case "paragraph":
      return `<p>${children}</p>`;
    case "heading": {
      const level = Math.min(6, Math.max(1, Number(node.attrs?.level ?? 1)));
      return `<h${level}>${children}</h${level}>`;
    }
    case "bulletList":
      return `<ul>${children}</ul>`;
    case "orderedList":
      return `<ol>${children}</ol>`;
    case "listItem":
      return `<li>${children}</li>`;
    case "blockquote":
      return `<blockquote>${children}</blockquote>`;
    case "codeBlock":
      return `<pre><code>${escapeHtml(textContent(node))}</code></pre>`;
    case "hardBreak":
      return "<br />";
    case "text":
      return applyMarks(escapeHtml(String(node.text ?? "")), node.marks ?? []);
    default:
      return children;
  }
}

function applyMarks(
  text: string,
  marks: Array<{ type?: string; attrs?: Record<string, unknown> }>,
): string {
  return marks.reduce((acc, mark) => {
    switch (mark.type) {
      case "bold":
        return `<strong>${acc}</strong>`;
      case "italic":
        return `<em>${acc}</em>`;
      case "strike":
        return `<s>${acc}</s>`;
      case "code":
        return `<code>${acc}</code>`;
      case "link": {
        const href = typeof mark.attrs?.href === "string" ? mark.attrs.href : "";
        if (!/^https?:\/\//i.test(href)) return acc;
        return `<a href="${escapeAttribute(href)}" rel="noreferrer noopener" target="_blank">${acc}</a>`;
      }
      default:
        return acc;
    }
  }, text);
}

function textContent(node: JSONContent): string {
  if (node.type === "text") return String(node.text ?? "");
  return (node.content ?? []).map((child) => textContent(child)).join("");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value);
}
