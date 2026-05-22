import type { JSONContent } from "@tiptap/react";
import { db } from "@/lib/db";
import { normalizeNoteTitle, parseTiptapContent, serializeTiptapContent } from "@/lib/note-content";

export type NoteSummary = {
  createdAt: string;
  id: string;
  shareEnabled: boolean;
  title: string;
  updatedAt: string;
};

export type NoteDetails = NoteSummary & {
  contentJson: JSONContent;
};

export type CreateNoteInput = {
  contentJson: JSONContent;
  title?: string;
};

export type UpdateNoteInput = {
  contentJson: JSONContent;
  id: string;
  title?: string;
};

export type NoteMutationResult = {
  id: string;
  updatedAt: string;
};

type NoteSummaryRow = {
  created_at: string;
  id: string;
  share_enabled: number;
  title: string;
  updated_at: string;
};

type NoteDetailsRow = NoteSummaryRow & {
  content_json: string;
};

export function listNotesForUser(userId: string): NoteSummary[] {
  const rows = db
    .query<NoteSummaryRow, string>(
      `
        SELECT id, title, share_enabled, created_at, updated_at
        FROM note
        WHERE user_id = ?
        ORDER BY updated_at DESC
      `,
    )
    .all(userId);

  return rows.map(mapNoteSummaryRow);
}

export function getNoteForUser(userId: string, noteId: string): NoteDetails | null {
  const row = db
    .query<NoteDetailsRow, [string, string]>(
      `
        SELECT id, title, content_json, share_enabled, created_at, updated_at
        FROM note
        WHERE id = ? AND user_id = ?
      `,
    )
    .get(noteId, userId);

  if (row === null) {
    return null;
  }

  return {
    ...mapNoteSummaryRow(row),
    contentJson: parseTiptapContent(row.content_json),
  };
}

export function createNoteForUser(
  userId: string,
  input: CreateNoteInput,
): NoteMutationResult | null {
  const contentJson = serializeTiptapContent(input.contentJson);

  if (contentJson === null) {
    return null;
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const title = normalizeNoteTitle(input.title);

  db.query<never, [string, string, string, string, string, string]>(
    `
      INSERT INTO note (id, user_id, title, content_json, share_enabled, created_at, updated_at)
      VALUES (?, ?, ?, ?, 0, ?, ?)
    `,
  ).run(id, userId, title, contentJson, now, now);

  return {
    id,
    updatedAt: now,
  };
}

export function updateNoteForUser(
  userId: string,
  input: UpdateNoteInput,
): NoteMutationResult | null {
  if (!noteExistsForUser(userId, input.id)) {
    return null;
  }

  const contentJson = serializeTiptapContent(input.contentJson);

  if (contentJson === null) {
    return null;
  }

  const now = new Date().toISOString();
  const title = normalizeNoteTitle(input.title);

  db.query<never, [string, string, string, string, string]>(
    `
      UPDATE note
      SET title = ?,
          content_json = ?,
          updated_at = ?
      WHERE id = ? AND user_id = ?
    `,
  ).run(title, contentJson, now, input.id, userId);

  return {
    id: input.id,
    updatedAt: now,
  };
}

function noteExistsForUser(userId: string, noteId: string): boolean {
  const row = db
    .query<{ id: string }, [string, string]>(
      `
        SELECT id
        FROM note
        WHERE id = ? AND user_id = ?
      `,
    )
    .get(noteId, userId);

  return row !== null;
}

function mapNoteSummaryRow(row: NoteSummaryRow): NoteSummary {
  return {
    createdAt: row.created_at,
    id: row.id,
    shareEnabled: row.share_enabled === 1,
    title: row.title,
    updatedAt: row.updated_at,
  };
}
