"use server";

import type { JSONContent } from "@tiptap/react";
import { revalidatePath } from "next/cache";
import {
  createNoteForUser,
  deleteNoteForUser,
  disableShareForUser,
  enableShareForUser,
  updateNoteForUser,
  type NoteMutationResult,
} from "@/lib/notes";
import { requireSession } from "@/lib/session";

export type NoteActionInput = { contentJson: JSONContent; title: string };
export type UpdateNoteActionInput = NoteActionInput & { id: string };
export type DeleteNoteActionInput = { id: string };
export type ShareNoteActionInput = { id: string };

export type NoteActionResult =
  | { note: NoteMutationResult; ok: true }
  | { error: string; ok: false };
export type DeleteNoteActionResult = { ok: true } | { error: string; ok: false };
export type EnableShareActionResult =
  | { ok: true; share: { shareEnabled: true; shareUrl: string; token: string } }
  | { error: string; ok: false };
export type DisableShareActionResult =
  | { ok: true; share: { shareEnabled: false } }
  | { error: string; ok: false };

const saveErrorMessage = "Unable to save this note right now.";
const deleteErrorMessage = "Unable to delete this note right now.";
const shareErrorMessage = "Unable to update sharing right now.";

export async function createNoteAction(input: NoteActionInput): Promise<NoteActionResult> {
  /* ... */
  const session = await requireSession();
  try {
    const note = createNoteForUser(session.user.id, input);
    if (note === null) return { error: saveErrorMessage, ok: false };
    revalidatePath("/notes");
    return { note, ok: true };
  } catch (error) {
    console.error("Note creation failed", error);
    return { error: saveErrorMessage, ok: false };
  }
}

export async function updateNoteAction(input: UpdateNoteActionInput): Promise<NoteActionResult> {
  const session = await requireSession();
  try {
    const note = updateNoteForUser(session.user.id, input);
    if (note === null) return { error: saveErrorMessage, ok: false };
    revalidatePath("/notes");
    revalidatePath(`/notes/${input.id}`);
    return { note, ok: true };
  } catch (error) {
    console.error("Note update failed", error);
    return { error: saveErrorMessage, ok: false };
  }
}

export async function deleteNoteAction(
  input: DeleteNoteActionInput,
): Promise<DeleteNoteActionResult> {
  const session = await requireSession();
  try {
    const deleted = deleteNoteForUser(session.user.id, input.id);
    if (!deleted) return { error: deleteErrorMessage, ok: false };
    revalidatePath("/notes");
    revalidatePath(`/notes/${input.id}`);
    return { ok: true };
  } catch (error) {
    console.error("Note deletion failed", error);
    return { error: deleteErrorMessage, ok: false };
  }
}

export async function enableShareAction(
  input: ShareNoteActionInput,
): Promise<EnableShareActionResult> {
  const session = await requireSession();
  try {
    const share = enableShareForUser(session.user.id, input.id);
    if (share === null) return { error: shareErrorMessage, ok: false };
    const shareUrl = `${getAppBaseUrl()}/s/${share.token}`;
    revalidatePath("/notes");
    revalidatePath(`/notes/${input.id}`);
    return { ok: true, share: { shareEnabled: true, shareUrl, token: share.token } };
  } catch (error) {
    console.error("Enable share failed", error);
    return { error: shareErrorMessage, ok: false };
  }
}

export async function disableShareAction(
  input: ShareNoteActionInput,
): Promise<DisableShareActionResult> {
  const session = await requireSession();
  try {
    const disabled = disableShareForUser(session.user.id, input.id);
    if (!disabled) return { error: shareErrorMessage, ok: false };
    revalidatePath("/notes");
    revalidatePath(`/notes/${input.id}`);
    return { ok: true, share: { shareEnabled: false } };
  } catch (error) {
    console.error("Disable share failed", error);
    return { error: shareErrorMessage, ok: false };
  }
}

function getAppBaseUrl(): string {
  return process.env.APP_URL ?? process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
}
