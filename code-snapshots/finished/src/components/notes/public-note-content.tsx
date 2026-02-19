import type { JSONContent } from "@tiptap/core";
import Link from "next/link";
import { Fragment, type ReactNode } from "react";

const ALLOWED_NODE_TYPES = new Set([
  "doc",
  "paragraph",
  "text",
  "hardBreak",
  "heading",
  "bulletList",
  "orderedList",
  "listItem",
  "blockquote",
  "codeBlock",
]);

function getNodeChildren(node: JSONContent | undefined): JSONContent[] {
  if (!node || !Array.isArray(node.content)) {
    return [];
  }

  return node.content;
}

function getSafeLinkHref(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

function renderTextNode(node: JSONContent, key: string): ReactNode {
  const value = typeof node.text === "string" ? node.text : "";
  const marks = Array.isArray(node.marks) ? node.marks : [];

  let rendered: ReactNode = value;

  marks.forEach((mark, index) => {
    const markKey = `${key}-mark-${index}`;

    if (!mark || typeof mark.type !== "string") {
      return;
    }

    if (mark.type === "bold") {
      rendered = <strong key={markKey}>{rendered}</strong>;
      return;
    }

    if (mark.type === "italic") {
      rendered = <em key={markKey}>{rendered}</em>;
      return;
    }

    if (mark.type === "strike") {
      rendered = <s key={markKey}>{rendered}</s>;
      return;
    }

    if (mark.type === "code") {
      rendered = <code key={markKey}>{rendered}</code>;
      return;
    }

    if (mark.type === "link") {
      const href = getSafeLinkHref(mark.attrs?.href);
      rendered = href ? (
        <Link key={markKey} href={href} target="_blank" rel="noreferrer noopener">
          {rendered}
        </Link>
      ) : (
        <Fragment key={markKey}>{rendered}</Fragment>
      );
    }
  });

  return <Fragment key={key}>{rendered}</Fragment>;
}

function renderNode(node: JSONContent, key: string): ReactNode {
  if (!node || typeof node.type !== "string" || !ALLOWED_NODE_TYPES.has(node.type)) {
    return null;
  }

  if (node.type === "doc") {
    return (
      <Fragment key={key}>
        {getNodeChildren(node).map((child, index) => renderNode(child, `${key}-${index}`))}
      </Fragment>
    );
  }

  if (node.type === "paragraph") {
    return (
      <p key={key}>
        {getNodeChildren(node).map((child, index) => renderNode(child, `${key}-${index}`))}
      </p>
    );
  }

  if (node.type === "text") {
    return renderTextNode(node, key);
  }

  if (node.type === "hardBreak") {
    return <br key={key} />;
  }

  if (node.type === "heading") {
    const level = Number(node.attrs?.level);
    const children = getNodeChildren(node).map((child, index) =>
      renderNode(child, `${key}-${index}`),
    );

    if (level === 1) {
      return <h1 key={key}>{children}</h1>;
    }

    if (level === 2) {
      return <h2 key={key}>{children}</h2>;
    }

    if (level === 3) {
      return <h3 key={key}>{children}</h3>;
    }

    return <p key={key}>{children}</p>;
  }

  if (node.type === "bulletList") {
    return (
      <ul key={key}>
        {getNodeChildren(node).map((child, index) => renderNode(child, `${key}-${index}`))}
      </ul>
    );
  }

  if (node.type === "orderedList") {
    return (
      <ol key={key}>
        {getNodeChildren(node).map((child, index) => renderNode(child, `${key}-${index}`))}
      </ol>
    );
  }

  if (node.type === "listItem") {
    return (
      <li key={key}>
        {getNodeChildren(node).map((child, index) => renderNode(child, `${key}-${index}`))}
      </li>
    );
  }

  if (node.type === "blockquote") {
    return (
      <blockquote key={key}>
        {getNodeChildren(node).map((child, index) => renderNode(child, `${key}-${index}`))}
      </blockquote>
    );
  }

  if (node.type === "codeBlock") {
    return (
      <pre key={key}>
        <code>
          {getNodeChildren(node).map((child, index) => renderNode(child, `${key}-${index}`))}
        </code>
      </pre>
    );
  }

  return null;
}

type PublicNoteContentProps = {
  contentJson: JSONContent;
};

export function PublicNoteContent({ contentJson }: PublicNoteContentProps) {
  return (
    <article className="note-editor-content space-y-4">{renderNode(contentJson, "root")}</article>
  );
}
