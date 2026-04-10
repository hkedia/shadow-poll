---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Completed 260410-d7c
last_updated: "2026-04-10T04:58:04.015Z"
last_activity: 2026-04-10
progress:
  total_phases: 13
  completed_phases: 12
  total_plans: 30
  completed_plans: 30
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-08)

**Core value:** Users can vote on polls anonymously with cryptographic guarantees
**Current focus:** Phase 13 — comprehensive-testing

## Current Position

Phase: 13
Plan: Not started
Status: Ready to execute
Last activity: 2026-04-10

Progress: [█████████2] 92%

## Performance Metrics

**Velocity:**

- Total plans completed: 26
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Wallet & UI Foundation | 3 | — | — |
| 2. Smart Contracts | 2 | — | — |
| 3. Data Layer | 2 | ~25 min | ~12.5 min |
| 13 | 6 | - | - |

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
| Phase 08 P01 | 763s | 2 tasks | 23 files |
| Phase 08 P02 | 17m | 2 tasks | 50 files |
| Phase 08 P03 | 3min | 1 tasks | 3 files |
| Phase 08 P04 | 2min | 1 tasks | 3 files |
| Phase 09 P01 | 325s | 2 tasks | 2 files |
| Phase 09 P02 | 144s | 2 tasks | 3 files |
| Phase 11-hono-api-migration P01 | 7min | 3 tasks | 6 files |
| Phase quick P260410-ag2 | 2min | 1 tasks | 3 files |
| Phase quick/260410-ars P01 | 6min | 2 tasks | 2 files |
| Phase quick/260410-bjv P01 | 8min | 2 tasks | 7 files |

## Phase 7 Design Decisions (from discussion)

- D-70: Neon serverless Postgres via `@neondatabase/serverless` — HTTP-based driver, no persistent connections, ideal for Vercel serverless
- D-71: Single `polls_metadata` table, no ORM — raw SQL via tagged template, schema is too simple to justify Prisma/Drizzle
- D-72: Lazy migration via `runMigrations()` with module-level flag — `CREATE TABLE IF NOT EXISTS` is idempotent, no CLI migration runner needed for v1
- D-73: `DATABASE_URL` as the single env var — standard Postgres connection string, works with Neon, Supabase, local Postgres equally
- D-74: List-all GET endpoint (no `pollId` param) returns all rows ordered by `created_at DESC` — enables batch metadata fetch for the home page

## Phase 6 Design Decisions (from discussion)

- D-60: Hybrid off-chain participation proof — no new contract circuit, nullifier-based
- D-61: Dual sharing format — verification URL + client-side SVG badge download
- D-62: Verify page reads on-chain vote_nullifiers via server-side API (wallet NOT required)
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
- [Phase 01-wallet-ui-foundation]: Turbopack resolveAlias + stub module to prevent Midnight SDK WASM packages bundling client-side (replaced in Phase 08 by vite-plugin-wasm)
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
- [Phase 08]: Used vite-plugin-wasm + vite-plugin-top-level-await for WASM module loading, replacing Turbopack stubbing approach
- [Phase 08]: Replaced process.env.NEXT_PUBLIC_* with import.meta.env.VITE_* for Vite environment variable convention
- [Phase 08]: Deleted app/api/polls/metadata/route.ts with app/ directory - API routes recreated in Plan 03
- [Phase 08]: Used native <img> tags to replace Next.js Image component - no optimization library needed for SVG logos
- [Phase 08]: Removed vite-plugin-top-level-await — Vite 8 with build.target: esnext natively supports TLA; plugin required rollup which Vite 8 (Rolldown-based) does not bundle
- [Phase 08]: object-inspect added to Vite optimizeDeps.include — CJS module requires pre-bundling for ESM import compatibility
- [Phase 09]: D-09-03: Browser calls contract service directly — no server intermediary for state-changing ops
- [Phase 09]: D-09-06/07: usePoll() enabled with !!pollId; unauthenticated path fetches from GET /api/polls?id=
- [Phase 11]: D-11-01: Sub-routers use full paths mounted at / on apiRoutes
- [Phase 11]: D-11-02: Kept manual CORS headers alongside Hono cors() middleware
- [Phase 11]: D-11-03: Kept runMigrations() inside handlers not middleware
- [Phase 11]: D-11-04: Used Bun.file() for static serving instead of Hono serveStatic()
- [Phase quick]: SECONDS_PER_BLOCK=10 as single source of truth in lib/utils.ts for block-to-date conversion
- [Phase quick/260410-ars]: D-ARS-01: talliesQuery enabled without wallet; fetches from /api/polls?id= when unauthenticated
- [Phase quick/260410-ars]: D-ARS-02: currentBlockHeight from /api/indexer/block via useQuery (30s refresh), not wallet-dependent getCurrentBlockNumber
- [Phase quick/260410-ars]: D-ARS-03: WalletOnboarding overlay removed entirely — page viewable without wallet
- [Phase quick/260410-bjv]: D-bjv-01: WalletOnboarding uses sessionStorage keyed by status for per-state dismissal
- [Phase quick/260410-bjv]: D-bjv-02: App-level mount inside WalletProvider — banner appears on all pages
- [Phase quick/260410-bjv]: D-bjv-03: Removed requiresWallet prop — component self-selects visibility from context

