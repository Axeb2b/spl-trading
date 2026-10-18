import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Wires Cloudflare bindings into `next dev` via wrangler's platform proxy.
// Only run under `next dev`: the proxy spins up workerd/miniflare, which must never
// load during a plain `next build`. Note the adapter's own AsyncLocalStorage-based
// guard is NOT sufficient on Next 16 (the build process also sets that global), so
// we gate on the CLI command explicitly.
if (process.argv.includes("dev")) {
  initOpenNextCloudflareForDev();
}

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["*.e2b.app"],
};

export default nextConfig;
