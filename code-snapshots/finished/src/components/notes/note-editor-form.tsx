"use client";

import type { JSONContent } from "@tiptap/core";
import { useRouter } from "next/navigation";
import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";
import { RichTextEditor } from "@/src/components/notes/rich-text-editor";
import {
  createNoteAction,
  deleteNoteAction,
  disableShareAction,
  enableShareAction,
  updateNoteAction,
} from "@/src/lib/notes/actions";
import {
  CREATE_NOTE_ERROR_MESSAGE,
  NOTE_AUTOSAVE_DEBOUNCE_MS,
  SAVE_NOTE_ERROR_MESSAGE,
} from "@/src/lib/notes/constants";
import type { SaveReason } from "@/src/lib/notes/types";
import { createEmptyNoteContent, serializeNoteDraft } from "@/src/lib/notes/validation";

type NoteEditorCreateProps = {
  mode: "create";
  initialTitle: string;
  initialContent: JSONContent;
};

type NoteEditorEditProps = {
  mode: "edit";
  noteId: string;
  initialTitle: string;
  initialContent: JSONContent;
  initialShareEnabled: boolean;
};

export type NoteEditorFormProps = NoteEditorCreateProps | NoteEditorEditProps;

type SaveStatus = "saved" | "unsaved" | "saving" | "error";

type DraftState = {
  title: string;
  contentJson: JSONContent;
};

const statusLabelByState: Record<SaveStatus, string> = {
  saved: "Saved",
  unsaved: "Unsaved changes",
  saving: "Saving",
  error: "Error",
};

const statusClassByState: Record<SaveStatus, string> = {
  saved: "text-emerald-300",
  unsaved: "text-(--foreground-muted)",
  saving: "text-(--accent)",
  error: "text-red-300",
};

