"use server";

import type { JSONContent } from "@tiptap/react";
import { revalidatePath } from "next/cache";
import { createNoteForUser, updateNoteForUser, type NoteMutationResult } from "@/lib/notes";
import { requireSession } from "@/lib/session";

export type NoteActionInput = {
  contentJson: JSONContent;
  title: string;
};

export type UpdateNoteActionInput = NoteActionInput & {
  id: string;
};

export type NoteActionResult =
  | {
      note: NoteMutationResult;
      ok: true;
    }
  | {
      error: string;
      ok: false;
    };

const saveErrorMessage = "Unable to save this note right now.";

export async function createNoteAction(input: NoteActionInput): Promise<NoteActionResult> {
  const session = await requireSession();

  try {
    const note = createNoteForUser(session.user.id, input);

    if (note === null) {
      return {
        error: saveErrorMessage,
        ok: false,
      };
    }

    revalidatePath("/notes");

    return {
      note,
      ok: true,
    };
  } catch (error) {
    console.error("Note creation failed", error);

    return {
      error: saveErrorMessage,
      ok: false,
    };
  }
}

export async function updateNoteAction(input: UpdateNoteActionInput): Promise<NoteActionResult> {
  const session = await requireSession();

  try {
    const note = updateNoteForUser(session.user.id, input);

    if (note === null) {
      return {
        error: saveErrorMessage,
        ok: false,
      };
    }

    revalidatePath("/notes");
    revalidatePath(`/notes/${input.id}`);

    return {
      note,
      ok: true,
    };
  } catch (error) {
    console.error("Note update failed", error);

    return {
      error: saveErrorMessage,
      ok: false,
    };
  }
}
