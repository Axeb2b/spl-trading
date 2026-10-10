#!/usr/bin/env node
// scripts/patch-load-manifest.mjs
//
// Post-build patch for Next.js 16.x + @opennextjs/cloudflare.
//
// Next.js 16's `NextServer.getPreviewProps()` calls `loadManifest` with the
// path `.next/server/preview-props.json` (draft-mode preview props) during
// server initialization. The OpenNext build patches `loadManifest` to inline
// known manifests and throw for anything else — `preview-props.json` is not in
// that list, so every request crashed with
// `Unexpected loadManifest(.next/server/preview-props.json) call!`.
//
// Draft-mode preview props are not a feature of this site; production
// `previewProps` is an empty object, so returning `{}` for this path is safe.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, "..");
const PROJECT_ROOT = join(__dirname, "..");
const HANDLER = join(PROJECT_ROOT, ".open-next/server-functions/default/handler.mjs");

const TARGET = "throw new Error(`Unexpected loadManifest(${path2}) call!`)";

const content = readFileSync(HANDLER, "utf-8");
if (!content.includes(TARGET)) {
  console.error("[patch-load-manifest] target not found — is .open-next freshly built?");
  process.exit(1);
}

const branch = `  if (path2.endsWith("/preview-props.json")) {
    return {};
  }
`;

if (content.includes('if (path2.endsWith("/preview-props.json"))')) {
  console.log("[patch-load-manifest] already patched, skipping.");
  process.exit(0);
}

writeFileSync(HANDLER, content.slice(0, content.indexOf(TARGET)) + branch + content.slice(content.indexOf(TARGET)));
console.log("[patch-load-manifest] patched loadManifest to handle preview-props.json.");