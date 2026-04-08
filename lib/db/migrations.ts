/**
 * Database migrations for Shadow Poll.
 *
 * Uses CREATE TABLE IF NOT EXISTS — fully idempotent. Safe to call on every
 * cold start without a CLI migration runner.
 *
 * Schema:
 *   polls_metadata (
 *     poll_id       TEXT PRIMARY KEY,        -- 64-char hex poll ID from Midnight contract
 *     title         TEXT NOT NULL,
 *     description   TEXT NOT NULL DEFAULT '',
 *     options       JSONB NOT NULL,           -- string[]
 *     metadata_hash TEXT NOT NULL,            -- 64-char hex SHA-256
 *     created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
 *   )
 *
 * Index:
 *   idx_polls_metadata_created_at ON polls_metadata (created_at DESC)
 *   Supports the list-all GET endpoint which orders by newest first.
 */

import { sql } from "@/lib/db/client";

/** Tracks whether migrations have run in this process instance. */
let migrationRan = false;

/**
 * Ensures the polls_metadata table exists.
 *
 * Called lazily on the first request to any metadata API endpoint.
 * Uses CREATE TABLE IF NOT EXISTS — safe to call multiple times.
 *
 * @throws if the database is unreachable or the DDL fails
 */
export async function runMigrations(): Promise<void> {
  if (migrationRan) return;

  await sql`
    CREATE TABLE IF NOT EXISTS polls_metadata (
      poll_id       TEXT PRIMARY KEY,
      title         TEXT NOT NULL,
      description   TEXT NOT NULL DEFAULT '',
      options       JSONB NOT NULL,
      metadata_hash TEXT NOT NULL,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_polls_metadata_created_at
      ON polls_metadata (created_at DESC)
  `;

  migrationRan = true;
}
