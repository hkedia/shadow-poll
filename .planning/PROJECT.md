# Shadow Poll

## What This Is

An anonymous polling application built on the Midnight blockchain. Users connect the 1am.xyz wallet on the Preview network to create polls, cast votes, and generate zero-knowledge proofs of participation — all through confidential smart contracts. The app stores no personally identifiable information; all state-changing actions happen on-chain with rational privacy and selective disclosure.

## Core Value

Users can vote on polls anonymously with cryptographic guarantees — no one can link a voter to their chosen option, but anyone can verify a vote was legitimately cast.

## Requirements

### Validated

- ✓ Next.js 16 App Router scaffold with TypeScript — existing
- ✓ Tailwind CSS v4 styling pipeline — existing
- ✓ Midnight Network SDK packages installed — existing
- ✓ GraphQL dependencies installed (graphql + graphql-yoga) — existing
- ✓ ESLint with Next.js config — existing
- ✓ Bun package manager configured — existing

### Active

- [ ] 1am.xyz wallet detection, connection, and provider factory
- [ ] Reusable useMidnightWallet hook/context with status, address, providers
- [ ] Compact smart contract for poll creation (title, description, options, type)
- [ ] Compact smart contract for vote casting (with optional invite code verification)
- [ ] Contract compilation pipeline in /contracts
- [ ] Public poll creation via on-chain transaction
- [ ] Invite-only poll creation with off-chain invite code generation + ZK verification
- [ ] Vote casting via on-chain transaction (public polls)
- [ ] Vote casting with invite code via on-chain transaction (invite-only polls)
- [ ] Client-side ZK proof generation for participation verification
- [ ] Poll data reading via Midnight Preview public indexer GraphQL endpoint
- [ ] Home / Trending Polls page with live data
- [ ] Create Poll page with toggle between Public and Invite-Only
- [ ] Poll Detail / Voting page (/poll/[id]) with live vote tallies
- [ ] Stats / Analytics page with global analytics (aggregate counts, trends, participation)
- [ ] Dark theme UI with shadcn/ui components
- [ ] Wallet connection controls in navigation with status and truncated address
- [ ] Thin API routes for indexer queries and serving static contract artifacts

### Out of Scope

- User accounts or authentication beyond wallet connection — wallet IS the identity
- Server-side data storage of votes or user data — all state lives on-chain
- Mobile native app — web-first
- Multi-chain support — Midnight Preview network only
- Real-time WebSocket subscriptions — polling/refetch is sufficient for v1
- Admin dashboard or moderation tools — decentralized, no central authority
- Token economics or incentive mechanisms — pure polling utility

## Context

**Blockchain Platform:** Midnight is a data-protection blockchain that uses zero-knowledge proofs for confidential transactions. The Preview network (testnet) is the target deployment environment.

**Wallet:** 1am.xyz is the browser extension wallet for Midnight. It exposes `window.midnight['1am']` and provides transaction signing, balance unsealing, and proof generation capabilities.

**Smart Contracts:** Written in Compact, Midnight's domain-specific language for confidential smart contracts. Compiled to WASM artifacts that get served from the app's public folder.

**Indexer:** The Midnight public indexer provides a GraphQL endpoint for reading on-chain state (poll data, vote tallies) without requiring users to run their own node.

**Provider Architecture:** The Midnight JS SDK requires assembling a provider set: ZK config provider (serves proving/verifying keys), indexer data provider, wallet provider (for transaction signing), and proof provider (for ZK proof generation). These are composed into a single Midnight provider for contract interactions.

**Prior Art:** This is a greenfield application on the scaffold. No business logic exists yet — only the Next.js 16 scaffold with dependencies installed.

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
| Keep Next.js 16 (not downgrade to 15) | Already installed, newer features available | — Pending |
| Off-chain invite codes with ZK verification | Simpler UX than on-chain code generation; privacy preserved via ZK proof at vote time | — Pending |
| Client-side ZK proof generation | Keeps proving trust-minimized; no server involvement in proof creation | — Pending |
| Public Midnight Preview indexer for data | No need to run own indexer infrastructure for testnet | — Pending |
| Global analytics only (no per-user dashboard) | Consistent with privacy-first design; per-user tracking would require identity correlation | — Pending |
| shadcn/ui with dark theme | Modern component library, good DX, matches crypto/privacy app aesthetic | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-08 after initialization*
