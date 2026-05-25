import { rmSync } from "node:fs";
import { resolve } from "node:path";

const dbPath = resolve(process.env.DB_PATH ?? "./data/tinynotes-e2e.db");

for (const suffix of ["", "-shm", "-wal"]) {
  rmSync(`${dbPath}${suffix}`, { force: true });
}

console.log(`Reset e2e database at ${dbPath}`);
