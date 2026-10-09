#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const modulesDir = path.resolve(import.meta.dirname, "../node_modules");
const prefixBin = path.dirname(process.execPath);

if (fs.existsSync("/usr/bin/env")) {
  process.exit(0);
}

function resolveInterpreter(token) {
  if (token === "node") return process.execPath;
  if (token.includes("/")) return fs.existsSync(token) ? token : null;
  const prefixed = path.join(prefixBin, token);
  return fs.existsSync(prefixed) ? prefixed : token;
}

function patchFile(file, patched) {
  let stat;
  try {
    stat = fs.statSync(file);
  } catch {
    return;
  }
  if (!stat.isFile() || !(stat.mode & 0o111)) return;

  let contents;
  let head;
  try {
    contents = fs.readFileSync(file, "utf8");
    head = contents.split("\n")[0];
  } catch {
    return;
  }

  const match = head.match(/^#!\/usr\/bin\/env\s+(\S+)(.*)$/);
  if (!match) return;

  const interpreter = resolveInterpreter(match[1]);
  if (!interpreter) return;

  patched.add(file);
  try {
    fs.writeFileSync(file, `#!${interpreter}${match[2]}${contents.slice(head.length)}`, { mode: stat.mode });
  } catch {
    patched.delete(file);
  }
}

function patchBinDir(dir, patched) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (!entry.isSymbolicLink()) {
      patchFile(full, patched);
      continue;
    }
    try {
      patchFile(fs.realpathSync(full), patched);
    } catch {
      continue;
    }
  }
}

function walkPackage(nodeModulesDir, patched, depth) {
  if (depth > 2) return;
  let entries;
  try {
    entries = fs.readdirSync(nodeModulesDir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === ".git") continue;
    const pkgDir = path.join(nodeModulesDir, entry.name);
    if (entry.name.startsWith("@")) {
      walkPackage(pkgDir, patched, depth);
      continue;
    }
    patchBinDir(path.join(pkgDir, "bin"), patched);
  }
}

if (!fs.existsSync(modulesDir)) process.exit(0);

const patched = new Set();
walkPackage(modulesDir, patched, 0);
patchBinDir(path.join(modulesDir, ".bin"), patched);

console.log(`fix-shebang: patched ${patched.size} shebang(s) for Termux`);
