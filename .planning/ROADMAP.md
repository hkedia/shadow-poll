# Roadmap: Shadow Poll

## Overview

Shadow Poll goes from an empty Next.js scaffold to a fully functional anonymous polling dApp on Midnight blockchain. The journey moves through wallet integration and UI foundation, smart contract development, data layer wiring, core polling features, invite-only privacy extensions, and finally ZK proof generation with analytics. Each phase delivers a coherent, verifiable capability that unblocks the next.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Wallet & UI Foundation** - Connect 1am.xyz wallet with provider assembly; establish dark theme and responsive layout (completed 2026-04-08)
- [x] **Phase 2: Smart Contracts** - Write and compile Compact contracts for poll creation and vote casting (completed 2026-04-08)
- [x] **Phase 3: Data Layer** - Wire up GraphQL indexer reads and API routes for on-chain data access (completed 2026-04-08)
- [x] **Phase 4: Core Polling** - End-to-end public poll creation, voting, and browsing with live tallies (completed 2026-04-08)
- [x] **Phase 5: Invite-Only Polls** - Private polls with off-chain invite codes, ZK verification, and duplicate vote prevention (completed 2026-04-08)
- [x] **Phase 6: ZK Proofs & Analytics** - Client-side participation proofs and global stats dashboard (in progress) (completed 2026-04-08)
- [ ] **Phase 7: Persistent Data Layer** - Replace in-memory poll metadata store with Neon serverless Postgres for Vercel production compatibility
- [x] **Phase 8: Vite Migration** - Replace Next.js + Turbopack with Vite + React Router + Bun.serve() to resolve Midnight SDK WASM runtime loading failures and align build tooling with the app's SPA architecture (completed 2026-04-09)

## Phase Details

### Phase 1: Wallet & UI Foundation
**Goal**: Users can connect the 1am.xyz wallet and navigate a polished dark-themed responsive shell
**Depends on**: Nothing (first phase)
**Requirements**: WALL-01, WALL-02, WALL-03, WALL-04, WALL-05, WALL-06, WALL-07, PAGE-04, PAGE-06
**Success Criteria** (what must be TRUE):
  1. User sees a prompt to install 1am.xyz when the extension is not detected in the browser
  2. User can connect their wallet and sees their truncated address in the navigation bar
  3. User can disconnect their wallet, and reconnection persists automatically across page refreshes
  4. All pages render in a dark theme using shadcn/ui components and are usable on mobile screens
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Aether design system, shadcn/ui setup, app shell (Header, Footer, MobileDrawer)
- [x] 01-02-PLAN.md — Wallet hook, provider factory, context, WalletButton, WalletOnboarding, InstallPrompt
- [x] 01-03-PLAN.md — Root layout wiring (WalletProvider), HeroSection, landing page, Next.js WASM config

**UI hint**: yes

### Phase 2: Smart Contracts
**Goal**: Compact smart contracts for poll creation and vote casting are compiled and their artifacts are served from the app
**Depends on**: Phase 1
**Requirements**: CONT-01, CONT-02, CONT-03, CONT-04
**Success Criteria** (what must be TRUE):
  1. A Compact contract exists that accepts poll title, description, options, and type — and compiles without errors
  2. A Compact contract exists that accepts a vote on a poll — and compiles without errors
  3. Running the compilation pipeline in /contracts produces deployable WASM artifacts and ZK keys
  4. Compiled proving/verifying keys are accessible from the public folder with correct CORS headers
**Plans**: 2 plans

Plans:
- [x] 02-01-PLAN.md — Write Poll Manager Compact contract with create_poll and cast_vote circuits
- [x] 02-02-PLAN.md — Build compilation pipeline script and serve ZK keys from public/

### Phase 3: Data Layer
**Goal**: The app can read on-chain poll data from the Midnight Preview indexer through configured GraphQL and API routes
**Depends on**: Phase 2
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04
**Success Criteria** (what must be TRUE):
  1. GraphQL client is configured and can query the Midnight Preview public indexer for poll data
  2. API routes exist that proxy indexer queries and serve static contract artifacts
  3. Vote tallies update optimistically in the UI before on-chain confirmation arrives
**Plans**: 2 plans

Plans:
- [x] 03-01-PLAN.md — SDK indexer provider wiring, tighten provider types, ledger read utilities, metadata API route
- [x] 03-02-PLAN.md — TanStack Query integration, data hooks for polls/tallies/metadata, optimistic vote updates

### Phase 4: Core Polling
**Goal**: Users can create public polls, vote on them, and browse trending polls with live vote tallies
**Depends on**: Phase 1, Phase 2, Phase 3
**Requirements**: POLL-01, POLL-03, POLL-04, POLL-07, PAGE-01, PAGE-02, PAGE-03
**Success Criteria** (what must be TRUE):
  1. User can fill out the Create Poll form and submit a public poll as an on-chain transaction
  2. User can browse the Home / Trending Polls page and see polls sorted by activity from the indexer
  3. User can open a poll detail page at /poll/[id], see current vote tallies, and cast a vote via on-chain transaction
  4. Poll creator can set an expiration time, and expired polls no longer accept votes
