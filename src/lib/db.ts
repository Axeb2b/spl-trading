import { DatabaseSync, type StatementSync } from "node:sqlite";
import { readFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { randomBytes } from "node:crypto";

const DATA_DIR = process.env.SPL_DATA_DIR ?? join(process.cwd(), "data");
const DB_PATH = process.env.SPL_DB_PATH ?? join(DATA_DIR, "spl.sqlite");
const MIGRATIONS_DIR = join(process.cwd(), "src", "lib", "migrations");

let db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (db) return db;
  const dir = dirname(DB_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  runMigrations(db);
  return db;
}

function runMigrations(database: DatabaseSync): void {
  database.exec(
    "CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')))"
  );
  const applied = new Set(
    database.prepare("SELECT name FROM _migrations").all().map((r) => String((r as { name: string }).name)),
  );
  const files = ["001_init.sql"];
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
    database.exec(sql);
    database.prepare("INSERT INTO _migrations (name) VALUES (?)").run(file);
  }
}

export function newId(): string {
  return randomBytes(16).toString("hex");
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function queryAll<T>(sql: string, params: unknown[] = []): T[] {
  const stmt = getDb().prepare(sql);
  return stmt.all(...(params as never[])) as T[];
}

export function queryOne<T>(sql: string, params: unknown[] = []): T | null {
  const stmt = getDb().prepare(sql);
  const row = stmt.get(...(params as never[])) as T | undefined;
  return row ?? null;
}

export function execute(sql: string, params: unknown[] = []): { changes: number } {
  const stmt: StatementSync = getDb().prepare(sql);
  const result = stmt.run(...(params as never[]));
  return { changes: Number(result.changes) };
}

export function withTransaction<T>(fn: () => T): T {
  const database = getDb();
  database.exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    database.exec("COMMIT");
    return result;
  } catch (err) {
    database.exec("ROLLBACK");
    throw err;
  }
}