### Roadmap Evolution

- Phase 9 added: Research all missing integrations and core feature gaps needed for a working app — poll creation invoking 1am wallet API, vote submission with blockchain confirmation, metadata storage in DB, active/closed poll tracking, invite code handling, and participation proof generation
- Phase 13 added: Comprehensive testing with testkit-js for Midnight contracts and app-wide test coverage

### Blockers/Concerns

None.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260409-rnc | Fix scroll-to-top on page navigation and auto-dismiss hamburger menu on mobile | 2026-04-09 | 35ed7f8 | [260409-rnc-fix-scroll-to-top-on-page-navigation-and](./quick/260409-rnc-fix-scroll-to-top-on-page-navigation-and/) |
| 260409-rxk | Make verify page work without wallet connection | 2026-04-09 | 6b7a3a6 | [260409-rxk-make-verify-page-work-without-wallet-con](./quick/260409-rxk-make-verify-page-work-without-wallet-con/) |
| 260410-9xs | Remove wallet autoconnect feature from the app | 2026-04-10 | 226ca5f | [260410-9xs-remove-wallet-autoconnect-feature-from-t](./quick/260410-9xs-remove-wallet-autoconnect-feature-from-t/) |
| 260410-ag2 | Replace raw block numbers with human-readable expiration dates | 2026-04-10 | 68ab310 | [260410-ag2-update-poll-page-live-results-to-show-ex](./quick/260410-ag2-update-poll-page-live-results-to-show-ex/) |
| 260410-ars | Make poll page show live results without wallet — only require wallet for voting and participation card | 2026-04-10 | 2ff00d7 | [260410-ars-make-poll-page-show-live-results-vote-co](./quick/260410-ars-make-poll-page-show-live-results-vote-co/) |
| 260410-bjv | Refactor wallet onboarding to dismissible app-wide banner handling all wallet states | 2026-04-10 | 2c2c49d | [260410-bjv-refactor-wallet-onboarding-to-be-non-blo](./quick/260410-bjv-refactor-wallet-onboarding-to-be-non-blo/) |
| 260410-c68 | Replace wallet banner with modal dialog for error states | 2026-04-10 | eff32fd | [260410-c68-replace-wallet-banner-with-modal-dialog-](./quick/260410-c68-replace-wallet-banner-with-modal-dialog-/) |
| 260410-cxl | Remove sessionStorage from wallet modal - show on every error state | 2026-04-10 | 2dc6ea7 | [260410-cxl-remove-sessionstorage-from-wallet-modal-](./quick/260410-cxl-remove-sessionstorage-from-wallet-modal-/) |
| 260410-d7c | Fix wallet detection to show modal instantly when no wallet detected | 2026-04-10 | 252d117 | [260410-d7c-fix-wallet-detection-to-show-modal-insta](./quick/260410-d7c-fix-wallet-detection-to-show-modal-insta/) |

## Session Continuity

Last session: 2026-04-10T04:00:25.060Z
Stopped at: Completed 260410-d7c
Resume file: None
