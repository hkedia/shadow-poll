# External Integrations

**Analysis Date:** 2026-04-09 (post Vite migration)

## APIs & External Services

**Midnight Network (Blockchain):**
- Midnight Network — Privacy-focused blockchain for smart contract execution
  - SDK/Client: `@midnight-ntwrk/midnight-js-contracts` (v4.0.4)
  - Smart Contract Language: Compact (via `@midnight-ntwrk/compact-js` v2.5.0)
  - Ledger: `@midnight-ntwrk/ledger-v8` (v8.0.3) — WASM-based ledger bindings
  - Network Config: `@midnight-ntwrk/midnight-js-network-id` (v4.0.4)
  - ZK Proofs: `@midnight-ntwrk/midnight-js-fetch-zk-config-provider` (v4.0.4) — Retrieves proving/verifying keys
  - Indexer: `@midnight-ntwrk/midnight-js-indexer-public-data-provider` (v4.0.4) — Public data via Pub-sub indexer
  - Auth: Via 1am.xyz wallet extension (browser-based)

**GraphQL (Indexer Queries):**
- `graphql` (v16.13.2) + `graphql-yoga` (v5.21.0) — Used for Midnight indexer queries

**Fonts:**
- Manrope + Plus Jakarta Sans loaded via `@fontsource` packages (self-hosted, no external calls)
- Material Symbols Outlined via Google Fonts CDN

## Data Storage

**Databases:**
- Neon Postgres (serverless) via `@neondatabase/serverless` — HTTP-based driver
  - Connection: `DATABASE_URL` environment variable
  - Schema: Single `polls_metadata` table (poll_id, title, description, options, metadata_hash, created_at)
  - Migrations: Lazy via `runMigrations()` with `CREATE TABLE IF NOT EXISTS`

**File Storage:**
- Local filesystem only (`public/` directory for static assets and ZK keys)

**Caching:**
- TanStack React Query client-side caching with configurable stale times

## Authentication & Identity

**Auth Provider:**
- 1am.xyz wallet browser extension — Midnight Network wallet
  - Detection: Checks for `window.midnight` in browser
  - Connection: SDK-based wallet connection flow
  - Identity: Wallet address used as user identifier (no PII stored)

## Monitoring & Observability

**Error Tracking:**
- None configured

**Logs:**
- Console only — no structured logging framework

## CI/CD & Deployment

**Hosting:**
- No specific hosting configured for v1
- Production server: `bun run serve` (Bun.serve() in `server.ts`)

**CI Pipeline:**
- None configured — no `.github/workflows/` or CI config files

## Environment Configuration

**Required env vars (client-side, `VITE_*` prefix):**
- `VITE_POLL_CONTRACT_ADDRESS` — Deployed poll manager contract address
- `VITE_INDEXER_URL` — Midnight Pub-sub indexer endpoint
- `VITE_NODE_URL` — Midnight node endpoint
- `VITE_PROOF_SERVER_URL` — ZK proof server endpoint

**Required env vars (server-side):**
- `DATABASE_URL` — Neon Postgres connection string

**Secrets location:**
- `.env*` files (gitignored)

## Integration Architecture

1. **Frontend**: Vite SPA with React 19 + React Router 7 for the polling UI
2. **Smart Contracts**: Compact language contracts executed via `@midnight-ntwrk/compact-js` for privacy-preserving poll logic
3. **Blockchain Indexing**: `@midnight-ntwrk/midnight-js-indexer-public-data-provider` for reading on-chain poll data via GraphQL
4. **ZK Proofs**: Client-side proof generation via WASM modules, keys fetched from `/zk-keys/`
5. **Metadata Storage**: Neon Postgres for off-chain poll metadata, verified by on-chain commitment hash
6. **Production Server**: Bun.serve() handles API routes, static files, and SPA fallback

---

*Integration audit: 2026-04-09*
