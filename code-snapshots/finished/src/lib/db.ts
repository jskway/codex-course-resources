import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";

const DEFAULT_DB_PATH = "./data/tinynotes.db";

function resolveDbPath() {
  const dbPathInput = process.env.DB_PATH?.trim() || DEFAULT_DB_PATH;

  if (dbPathInput === ":memory:") {
    return dbPathInput;
  }

  return path.resolve(process.cwd(), dbPathInput);
}

function ensureDatabaseDirectory(dbPath: string) {
  if (dbPath === ":memory:" || dbPath === "") {
    return;
  }

  mkdirSync(path.dirname(dbPath), { recursive: true });
}

function createDatabase() {
  const dbPath = resolveDbPath();
  ensureDatabaseDirectory(dbPath);

  const database = new Database(dbPath, { create: true });
  database.run("PRAGMA foreign_keys = ON;");
  return database;
}

type GlobalDb = typeof globalThis & {
  __tinynotesDb?: Database;
};

const globalDb = globalThis as GlobalDb;

const existingDb = globalDb.__tinynotesDb;

export const db = existingDb ?? createDatabase();

if (!existingDb && process.env.NODE_ENV !== "production") {
  globalDb.__tinynotesDb = db;
}
