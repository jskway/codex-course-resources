import { createHash, randomBytes } from "node:crypto";
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

export type SharedNoteDetails = {
  contentJson: JSONContent;
  id: string;
  title: string;
  updatedAt: string;
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

export type EnableShareResult = {
  shareEnabled: true;
  token: string;
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

type ShareRow = {
  id: string;
};

type SharedNoteRow = {
  content_json: string;
  id: string;
  title: string;
  updated_at: string;
};

export function listNotesForUser(userId: string): NoteSummary[] {
  /* unchanged */
  const rows = db
    .query<NoteSummaryRow, string>(
      `SELECT id, title, share_enabled, created_at, updated_at FROM note WHERE user_id = ? ORDER BY updated_at DESC`,
    )
    .all(userId);
  return rows.map(mapNoteSummaryRow);
}

export function getNoteForUser(userId: string, noteId: string): NoteDetails | null {
  const row = db
    .query<NoteDetailsRow, [string, string]>(
      `SELECT id, title, content_json, share_enabled, created_at, updated_at FROM note WHERE id = ? AND user_id = ?`,
    )
    .get(noteId, userId);
  if (row === null) return null;
  return { ...mapNoteSummaryRow(row), contentJson: parseTiptapContent(row.content_json) };
}

export function createNoteForUser(
  userId: string,
  input: CreateNoteInput,
): NoteMutationResult | null {
  const contentJson = serializeTiptapContent(input.contentJson);
  if (contentJson === null) return null;
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const title = normalizeNoteTitle(input.title);
  db.query<never, [string, string, string, string, string, string]>(
    `INSERT INTO note (id, user_id, title, content_json, share_enabled, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?)`,
  ).run(id, userId, title, contentJson, now, now);
  return { id, updatedAt: now };
}

export function updateNoteForUser(
  userId: string,
  input: UpdateNoteInput,
): NoteMutationResult | null {
  if (!noteExistsForUser(userId, input.id)) return null;
  const contentJson = serializeTiptapContent(input.contentJson);
  if (contentJson === null) return null;
  const now = new Date().toISOString();
  const title = normalizeNoteTitle(input.title);
  db.query<never, [string, string, string, string, string]>(
    `UPDATE note SET title = ?, content_json = ?, updated_at = ? WHERE id = ? AND user_id = ?`,
  ).run(title, contentJson, now, input.id, userId);
  return { id: input.id, updatedAt: now };
}

export function deleteNoteForUser(userId: string, noteId: string): boolean {
  const result = db
    .query<never, [string, string]>(`DELETE FROM note WHERE id = ? AND user_id = ?`)
    .run(noteId, userId);
  return result.changes > 0;
}

export function enableShareForUser(userId: string, noteId: string): EnableShareResult | null {
  if (!noteExistsForUser(userId, noteId)) return null;
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const now = new Date().toISOString();
  const existing = db
    .query<ShareRow, string>(`SELECT id FROM note_share WHERE note_id = ?`)
    .get(noteId);
  if (existing === null) {
    db.query<never, [string, string, string, string]>(
      `INSERT INTO note_share (id, note_id, token_hash, enabled, created_at, disabled_at) VALUES (?, ?, ?, 1, ?, NULL)`,
    ).run(crypto.randomUUID(), noteId, tokenHash, now);
  } else {
    db.query<never, [string, string]>(
      `UPDATE note_share SET token_hash = ?, enabled = 1, disabled_at = NULL WHERE id = ?`,
    ).run(tokenHash, existing.id);
  }
  db.query<never, [string, string]>(
    `UPDATE note SET share_enabled = 1, updated_at = ? WHERE id = ?`,
  ).run(now, noteId);
  return { shareEnabled: true, token };
}

export function disableShareForUser(userId: string, noteId: string): boolean {
  if (!noteExistsForUser(userId, noteId)) return false;
  const now = new Date().toISOString();
  db.query<never, [string, string]>(
    `UPDATE note_share SET enabled = 0, disabled_at = ? WHERE note_id = ?`,
  ).run(now, noteId);
  db.query<never, [string, string]>(
    `UPDATE note SET share_enabled = 0, updated_at = ? WHERE id = ?`,
  ).run(now, noteId);
  return true;
}

export function getSharedNoteByToken(token: string): SharedNoteDetails | null {
  const row = db
    .query<SharedNoteRow, string>(
      `SELECT note.id, note.title, note.content_json, note.updated_at FROM note_share INNER JOIN note ON note.id = note_share.note_id WHERE note_share.token_hash = ? AND note_share.enabled = 1 AND note.share_enabled = 1`,
    )
    .get(hashToken(token));
  if (row === null) return null;
  return {
    contentJson: parseTiptapContent(row.content_json),
    id: row.id,
    title: row.title,
    updatedAt: row.updated_at,
  };
}

function noteExistsForUser(userId: string, noteId: string): boolean {
  const row = db
    .query<{ id: string }, [string, string]>(`SELECT id FROM note WHERE id = ? AND user_id = ?`)
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

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
