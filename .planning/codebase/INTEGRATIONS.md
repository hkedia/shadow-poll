# External Integrations

**Analysis Date:** 2026-04-08

## APIs & External Services

**Midnight Network (Blockchain):**
- Midnight Network - Privacy-focused blockchain for smart contract execution
  - SDK/Client: `@midnight-ntwrk/midnight-js-contracts` (v4.0.4)
  - Smart Contract Language: Compact (via `@midnight-ntwrk/compact-js` v2.5.0)
  - Ledger: `@midnight-ntwrk/ledger-v8` (v8.0.3) - WASM-based ledger bindings
  - Network Config: `@midnight-ntwrk/midnight-js-network-id` (v4.0.4)
  - ZK Proofs: `@midnight-ntwrk/midnight-js-fetch-zk-config-provider` (v4.0.4) - Retrieves proving/verifying keys
  - Indexer: `@midnight-ntwrk/midnight-js-indexer-public-data-provider` (v4.0.4) - Public data via Pub-sub indexer
  - Auth: Not yet configured (no env vars detected)

**GraphQL:**
- `graphql` (v16.13.2) + `graphql-yoga` (v5.21.0) - GraphQL server framework
  - Likely intended for building a GraphQL API layer within Next.js API routes
  - No GraphQL schema or resolvers implemented yet

**Google Fonts:**
- Geist and Geist_Mono fonts loaded via `next/font/google` in `app/layout.tsx`
  - Self-hosted at build time by Next.js (no runtime external calls)

## Data Storage

**Databases:**
- None configured. No ORM, database driver, or database connection detected.

**File Storage:**
- Local filesystem only (`public/` directory for static SVG assets)

**Caching:**
- None configured beyond Next.js built-in caching

## Authentication & Identity

**Auth Provider:**
- None configured. No auth library or provider detected.
- Midnight Network may provide identity/privacy features via ZK proofs (not yet implemented)

## Monitoring & Observability

**Error Tracking:**
- None configured

**Logs:**
- No logging framework detected. Console only.

## CI/CD & Deployment

**Hosting:**
- Vercel (inferred from `.vercel` in `.gitignore` and Vercel links in scaffold `app/page.tsx`)
- No `vercel.json` configuration file present

**CI Pipeline:**
- None configured. No `.github/workflows/`, no CI config files detected.

## Environment Configuration

**Required env vars:**
- None currently referenced in source code
- `.env*` files are gitignored
- No `.env.example` or `.env.local.example` file exists

**Secrets location:**
- Not yet configured. Will likely need environment variables for:
  - Midnight Network RPC/indexer endpoints
  - ZK proof provider configuration
  - Any future database connection strings

## Webhooks & Callbacks

**Incoming:**
- None configured

**Outgoing:**
- None configured

## Integration Architecture Notes

This project is in an early scaffold stage. The Midnight Network SDK packages are installed as dependencies but have not yet been imported or used in any source files. The intended architecture appears to be:

1. **Frontend**: Next.js App Router with React 19 for the polling UI
2. **Smart Contracts**: Compact language contracts executed via `@midnight-ntwrk/compact-js` for privacy-preserving poll logic
3. **GraphQL API**: `graphql-yoga` for building a GraphQL API layer (likely as Next.js route handlers)
4. **Blockchain Indexing**: `@midnight-ntwrk/midnight-js-indexer-public-data-provider` for reading on-chain poll data
5. **ZK Proofs**: `@midnight-ntwrk/midnight-js-fetch-zk-config-provider` for zero-knowledge proof generation/verification

The Midnight Network SDK includes transitive dependencies installed in `node_modules/@midnight-ntwrk/`:
- `compact-runtime` - Runtime for Compact smart contract execution
- `onchain-runtime-v3` - On-chain runtime support
- `platform-js` - Platform abstractions
- `midnight-js-utils` - Shared utilities

---

*Integration audit: 2026-04-08*
