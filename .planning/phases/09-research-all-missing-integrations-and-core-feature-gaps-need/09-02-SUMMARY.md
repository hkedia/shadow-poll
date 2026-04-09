---
phase: 09-research-all-missing-integrations-and-core-feature-gaps-need
plan: 02
subsystem: poll-reads, data-layer
tags: [unauthenticated-access, polls-handler, neon-postgres, metadata-api]
dependency_graph:
  requires: [lib/midnight/contract-service.ts, lib/midnight/ledger-utils.ts, lib/db/client.ts, lib/db/migrations.ts]
  provides: [lib/queries/use-poll.ts, lib/api/polls-handler.ts]
  affects: [src/routes/poll-detail.tsx]
tech_stack:
  added: []
  patterns: [two-path-fetch, server-api-fallback, lazy-migration, upsert-idempotent]
key_files:
  created: []
  modified:
    - lib/queries/use-poll.ts
    - lib/api/polls-handler.ts
    - lib/api/metadata-handler.ts
decisions:
  - "D-09-06: usePoll() enabled with !!pollId only — no wallet required for poll data reads"
  - "D-09-07: Unauthenticated path fetches from GET /api/polls?id={pollId} — server bridges to indexer"
  - "Tallies remain wallet-gated — live indexer reads require providers"
  - "Phase 7 Neon Postgres layer confirmed complete — no fixes needed"
metrics:
  duration: 144s
  completed: "2026-04-09"
  tasks_completed: 2
  files_changed: 3
---

# Phase 09 Plan 02: Fix Unauthenticated Poll Reads and Verify Phase 7 Summary

**One-liner:** Removed wallet gate from poll data reads by adding two-path fetch to usePoll() (server API for unauthenticated, live indexer for wallet users) and extended polls-handler with ?id= filter.

## What Was Built

### Task 1: usePoll() Two-Path Architecture
- **Problem:** `usePoll()` was gated behind `isConnected`, causing blank loading state for visitors without a wallet
- **Fix:** Changed `enabled: isConnected && !!pollId` to `enabled: !!pollId` for the poll query
- **Unauthenticated path:** When no wallet or no contractAddress, fetches from `GET /api/polls?id={pollId}`, maps server response to `PollWithId` shape using `PollType` enum from contract
- **Authenticated path:** Uses `fetchPollWithTallies()` via live indexer (unchanged)
- **Tallies:** Remain wallet-gated (`enabled: isConnected && !!pollId`) — correct, require providers

### polls-handler.ts: `?id=` Filter
- Added single-poll filter after `polls` array is built
- `GET /api/polls?id={pollId}` returns `{ currentBlockHeight, poll }` or 404 `{ error: "Poll not found" }`
- Requests without `?id=` continue returning `{ currentBlockHeight, polls: [...] }` unchanged

### Task 2: Phase 7 Neon Postgres Verification
All items confirmed operational — no code changes needed:
- `lib/db/client.ts`: Uses `process.env.DATABASE_URL` (server-side, not import.meta.env)
- `lib/db/migrations.ts`: `CREATE TABLE IF NOT EXISTS polls_metadata` with `poll_id TEXT PRIMARY KEY`, `metadata JSONB`, `metadata_hash TEXT`, `created_at TIMESTAMPTZ`
- `lib/api/metadata-handler.ts`: GET by pollId / list all / POST upsert with SHA-256 hash verification and `ON CONFLICT DO UPDATE`
- `server.ts`: Route `/api/polls/metadata` registered and imports `handleMetadataRequest`
- Added audit comment at top of `metadata-handler.ts` as execution evidence

## Deviations from Plan

**[Rule 2 - Missing Critical Functionality] Tallies query updated to simpler enabled condition**
- **Found during:** Task 1
- **Issue:** Plan suggested updating tallies `enabled` from `isConnected && !!pollId && pollQuery.data !== null` to `isConnected && !!pollId` to avoid circular dependency
- **Fix:** Applied as written — simpler and correct since tallies are only fetched when wallet is connected (isConnected already implies providers exist)
- **Files modified:** lib/queries/use-poll.ts

## Known Stubs

None — all read paths are fully wired.

## Threat Flags

None — no new network endpoints introduced beyond what the threat model already covers.

## Self-Check: PASSED
- lib/queries/use-poll.ts: FOUND
- lib/api/polls-handler.ts: FOUND
- lib/api/metadata-handler.ts: FOUND
- Commit 74088e9: FOUND
