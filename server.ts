/**
 * Shadow Poll — Hono + Bun production server.
 *
 * Hono web framework with Bun adapter handles:
 *   1. API routes (/api/* → Hono route handlers)
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

import { Hono } from "hono";
import { cors } from "hono/cors";
import { join } from "path";
import { apiRoutes } from "./lib/api/routes";

const app = new Hono();
const PORT = Number(process.env.PORT) || 3000;

// --- API routes (metadata, polls, indexer) ---
app.route("/", apiRoutes);

// --- CORS headers for zk-keys ---
app.all("/zk-keys/*", cors({ origin: "*", allowMethods: ["GET", "OPTIONS"], allowHeaders: ["Content-Type"] }));
app.get("/zk-keys/*", async (c) => {
  const filePath = join(import.meta.dir, "public", c.req.path);
  const file = Bun.file(filePath);
  if (await file.exists()) {
    return new Response(file, {
      headers: { "Cache-Control": "public, max-age=31536000, immutable" },
    });
  }
  return c.notFound();
});

// --- Public static files (favicon, logo, etc.) ---
app.get("/*", async (c, next) => {
  if (c.req.path === "/") return next();
  const filePath = join(import.meta.dir, "public", c.req.path);
  const file = Bun.file(filePath);
  if (await file.exists()) {
    return new Response(file);
  }
  return next();
});

// --- Vite build output (dist/) ---
app.get("/*", async (c, next) => {
  if (c.req.path === "/") return next();
  const filePath = join(import.meta.dir, "dist", c.req.path);
  const file = Bun.file(filePath);
  if (await file.exists()) {
    return new Response(file);
  }
  return next();
});

// --- SPA fallback: serve index.html for all other routes ---
app.get("*", async (c) => {
  return new Response(Bun.file(join(import.meta.dir, "dist", "index.html")), {
    headers: { "Content-Type": "text/html" },
  });
});

Bun.serve({
  port: PORT,
  fetch: app.fetch,
});

console.log(`Shadow Poll server running on http://localhost:${PORT}`);