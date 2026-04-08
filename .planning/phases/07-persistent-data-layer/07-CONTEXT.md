# Phase 7: Persistent Data Layer — Context

## Phase Goal

Replace the in-memory `Map` used to store poll metadata in `app/api/polls/metadata/route.ts` with a persistent Postgres database, so the app works correctly on Vercel's serverless infrastructure where module-level state is lost on every function cold start.

## Problem

The current metadata store is a module-level JavaScript `Map`:

```typescript
// app/api/polls/metadata/route.ts — line 16
const metadataStore = new Map<string, { metadata: PollMetadata; metadataHash: string }>();
```

On Vercel, each serverless function invocation may run in a fresh process. The `Map` is re-initialized to empty on every cold start. Any poll created after the previous warm instance was recycled loses its title, description, and option labels permanently — users see empty poll cards.

**What is stored off-chain (and must persist):**

| Field | Type | Purpose |
|-------|------|---------|
| `poll_id` | `TEXT` (64 hex chars) | Primary key — maps to on-chain contract ID |
| `title` | `TEXT` | Human-readable poll name |
| `description` | `TEXT` | Optional longer description |
| `options` | `JSONB` | Array of option label strings |
| `metadata_hash` | `TEXT` (64 hex chars) | SHA-256 integrity check (matches on-chain `metadata_hash`) |
| `created_at` | `TIMESTAMPTZ` | Auto-set by DB — for ordering on the home page |

Nothing else is stored. No user data, no wallet addresses, no vote history — those live on-chain.

## Requirements

No new user-facing requirements. This phase fixes an infrastructure constraint:

| ID | Description |
|----|-------------|
| INFRA-01 | Poll metadata (title, description, options) persists across Vercel serverless restarts |
| INFRA-02 | GET `/api/polls/metadata?pollId=<hex>` returns the same data regardless of which serverless instance handles the request |
| INFRA-03 | GET `/api/polls/metadata` (no pollId) returns a list of all stored metadata (for the home page to show titles without N+1 calls) |
| INFRA-04 | POST `/api/polls/metadata` is idempotent — submitting the same `pollId` twice updates in place |
| INFRA-05 | App builds and deploys on Vercel with a `DATABASE_URL` environment variable pointing to a Neon serverless Postgres instance |

## Success Criteria

1. Creating a poll and refreshing the page (or opening it in another browser) shows the correct title and options — metadata survived the restart
2. The home page can fetch all polls' metadata in a single API call
3. The build passes (`bun run build`) with the new dependency
4. The TypeScript compiler reports zero errors

## Technology Decision

**Neon serverless Postgres** via the `@neondatabase/serverless` driver.

**Why Neon over alternatives:**

| Option | Verdict | Reason |
|--------|---------|--------|
| Vercel KV (Upstash Redis) | Rejected | KV stores strings; JSONB typing, ordering, and batch queries are awkward |
| Vercel Postgres (Neon under the hood) | Acceptable | Identical wire protocol; `@vercel/postgres` is a thin wrapper around `@neondatabase/serverless` |
| `@neondatabase/serverless` directly | **Chosen** | Free tier, first-party serverless-Postgres driver, works with any Postgres (including local dev via `DATABASE_URL`), no Vercel lock-in |
| PlanetScale / Turso | Rejected | MySQL/SQLite dialect; additional migration overhead |
| Supabase | Rejected | Adds auth/realtime SDK complexity we don't need |

**Driver:** `@neondatabase/serverless` — exports `neon` (tagged template SQL) and `Pool` for connection pooling over HTTP + WebSocket. The `neon` tagged-template function is the simplest API for single-query endpoints.

**Environment variable:** `DATABASE_URL` — standard Postgres connection string. Works with Neon, Supabase, local Postgres, and Vercel Postgres equally.

## Schema

Single table, no relations:

```sql
CREATE TABLE IF NOT EXISTS polls_metadata (
  poll_id       TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  options       JSONB NOT NULL,
  metadata_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_polls_metadata_created_at
  ON polls_metadata (created_at DESC);
```

The `created_at DESC` index supports the list-all endpoint which returns polls ordered newest-first (matches the home page trending sort).

## API Contract Changes

### Existing endpoints (backward compatible)

`GET /api/polls/metadata?pollId=<hex>` — unchanged response shape:
```json
{
  "pollId": "<hex>",
  "metadata": { "title": "...", "description": "...", "options": [...], "createdAt": "..." },
  "metadataHash": "<hex>"
}
```

`POST /api/polls/metadata` — unchanged request/response. Becomes an `UPSERT` instead of `Map.set()`.

### New endpoint

`GET /api/polls/metadata` (no `pollId` param) — returns all polls metadata in creation order:
```json
[
  {
    "pollId": "<hex>",
    "metadata": { "title": "...", "description": "...", "options": [...], "createdAt": "..." },
    "metadataHash": "<hex>"
  },
  ...
]
```

This endpoint is needed by the home page to batch-fetch titles for all on-chain polls instead of issuing N individual GET requests.

**Pagination:** Not needed for v1/testnet. Neon free tier supports ~hundreds of rows easily. If poll count grows, add `?limit=&offset=` params in a future phase.

## Architecture

