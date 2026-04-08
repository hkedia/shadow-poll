---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: in_progress
stopped_at: Phase 8 added — 08-CONTEXT.md and 08-01/02/03-PLAN.md written, ready to execute
last_updated: "2026-04-08T18:30:00.000Z"
last_activity: 2026-04-08
progress:
  total_phases: 8
  completed_phases: 7
  total_plans: 19
  completed_plans: 16
  percent: 84
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-08)

**Core value:** Users can vote on polls anonymously with cryptographic guarantees
**Current focus:** Phase 8 — NIGHT token payment for poll creation

## Current Position

Phase: 8 of 8 (NIGHT Token Payment) — IN PROGRESS
Plan: 1 of 3 in current phase
Status: Ready to execute (plans written, context documented)
Last activity: 2026-04-08

Progress: [████████░░] 84%

## Performance Metrics

**Velocity:**

- Total plans completed: 13
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Wallet & UI Foundation | 3 | — | — |
| 2. Smart Contracts | 2 | — | — |
| 3. Data Layer | 2 | ~25 min | ~12.5 min |

**Recent Trend:**

- Last 5 plans: —
- Trend: —

*Updated after each plan completion*
| Phase 04 P02 | 4min | 2 tasks | 7 files |
| Phase 04 P03 | 13min | 3 tasks | 8 files |
| Phase 05 P01 | 4min | 3 tasks | 2 files |
| Phase 05 P02 | 5min | 4 tasks | 8 files |
| Phase 05 P03 | 7min | 3 tasks | 5 files |
| Phase 06 P01 | 3 | 4 tasks | 4 files |
| Phase 06 P02 | 5 | 6 tasks | 6 files |

## Phase 8 Design Decisions (from discussion)

- D-80: Fee is 5 NIGHT/tNIGHT per poll creation — defined as `POLL_CREATION_FEE` constant in `lib/midnight/fee-config.ts`; changing one constant updates fee everywhere
- D-81: Token denomination is network-aware via `getFeeTokenId(networkId)` — tNIGHT for preview/preprod, NIGHT for mainnet; network ID comes from 1am wallet config
- D-82: Fee collected atomically via Compact `receive(tokenId, amount)` in the `create_poll` circuit — atomic with the transaction, no separate approve step
- D-83: Voters (cast_vote, cast_invite_vote) pay nothing — unchanged, DUST only, sponsored by 1am wallet
- D-84: Create Poll UI shows fee banner "Creating this poll costs 5 tNIGHT" above submit button — visible when wallet is connected
- D-85: Insufficient balance produces a typed `PollCreationError` with `code: "INSUFFICIENT_BALANCE"` — distinct from generic transaction failure in the UI
- D-86: Fees accumulate in the contract's shielded balance — no separate treasury wallet in v1; withdraw_fees circuit is deferred
- D-87: `fee_token_id: Bytes<32>` added as a parameter to `create_poll` — TypeScript service derives it from `getFeeTokenId(networkId)` and converts to bytes
- D-88: `networkId` added to `MidnightProviderSet` — populated from `config.networkId` in `assembleProviders()`

## Phase 7 Design Decisions (from discussion)

- D-70: Neon serverless Postgres via `@neondatabase/serverless` — HTTP-based driver, no persistent connections, ideal for Vercel serverless
- D-71: Single `polls_metadata` table, no ORM — raw SQL via tagged template, schema is too simple to justify Prisma/Drizzle
- D-72: Lazy migration via `runMigrations()` with module-level flag — `CREATE TABLE IF NOT EXISTS` is idempotent, no CLI migration runner needed for v1
- D-73: `DATABASE_URL` as the single env var — standard Postgres connection string, works with Neon, Supabase, local Postgres equally
- D-74: List-all GET endpoint (no `pollId` param) returns all rows ordered by `created_at DESC` — enables batch metadata fetch for the home page

## Phase 6 Design Decisions (from discussion)

- D-60: Hybrid off-chain participation proof — no new contract circuit, nullifier-based
- D-61: Dual sharing format — verification URL + client-side SVG badge download
- D-62: Verify page reads on-chain vote_nullifiers map live via indexer (wallet required)
- D-63: Global-only analytics at /stats — total polls, total votes, active count, public/invite split, avg votes/poll, most-voted poll

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- D-10: Aether Privacy design system (navy-black backgrounds, lavender primary, turquoise tertiary)
- D-10a: Manrope + Plus Jakarta Sans fonts, 4 sizes (14/16/24/48-60px), 2 weights (400/700)
- D-10b: Material Symbols Outlined icons
- [Phase 01-wallet-ui-foundation]: Use CSS custom properties (var(--token)) for Aether design tokens — not Tailwind config values
- [Phase 01-wallet-ui-foundation]: Provider types are any in Phase 1 — tightened in Phase 3 when full indexer is wired
- [Phase 01-wallet-ui-foundation]: Turbopack resolveAlias + stub module to prevent Midnight SDK WASM packages bundling client-side
- D-20: Single Poll Manager contract (not factory pattern)
- D-21: Public tallies, private voter identity
- D-22: Hash-based metadata storage (title/description as commitment hash on-chain)
- D-23: Maximum 10 poll options
- D-24: Block-number-based expiration
- D-25: Simple manual compilation pipeline (bun run compile:contracts)

