# Milestone 1: Shadow Poll v1.0 Complete

**Status:** ✓ COMPLETED  
**Completed:** 2026-04-10  
**Duration:** 2026-04-07 → 2026-04-10 (4 days)  

---

## Summary

Shadow Poll milestone 1 delivers a fully functional anonymous polling dApp on Midnight Preview blockchain. Users can create public or invite-only polls, cast votes with cryptographic privacy guarantees, and generate ZK proofs of participation — all without revealing their identity.

**One-liner:** Anonymous blockchain polling with invite codes, ZK proofs, and 1am.xyz wallet integration

---

## Key Accomplishments

### Midnight Blockchain Integration
- **1am.xyz wallet** connection, detection, and session persistence via `@midnight-ntwrk/midnight-js-contracts`
- **Confidential smart contracts** written in Compact language for poll creation, voting, and invite code verification
- **ZK proof generation** in-browser via Midnight SDK for anonymous vote verification
- **Preview network** deployment with on-chain state via `Bun.serve()`

### Confidential Smart Contracts (Compact)
- `create_poll` circuit — creates polls with title, options, type, expiration
- `cast_vote` circuit — public vote casting with nullifier-based duplicate prevention
- `cast_invite_vote` circuit — invite-only voting with ZK-verified invite codes
- `add_invite_codes` circuit — batch invite code management
- Compiled WASM artifacts and ZK proving/verifying keys served from `/zk-keys/`

### Invite-Only Polls with ZK Privacy
- Off-chain invite code generation and storage (SHA-256 normalized)
- ZK proof verifies code validity without revealing the code on-chain
- Nullifier-based duplicate vote prevention — one vote per wallet per poll
- Case-insensitive codes with uppercase normalization

### Off-Chain Metadata Storage
- **Neon Postgres** serverless database for poll title, description, options
- HTTP-based `@neondatabase/serverless` driver (no persistent connections)
- Lazy migration via `CREATE TABLE IF NOT EXISTS`
- Idempotent POST endpoint for metadata upsert

### Anonymous Vote Verification
- Client-side ZK proof generation showing poll participation without revealing choice
- Verification URL sharing format
- SVG badge download for visual proof
- `/verify` page reads on-chain `vote_nullifiers` directly (no wallet required)

### Full-Stack Application
- **Frontend:** React 19 + React Router 7 + TanStack Query
- **Styling:** Tailwind CSS 4 with Aether design system (dark theme, Manrope + Plus Jakarta Sans)
- **API:** Hono on Bun (`server.ts` → `Bun.serve({ fetch: app.fetch })`)
- **Bundler:** Vite 8 with `vite-plugin-wasm` for Midnight SDK WASM loading
- **Testing:** Vitest with `@midnight-ntwrk/testkit-js` simulator

---

## Phases Completed

| Phase | Name | Plans | Completed |
|-------|------|-------|-----------|
| 1 | Wallet & UI Foundation | 3/3 | 2026-04-08 |
| 2 | Smart Contracts | 2/2 | 2026-04-08 |
| 3 | Data Layer | 2/2 | 2026-04-08 |
| 4 | Core Polling | 3/3 | 2026-04-08 |
| 5 | Invite-Only Polls | 3/3 | 2026-04-08 |
| 6 | ZK Proofs & Analytics | 2/2 | 2026-04-08 |
| 8 | Vite Migration | 4/4 | 2026-04-09 |
| 9 | Fix Core Integration Gaps | 2/2 | 2026-04-09 |
| 10 | Invite Code Improvements | 1/1 | 2026-04-09 |
| 11 | Hono API Migration | 1/1 | 2026-04-09 |
| 13 | Comprehensive Testing | 6/6 | 2026-04-10 |

**Total:** 29 plans across 11 phases

---

## Test Coverage

- **167 passing tests** across contract circuits, service layer, data hooks, API routes, and UI components
- Contract circuits tested with `testkit-js` simulator
- Service layer and hooks tested with mocked TanStack Query providers
- API routes tested with Hono test client

---

## Design Decisions Preserved

| Decision | Description |
|----------|-------------|
| D-20 | Single Poll Manager contract (not factory) |
| D-21 | Public tallies, private voter identity |
| D-22 | Hash-based metadata storage on-chain |
| D-50 | Hash-list for invite code verification |
| D-51 | Nullifier-based duplicate vote prevention |
| D-52 | Separate `cast_invite_vote` circuit for invite polls |
| D-60 | Hybrid off-chain participation proof |
| D-70 | Neon serverless Postgres via HTTP driver |
| D-71 | Single `polls_metadata` table, no ORM |
| D-11-01 | Sub-routers use full paths mounted at `/` |

---

## Remaining Work (Future Milestones)

| Phase | Description | Status |
|-------|-------------|--------|
| 7 | Persistent Data Layer — Neon Postgres metadata | Not started |
| 12 | Docker Deployment — containerization + fly.io | Not started |

---

## Tech Stack Added

| Category | Added |
|----------|-------|
| **Blockchain** | `@midnight-ntwrk/compact-commitment`, `@midnight-ntwrk/midnight-js-contracts`, `@midnight-ntwrk/midnight-js-wallet`, `@midnight-ntwrk/testkit-js` |
| **Frontend** | React 19, React Router 7, TanStack Query v5, Tailwind CSS 4 |
| **API** | Hono, `@hono/node-server`, `@hono/bun-server` |
| **Database** | `@neondatabase/serverless` |
| **Build** | Vite 8, `vite-plugin-wasm` |
| **Testing** | Vitest, `@testing-library/react`, `@testing-library/jest-dom` |

---

## Files Created/Modified

Key directories:
- `contracts/src/` — Compact smart contracts
- `lib/midnight/` — Contract service, wallet provider, invite codes, ledger utilities
- `lib/api/` — Hono API route handlers
- `lib/db/` — Neon Postgres client and migrations
- `src/routes/` — React Router page components
- `tests/` — Vitest test suite with 167 tests