```
app/api/polls/metadata/route.ts
  ↓ imports
lib/db/client.ts          ← new: exports neon SQL tagged template
lib/db/migrations.ts      ← new: exports runMigrations() (CREATE TABLE IF NOT EXISTS)
  ↓ calls
Neon serverless Postgres  ← external: configured via DATABASE_URL env var
```

**No ORM.** Raw SQL via the `neon` tagged template. The single-table schema is simple enough that Prisma/Drizzle would add complexity without benefit.

**Migration strategy:** `runMigrations()` is called lazily on the first request to any metadata endpoint (guarded by a module-level `migrationRan` flag). This is safe for serverless — `CREATE TABLE IF NOT EXISTS` is idempotent. No CLI migration runner needed for a single-table schema at v1 scale.

## File Map

### New files

| File | Purpose |
|------|---------|
| `lib/db/client.ts` | Exports `sql` (neon tagged template), initialized from `DATABASE_URL` |
| `lib/db/migrations.ts` | Exports `runMigrations()` — idempotent `CREATE TABLE IF NOT EXISTS` DDL |

### Modified files

| File | Change |
|------|--------|
| `app/api/polls/metadata/route.ts` | Replace `Map` store with DB queries; add list-all branch to GET |
| `package.json` | Add `@neondatabase/serverless` dependency |

### No changes to

- `lib/midnight/metadata-store.ts` — types and validation logic unchanged
- `lib/queries/use-metadata.ts` — client hook unchanged (same API contract)
- Any Compact contracts or ZK artifacts
- Tailwind, ESLint, TypeScript, or Next.js config

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes (production) | Postgres connection string, e.g. `postgresql://user:pass@host/db?sslmode=require` |

For local development without a real DB, the route gracefully falls back — see Plan 07-01 for the fallback behavior specification.

**Neon free tier setup steps (documented for the operator, not coded):**
1. Create account at [neon.tech](https://neon.tech)
2. Create a new project → copy the connection string
3. Set `DATABASE_URL` in Vercel project settings (Environment Variables)
4. Set `DATABASE_URL` in local `.env.local` for development

## Error Handling

| Scenario | Behavior |
|----------|----------|
| `DATABASE_URL` not set | `client.ts` throws at initialization; route returns `503 Service Unavailable` with descriptive error |
| DB connection timeout | Route returns `503` — does not crash the Next.js process |
| Duplicate `poll_id` on POST | UPSERT (ON CONFLICT DO UPDATE) — idempotent, returns `201` |
| `poll_id` not found on GET | Returns `404` — same as before |
| Migration fails on first request | Route returns `503` — migration error logged to stderr |

## Key Technical Notes

### Neon serverless driver over HTTP

The `neon` tagged template from `@neondatabase/serverless` sends queries over HTTPS (not a persistent TCP connection). This is ideal for Vercel serverless functions which cannot maintain persistent connections. No connection pool configuration needed for simple single-query endpoints.

### `createdAt` in PollMetadata vs. DB `created_at`

`PollMetadata.createdAt` is the client-supplied ISO 8601 timestamp (set at poll creation time, before the on-chain transaction). The DB `created_at` column is the server-side insert timestamp (when the POST arrives). They are close but not identical. The API continues to return `metadata.createdAt` (client-supplied) in the response body — the DB `created_at` column is used only for ordering in the list-all endpoint.

### Turbopack alias not needed

`@neondatabase/serverless` is a server-only package used exclusively in `app/api/` routes (Next.js Route Handlers). It never touches the client bundle. No `turbopack.resolveAlias` entry needed — Next.js automatically excludes route handler imports from the client bundle.

---

## Suggested Plan Breakdown

**1 plan** — this is a focused infrastructure swap. The work is:
1. Install the package
2. Create `lib/db/client.ts` and `lib/db/migrations.ts`
3. Rewrite the route handler
4. Verify the build passes

All work is tightly coupled (the route depends on the DB client) so a single plan is the right granularity.

### Plan 07-01: Neon Postgres Data Layer

**Subsystem:** data / infrastructure
**Goal:** Swap the in-memory Map for Neon serverless Postgres; add list-all endpoint; zero breaking changes

**Tasks:**
1. Add `@neondatabase/serverless` to `package.json` and install via Bun
2. Create `lib/db/client.ts` — `sql` tagged template exported, initialized from `DATABASE_URL`
3. Create `lib/db/migrations.ts` — `runMigrations()` with `CREATE TABLE IF NOT EXISTS` DDL
4. Rewrite `app/api/polls/metadata/route.ts` — replace `Map` with DB queries, add list-all GET branch
5. Verify TypeScript compiles and build passes

---

## Assumptions

- The operator will configure `DATABASE_URL` in Vercel environment settings and in `.env.local` for local development — no `.env` file is committed to the repo
- Neon's free tier HTTP-based driver does not require persistent connections — safe for Vercel serverless
- The existing `PollMetadata.createdAt` field (client-supplied) remains in the response; the DB `created_at` is for ordering only
- The list-all endpoint returns all rows without pagination — acceptable for testnet scale
- `CREATE TABLE IF NOT EXISTS` as the migration strategy is sufficient for a single-table schema at v1
