"use client";

import type { Editor, JSONContent } from "@tiptap/react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  createNoteAction,
  deleteNoteAction,
  disableShareAction,
  enableShareAction,
  updateNoteAction,
} from "./actions";
import {
  createEmptyTiptapContent,
  normalizeNoteTitle,
  serializeTiptapContent,
} from "@/lib/note-content";

type NoteEditorProps =
  | {
      initialContentJson: JSONContent;
      initialTitle: string;
      mode: "create";
    }
  | {
      initialContentJson: JSONContent;
      initialTitle: string;
      mode: "edit";
      noteId: string;
      shareEnabled: boolean;
    };

const autosaveDelayMs = 1200;

export function NoteEditor(props: NoteEditorProps) {
  const router = useRouter();
  const initialContentKey = getContentKey(props.initialContentJson);
  const initialSavedKey = getDraftKey(props.initialTitle, initialContentKey);
  const [title, setTitle] = useState(props.initialTitle);
  const [contentKey, setContentKey] = useState(initialContentKey);
  const [savedKey, setSavedKey] = useState(initialSavedKey);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareEnabled, setShareEnabled] = useState(
    props.mode === "edit" ? props.shareEnabled : false,
  );
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isRouting, startRouting] = useTransition();
  const latestTitleRef = useRef(props.initialTitle);
  const latestContentKeyRef = useRef(initialContentKey);

  const editor = useEditor({
    content: props.initialContentJson,
    editorProps: {
      attributes: {
        "aria-label": "Note content",
        role: "textbox",
      },
    },
    extensions: [StarterKit],
    immediatelyRender: false,
    onUpdate: ({ editor: currentEditor }) => {
      const nextContentKey = getContentKey(currentEditor.getJSON());

      latestContentKeyRef.current = nextContentKey;
      setContentKey(nextContentKey);
      setErrorMessage(null);
    },
  });

  const currentKey = getDraftKey(title, contentKey);
  const hasUnsavedChanges = currentKey !== savedKey;
  const isCreateMode = props.mode === "create";
  const status = getSaveStatus({
    errorMessage,
    hasUnsavedChanges,
    isCreateMode,
    isSaving: isSaving || isRouting,
  });

  const saveNote = useCallback(async () => {
    if (editor === null || isSaving || isRouting) {
      return;
    }

    const contentJson = editor.getJSON();
    const nextContentKey = getContentKey(contentJson);
    const nextTitle = normalizeNoteTitle(title);
    const nextSavedKey = getDraftKey(nextTitle, nextContentKey);

    setIsSaving(true);
    setErrorMessage(null);

    const result =
      props.mode === "create"
        ? await createNoteAction({
            contentJson,
            title: nextTitle,
          })
        : await updateNoteAction({
            contentJson,
            id: props.noteId,
            title: nextTitle,
          });

    setIsSaving(false);

    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }

    setSavedKey(nextSavedKey);

    if (getDraftKey(latestTitleRef.current, latestContentKeyRef.current) === nextSavedKey) {
      latestTitleRef.current = nextTitle;
      latestContentKeyRef.current = nextContentKey;
      setTitle(nextTitle);
      setContentKey(nextContentKey);
    }

    if (props.mode === "create") {
      startRouting(() => {
        router.replace(`/notes/${result.note.id}`);
      });
    }
  }, [editor, isRouting, isSaving, props, router, title]);

  useEffect(() => {
    if (props.mode !== "edit" || !hasUnsavedChanges || isSaving || editor === null) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void saveNote();
    }, autosaveDelayMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [currentKey, editor, hasUnsavedChanges, isSaving, props.mode, saveNote]);

  function handleTitleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextTitle = event.target.value;

    latestTitleRef.current = nextTitle;
    setTitle(nextTitle);
    setErrorMessage(null);
  }

  function handleSaveClick() {
    void saveNote();
  }

  async function handleDeleteClick() {
    if (props.mode !== "edit" || isDeleting || isSaving || isRouting) return;
    if (!window.confirm("Delete this note? This action cannot be undone.")) return;
    setIsDeleting(true);
    setErrorMessage(null);
    const result = await deleteNoteAction({ id: props.noteId });
    setIsDeleting(false);
    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }
    startRouting(() => {
      router.replace("/notes");
    });
  }

  async function handleEnableShareClick() {
    if (props.mode !== "edit" || isSharing) return;
    setIsSharing(true);
    setErrorMessage(null);
    const result = await enableShareAction({ id: props.noteId });
    setIsSharing(false);
    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }
    setShareEnabled(true);
    setShareUrl(result.share.shareUrl);
  }

  async function handleDisableShareClick() {
    if (props.mode !== "edit" || isSharing) return;
    setIsSharing(true);
    setErrorMessage(null);
    const result = await disableShareAction({ id: props.noteId });
    setIsSharing(false);
    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }
    setShareEnabled(false);
    setShareUrl(null);
  }

  function handleClearClick() {
    const emptyContent = createEmptyTiptapContent();

    setTitle("");
    setContentKey(getContentKey(emptyContent));
    latestTitleRef.current = "";
    latestContentKeyRef.current = getContentKey(emptyContent);
    setErrorMessage(null);
    editor?.commands.setContent(emptyContent);
  }

  return (
    <section className="mx-auto max-w-4xl">
      {isCreateMode ? (
        <div className="mb-5">
          <h1 className="text-3xl font-semibold tracking-tight text-acc-5">New note</h1>
          <p className={`mt-2 text-sm font-semibold ${status.className}`} aria-live="polite">
            {status.label}
          </p>
        </div>
      ) : (
        <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-acc-2 px-4 py-2 text-sm font-semibold text-acc-5 transition hover:border-acc-3 hover:bg-acc-1 focus:outline-none focus:ring-2 focus:ring-acc-2 focus:ring-offset-2 focus:ring-offset-background"
              href="/notes"
            >
              Back to notes
            </Link>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-acc-5">Edit Note</h1>
            <p className="mt-2 text-sm leading-6 text-foreground/70">
              Changes are saved while you type.
            </p>
          </div>
          <p className={`text-sm font-semibold ${status.className}`} aria-live="polite">
            {status.label}
          </p>
        </header>
      )}

      <div className="overflow-hidden rounded-lg border border-acc-2 bg-acc-1/80 shadow-xl shadow-black/10">
        <label className="block border-b border-acc-2 px-4 py-3">
          <span className="sr-only">Note title</span>
          <input
            className="w-full bg-transparent text-2xl font-semibold tracking-tight text-acc-5 outline-none placeholder:text-foreground/35"
            maxLength={160}
            onChange={handleTitleChange}
            placeholder="Untitled note"
            type="text"
            value={title}
          />
        </label>

        <EditorToolbar editor={editor} />

        <div className="tinynotes-editor border-t border-acc-2 bg-background px-5 py-5 text-foreground">
          {editor === null ? (
            <div className="min-h-96 animate-pulse rounded-md border border-dashed border-acc-2 bg-acc-1/50" />
          ) : (
            <EditorContent editor={editor} />
          )}
        </div>
      </div>

      {props.mode === "edit" ? (
        <div className="mt-5 rounded-lg border border-acc-2 bg-acc-1 p-4">
          <p className="text-sm font-semibold text-acc-5">Public sharing</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {shareEnabled ? (
              <button
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-acc-2 px-4 py-2 text-sm font-semibold text-acc-5"
                disabled={isSharing}
                onClick={handleDisableShareClick}
                type="button"
              >
                Disable sharing
              </button>
            ) : (
              <button
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-acc-2 px-4 py-2 text-sm font-semibold text-acc-5"
                disabled={isSharing}
                onClick={handleEnableShareClick}
                type="button"
              >
                Enable sharing
              </button>
            )}
            {shareUrl !== null ? (
              <input
                className="min-w-0 flex-1 rounded-md border border-acc-2 bg-background px-3 py-2 text-sm"
                readOnly
                value={shareUrl}
              />
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
        {props.mode === "edit" ? (
          <button
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-red-300 px-5 py-2 text-sm font-semibold text-red-700"
            disabled={isDeleting || isSaving || isRouting}
            onClick={handleDeleteClick}
            type="button"
          >
            Delete
          </button>
        ) : null}
        {isCreateMode ? (
          <button
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-acc-2 px-5 py-2 text-sm font-semibold text-acc-5 transition hover:border-acc-3 hover:bg-acc-1 focus:outline-none focus:ring-2 focus:ring-acc-2 focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60"
            disabled={editor === null || isSaving || isRouting}
            onClick={handleClearClick}
            type="button"
          >
            Clear
          </button>
        ) : null}
        <button
          className="inline-flex min-h-10 items-center justify-center rounded-md bg-acc-3 px-5 py-2 text-sm font-semibold text-background shadow-sm transition hover:bg-acc-4 focus:outline-none focus:ring-2 focus:ring-acc-4 focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60"
          disabled={
            editor === null || isSaving || isRouting || (!hasUnsavedChanges && !isCreateMode)
          }
          onClick={handleSaveClick}
          type="button"
        >
          {isCreateMode ? "Create note" : "Save"}
        </button>
      </div>

      {errorMessage !== null ? (
        <p
          className="mt-4 rounded-md border border-acc-2 bg-acc-1 px-4 py-3 text-sm text-acc-5"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}
    </section>
  );
}

function EditorToolbar({ editor }: { editor: Editor | null }) {
  const editorState = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      if (currentEditor === null) {
        return {
          canRedo: false,
          canUndo: false,
          isBold: false,
          isBulletList: false,
          isHeading: false,
          isItalic: false,
          isOrderedList: false,
          isParagraph: false,
          isStrike: false,
        };
      }

      return {
        canRedo: currentEditor.can().chain().focus().redo().run(),
        canUndo: currentEditor.can().chain().focus().undo().run(),
        isBold: currentEditor.isActive("bold"),
        isBulletList: currentEditor.isActive("bulletList"),
        isHeading: currentEditor.isActive("heading", { level: 2 }),
        isItalic: currentEditor.isActive("italic"),
        isOrderedList: currentEditor.isActive("orderedList"),
        isParagraph: currentEditor.isActive("paragraph"),
        isStrike: currentEditor.isActive("strike"),
      };
    },
  });

  const state = editorState ?? {
    canRedo: false,
    canUndo: false,
    isBold: false,
    isBulletList: false,
    isHeading: false,
    isItalic: false,
    isOrderedList: false,
    isParagraph: false,
    isStrike: false,
  };

  function handleParagraphClick() {
    editor?.chain().focus().setParagraph().run();
  }

  function handleHeadingClick() {
    editor?.chain().focus().toggleHeading({ level: 2 }).run();
  }

  function handleBoldClick() {
    editor?.chain().focus().toggleBold().run();
  }

  function handleItalicClick() {
    editor?.chain().focus().toggleItalic().run();
  }

  function handleStrikeClick() {
    editor?.chain().focus().toggleStrike().run();
  }

  function handleBulletListClick() {
    editor?.chain().focus().toggleBulletList().run();
  }

  function handleOrderedListClick() {
    editor?.chain().focus().toggleOrderedList().run();
  }

  function handleUndoClick() {
    editor?.chain().focus().undo().run();
  }

  function handleRedoClick() {
    editor?.chain().focus().redo().run();
  }

  return (
    <div
      aria-label="Editor formatting tools"
      className="flex flex-wrap items-center gap-2 bg-acc-1 px-4 py-3"
      role="toolbar"
    >
      <ToolbarButton
        active={state.isParagraph}
        disabled={editor === null}
        onClick={handleParagraphClick}
      >
        P
      </ToolbarButton>
      <ToolbarButton
        active={state.isHeading}
        disabled={editor === null}
        onClick={handleHeadingClick}
      >
        H2
      </ToolbarButton>
      <ToolbarDivider />
      <ToolbarButton active={state.isBold} disabled={editor === null} onClick={handleBoldClick}>
        B
      </ToolbarButton>
      <ToolbarButton active={state.isItalic} disabled={editor === null} onClick={handleItalicClick}>
        I
      </ToolbarButton>
      <ToolbarButton active={state.isStrike} disabled={editor === null} onClick={handleStrikeClick}>
        S
      </ToolbarButton>
      <ToolbarDivider />
      <ToolbarButton
        active={state.isBulletList}
        disabled={editor === null}
        onClick={handleBulletListClick}
      >
        UL
      </ToolbarButton>
      <ToolbarButton
        active={state.isOrderedList}
        disabled={editor === null}
        onClick={handleOrderedListClick}
      >
        OL
      </ToolbarButton>
      <ToolbarDivider />
      <ToolbarButton disabled={editor === null || !state.canUndo} onClick={handleUndoClick}>
        Undo
      </ToolbarButton>
      <ToolbarButton disabled={editor === null || !state.canRedo} onClick={handleRedoClick}>
        Redo
      </ToolbarButton>
    </div>
  );
}

function ToolbarButton({
  active,
  children,
  disabled = false,
  onClick,
}: Readonly<{
  active?: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}>) {
  return (
    <button
      aria-pressed={active}
      className={getToolbarButtonClass(active === true)}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <span className="mx-1 h-6 w-px bg-acc-2" />;
}

function getToolbarButtonClass(active: boolean): string {
  const activeClass = active
    ? "border-acc-3 bg-acc-3 text-background"
    : "border-acc-2 bg-background text-acc-5 hover:border-acc-3 hover:bg-acc-2";

  return `inline-flex min-h-9 min-w-9 items-center justify-center rounded-md border px-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-acc-3 disabled:cursor-not-allowed disabled:opacity-45 ${activeClass}`;
}

function getContentKey(contentJson: JSONContent): string {
  return serializeTiptapContent(contentJson) ?? "";
}

function getDraftKey(title: string, contentKey: string): string {
  return `${normalizeNoteTitle(title)}\n${contentKey}`;
}

function getSaveStatus({
  errorMessage,
  hasUnsavedChanges,
  isCreateMode,
  isSaving,
}: {
  errorMessage: string | null;
  hasUnsavedChanges: boolean;
  isCreateMode: boolean;
  isSaving: boolean;
}) {
  if (isSaving) {
    return {
      className: "text-acc-4",
      label: "Saving...",
    };
  }

  if (errorMessage !== null) {
    return {
      className: "text-red-200",
      label: "Save failed",
    };
  }

  if (hasUnsavedChanges || isCreateMode) {
    return {
      className: "text-acc-4",
      label: "Unsaved changes",
    };
  }

  return {
    className: "text-acc-5",
    label: "Saved",
  };
}