**Plans**: 3 plans

Plans:
- [x] 04-01-PLAN.md — Contract interaction service layer (witnesses, providers, deploy/call)
- [x] 04-02-PLAN.md — Data hooks wiring + header navigation links
- [x] 04-03-PLAN.md — UI pages (Trending Polls, Create Poll, Poll Detail with voting)

**UI hint**: yes

### Phase 5: Invite-Only Polls
**Goal**: Users can create private polls with invite codes, and only holders of valid codes can vote — with ZK verification and duplicate vote prevention
**Depends on**: Phase 4
**Requirements**: POLL-02, POLL-05, POLL-06, CONT-05, CONT-06
**Success Criteria** (what must be TRUE):
  1. User can create an invite-only poll and generate shareable invite codes off-chain
  2. User with a valid invite code can vote on an invite-only poll, with the code verified via ZK proof in the contract
  3. The same wallet cannot vote twice on the same poll — the contract rejects duplicate votes
  4. The Create Poll form toggle between Public and Invite-Only correctly gates the invite code workflow
**Plans**: 3 plans

Plans:
- [x] 05-01-PLAN.md — Contract changes: nullifier-based duplicate vote prevention, invite code hash verification, new circuits (cast_invite_vote, add_invite_codes)
- [x] 05-02-PLAN.md — Service layer: invite code generation utility, contract call functions, mutation hooks (useInviteVoteMutation, useAddInviteCodesMutation), updated useCreatePoll
- [x] 05-03-PLAN.md — UI: Create Poll toggle (Public/Invite-Only), InviteCodePanel, invite code entry on Poll Detail, poll type badges

**UI hint**: yes

### Phase 6: ZK Proofs & Analytics
**Goal**: Users can generate and share verifiable ZK proofs of poll participation, and view global analytics
**Depends on**: Phase 4
**Requirements**: ZKPR-01, ZKPR-02, ZKPR-03, PAGE-05
**Success Criteria** (what must be TRUE):
  1. User can generate a client-side ZK proof that they participated in a poll without revealing their chosen option
  2. A third party can verify a participation proof is valid
  3. User can share a proof via link or visual badge
  4. Stats / Analytics page displays global trends, participation rates, and aggregate vote counts
**Plans**: 2 plans

Plans:
- [x] 06-01-PLAN.md — Proof & stats service layer (proof-badge.ts, use-participation-proof, use-verify-proof, use-stats)
- [x] 06-02-PLAN.md — Proof & stats UI pages (ProofPanel, /verify page, /stats page, Poll Detail update, header nav)

**UI hint**: yes

### Phase 7: Persistent Data Layer
**Goal**: Poll metadata (title, description, option labels) persists across Vercel serverless cold starts by storing it in Neon serverless Postgres instead of a module-level in-memory Map
**Depends on**: Phase 3 (metadata API route created there)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05
**Success Criteria** (what must be TRUE):
  1. Creating a poll and reloading the page (or opening it in another browser/instance) shows the correct title and options
  2. GET `/api/polls/metadata` (no pollId) returns all polls metadata in a single call
  3. POST `/api/polls/metadata` is idempotent — submitting the same pollId twice updates in place
  4. TypeScript compiles without errors and `bun run build` succeeds with `DATABASE_URL` set
**Plans**: 1 plan

Plans:
- [ ] 07-01-PLAN.md — Install @neondatabase/serverless, create DB client + migrations, rewrite route handler

**UI hint**: no

### Phase 8: Vite Migration
**Goal**: All Midnight SDK WASM modules load correctly at runtime by replacing Next.js + Turbopack with Vite (client bundling) + React Router (routing) + Bun.serve() (API + static serving)
**Depends on**: Phase 6 (all existing features must survive migration)
**Requirements**: MIGR-01, MIGR-02, MIGR-03, MIGR-04, MIGR-05, MIGR-06
**Success Criteria** (what must be TRUE):
  1. `@midnight-ntwrk/*` packages import via normal static imports (no dynamic import workarounds, no stub file)
  2. WASM modules from the Midnight SDK load successfully at runtime in the browser
  3. All 9 existing routes render correctly under React Router
  4. The metadata API endpoint (`/api/polls/metadata`) works via Bun.serve()
  5. `bun run build` produces a working production bundle
  6. ZK proof generation works end-to-end (create poll → vote → verify proof)
**Plans**: 4 plans

Plans:
- [x] 08-01-PLAN.md — Vite config, entry points, static SDK imports, delete stub + Turbopack workarounds
- [x] 08-02-PLAN.md — React Router app shell, move routes to src/routes/, update all Next.js imports
- [x] 08-03-PLAN.md — Bun.serve() production server, metadata API handler migration
- [x] 08-04-PLAN.md — Gap closure: remove incompatible vite-plugin-top-level-await to fix build

