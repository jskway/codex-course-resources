import { mkdirSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { Database } from "bun:sqlite";

type Direction = "up" | "down";

type Migration = {
  version: string;
  up: string;
  down: string;
};

type AppliedMigration = {
  version: string;
};

const MIGRATION_UP_MARKER = "-- migrate:up";
const MIGRATION_DOWN_MARKER = "-- migrate:down";
const migrationsDir = resolve("migrations");
const dbPath = process.env.DB_PATH ?? "./data/tinynotes.db";
const direction = parseDirection(process.argv[2]);

function parseDirection(value: string | undefined): Direction {
  if (value === undefined || value === "up") {
    return "up";
  }

  if (value === "down") {
    return "down";
  }

  throw new Error(`Unknown migration direction "${value}". Use "up" or "down".`);
}

function parseMigration(version: string, contents: string): Migration {
  const upIndex = contents.indexOf(MIGRATION_UP_MARKER);
  const downIndex = contents.indexOf(MIGRATION_DOWN_MARKER);

  if (upIndex === -1 || downIndex === -1 || downIndex < upIndex) {
    throw new Error(`Malformed migration "${version}". Expected UP and DOWN sections.`);
  }

  const up = contents.slice(upIndex + MIGRATION_UP_MARKER.length, downIndex).trim();
  const down = contents.slice(downIndex + MIGRATION_DOWN_MARKER.length).trim();

  if (up.length === 0 || down.length === 0) {
    throw new Error(`Malformed migration "${version}". UP and DOWN sections must not be empty.`);
  }

  return { version, up, down };
}

function readMigrations(): Migration[] {
  return readdirSync(migrationsDir)
    .filter((fileName) => fileName.endsWith(".sql"))
    .sort()
    .map((fileName) => {
      const migrationPath = join(migrationsDir, fileName);
      const contents = readFileSync(migrationPath, "utf8");

      return parseMigration(fileName, contents);
    });
}

function ensureSchemaMigrations(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);
}

function getAppliedVersions(db: Database): string[] {
  return db
    .query<AppliedMigration, []>(`
      SELECT version
      FROM schema_migrations
      ORDER BY version ASC;
    `)
    .all()
    .map((migration) => migration.version);
}

function assertAppliedMigrationsExist(appliedVersions: string[], migrations: Migration[]) {
  const knownVersions = new Set(migrations.map((migration) => migration.version));
  const unknownVersion = appliedVersions.find((version) => !knownVersions.has(version));

  if (unknownVersion !== undefined) {
    throw new Error(`Applied migration "${unknownVersion}" does not exist in migrations/.`);
  }
}

function migrateUp(db: Database, migrations: Migration[], appliedVersions: string[]) {
  const appliedVersionSet = new Set(appliedVersions);
  const pendingMigrations = migrations.filter(
    (migration) => !appliedVersionSet.has(migration.version),
  );

  if (pendingMigrations.length === 0) {
    console.log("No pending migrations.");
    return;
  }

  const applyMigration = db.transaction((migration: Migration) => {
    db.run(migration.up);
    db.query(
      "INSERT INTO schema_migrations (version, applied_at) VALUES ($version, $appliedAt);",
    ).run({
      version: migration.version,
      appliedAt: new Date().toISOString(),
    });
  });

  for (const migration of pendingMigrations) {
    applyMigration.immediate(migration);
    console.log(`Applied ${migration.version}`);
  }
}

function migrateDown(db: Database, migrations: Migration[], appliedVersions: string[]) {
  const latestVersion = appliedVersions.at(-1);

  if (latestVersion === undefined) {
    console.log("No applied migrations to roll back.");
    return;
  }

  const migration = migrations.find((candidate) => candidate.version === latestVersion);

  if (migration === undefined) {
    throw new Error(`Applied migration "${latestVersion}" does not exist in migrations/.`);
  }

  const rollBackMigration = db.transaction(() => {
    db.run(migration.down);
    db.query("DELETE FROM schema_migrations WHERE version = $version;").run({
      version: migration.version,
    });
  });

  rollBackMigration.immediate();
  console.log(`Rolled back ${migration.version}`);
}

function main() {
  const resolvedDbPath = resolve(dbPath);
  mkdirSync(dirname(resolvedDbPath), { recursive: true });

  const migrations = readMigrations();
  const db = new Database(resolvedDbPath, { create: true, strict: true });

  try {
    db.run("PRAGMA foreign_keys = ON;");
    db.run("PRAGMA journal_mode = WAL;");
    ensureSchemaMigrations(db);

    const appliedVersions = getAppliedVersions(db);
    assertAppliedMigrationsExist(appliedVersions, migrations);

    if (direction === "up") {
      migrateUp(db, migrations, appliedVersions);
    } else {
      migrateDown(db, migrations, appliedVersions);
    }
  } finally {
    db.close(false);
  }
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : "Migration failed.");
  process.exit(1);
}
