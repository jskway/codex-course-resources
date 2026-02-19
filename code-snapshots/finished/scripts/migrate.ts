import { Database } from "bun:sqlite";
import { existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

type MigrationCommand = "up" | "down" | "status";

interface MigrationFile {
  version: string;
  upSql: string;
  downSql: string;
}

interface AppliedMigration {
  version: string;
  appliedAt: string;
}

const DEFAULT_DB_PATH = "./data/tinynotes.db";
const MIGRATIONS_DIR = path.resolve(process.cwd(), "migrations");

function printUsage() {
  console.log("Usage:");
  console.log("  bun scripts/migrate.ts up");
  console.log("  bun scripts/migrate.ts down [steps]");
  console.log("  bun scripts/migrate.ts status");
}

function parseCommand(commandArg?: string): MigrationCommand {
  if (commandArg === "up" || commandArg === "down" || commandArg === "status") {
    return commandArg;
  }

  throw new Error(
    `Invalid or missing command: "${commandArg ?? "undefined"}". Use up, down, or status.`,
  );
}

function parseDownSteps(stepsArg?: string): number {
  if (!stepsArg) {
    return 1;
  }

  const parsedSteps = Number.parseInt(stepsArg, 10);
  if (!Number.isInteger(parsedSteps) || parsedSteps < 1) {
    throw new Error(`Invalid rollback step count: "${stepsArg}". Use a positive integer.`);
  }

  return parsedSteps;
}

function ensureDatabaseDirectory(dbPath: string) {
  if (dbPath === ":memory:" || dbPath === "") {
    return;
  }

  mkdirSync(path.dirname(dbPath), { recursive: true });
}

function ensureMigrationsDirExists() {
  if (!existsSync(MIGRATIONS_DIR)) {
    throw new Error(`Migrations directory does not exist: ${MIGRATIONS_DIR}`);
  }
}

function parseMigrationSections(source: string, version: string) {
  const markerPattern = /^--!\s*(UP|DOWN)\s*$/gim;
  const markers: Array<{ name: "UP" | "DOWN"; start: number; end: number }> = [];

  for (const match of source.matchAll(markerPattern)) {
    markers.push({
      name: match[1].toUpperCase() as "UP" | "DOWN",
      start: match.index ?? 0,
      end: (match.index ?? 0) + match[0].length,
    });
  }

  if (markers.length !== 2) {
    throw new Error(
      `Migration ${version} must contain exactly one "--! UP" and one "--! DOWN" marker.`,
    );
  }

  const upMarker = markers.find((marker) => marker.name === "UP");
  const downMarker = markers.find((marker) => marker.name === "DOWN");

  if (!upMarker || !downMarker || upMarker.start > downMarker.start) {
    throw new Error(`Migration ${version} must declare "--! UP" before "--! DOWN".`);
  }

  const upSql = source.slice(upMarker.end, downMarker.start).trim();
  const downSql = source.slice(downMarker.end).trim();

  if (!upSql) {
    throw new Error(`Migration ${version} has an empty UP section.`);
  }

  if (!downSql) {
    throw new Error(`Migration ${version} has an empty DOWN section.`);
  }

  return { upSql, downSql };
}

function loadMigrationFiles(): MigrationFile[] {
  ensureMigrationsDirExists();

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort((left, right) => left.localeCompare(right));

  if (files.length === 0) {
    throw new Error(`No migration files found in ${MIGRATIONS_DIR}.`);
  }

  return files.map((file) => {
    const source = readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
    const { upSql, downSql } = parseMigrationSections(source, file);

    return {
      version: file,
      upSql,
      downSql,
    };
  });
}

function ensureSchemaMigrationsTable(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);
}

function getAppliedMigrations(db: Database) {
  return db
    .query(
      `
      SELECT version, applied_at AS appliedAt
      FROM schema_migrations
      ORDER BY applied_at ASC, version ASC;
    `,
    )
    .all() as AppliedMigration[];
}

function runUp(db: Database, migrations: MigrationFile[]) {
  const appliedVersions = new Set(getAppliedMigrations(db).map((migration) => migration.version));
  const pendingMigrations = migrations.filter(
    (migration) => !appliedVersions.has(migration.version),
  );

  if (pendingMigrations.length === 0) {
    console.log("No pending migrations.");
    return;
  }

  const insertAppliedStatement = db.prepare(
    "INSERT INTO schema_migrations (version, applied_at) VALUES (?1, ?2);",
  );
  const applyMigration = db.transaction((migration: MigrationFile, appliedAt: string) => {
    db.run(migration.upSql);
    insertAppliedStatement.run(migration.version, appliedAt);
  });

  for (const migration of pendingMigrations) {
    const appliedAt = new Date().toISOString();
    applyMigration(migration, appliedAt);
    console.log(`Applied ${migration.version}`);
  }
}

