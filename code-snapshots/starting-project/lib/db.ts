import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { Database } from "bun:sqlite";

const dbPath = resolve(process.env.DB_PATH ?? "./data/tinynotes.db");
const globalForDb = globalThis as typeof globalThis & {
  tinyNotesDb?: Database;
};

function createDatabase() {
  mkdirSync(dirname(dbPath), { recursive: true });

  const database = new Database(dbPath, { create: true });
  database.run("PRAGMA foreign_keys = ON;");
  database.run("PRAGMA journal_mode = WAL;");

  return database;
}

export const db = globalForDb.tinyNotesDb ?? createDatabase();

if (process.env.NODE_ENV !== "production") {
  globalForDb.tinyNotesDb = db;
}
