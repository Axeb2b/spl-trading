/**
 * Style guard for the SPL Trading site.
 *
 * The build shipped copy that was either stale or untrue: a link to an admin
 * console the client does not own, a "demo environment" line in production,
 * three seeded notifications, a hardcoded onboarding counter, and a second
 * dark-mode mechanism. This script turns each of those into a build failure
 * rather than a visual bug someone has to notice.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const failures = [];

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry === "node_modules" || entry === ".next" || entry === ".open-next" || entry === ".git") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const files = walk(join(ROOT, "src"));

const RULES = [
  {
    pattern: /moospage\.com/i,
    message: "moospage.com is not owned by the client and must never appear in the build.",
  },
  {
    pattern: /Demo environment — no real funds are moved/i,
    message: "Demo-environment copy must not ship.",
  },
  { pattern: /Local clone/i, message: '"Local clone" copy must not ship.' },
  { pattern: /UI preview is ready/i, message: "Seeded preview notifications must not ship." },
  {
    pattern: /data-auth-theme/,
    message: "data-auth-theme is gone — dark mode is driven by the .dark class alone.",
  },
  {
    pattern: /Onboarding 1 of 12/,
    message: "The onboarding counter must come from the API, not a literal.",
  },
  {
    pattern: /toLocaleString\(\s*["']en-US["']\s*,\s*\{[^}]*hour/,
    message: "Timestamps must be formatted in IST via lib/time/ist.ts, not toLocaleString.",
  },
];

for (const file of files) {
  if (!/\.(ts|tsx|css)$/.test(file)) continue;
  const rel = relative(ROOT, file);
  const content = readFileSync(file, "utf8");
  for (const rule of RULES) {
    if (rule.pattern.test(content)) failures.push(`${rel}: ${rule.message}`);
  }
}

if (failures.length > 0) {
  console.error("SPL style check failed:");
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  process.exit(1);
}

console.log("SPL style check passed: no external admin link, no demo copy, no hardcoded onboarding, IST timestamps.");