function runDown(db: Database, migrations: MigrationFile[], steps: number) {
  const migrationByVersion = new Map(
    migrations.map((migration) => [migration.version, migration] as const),
  );
  const appliedDescending = db
    .query(
      `
      SELECT version, applied_at AS appliedAt
      FROM schema_migrations
      ORDER BY applied_at DESC, version DESC;
    `,
    )
    .all() as AppliedMigration[];
  const migrationsToRollback = appliedDescending.slice(0, steps);

  if (migrationsToRollback.length === 0) {
    console.log("No applied migrations to roll back.");
    return;
  }

  if (migrationsToRollback.length < steps) {
    console.log(
      `Requested ${steps} rollback step(s), but only ${migrationsToRollback.length} migration(s) are applied.`,
    );
  }

  const deleteAppliedStatement = db.prepare("DELETE FROM schema_migrations WHERE version = ?1;");
  const rollbackMigration = db.transaction((migration: MigrationFile) => {
    db.run(migration.downSql);
    deleteAppliedStatement.run(migration.version);
  });

  for (const appliedMigration of migrationsToRollback) {
    const migration = migrationByVersion.get(appliedMigration.version);

    if (!migration) {
      throw new Error(
        `Cannot roll back ${appliedMigration.version}: migration file is missing from ${MIGRATIONS_DIR}.`,
      );
    }

    rollbackMigration(migration);
    console.log(`Rolled back ${migration.version}`);
  }
}

function runStatus(db: Database, migrations: MigrationFile[], dbPath: string) {
  const appliedMigrations = getAppliedMigrations(db);
  const appliedVersionSet = new Set(appliedMigrations.map((migration) => migration.version));
  const pendingMigrations = migrations.filter(
    (migration) => !appliedVersionSet.has(migration.version),
  );
  const knownVersions = new Set(migrations.map((migration) => migration.version));
  const missingFromDisk = appliedMigrations.filter(
    (migration) => !knownVersions.has(migration.version),
  );

  console.log(`Database: ${dbPath}`);
  console.log("");
  console.log(`Applied (${appliedMigrations.length}):`);
  if (appliedMigrations.length === 0) {
    console.log("  - none");
  } else {
    for (const migration of appliedMigrations) {
      console.log(`  - ${migration.version} (${migration.appliedAt})`);
    }
  }

  console.log("");
  console.log(`Pending (${pendingMigrations.length}):`);
  if (pendingMigrations.length === 0) {
    console.log("  - none");
  } else {
    for (const migration of pendingMigrations) {
      console.log(`  - ${migration.version}`);
    }
  }

  if (missingFromDisk.length > 0) {
    console.log("");
    console.log(`Missing migration files (${missingFromDisk.length}):`);
    for (const migration of missingFromDisk) {
      console.log(`  - ${migration.version}`);
    }
  }
}

function main() {
  const command = parseCommand(process.argv[2]);
  const steps = command === "down" ? parseDownSteps(process.argv[3]) : undefined;
  const dbPathInput = process.env.DB_PATH ?? DEFAULT_DB_PATH;
  const dbPath =
    dbPathInput === ":memory:" ? dbPathInput : path.resolve(process.cwd(), dbPathInput);

  ensureDatabaseDirectory(dbPath);

  const db = new Database(dbPath, { create: true });
  db.run("PRAGMA foreign_keys = ON;");

  try {
    ensureSchemaMigrationsTable(db);

    const migrations = loadMigrationFiles();

    switch (command) {
      case "up":
        runUp(db, migrations);
        break;
      case "down":
        runDown(db, migrations, steps ?? 1);
        break;
      case "status":
        runStatus(db, migrations, dbPath);
        return;
    }
  } finally {
    db.close(false);
  }
}

try {
  main();
} catch (error) {
  printUsage();
  console.error("");
  if (error instanceof Error) {
    console.error(`Migration failed: ${error.message}`);
  } else {
    console.error("Migration failed due to an unknown error.");
  }
  process.exit(1);
}
