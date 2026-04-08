# Phase 07-01 Summary — Neon Postgres Data Layer

**Completed:** 2026-04-08
**Status:** Done — all 5 tasks complete, zero type errors

## What was done

Replaced the ephemeral module-level `Map` in `app/api/polls/metadata/route.ts` with a persistent Neon serverless Postgres backend. Poll metadata now survives Vercel serverless cold starts.

## Files changed

| File | Change |
|------|--------|
| `package.json` | Added `@neondatabase/serverless@1.0.2` to dependencies |
| `lib/db/client.ts` | **New** — exports `sql` tagged template from `@neondatabase/serverless`, initialized from `DATABASE_URL` |
| `lib/db/migrations.ts` | **New** — exports `runMigrations()` with idempotent `CREATE TABLE IF NOT EXISTS` DDL for `polls_metadata` |
| `app/api/polls/metadata/route.ts` | **Rewritten** — `Map` removed, DB queries added, list-all GET branch added |

## Key decisions

- `@neondatabase/serverless` v1.0.2 installed (latest stable, HTTP-based driver — no persistent connections)
- `runMigrations()` uses a module-level `migrationRan` flag to avoid re-running DDL on warm instances
- `ON CONFLICT (poll_id) DO UPDATE SET` upsert — idempotent POST (INFRA-04)
- `PollMetadataRow` typed interface for DB rows — no `any`
- GET with no `pollId` param returns `MetadataResponse[]` ordered by `created_at DESC` (INFRA-03)
- All existing GET (single-poll) and POST response shapes preserved — no breaking changes

## Verification

- `npx tsc --noEmit` exits with 0 errors
- `lib/db/client.ts` and `lib/db/migrations.ts` exist
- `app/api/polls/metadata/route.ts` contains no `new Map` reference
- `@neondatabase/serverless` installed in `node_modules`

## Deployment note

Set `DATABASE_URL` in Vercel Environment Variables (and `.env.local` for local dev):
```
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
```
The table is created automatically on first request via `runMigrations()`.
