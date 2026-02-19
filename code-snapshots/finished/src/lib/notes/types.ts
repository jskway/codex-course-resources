import type { JSONContent } from "@tiptap/core";

export type NoteContentJson = JSONContent;

export type SaveReason = "autosave" | "manual";

export type NoteListItem = {
  id: string;
  title: string;
  shareEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type NoteDetail = {
  id: string;
  title: string;
  contentJson: NoteContentJson;
  shareEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type NoteActionErrorCode =
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "INTERNAL_ERROR";

export type NoteActionResult<TData> =
  | {
      ok: true;
      data: TData;
    }
  | {
      ok: false;
      error: {
        code: NoteActionErrorCode;
        message: string;
      };
    };

export type CreateNoteActionInput = {
  title: string;
  contentJson: NoteContentJson;
};

export type CreateNoteActionData = {
  noteId: string;
  updatedAt: string;
};

export type UpdateNoteActionInput = {
  id: string;
  title: string;
  contentJson: NoteContentJson;
  reason: SaveReason;
};

export type UpdateNoteActionData = {
  updatedAt: string;
};

export type DeleteNoteActionInput = {
  id: string;
};

export type DeleteNoteActionData = {
  deleted: true;
};

export type EnableShareActionInput = {
  id: string;
};

export type EnableShareActionData = {
  shareToken: string;
  shareUrl: string;
};

export type DisableShareActionInput = {
  id: string;
  shareToken?: string;
};

export type DisableShareActionData = {
  disabled: true;
};
