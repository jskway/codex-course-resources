import "server-only";

import { db } from "@/src/lib/db";
import type { NoteDetail, NoteListItem } from "@/src/lib/notes/types";
import { parseStoredContent } from "@/src/lib/notes/validation";

type NoteListRow = {
  id: string;
  title: string;
  shareEnabled: number;
  createdAt: string;
  updatedAt: string;
};

type NoteDetailRow = {
  id: string;
  title: string;
  contentJson: string;
  shareEnabled: number;
  createdAt: string;
  updatedAt: string;
};

type SharedNoteRow = {
  id: string;
  title: string;
  contentJson: string;
  shareEnabled: number;
  createdAt: string;
  updatedAt: string;
};

type CreateNoteRecordInput = {
  id: string;
  userId: string;
  title: string;
  serializedContent: string;
  createdAt: string;
  updatedAt: string;
};

type UpdateNoteRecordInput = {
  id: string;
  userId: string;
  title: string;
  serializedContent: string;
  updatedAt: string;
};

type DeleteNoteRecordInput = {
  id: string;
  userId: string;
};

type EnableNoteShareRecordInput = {
  id: string;
  userId: string;
  shareId: string;
  tokenHash: string;
  now: string;
};

type DisableNoteShareRecordInput = {
  id: string;
  userId: string;
  now: string;
};

const listNotesByUserQuery = db.query(`
  SELECT
    id,
    title,
    share_enabled AS shareEnabled,
    created_at AS createdAt,
    updated_at AS updatedAt
  FROM note
  WHERE user_id = ?1
  ORDER BY updated_at DESC;
`);

const getNoteByIdForUserQuery = db.query(`
  SELECT
    id,
    title,
    content_json AS contentJson,
    share_enabled AS shareEnabled,
    created_at AS createdAt,
    updated_at AS updatedAt
  FROM note
  WHERE id = ?1 AND user_id = ?2
  LIMIT 1;
`);

const getSharedNoteByTokenHashQuery = db.query(`
  SELECT
    note.id,
    note.title,
    note.content_json AS contentJson,
    note.share_enabled AS shareEnabled,
    note.created_at AS createdAt,
    note.updated_at AS updatedAt
  FROM note_share
  INNER JOIN note ON note.id = note_share.note_id
  WHERE note_share.token_hash = ?1
    AND note_share.enabled = 1
    AND note.share_enabled = 1
  LIMIT 1;
`);

const createNoteStatement = db.prepare(`
  INSERT INTO note (id, user_id, title, content_json, share_enabled, created_at, updated_at)
  VALUES (?1, ?2, ?3, ?4, 0, ?5, ?6);
`);

const updateNoteStatement = db.prepare(`
  UPDATE note
  SET title = ?1,
      content_json = ?2,
      updated_at = ?3
  WHERE id = ?4 AND user_id = ?5;
`);

const deleteNoteStatement = db.prepare(`
  DELETE FROM note
  WHERE id = ?1 AND user_id = ?2;
`);

const getOwnedNoteShareStateQuery = db.query(`
  SELECT share_enabled AS shareEnabled
  FROM note
  WHERE id = ?1 AND user_id = ?2
  LIMIT 1;
`);

const disableExistingSharesStatement = db.prepare(`
  UPDATE note_share
  SET enabled = 0,
      disabled_at = ?1
  WHERE note_id = ?2 AND enabled = 1;
`);

const createShareStatement = db.prepare(`
  INSERT INTO note_share (id, note_id, token_hash, enabled, created_at, disabled_at)
  VALUES (?1, ?2, ?3, 1, ?4, NULL);
`);

const enableNoteShareFlagStatement = db.prepare(`
  UPDATE note
  SET share_enabled = 1,
      updated_at = ?1
  WHERE id = ?2;
`);

const disableNoteShareFlagStatement = db.prepare(`
  UPDATE note
  SET share_enabled = 0,
      updated_at = ?1
  WHERE id = ?2;
`);

function mapNoteListRow(row: NoteListRow): NoteListItem {
  return {
    id: row.id,
    title: row.title,
    shareEnabled: row.shareEnabled === 1,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapNoteDetailRow(row: NoteDetailRow): NoteDetail {
  return {
    id: row.id,
    title: row.title,
    contentJson: parseStoredContent(row.contentJson),
    shareEnabled: row.shareEnabled === 1,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function listNotesByUser(userId: string): NoteListItem[] {
  const rows = listNotesByUserQuery.all(userId) as NoteListRow[];
  return rows.map(mapNoteListRow);
}

export function getNoteByIdForUser(noteId: string, userId: string): NoteDetail | null {
  const row = getNoteByIdForUserQuery.get(noteId, userId) as NoteDetailRow | null;

  if (!row) {
    return null;
  }

  return mapNoteDetailRow(row);
}

export function getSharedNoteByTokenHash(tokenHash: string): NoteDetail | null {
  const row = getSharedNoteByTokenHashQuery.get(tokenHash) as SharedNoteRow | null;

  if (!row) {
    return null;
  }

  return mapNoteDetailRow(row);
}

export function createNoteRecord(input: CreateNoteRecordInput): void {
  createNoteStatement.run(
    input.id,
    input.userId,
    input.title,
    input.serializedContent,
    input.createdAt,
    input.updatedAt,
  );
}

export function updateNoteRecord(input: UpdateNoteRecordInput): boolean {
  const result = updateNoteStatement.run(
    input.title,
    input.serializedContent,
    input.updatedAt,
    input.id,
    input.userId,
  );

  return result.changes > 0;
}

export function deleteNoteRecord(input: DeleteNoteRecordInput): boolean {
  const result = deleteNoteStatement.run(input.id, input.userId);
  return result.changes > 0;
}

export function enableNoteShareRecord(input: EnableNoteShareRecordInput): boolean {
  const run = db.transaction((transactionInput: EnableNoteShareRecordInput) => {
    const ownedRow = getOwnedNoteShareStateQuery.get(
      transactionInput.id,
      transactionInput.userId,
    ) as { shareEnabled: number } | null;

    if (!ownedRow) {
      return false;
    }

    disableExistingSharesStatement.run(transactionInput.now, transactionInput.id);
    createShareStatement.run(
      transactionInput.shareId,
      transactionInput.id,
      transactionInput.tokenHash,
      transactionInput.now,
    );
    enableNoteShareFlagStatement.run(transactionInput.now, transactionInput.id);

    return true;
  });

  return run(input);
}

export function disableNoteShareRecord(input: DisableNoteShareRecordInput): boolean {
  const run = db.transaction((transactionInput: DisableNoteShareRecordInput) => {
    const ownedRow = getOwnedNoteShareStateQuery.get(
      transactionInput.id,
      transactionInput.userId,
    ) as { shareEnabled: number } | null;

    if (!ownedRow) {
      return false;
    }

    disableExistingSharesStatement.run(transactionInput.now, transactionInput.id);
    disableNoteShareFlagStatement.run(transactionInput.now, transactionInput.id);

    return true;
  });

  return run(input);
}
