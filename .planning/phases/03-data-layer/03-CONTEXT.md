# Phase 3: Data Layer — Context

## Phase Goal
The app can read on-chain poll data from the Midnight Preview indexer through configured GraphQL and API routes.

## Requirements
- DATA-01: Read poll data from Midnight Preview indexer GraphQL endpoint
- DATA-02: GraphQL client configured for indexer queries
- DATA-03: API routes that proxy indexer queries and serve static contract artifacts
- DATA-04: Optimistic vote tally updates before on-chain confirmation

## Success Criteria
1. GraphQL client can query the Midnight Preview public indexer for poll data
2. API routes proxy indexer queries and serve contract artifacts
3. Vote tallies update optimistically in the UI before on-chain confirmation

## Architectural Decisions

### D-30: Off-chain Metadata API Route
**Decision:** Store poll metadata (title, description, option labels) via a thin Next.js API route at `/api/polls/metadata`. After poll creation, the client POSTs metadata keyed by poll ID. Any user can GET metadata by poll ID. The on-chain contract stores only `metadata_hash` for integrity verification.

**Rationale:** The Compact contract only stores `metadata_hash` — not the actual text. An off-chain store is the simplest mechanism for other users to discover poll titles and options. The hash provides tamper-proofing: clients can verify the off-chain metadata matches the on-chain hash.

### D-31: Hybrid API Architecture
**Decision:** Use the Midnight SDK's `indexerPublicDataProvider` directly from the client for ledger state reads (poll data, tallies). Use thin Next.js API routes only for:
- Metadata storage/retrieval (`/api/polls/metadata`)
- Any indexer queries that are complex or need server-side processing

**Rationale:** The SDK provider is the canonical approach for reading Midnight ledger state. Wrapping it in API routes adds unnecessary indirection. API routes are reserved for off-chain concerns (metadata) and complex queries.

### D-32: TanStack Query for Data Fetching
**Decision:** Use TanStack Query (React Query) for all data fetching, caching, and optimistic updates. This includes indexer reads and metadata API calls.

**Rationale:** TanStack Query provides built-in optimistic mutation support, automatic cache invalidation, background refetching, and stale-while-revalidate patterns — all needed for live poll tallies and responsive vote UX. More capable than bare `useOptimistic` for a data-fetching-heavy phase.

### D-33: Provider Type Tightening (Partial)
**Decision:** Tighten `MidnightProviderSet` types for indexer and ZK config providers using `@midnight-ntwrk/midnight-js-types`. Leave wallet and proof server providers as-is until Phase 4 when circuits are called.

## Integration Points From Prior Phases

### From Phase 1 (Wallet & UI)
- `lib/midnight/providers.ts` — `assembleProviders()` has placeholder config for `zkConfigProvider` and `indexerPublicDataProvider` (commented "replaced in Phase 3")
- `lib/midnight/types.ts` — `MidnightProviderSet` has `any` types (commented "tightened in Phase 3")
- Wallet's `enabledApi.getConfiguration()` returns `indexerUri`, `indexerWsUri`, `proverServerUri`, `networkId`

### From Phase 2 (Smart Contracts)
- `contracts/managed/contract/index.d.ts` — TypeScript types for `Ledger`, `PollData`, `Contract`, `Witnesses`, `Circuits`
- Flat tally map: `tallies: Map<Bytes<32>, Counter>` with composite key `hash(poll_id, option_index_as_bytes)`
- `metadata_hash` only — actual metadata NOT on-chain
- ZK keys served from `public/zk-keys/` with CORS headers

## Plan Structure
- **Plan 1:** Wire SDK indexer provider, tighten provider types, create ledger read utilities, implement metadata storage API route
- **Plan 2:** TanStack Query integration, data hooks for polls/tallies, optimistic vote updates, metadata fetching
