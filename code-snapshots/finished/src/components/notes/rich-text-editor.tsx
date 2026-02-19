"use client";

import type { JSONContent } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

type RichTextEditorProps = {
  initialContent: JSONContent;
  onContentChange: (value: JSONContent) => void;
  isReadOnly?: boolean;
};

type ToolbarButtonProps = {
  label: string;
  disabled?: boolean;
  active?: boolean;
  onPress: () => void;
};

function ToolbarButton({ label, disabled, active, onPress }: ToolbarButtonProps) {
  function handlePress() {
    if (disabled) {
      return;
    }

    onPress();
  }

  return (
    <button
      type="button"
      onClick={handlePress}
      disabled={disabled}
      className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
        active
          ? "border-(--accent) bg-(--accent)/20 text-(--accent)"
          : "border-(--border) bg-(--background-elevated) text-(--foreground-muted) hover:text-(--foreground)"
      } disabled:cursor-not-allowed disabled:opacity-45`}
    >
      {label}
    </button>
  );
}

function normalizeUrl(value: string): string | null {
  const candidate =
    value.startsWith("http://") || value.startsWith("https://") ? value : `https://${value}`;

  try {
    const url = new URL(candidate);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

export function RichTextEditor({
  initialContent,
  onContentChange,
  isReadOnly = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        link: {
          openOnClick: false,
          protocols: ["http", "https"],
          HTMLAttributes: {
            rel: "noopener noreferrer",
            target: "_blank",
          },
        },
      }),
    ],
    content: initialContent,
    editable: !isReadOnly,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "note-editor-content min-h-[20rem] rounded-lg border border-(--border) bg-[#031326] px-4 py-3 text-base leading-7 text-(--foreground) outline-none",
      },
    },
    onUpdate({ editor: editorInstance }) {
      onContentChange(editorInstance.getJSON());
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    editor.setEditable(!isReadOnly);
  }, [editor, isReadOnly]);

  function handleParagraph() {
    editor?.chain().focus().setParagraph().run();
  }

  function handleHeading2() {
    editor?.chain().focus().toggleHeading({ level: 2 }).run();
  }

  function handleHeading3() {
    editor?.chain().focus().toggleHeading({ level: 3 }).run();
  }

  function handleBold() {
    editor?.chain().focus().toggleBold().run();
  }

  function handleItalic() {
    editor?.chain().focus().toggleItalic().run();
  }

  function handleStrike() {
    editor?.chain().focus().toggleStrike().run();
  }

  function handleBulletList() {
    editor?.chain().focus().toggleBulletList().run();
  }

  function handleOrderedList() {
    editor?.chain().focus().toggleOrderedList().run();
  }

  function handleCodeBlock() {
    editor?.chain().focus().toggleCodeBlock().run();
  }

  function handleBlockquote() {
    editor?.chain().focus().toggleBlockquote().run();
  }

  function handleUndo() {
    editor?.chain().focus().undo().run();
  }

  function handleRedo() {
    editor?.chain().focus().redo().run();
  }

  function handleLink() {
    if (!editor || isReadOnly) {
      return;
    }

    const currentHref = editor.getAttributes("link").href;
    const inputValue = window.prompt("Enter URL", currentHref || "https://");

    if (inputValue === null) {
      return;
    }

    const trimmedValue = inputValue.trim();

    if (!trimmedValue) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    const normalizedHref = normalizeUrl(trimmedValue);

    if (!normalizedHref) {
      return;
    }

    editor.chain().focus().setLink({ href: normalizedHref }).run();
  }

  const isEditorReady = Boolean(editor);
  const areControlsDisabled = !isEditorReady || isReadOnly;

  return (
    <section>
      <div className="rounded-lg border border-(--border) bg-[#031326] p-2">
        <div className="flex flex-wrap items-center gap-2">
          <ToolbarButton
            label="P"
            onPress={handleParagraph}
            active={editor?.isActive("paragraph")}
            disabled={areControlsDisabled}
          />
          <ToolbarButton
            label="H2"
            onPress={handleHeading2}
            active={editor?.isActive("heading", { level: 2 })}
            disabled={areControlsDisabled}
          />
          <ToolbarButton
            label="H3"
            onPress={handleHeading3}
            active={editor?.isActive("heading", { level: 3 })}
            disabled={areControlsDisabled}
          />
          <ToolbarButton
            label="Bold"
            onPress={handleBold}
            active={editor?.isActive("bold")}
            disabled={areControlsDisabled}
          />
          <ToolbarButton
            label="Italic"
            onPress={handleItalic}
            active={editor?.isActive("italic")}
            disabled={areControlsDisabled}
          />
          <ToolbarButton
            label="Strike"
            onPress={handleStrike}
            active={editor?.isActive("strike")}
            disabled={areControlsDisabled}
          />
          <ToolbarButton
            label="Bullet"
            onPress={handleBulletList}
            active={editor?.isActive("bulletList")}
            disabled={areControlsDisabled}
          />
          <ToolbarButton
            label="Ordered"
            onPress={handleOrderedList}
            active={editor?.isActive("orderedList")}
            disabled={areControlsDisabled}
          />
          <ToolbarButton
            label="Code"
            onPress={handleCodeBlock}
            active={editor?.isActive("codeBlock")}
            disabled={areControlsDisabled}
          />
          <ToolbarButton
            label="Quote"
            onPress={handleBlockquote}
            active={editor?.isActive("blockquote")}
            disabled={areControlsDisabled}
          />
          <ToolbarButton
            label="Link"
            onPress={handleLink}
            active={editor?.isActive("link")}
            disabled={areControlsDisabled}
          />
          <ToolbarButton label="Undo" onPress={handleUndo} disabled={areControlsDisabled} />
          <ToolbarButton label="Redo" onPress={handleRedo} disabled={areControlsDisabled} />
        </div>
      </div>

      {editor ? (
        <EditorContent editor={editor} className="mt-3" />
      ) : (
        <div className="mt-3 min-h-[20rem] rounded-lg border border-(--border) bg-[#031326]" />
      )}
    </section>
  );
}
