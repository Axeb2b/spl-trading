// OpenNext configuration for Cloudflare Workers deployment.
//
// IMPORTANT — incremental cache is intentionally NOT R2.
// Cloudflare R2 requires a payment method on file + a $5 authorisation hold, so it is
// disqualifying for a hard "free-tier, no credit card" requirement. Instead we use the
// built-in "dummy" (no-op) incremental cache, which persists nothing and needs zero
// storage bindings. This app is almost entirely dynamic, auth-gated pages, so ISR /
// incremental caching is not needed — every request just renders fresh, which is the
// correct behaviour here. Correctness on free-tier beats cache performance.
//
// The revalidation queue uses the Durable Object implementation (DO-backed, SQLite
// storage class) which is free-tier eligible. It is wired to the `NEXT_CACHE_DO_QUEUE`
// binding declared in wrangler.jsonc and relies on the `WORKER_SELF_REFERENCE` service
// binding to re-request routes for on-demand revalidation.
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";

export default defineCloudflareConfig({
  // No-op incremental cache: no R2, no KV, no card. ISR entries are never persisted.
  incrementalCache: "dummy",
  // Durable Object-backed revalidation queue (free tier, SQLite-backed DO).
  queue: doQueue,
});
