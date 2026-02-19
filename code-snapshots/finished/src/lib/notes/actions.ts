"use server";

import { revalidatePath } from "next/cache";
import { CREATE_NOTE_ERROR_MESSAGE, SAVE_NOTE_ERROR_MESSAGE } from "@/src/lib/notes/constants";
import {
  createNoteRecord,
  deleteNoteRecord,
  disableNoteShareRecord,
  enableNoteShareRecord,
  updateNoteRecord,
} from "@/src/lib/notes/repository";
import { buildShareUrl, generateShareToken, hashShareToken } from "@/src/lib/notes/sharing";
import type {
  CreateNoteActionData,
  CreateNoteActionInput,
  DeleteNoteActionData,
  DeleteNoteActionInput,
  DisableShareActionData,
  DisableShareActionInput,
  EnableShareActionData,
  EnableShareActionInput,
  NoteActionResult,
  UpdateNoteActionData,
  UpdateNoteActionInput,
} from "@/src/lib/notes/types";
import { normalizeNoteTitle, validateNoteContent } from "@/src/lib/notes/validation";
import { requireSessionOrRedirect } from "@/src/lib/session";

function createValidationError<TData>(message: string): NoteActionResult<TData> {
  return {
    ok: false,
    error: {
      code: "VALIDATION_ERROR",
      message,
    },
  };
}

function createInternalError<TData>(message: string): NoteActionResult<TData> {
  return {
    ok: false,
    error: {
      code: "INTERNAL_ERROR",
      message,
    },
  };
}

function createNotFoundError<TData>(): NoteActionResult<TData> {
  return {
    ok: false,
    error: {
      code: "NOT_FOUND",
      message: "The requested note could not be found.",
    },
  };
}

async function getSessionUserId(): Promise<string | null> {
  const session = await requireSessionOrRedirect();
  const userId = session?.user?.id;

  if (!userId || typeof userId !== "string") {
    return null;
  }

  return userId;
}

export async function createNoteAction(
  input: CreateNoteActionInput,
): Promise<NoteActionResult<CreateNoteActionData>> {
  const userId = await getSessionUserId();
  if (!userId) {
    return createInternalError("Authentication is currently unavailable.");
  }

  if (!input || typeof input.title !== "string") {
    return createValidationError("Please provide a valid note title.");
  }

  const contentValidation = validateNoteContent(input.contentJson);
  if (!contentValidation.ok) {
    return createValidationError(contentValidation.message);
  }

  const noteId = crypto.randomUUID();
  const now = new Date().toISOString();
  const normalizedTitle = normalizeNoteTitle(input.title);

  try {
    createNoteRecord({
      id: noteId,
      userId,
      title: normalizedTitle,
      serializedContent: contentValidation.serializedContent,
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    console.error("Failed to create note", error);
    return createInternalError(CREATE_NOTE_ERROR_MESSAGE);
  }

  revalidatePath("/notes");
  revalidatePath(`/notes/${noteId}`);

  return {
    ok: true,
    data: {
      noteId,
      updatedAt: now,
    },
  };
}

export async function updateNoteAction(
  input: UpdateNoteActionInput,
): Promise<NoteActionResult<UpdateNoteActionData>> {
  const userId = await getSessionUserId();
  if (!userId) {
    return createInternalError("Authentication is currently unavailable.");
  }

  if (!input || typeof input.id !== "string" || typeof input.title !== "string") {
    return createValidationError("Please provide valid note data.");
  }

  const contentValidation = validateNoteContent(input.contentJson);
  if (!contentValidation.ok) {
    return createValidationError(contentValidation.message);
  }

  const normalizedTitle = normalizeNoteTitle(input.title);
  const now = new Date().toISOString();

  try {
    const didUpdate = updateNoteRecord({
      id: input.id,
      userId,
      title: normalizedTitle,
      serializedContent: contentValidation.serializedContent,
      updatedAt: now,
    });

    if (!didUpdate) {
      return createNotFoundError();
    }
  } catch (error) {
    console.error("Failed to update note", {
      error,
      noteId: input.id,
      reason: input.reason,
    });
    return createInternalError(SAVE_NOTE_ERROR_MESSAGE);
  }

  revalidatePath("/notes");
  revalidatePath(`/notes/${input.id}`);

  return {
    ok: true,
    data: {
      updatedAt: now,
    },
  };
}

export async function deleteNoteAction(
  input: DeleteNoteActionInput,
): Promise<NoteActionResult<DeleteNoteActionData>> {
  const userId = await getSessionUserId();
  if (!userId) {
    return createInternalError("Authentication is currently unavailable.");
  }

  if (!input || typeof input.id !== "string" || input.id.trim() === "") {
    return createValidationError("Please provide valid note data.");
  }

  try {
    const didDelete = deleteNoteRecord({
      id: input.id,
      userId,
    });

    if (!didDelete) {
      return createNotFoundError();
    }
  } catch (error) {
    console.error("Failed to delete note", {
      error,
      noteId: input.id,
    });
    return createInternalError("Unable to delete note. Please try again.");
  }

  revalidatePath("/notes");
  revalidatePath(`/notes/${input.id}`);

  return {
    ok: true,
    data: {
      deleted: true,
    },
  };
}

export async function enableShareAction(
  input: EnableShareActionInput,
): Promise<NoteActionResult<EnableShareActionData>> {
  const userId = await getSessionUserId();
  if (!userId) {
    return createInternalError("Authentication is currently unavailable.");
  }

  if (!input || typeof input.id !== "string" || input.id.trim() === "") {
    return createValidationError("Please provide valid note data.");
  }

  const shareToken = generateShareToken();
  const tokenHash = hashShareToken(shareToken);
  const now = new Date().toISOString();

  try {
    const enabled = enableNoteShareRecord({
      id: input.id,
      userId,
      shareId: crypto.randomUUID(),
      tokenHash,
      now,
    });

    if (!enabled) {
      return createNotFoundError();
    }
  } catch (error) {
    console.error("Failed to enable note share", {
      error,
      noteId: input.id,
    });
    return createInternalError("Unable to update sharing. Please try again.");
  }

  const shareUrl = buildShareUrl(shareToken);
  revalidatePath("/notes");
  revalidatePath(`/notes/${input.id}`);
  revalidatePath(`/s/${shareToken}`);

  return {
    ok: true,
    data: {
      shareToken,
      shareUrl,
    },
  };
}

export async function disableShareAction(
  input: DisableShareActionInput,
): Promise<NoteActionResult<DisableShareActionData>> {
  const userId = await getSessionUserId();
  if (!userId) {
    return createInternalError("Authentication is currently unavailable.");
  }

  if (!input || typeof input.id !== "string" || input.id.trim() === "") {
    return createValidationError("Please provide valid note data.");
  }

  const now = new Date().toISOString();

  try {
    const disabled = disableNoteShareRecord({
      id: input.id,
      userId,
      now,
    });

    if (!disabled) {
      return createNotFoundError();
    }
  } catch (error) {
    console.error("Failed to disable note share", {
      error,
      noteId: input.id,
    });
    return createInternalError("Unable to update sharing. Please try again.");
  }

  revalidatePath("/notes");
  revalidatePath(`/notes/${input.id}`);

  if (typeof input.shareToken === "string" && input.shareToken.trim() !== "") {
    revalidatePath(`/s/${input.shareToken}`);
  }

  return {
    ok: true,
    data: {
      disabled: true,
    },
  };
}