**UI hint**: yes

## Requirement Coverage

All 33 v1 requirements mapped to exactly one phase. 100% coverage.
5 infrastructure requirements (INFRA-01..05) added in Phase 7.
6 migration requirements (MIGR-01..06) added in Phase 8.

| Requirement | Phase | Description |
|-------------|-------|-------------|
| WALL-01 | 1 | Detect 1am.xyz wallet extension |
| WALL-02 | 1 | Connect wallet to Midnight Preview |
| WALL-03 | 1 | Disconnect wallet |
| WALL-04 | 1 | Wallet status and truncated address in nav |
| WALL-05 | 1 | Assemble complete provider set |
| WALL-06 | 1 | Prompt to install 1am.xyz |
| WALL-07 | 1 | Auto-reconnect on page refresh |
| PAGE-04 | 1 | shadcn/ui dark theme |
| PAGE-06 | 1 | Responsive mobile layout |
| CONT-01 | 2 | Poll creation contract |
| CONT-02 | 2 | Vote casting contract |
| CONT-03 | 2 | Contract compilation pipeline |
| CONT-04 | 2 | ZK keys served from public folder |
| DATA-01 | 3 | Read from Midnight Preview indexer |
| DATA-02 | 3 | GraphQL client configured |
| DATA-03 | 3 | API routes for indexer and artifacts |
| DATA-04 | 3 | Optimistic vote tally updates |
| POLL-01 | 4 | Create public poll on-chain |
| POLL-03 | 4 | Vote on public poll on-chain |
| POLL-04 | 4 | View poll details with live tallies |
| POLL-07 | 4 | Poll expiration |
| PAGE-01 | 4 | Home / Trending Polls page |
| PAGE-02 | 4 | Create Poll page |
| PAGE-03 | 4 | Poll Detail / Voting page |
| POLL-02 | 5 | Create invite-only poll on-chain |
| POLL-05 | 5 | Vote on invite-only poll with ZK code verification |
| POLL-06 | 5 | Generate and manage invite codes off-chain |
| CONT-05 | 5 | ZK proof of valid invite code in contract |
| CONT-06 | 5 | Prevent duplicate wallet votes |
| ZKPR-01 | 6 | Client-side ZK participation proof |
| ZKPR-02 | 6 | Third-party proof verification |
| ZKPR-03 | 6 | Share proof via link or badge |
| PAGE-05 | 6 | Stats / Analytics page |
| INFRA-01 | 7 | Poll metadata persists across Vercel serverless cold starts |
| INFRA-02 | 7 | GET /api/polls/metadata?pollId returns correct data from any instance |
| INFRA-03 | 7 | GET /api/polls/metadata (no pollId) returns all polls metadata |
| INFRA-04 | 7 | POST /api/polls/metadata is idempotent (upsert) |
| INFRA-05 | 7 | App deploys on Vercel with DATABASE_URL env var |
| MIGR-01 | 8 | Midnight SDK WASM modules load via static imports without stubs |
| MIGR-02 | 8 | All 9 routes work under React Router (including dynamic /poll/:id) |
| MIGR-03 | 8 | Metadata API serves via Bun.serve() |
| MIGR-04 | 8 | Production build succeeds with Vite |
| MIGR-05 | 8 | ZK proof generation works end-to-end after migration |
| MIGR-06 | 8 | SDK stub file and all Turbopack workarounds removed |

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Wallet & UI Foundation | 3/3 | Complete   | 2026-04-08 |
| 2. Smart Contracts | 2/2 | Complete   | 2026-04-08 |
| 3. Data Layer | 2/2 | Complete   | 2026-04-08 |
| 4. Core Polling | 3/3 | Complete | 2026-04-08 |
| 5. Invite-Only Polls | 3/3 | Complete | 2026-04-08 |
| 6. ZK Proofs & Analytics | 2/2 | Complete   | 2026-04-08 |
| 7. Persistent Data Layer | 0/1 | Pending | — |
| 8. Vite Migration | 4/4 | Complete | 2026-04-09 |

### Phase 9: Fix Core Integration Gaps
**Goal**: All state-changing operations (poll creation, vote casting, invite code submission) execute as real on-chain transactions via the browser's Midnight wallet, and poll detail pages are readable by unauthenticated visitors
**Depends on**: Phase 8
**Requirements**: POLL-01, POLL-02, POLL-03, POLL-04, POLL-06, INFRA-01, INFRA-02, INFRA-03, INFRA-04
**Plans:** 2 plans

Plans:
- [ ] 09-01-PLAN.md — Restore direct contract service calls in use-create-poll.ts and use-vote-mutation.ts (remove phantom fetch routes)
- [ ] 09-02-PLAN.md — Fix usePoll() unauthenticated access + add ?id= filter to polls-handler + verify Phase 7 Neon Postgres layer
