/**
 * Shadow Poll — Bun.serve() production server.
 *
 * Lightweight Bun server that handles:
 *   1. API routes (/api/polls/metadata → metadata handler)
 *   2. ZK keys static files (/zk-keys/* from public/ with CORS)
 *   3. Public static files (favicon, logo, etc. from public/)
 *   4. Vite build output (from dist/)
 *   5. SPA fallback (index.html for client-side routing)
 *
 * Usage:
 *   bun run serve        (production, after `bun run build`)
 *   PORT=8080 bun run serve  (custom port)
 *
 * Required env vars:
 *   DATABASE_URL — Neon Postgres connection string (for metadata API)
 */

import { join } from "path";

const DIST_DIR = join(import.meta.dir, "dist");
const PUBLIC_DIR = join(import.meta.dir, "public");
const PORT = Number(process.env.PORT) || 3000;

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    // --- API routes ---
    if (url.pathname === "/api/polls/metadata") {
      const { handleMetadataRequest } = await import("./lib/api/metadata-handler");
      return handleMetadataRequest(req);
    }

    if (url.pathname === "/api/polls" || url.pathname === "/api/polls/") {
      const { handlePollsRequest } = await import("./lib/api/polls-handler");
      return handlePollsRequest(req);
    }

    // --- Indexer API routes (direct GraphQL queries to Midnight indexer) ---
    if (url.pathname.startsWith("/api/indexer/")) {
      const { handleIndexerRequest } = await import("./lib/api/indexer-handler");
      return handleIndexerRequest(req);
    }

    // --- CORS headers for zk-keys ---
    if (url.pathname.startsWith("/zk-keys/")) {
      const file = Bun.file(join(PUBLIC_DIR, url.pathname));
      if (await file.exists()) {
        return new Response(file, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      }
    }

    // --- Other public/ static files (favicon, logo, etc.) ---
    if (url.pathname !== "/") {
      const publicFile = Bun.file(join(PUBLIC_DIR, url.pathname));
      if (await publicFile.exists()) {
        return new Response(publicFile);
      }
    }

    // --- Static files from dist/ (Vite build output) ---
    if (url.pathname !== "/") {
      const distFile = Bun.file(join(DIST_DIR, url.pathname));
      if (await distFile.exists()) {
        return new Response(distFile);
      }
    }

    // --- SPA fallback: serve index.html for all other routes ---
    return new Response(Bun.file(join(DIST_DIR, "index.html")), {
      headers: { "Content-Type": "text/html" },
    });
  },
});

console.log(`Shadow Poll server running on http://localhost:${PORT}`);
