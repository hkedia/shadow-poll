---
phase: 03-data-layer
plan: 01
subsystem: api
tags: [midnight-sdk, graphql, indexer, provider, metadata, api-route]

requires:
  - phase: 01-wallet-ui-foundation
    provides: WalletProvider, assembleProviders, MidnightProviderSet types
  - phase: 02-smart-contracts
    provides: Compiled contract types (Ledger, PollData, PollType), ZK keys in public/
provides:
  - Tightened provider types (IndexerPublicDataProvider, ZkConfigProvider)
  - Real SDK indexer provider creation via dynamic import
  - Ledger read utilities (readPoll, readTallies, readPollCount, deriveTallyKey)
  - Off-chain metadata storage API route (/api/polls/metadata)
  - Contract type re-exports (lib/midnight/contract-types.ts)
affects: [03-data-layer plan 02, 04-core-polling, 05-invite-only-polls]

tech-stack:
  added: []
  patterns: [dynamic SDK import, structural typing for Turbopack-stubbed packages, in-memory metadata store]

key-files:
  created:
    - lib/midnight/indexer.ts
    - lib/midnight/contract-types.ts
    - lib/midnight/ledger-utils.ts
    - lib/midnight/metadata-store.ts
    - app/api/polls/metadata/route.ts
  modified:
    - lib/midnight/types.ts
    - lib/midnight/providers.ts

key-decisions:
  - "D-30: Off-chain metadata API route with SHA-256 hash verification"
  - "D-33: Partial provider type tightening — indexer + ZK typed, wallet + proof stay any until Phase 4"
  - "Structural types for IndexerPublicDataProvider and ZkConfigProvider to avoid Turbopack import issues"
  - "Cast through unknown when assigning SDK PublicDataProvider to structural IndexerPublicDataProvider"
  - "persistentHash from compact-runtime used for tally key derivation via dynamic import"

patterns-established:
  - "Dynamic SDK import pattern: always import @midnight-ntwrk packages via dynamic import() in client code"
  - "Structural typing: define interfaces matching SDK shapes without importing SDK types at module level"
  - "Metadata integrity: off-chain metadata always verified against on-chain metadata_hash via SHA-256"
  - "Ledger utilities: typed wrapper functions over raw ledger state from parseLedger()"

requirements-completed: [DATA-01, DATA-02, DATA-03]

duration: 15min
completed: 2026-04-08
---

# Plan 03-01: SDK Provider Wiring + Ledger Utilities + Metadata API Summary

**Real SDK indexer provider, typed ledger read utilities, and off-chain metadata API route with hash verification**

## Performance

- **Duration:** ~15 min
- **Tasks:** 3
- **Files created:** 5
- **Files modified:** 2

## Accomplishments
- Tightened MidnightProviderSet with structural IndexerPublicDataProvider and ZkConfigProvider interfaces
- assembleProviders() now creates real SDK indexer via dynamic import + simple ZK config URI resolver
- Ledger utilities read polls, tallies, and poll count from parsed contract state using SDK's persistentHash
- Metadata API route at /api/polls/metadata stores and retrieves off-chain poll metadata with hash integrity verification

## Files Created/Modified
- `lib/midnight/types.ts` — Added IndexerPublicDataProvider, ZkConfigProvider interfaces; tightened MidnightProviderSet
- `lib/midnight/providers.ts` — Replaced placeholder config objects with real SDK provider factory calls
- `lib/midnight/indexer.ts` — createIndexerProvider (dynamic SDK import) + createZkConfigProvider (URI resolver)
- `lib/midnight/contract-types.ts` — Re-exports PollData, PollType, Ledger from generated contract
- `lib/midnight/ledger-utils.ts` — readPoll, readTallies, readPollCount, deriveTallyKey, byte conversion helpers
- `lib/midnight/metadata-store.ts` — PollMetadata types, computeMetadataHash, validateMetadataHash, validatePollMetadata
- `app/api/polls/metadata/route.ts` — GET/POST handlers with in-memory Map store

## Decisions Made
- Used structural types (not direct SDK type imports) for IndexerPublicDataProvider and ZkConfigProvider because Turbopack stubs all @midnight-ntwrk packages at build time
- Cast SDK PublicDataProvider through `unknown` to our structural type since the SDK type has no index signature
- Used compact-runtime's persistentHash + CompactTypeVector/CompactTypeBytes for tally key derivation to match contract behavior exactly
- Used BigInt() constructor instead of bigint literals (0n) to stay compatible with ES2017 target in tsconfig

## Deviations from Plan
- Plan suggested persistentHash from @midnight-ntwrk/compact-js but it's actually in @midnight-ntwrk/compact-runtime — used correct import
- Plan suggested a default export fallback for the indexer provider factory — SDK only has named export, removed fallback

## Issues Encountered
- BigInt literal syntax (0n) not available with ES2017 target — used BigInt() constructor form instead

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- Ledger utilities and metadata API ready for TanStack Query hooks (Plan 03-02)
- Provider types are correct for Phase 4 contract interactions

---
*Phase: 03-data-layer*
*Completed: 2026-04-08*
