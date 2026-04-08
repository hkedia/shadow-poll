/**
 * Neon serverless Postgres client for Shadow Poll.
 *
 * Exports `sql` — a tagged template literal function that sends queries over
 * HTTPS to Neon (no persistent TCP connection required, ideal for Vercel
 * serverless functions).
 *
 * Usage:
 *   import { sql } from "@/lib/db/client";
 *   const rows = await sql`SELECT * FROM polls_metadata WHERE poll_id = ${id}`;
 *
 * Configuration: Requires DATABASE_URL environment variable.
 * Format: postgresql://user:pass@host/db?sslmode=require
 *
 * For local development, set DATABASE_URL in .env.local (not committed to git).
 */

import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL environment variable is not set. " +
      "Set it to a Neon (or any Postgres) connection string. " +
      "See .planning/phases/07-persistent-data-layer/07-CONTEXT.md for setup instructions.",
  );
}

/**
 * SQL tagged template literal backed by Neon serverless Postgres.
 *
 * Sends queries over HTTPS — no persistent connection pool needed.
 * Safe for Vercel serverless cold starts.
 *
 * @example
 *   const rows = await sql`SELECT poll_id FROM polls_metadata`;
 */
export const sql = neon(databaseUrl);
