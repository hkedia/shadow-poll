# Shadow Poll

## What This Is

An anonymous polling application built on the Midnight blockchain. Users connect the 1am.xyz wallet on the Preview network to create polls, cast votes, and generate zero-knowledge proofs of participation — all through confidential smart contracts. The app stores no personally identifiable information; all state-changing actions happen on-chain with rational privacy and selective disclosure.

## Core Value

Users can vote on polls anonymously with cryptographic guarantees — no one can link a voter to their chosen option, but anyone can verify a vote was legitimately cast.

## Requirements

### Validated

- ✓ shadcn/ui with Aether Privacy dark design tokens, glass-blur app shell — v1.0
- ✓ 1am.xyz wallet detection, connection, and provider factory — v1.0
- ✓ Auto-reconnect on page refresh — v1.0
- ✓ Compact smart contract for poll creation (title, description, options, type) — v1.0
- ✓ Compact smart contract for vote casting (public polls) — v1.0
- ✓ Compact contract compilation pipeline in /contracts — v1.0
- ✓ ZK proving/verifying keys served from public folder — v1.0
- ✓ Invite-only poll votes verified via ZK proof of valid invite code — v1.0
- ✓ Contract prevents same wallet from voting twice — v1.0
- ✓ Public poll creation via on-chain transaction — v1.0
- ✓ Invite-only poll creation with off-chain invite code generation — v1.0
- ✓ Vote casting via on-chain transaction (public polls) — v1.0
- ✓ Vote casting with invite code via on-chain transaction — v1.0
- ✓ Client-side ZK proof generation for participation verification — v1.0
- ✓ Third parties can verify a participation proof — v1.0
- ✓ Proof sharing via link or visual badge — v1.0
- ✓ Poll data reading via Midnight Preview public indexer GraphQL — v1.0
- ✓ GraphQL client configured for indexer queries — v1.0
- ✓ Thin API routes proxy indexer queries and serve static artifacts — v1.0
- ✓ Vote tallies update optimistically before on-chain confirmation — v1.0
- ✓ Home / Trending Polls page with live data — v1.0
- ✓ Create Poll page with toggle between Public and Invite-Only — v1.0
- ✓ Poll Detail / Voting page (/poll/[id]) with live vote tallies — v1.0
- ✓ Stats / Analytics page with global analytics — v1.0
- ✓ Dark theme UI with shadcn/ui components — v1.0
- ✓ Wallet connection controls in navigation with status and truncated address — v1.0
- ✓ Poll expiration (block-number-based) — v1.0
- ✓ Neon serverless Postgres for poll metadata persistence — v1.0
- ✓ Vite + React Router + Bun.serve() migration — v1.0
- ✓ Hono API framework migration — v1.0
- ✓ Docker containerization — v1.0
- ✓ Comprehensive test coverage with Vitest and testkit-js — v1.0

### Active

_(No active requirements — v1.0 shipped complete. Next milestone TBD.)_

### Out of Scope

- User accounts or authentication beyond wallet connection — wallet IS the identity
- Server-side data storage of votes or user data — all state lives on-chain
- Mobile native app — web-first
- Multi-chain support — Midnight Preview network only
- Real-time WebSocket subscriptions — polling/refetch is sufficient for v1
- Admin dashboard or moderation tools — decentralized, no central authority
- Token economics or incentive mechanisms beyond poll-creation fee
- Mainnet deployment — Preview network (testnet) only for v1

## Context

**Blockchain Platform:** Midnight is a data-protection blockchain that uses zero-knowledge proofs for confidential transactions. The Preview network (testnet) is the target deployment environment.

**Wallet:** 1am.xyz is the browser extension wallet for Midnight. It exposes `window.midnight['1am']` and provides transaction signing, balance unsealing, and proof generation capabilities.

**Smart Contracts:** Written in Compact, Midnight's domain-specific language for confidential smart contracts. Compiled to WASM artifacts that get served from the app's public folder.

**Indexer:** The Midnight public indexer provides a GraphQL endpoint for reading on-chain state (poll data, vote tallies) without requiring users to run their own node.

**Provider Architecture:** The Midnight JS SDK requires assembling a provider set: ZK config provider (serves proving/verifying keys), indexer data provider, wallet provider (for transaction signing), and proof provider (for ZK proof generation). These are composed into a single Midnight provider for contract interactions.

**Tech Stack:** React 19 + React Router 7 + TanStack Query, bundled by Vite 8. Styling with Tailwind CSS 4 and shadcn/ui. API via Hono on Bun. Database via Neon Postgres (serverless). Blockchain via Midnight SDK (compact-js, ledger-v8, midnight-js-contracts).

**Shipped v1.0:** ~88 TypeScript/TSX files, 13 phases, 31 plans, 206 commits. Timeline: 2026-04-08 to 2026-04-10.

## Constraints

- **Blockchain:** All state-changing operations (create poll, cast vote) must go through Midnight confidential smart contracts — no off-chain state mutations
- **Privacy:** Zero personally identifiable information stored server-side or in any database
- **Wallet:** 1am.xyz is the only supported wallet; must handle detection, connection, and disconnection gracefully
- **Network:** Midnight Preview (testnet) only — no mainnet considerations for v1
- **Contract Language:** Compact (Midnight's DSL) for smart contracts — cannot use Solidity or other contract languages
- **Runtime:** Bun as package manager and runtime
- **Client-side Proving:** ZK proofs generated in the user's browser via the Midnight SDK — no server-side proving

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Keep Next.js 16 (not downgrade to 15) | Already installed, newer features available | ✓ Validated — Later migrated to Vite |
| Off-chain invite codes with ZK verification | Simpler UX than on-chain code generation; privacy preserved via ZK proof at vote time | ✓ Validated — Works well |
| Client-side ZK proof generation | Keeps proving trust-minimized; no server involvement in proof creation | ✓ Validated |
| Public Midnight Preview indexer for data | No need to run own indexer infrastructure for testnet | ✓ Validated |
| Global analytics only (no per-user dashboard) | Consistent with privacy-first design; per-user tracking would require identity correlation | ✓ Validated |
| shadcn/ui with dark theme | Modern component library, good DX, matches crypto/privacy app aesthetic | ✓ Validated |
| Vite + React Router + Bun.serve() | Next.js Turbopack incompatible with Midnight SDK WASM loading | ✓ Validated — Resolved WASM issues |
| Hono for API layer | Structured routing, built-in middleware, type-safe request handling | ✓ Validated — Better DX than raw Bun.serve() |
| Neon serverless Postgres | HTTP-based driver, no persistent connections, ideal for serverless | ✓ Validated |
| Docker containerization | Reproducible deployments, local testing | ✓ Validated |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-10 after v1.0 milestone*
