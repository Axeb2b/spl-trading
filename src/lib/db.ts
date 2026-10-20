import { randomBytes } from "node:crypto";
import { getCloudflareContext } from "@opennextjs/cloudflare/cloudflare-context";

export type SqlStatement = { sql: string; params?: unknown[] };
export type ExecuteResult = { changes: number };

/**
 * Structural subset of the Workers D1 API. `@cloudflare/workers-types` is not a
 * dependency of this app, so the binding is described by the members we use.
 */
export type D1Statement = {
  bind(...values: unknown[]): D1Statement;
  all<T>(): Promise<{ results?: T[] }>;
  first<T>(): Promise<T | null>;
  run(): Promise<{ meta?: { changes?: number } }>;
};

export type D1Database = {
  prepare(sql: string): D1Statement;
  batch(statements: D1Statement[]): Promise<{ meta?: { changes?: number } }[]>;
};

declare global {
  interface CloudflareEnv {
    DB?: D1Database;
  }
}

type Driver = {
  queryAll<T>(sql: string, params: unknown[]): Promise<T[]>;
  queryOne<T>(sql: string, params: unknown[]): Promise<T | null>;
  execute(sql: string, params: unknown[]): Promise<ExecuteResult>;
  batch(statements: SqlStatement[]): Promise<ExecuteResult[]>;
};

/** Registered file migrations, applied in order by the local driver only. */
const MIGRATION_FILES = [
  "001_init.sql",
  "002_referral_rewards_unique.sql",
  "003_realtime_sessions.sql",
];

/**
 * Dual-mode data layer: Cloudflare D1 in production (Workers), local SQLite in
 * dev/test/build/standalone.
 *
 * Mode detection is lazy (first helper call) and never throws: it reads the
 * Cloudflare context through `getCloudflareContext()` (sync mode), which the
 * worker entry sets per request and `initOpenNextCloudflareForDev` sets in
 * `next dev`; when no context/binding is present it falls back to SQLite.
 * D1 mode never touches the filesystem and never migrates — apply schema with
 * `npx wrangler d1 migrations apply spl` (migrations_dir: src/lib/migrations).
 */
let d1Driver: Driver | null = null;
let localDriver: Promise<Driver> | null = null;

function detectD1(): D1Database | null {
  try {
    const database = getCloudflareContext().env?.DB;
    return database && typeof database.prepare === "function" ? database : null;
  } catch {
    return null;
  }
}

async function getDriver(): Promise<Driver> {
  if (d1Driver) return d1Driver;
  const database = detectD1();
  if (database) {
    d1Driver = createD1Driver(database);
    return d1Driver;
  }
  if (!localDriver) {
    localDriver = createLocalDriver().catch((error) => {
      localDriver = null;
      throw error;
    });
  }
  return localDriver;
}

function bind(statement: D1Statement, params: unknown[]): D1Statement {
  return params.length > 0 ? statement.bind(...params) : statement;
}

function createD1Driver(database: D1Database): Driver {
  return {
    async queryAll<T>(sql: string, params: unknown[]): Promise<T[]> {
      const result = await bind(database.prepare(sql), params).all<T>();
      return result.results ?? [];
    },
    async queryOne<T>(sql: string, params: unknown[]): Promise<T | null> {
      const row = await bind(database.prepare(sql), params).first<T>();
      return row ?? null;
    },
    async execute(sql: string, params: unknown[]): Promise<ExecuteResult> {
      const result = await bind(database.prepare(sql), params).run();
      return { changes: Number(result.meta?.changes ?? 0) };
    },
    async batch(statements: SqlStatement[]): Promise<ExecuteResult[]> {
      if (statements.length === 0) return [];
      const results = await database.batch(
        statements.map((statement) => bind(database.prepare(statement.sql), statement.params ?? [])),
      );
      return results.map((result) => ({ changes: Number(result.meta?.changes ?? 0) }));
    },
  };
}

async function createLocalDriver(): Promise<Driver> {
  const { DatabaseSync } = await import("node:sqlite");
  const { readFileSync, mkdirSync, existsSync } = await import("node:fs");
  const { dirname, join } = await import("node:path");

  const dbPath =
    process.env.SPL_DB_PATH ?? join(process.env.SPL_DATA_DIR ?? join(process.cwd(), "data"), "spl.sqlite");
  const dir = dirname(dbPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const database = new DatabaseSync(dbPath);
  database.exec("PRAGMA journal_mode = WAL");
  database.exec("PRAGMA foreign_keys = ON");
  database.exec("PRAGMA busy_timeout = 5000");

  database.exec(
    "CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')))",
  );
  const applied = new Set(
    database.prepare("SELECT name FROM _migrations").all().map((row) => String((row as { name: string }).name)),
  );
  const migrationsDir = join(process.cwd(), "src", "lib", "migrations");
  for (const file of MIGRATION_FILES) {
    if (applied.has(file)) continue;
    database.exec(readFileSync(join(migrationsDir, file), "utf8"));
    database.prepare("INSERT INTO _migrations (name) VALUES (?)").run(file);
  }

  const runSql = (sql: string, params: unknown[]) =>
    database.prepare(sql).run(...(params as never[]));

  return {
    async queryAll<T>(sql: string, params: unknown[]): Promise<T[]> {
      return database.prepare(sql).all(...(params as never[])) as T[];
    },
    async queryOne<T>(sql: string, params: unknown[]): Promise<T | null> {
      const row = database.prepare(sql).get(...(params as never[])) as T | undefined;
      return row ?? null;
    },
    async execute(sql: string, params: unknown[]): Promise<ExecuteResult> {
      return { changes: Number(runSql(sql, params).changes) };
    },
    async batch(statements: SqlStatement[]): Promise<ExecuteResult[]> {
      if (statements.length === 0) return [];
      // Runs synchronously (no awaits between BEGIN/COMMIT), so no other local
      // request can interleave inside the transaction.
      database.exec("BEGIN IMMEDIATE");
      try {
        const results = statements.map((statement) => ({
          changes: Number(runSql(statement.sql, statement.params ?? []).changes),
        }));
        database.exec("COMMIT");
        return results;
      } catch (error) {
        database.exec("ROLLBACK");
        throw error;
      }
    },
  };
}

export async function queryAll<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  return (await getDriver()).queryAll<T>(sql, params);
}

export async function queryOne<T>(sql: string, params: unknown[] = []): Promise<T | null> {
  return (await getDriver()).queryOne<T>(sql, params);
}

export async function execute(sql: string, params: unknown[] = []): Promise<ExecuteResult> {
  return (await getDriver()).execute(sql, params);
}

/** Run pre-built statements atomically (local BEGIN IMMEDIATE / D1 db.batch). */
export async function runBatch(statements: SqlStatement[]): Promise<ExecuteResult[]> {
  return (await getDriver()).batch(statements);
}

export function newId(): string {
  return randomBytes(16).toString("hex");
}

export function nowIso(): string {
  return new Date().toISOString();
}