- [Phase 02-smart-contracts]: Flat tally map with composite key hash(poll_id, option_index) — avoids unsupported nested Map<Map<Counter>>
- [Phase 02-smart-contracts]: All circuit parameters explicitly disclosed via disclose() for ledger operations
- [Phase 02-smart-contracts]: contracts/managed/** added to ESLint ignores (auto-generated files)

- D-30: Off-chain metadata API route with SHA-256 hash verification (/api/polls/metadata)
- D-31: Hybrid API architecture — SDK indexer for ledger reads, API routes for metadata only
- D-32: TanStack Query for all data fetching, caching, and optimistic updates
- D-33: Partial provider type tightening — indexer + ZK typed, wallet + proof stay any until Phase 4
- [Phase 03-data-layer]: Structural types for IndexerPublicDataProvider and ZkConfigProvider (Turbopack stubs prevent direct SDK type imports)
- [Phase 03-data-layer]: persistentHash from compact-runtime for tally key derivation (not compact-js)
- [Phase 03-data-layer]: BigInt() constructor instead of bigint literals to stay ES2017-compatible
- [Phase 03-data-layer]: QueryProvider inside WalletProvider in root layout
- [Phase 03-data-layer]: usePoll/usePolls have Phase 4 placeholders; useMetadata is fully functional
- [Phase 04]: Contract-service functions take MidnightProviderSet directly — hooks pass providers unchanged from useWalletContext
- [Phase 04]: HeaderNav extracted as client component for active state highlighting — Header stays server component
- [Phase 04]: useCreatePoll extracts poll ID from result.private.result with fallback chain
- [Phase 04]: PollCard self-fetches metadata via useMetadata(poll.id) — avoids N+1 at page level
- [Phase 04]: BLOCKS_PER_DAY = BigInt(4320) for duration-to-blocks conversion (~20 sec/block on Preview)
- [Phase 04]: Block-based expiration polling via getCurrentBlockNumber() with 30s refresh interval

- D-50: Hash-list for invite code verification (Map<Bytes<32>, Boolean> keyed by hash(poll_id, code))
- D-51: Nullifier-based duplicate vote prevention for ALL polls (hash(poll_id, voter_sk))
- D-52: Separate cast_invite_vote circuit for invite-only polls (cast_vote stays for public)
- D-53: Browser-only invite code storage (localStorage + clipboard, no server state)
- D-54: Separate add_invite_codes circuit (decoupled from poll creation)
- [Phase 05]: One invite code per add_invite_codes call — Compact v0.19 variable-length array limitation
- [Phase 05]: Nullifier derived from voter_sk not invite_code — one vote per wallet regardless of codes held
- [Phase 05]: invite_code NOT disclosed in cast_invite_vote — only hash crosses ZK boundary
- [Phase 05]: inviteCodeToBytes32 uses SHA-256 to normalize variable-length codes to fixed Bytes<32>
- [Phase 05]: Case-insensitive invite codes via uppercase normalization before hashing
- [Phase 05]: Dynamic import for invite-codes.ts to keep public poll path lightweight
- [Phase 05]: Number(poll_type) === 1 instead of PollType enum import — avoids compact-runtime in client bundles
- [Phase 05]: activeMutation pattern for dual mutation handlers (public/invite-only) sharing single UI
- [Phase 06]: D-60: Hybrid off-chain participation proof — nullifier-based, no new Compact circuit
- [Phase 06]: D-61: Dual sharing format — verification URL + client-side SVG badge download
- [Phase 06]: D-62: Verify page reads on-chain vote_nullifiers map live via indexer (wallet required)
- [Phase 06]: D-63: Global-only analytics at /stats — totalPolls, totalVotes, activePolls, public/invite split, avgVotes, mostVotedPoll
- [Phase 06]: Spinner extended with lg size to support verify and stats page usage

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-04-08T18:30:00.000Z
Stopped at: Phase 8 added — 08-CONTEXT.md and 08-01/02/03-PLAN.md written, ready to execute
Resume file: .planning/phases/08-night-token-payment/08-01-PLAN.md