export function NoteEditorForm(props: NoteEditorFormProps) {
  const { mode, initialTitle, initialContent } = props;
  const noteId = mode === "edit" ? props.noteId : null;
  const router = useRouter();
  const initialSignature = serializeNoteDraft(initialTitle, initialContent);

  const [title, setTitle] = useState(initialTitle);
  const [contentJson, setContentJson] = useState<JSONContent>(initialContent);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(mode === "edit" ? "saved" : "unsaved");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isCreateSubmitting, setIsCreateSubmitting] = useState(false);
  const [isManualSavePending, setIsManualSavePending] = useState(false);
  const [isDeletePending, setIsDeletePending] = useState(false);
  const [isSharePending, setIsSharePending] = useState(false);
  const [editorVersion, setEditorVersion] = useState(0);
  const [lastSavedSignature, setLastSavedSignature] = useState(initialSignature);
  const [isShareEnabled, setIsShareEnabled] = useState(
    mode === "edit" ? props.initialShareEnabled : false,
  );
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveInFlightRef = useRef(false);
  const queuedReasonRef = useRef<SaveReason | null>(null);
  const lastShareTokenRef = useRef<string | null>(null);
  const draftRef = useRef<DraftState>({
    title: initialTitle,
    contentJson: initialContent,
  });
  const lastSavedSignatureRef = useRef(initialSignature);

  const isEditMode = mode === "edit";
  const currentSignature = serializeNoteDraft(title, contentJson);
  const hasUnsavedChanges = currentSignature !== lastSavedSignature;

  function setSavedSignature(signature: string) {
    lastSavedSignatureRef.current = signature;
    setLastSavedSignature(signature);
  }

  function clearAutosaveTimer() {
    if (!autosaveTimerRef.current) {
      return;
    }

    clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = null;
  }

  function draftSignatureFor(value: DraftState): string {
    return serializeNoteDraft(value.title, value.contentJson);
  }

  function scheduleAutosave(nextDraft: DraftState) {
    if (!isEditMode) {
      return;
    }

    const signature = draftSignatureFor(nextDraft);

    if (signature === lastSavedSignatureRef.current && !saveInFlightRef.current) {
      clearAutosaveTimer();
      setSaveStatus("saved");
      return;
    }

    setSaveStatus("unsaved");
    clearAutosaveTimer();
    autosaveTimerRef.current = setTimeout(() => {
      void queueSave("autosave");
    }, NOTE_AUTOSAVE_DEBOUNCE_MS);
  }

  function updateDraft(nextDraft: DraftState) {
    draftRef.current = nextDraft;
    setTitle(nextDraft.title);
    setContentJson(nextDraft.contentJson);
    setFeedbackMessage(null);

    if (isEditMode) {
      scheduleAutosave(nextDraft);
      return;
    }

    setSaveStatus("unsaved");
  }

  function handleTitleChange(event: ChangeEvent<HTMLInputElement>) {
    updateDraft({
      ...draftRef.current,
      title: event.target.value,
    });
  }

  function handleContentChange(nextContent: JSONContent) {
    updateDraft({
      ...draftRef.current,
      contentJson: nextContent,
    });
  }

  async function executeSave(reason: SaveReason): Promise<void> {
    if (!isEditMode || !noteId) {
      return;
    }

    clearAutosaveTimer();

    const draft = draftRef.current;
    const draftSignature = draftSignatureFor(draft);

    if (reason === "autosave" && draftSignature === lastSavedSignatureRef.current) {
      setSaveStatus("saved");
      return;
    }

    saveInFlightRef.current = true;
    setSaveStatus("saving");
    setFeedbackMessage(null);

    if (reason === "manual") {
      setIsManualSavePending(true);
    }

    try {
      const response = await updateNoteAction({
        id: noteId,
        title: draft.title,
        contentJson: draft.contentJson,
        reason,
      });

      if (!response.ok) {
        setSaveStatus("error");
        setFeedbackMessage(response.error.message);
        return;
      }

      const latestDraftSignature = draftSignatureFor(draftRef.current);

      if (draftSignature === latestDraftSignature) {
        setSavedSignature(draftSignature);
        setSaveStatus("saved");
        return;
      }

      setSaveStatus("unsaved");

      if (!queuedReasonRef.current) {
        queuedReasonRef.current = "autosave";
      }
    } catch (error) {
      console.error("Failed to save note", {
        error,
        noteId,
        reason,
      });
      setSaveStatus("error");
      setFeedbackMessage(SAVE_NOTE_ERROR_MESSAGE);
    } finally {
      saveInFlightRef.current = false;

      if (reason === "manual") {
        setIsManualSavePending(false);
      }

      const queuedReason = queuedReasonRef.current;
      queuedReasonRef.current = null;

      if (queuedReason) {
        await executeSave(queuedReason);
      }
    }
  }

  async function queueSave(reason: SaveReason): Promise<void> {
    if (!isEditMode || !noteId) {
      return;
    }

    if (saveInFlightRef.current) {
      queuedReasonRef.current =
        reason === "manual" ? "manual" : (queuedReasonRef.current ?? "autosave");
      return;
    }

    await executeSave(reason);
  }

  async function submitCreate(): Promise<void> {
    if (isCreateSubmitting || isEditMode) {
      return;
    }

    setIsCreateSubmitting(true);
    setSaveStatus("saving");
    setFeedbackMessage(null);
    const draftSnapshot = {
      title: draftRef.current.title,
      contentJson: draftRef.current.contentJson,
    };

    try {
      const response = await createNoteAction({
        title: draftSnapshot.title,
        contentJson: draftSnapshot.contentJson,
      });

      if (!response.ok) {
        setSaveStatus("error");
        setFeedbackMessage(response.error.message);
        return;
      }

      setSavedSignature(draftSignatureFor(draftSnapshot));
      setSaveStatus("saved");
      router.push(`/notes/${response.data.noteId}`);
      router.refresh();
    } catch (error) {
      console.error("Failed to create note", error);
      setSaveStatus("error");
      setFeedbackMessage(CREATE_NOTE_ERROR_MESSAGE);
    } finally {
      setIsCreateSubmitting(false);
    }
  }

  async function handleDelete(): Promise<void> {
    if (!isEditMode || !noteId || isDeletePending) {
      return;
    }

    const isConfirmed = window.confirm("Delete this note permanently?");
    if (!isConfirmed) {
      return;
    }

    setIsDeletePending(true);
    setFeedbackMessage(null);

    try {
      const response = await deleteNoteAction({ id: noteId });

      if (!response.ok) {
        setFeedbackMessage(response.error.message);
        return;
      }

      router.push("/notes");
      router.refresh();
    } catch (error) {
      console.error("Failed to delete note", {
        error,
        noteId,
      });
      setFeedbackMessage("Unable to delete note. Please try again.");
    } finally {
      setIsDeletePending(false);
    }
  }

  async function handleEnableOrRegenerateShare(): Promise<void> {
    if (!isEditMode || !noteId || isSharePending) {
      return;
    }

    setIsSharePending(true);
    setFeedbackMessage(null);

    try {
      const response = await enableShareAction({ id: noteId });

      if (!response.ok) {
        setFeedbackMessage(response.error.message);
        return;
      }

      setShareUrl(response.data.shareUrl);
      setIsShareEnabled(true);
      lastShareTokenRef.current = response.data.shareToken;
    } catch (error) {
      console.error("Failed to enable note sharing", {
        error,
        noteId,
      });
      setFeedbackMessage("Unable to update sharing. Please try again.");
    } finally {
      setIsSharePending(false);
    }
  }

  async function handleDisableShare(): Promise<void> {
    if (!isEditMode || !noteId || isSharePending) {
      return;
    }

    setIsSharePending(true);
    setFeedbackMessage(null);

    try {
      const response = await disableShareAction({
        id: noteId,
        shareToken: lastShareTokenRef.current ?? undefined,
      });

      if (!response.ok) {
        setFeedbackMessage(response.error.message);
        return;
      }

      setIsShareEnabled(false);
      setShareUrl(null);
      lastShareTokenRef.current = null;
    } catch (error) {
      console.error("Failed to disable note sharing", {
        error,
        noteId,
      });
      setFeedbackMessage("Unable to update sharing. Please try again.");
    } finally {
      setIsSharePending(false);
    }
  }

  async function handleCopyShareUrl(): Promise<void> {
    if (!shareUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch (error) {
      console.error("Failed to copy share URL", error);
      setFeedbackMessage("Unable to copy share link. Please copy it manually.");
    }
  }

  function handleClear() {
    if (isEditMode) {
      return;
    }

    const emptyContent = createEmptyNoteContent();
    const clearedDraft = {
      title: "",
      contentJson: emptyContent,
    };

    draftRef.current = clearedDraft;
    setTitle(clearedDraft.title);
    setContentJson(clearedDraft.contentJson);
    setEditorVersion((currentValue) => currentValue + 1);
    setFeedbackMessage(null);
    setSaveStatus("unsaved");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isEditMode) {
      void queueSave("manual");
      return;
    }

    void submitCreate();
  }

  useEffect(() => {
    return () => {
      clearAutosaveTimer();
    };
  }, []);

  const createSaveLabel = isCreateSubmitting ? "Saving..." : "Save";
  const editSaveLabel = isManualSavePending || saveStatus === "saving" ? "Saving..." : "Save";
  const saveButtonLabel = isEditMode ? editSaveLabel : createSaveLabel;
  const isEditSaveDisabled = !hasUnsavedChanges || saveStatus === "saving";
  const isCreateLocked = !isEditMode && isCreateSubmitting;
  const isSaveButtonDisabled = isEditMode ? isEditSaveDisabled : isCreateSubmitting;

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div>
          <label className="text-sm font-medium text-(--foreground-muted)" htmlFor="note-title">
            Title
          </label>
          <input
            id="note-title"
            name="title"
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Untitled note"
            disabled={isCreateLocked}
            className="mt-1.5 w-full rounded-lg border border-(--border) bg-(--background-elevated) px-3 py-2.5 text-base text-(--foreground) outline-none transition focus:border-(--accent)"
          />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 sm:flex-nowrap sm:pb-0.5">
          <p
            className={`min-w-[16ch] whitespace-nowrap text-right text-sm font-semibold ${statusClassByState[saveStatus]}`}
          >
            {statusLabelByState[saveStatus]}
          </p>

          {isEditMode ? null : (
            <button
              type="button"
              onClick={handleClear}
              disabled={isCreateLocked}
              className="rounded-lg border border-(--border) px-4 py-2 text-sm font-medium text-(--foreground-muted) transition-colors hover:border-(--accent) hover:text-(--accent) disabled:cursor-not-allowed disabled:opacity-60"
            >
              Clear
            </button>
          )}

          <button
            type="submit"
            disabled={isSaveButtonDisabled}
            className={
              isEditMode
                ? "min-w-[8.5rem] rounded-lg border border-(--border) bg-(--surface-soft) px-5 py-2 text-base font-semibold text-(--foreground) transition-colors hover:border-(--accent) hover:text-(--accent) disabled:cursor-not-allowed disabled:opacity-60"
                : "min-w-[8.5rem] rounded-lg bg-(--accent) px-5 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-(--accent-strong) disabled:cursor-not-allowed disabled:opacity-60"
            }
          >
            {saveButtonLabel}
          </button>
        </div>
      </div>

      <RichTextEditor
        key={isEditMode ? noteId : `create-${editorVersion}`}
        initialContent={contentJson}
        onContentChange={handleContentChange}
        isReadOnly={isCreateLocked}
      />

      {isEditMode ? (
        <section className="space-y-3 rounded-lg border border-(--border) bg-(--surface-soft) p-3">
          <h2 className="text-base font-semibold text-(--foreground)">Sharing</h2>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleEnableOrRegenerateShare}
              disabled={isSharePending}
              className="rounded-lg border border-(--border) px-4 py-2 text-sm font-medium text-(--foreground) transition-colors hover:border-(--accent) hover:text-(--accent) disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSharePending
                ? "Updating..."
                : isShareEnabled
                  ? "Regenerate link"
                  : "Enable sharing"}
            </button>

            <button
              type="button"
              onClick={handleDisableShare}
              disabled={!isShareEnabled || isSharePending}
              className="rounded-lg border border-red-400/40 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition-colors hover:border-red-300 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Disable sharing
            </button>
          </div>

          {shareUrl ? (
            <div className="space-y-2">
              <label htmlFor="share-url" className="text-sm font-medium text-(--foreground-muted)">
                Share link
              </label>
              <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                <input
                  id="share-url"
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="w-full rounded-lg border border-(--border) bg-(--background-elevated) px-3 py-2 text-sm text-(--foreground)"
                />
                <button
                  type="button"
                  onClick={handleCopyShareUrl}
                  className="rounded-lg border border-(--border) px-4 py-2 text-sm font-medium text-(--foreground-muted) transition-colors hover:border-(--accent) hover:text-(--accent)"
                >
                  Copy link
                </button>
              </div>
            </div>
          ) : isShareEnabled ? (
            <p className="text-sm text-(--foreground-muted)">
              Sharing is enabled. Generate a fresh link to share this note.
            </p>
          ) : null}
        </section>
      ) : null}

      {isEditMode ? (
        <button
          type="button"
          onClick={() => {
            void handleDelete();
          }}
          disabled={isDeletePending}
          className="rounded-lg border border-red-400/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 transition-colors hover:border-red-300 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isDeletePending ? "Deleting..." : "Delete note"}
        </button>
      ) : null}

      {feedbackMessage ? (
        <p
          className="rounded-md border border-red-300/25 bg-red-400/10 px-3 py-2 text-sm text-red-200"
          role="alert"
        >
          {feedbackMessage}
        </p>
      ) : null}
    </form>
  );
}
