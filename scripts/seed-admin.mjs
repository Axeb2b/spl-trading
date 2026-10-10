#!/usr/bin/env node
// Seed a demo admin account into the local SQLite DB.
// Usage: node scripts/seed-admin.mjs [email] [password]
// Password hashing MUST stay in sync with src/lib/password.ts (scrypt N=16384 r=8 p=1, keylen=64).

import { DatabaseSync } from "node:sqlite";
import { scrypt, randomBytes } from "node:crypto";
import { mkdirSync, existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

const SCRYPT_KEYLEN = 64;
const SCRYPT_OPTS = { N: 16384, r: 8, p: 1 };

function scryptAsync(password, salt) {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, SCRYPT_KEYLEN, SCRYPT_OPTS, (err, dk) => (err ? reject(err) : resolve(dk)));
  });
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = (await scryptAsync(password, salt)).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

const DATA_DIR = process.env.SPL_DATA_DIR ?? join(process.cwd(), "data");
const DB_PATH = process.env.SPL_DB_PATH ?? join(DATA_DIR, "spl.sqlite");

if (!existsSync(DB_PATH)) {
  mkdirSync(dirname(DB_PATH), { recursive: true });
}
const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

// Ensure schema exists. Mirrors MIGRATION_FILES in src/lib/db.ts (source of truth) — keep in sync.
const MIGRATION_FILES = ["001_init.sql", "002_referral_rewards_unique.sql"];
const migrationsDir = join(process.cwd(), "src", "lib", "migrations");
db.exec("CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')))");
const applied = new Set(db.prepare("SELECT name FROM _migrations").all().map((r) => String(r.name)));
for (const file of MIGRATION_FILES) {
  if (applied.has(file)) continue;
  db.exec(readFileSync(join(migrationsDir, file), "utf8"));
  db.prepare("INSERT INTO _migrations (name) VALUES (?)").run(file);
}

const email = (process.argv[2] ?? process.env.ADMIN_EMAIL ?? "admin@spl.local").trim().toLowerCase();
let password = process.argv[3] ?? process.env.ADMIN_PASSWORD ?? "";
let generated = false;
if (!password) {
  password = randomBytes(9).toString("base64url");
  generated = true;
}

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error("Invalid email:", email);
  process.exit(1);
}
if (password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

const existing = db.prepare("SELECT id, role FROM users WHERE email = ?").get(email);
const passwordHash = await hashPassword(password);
const referralCode = randomBytes(4).toString("hex").toUpperCase();

if (existing) {
  db.prepare("UPDATE users SET password_hash = ?, role = 'admin', status = 'active', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?").run(passwordHash, existing.id);
  console.log(`Updated existing user ${email} → role=admin, password reset.`);
} else {
  db.prepare(
    `INSERT INTO users (id, email, password_hash, name, role, status, referral_code, created_at, updated_at)
     VALUES (?, ?, ?, 'Demo Admin', 'admin', 'admin' IS NULL, ?, ?, ?)`.replace("'admin' IS NULL", "'active'"),
  ).run(randomBytes(16).toString("hex"), email, passwordHash, referralCode,
    new Date().toISOString(), new Date().toISOString());
  console.log(`Created admin user ${email}.`);
}

console.log("----");
console.log("Email:    ", email);
console.log("Password: ", password);
if (generated) console.log("(generated — store it now; it will not be shown again)");
console.log("----");
console.log("NOTE: this is a DEMO admin for local/staging use. Rotate the password before any real deployment.");
db.close();
