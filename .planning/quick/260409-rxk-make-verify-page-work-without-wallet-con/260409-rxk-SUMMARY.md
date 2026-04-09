---
phase: quick
plan: 260409-rxk
type: execute
subsystem: verify-page
tags: [wallet-free-verification, api-endpoint, nullifier-check]
dependency_graph:
  requires: []
  provides: [GET /api/indexer/verify-nullifier, wallet-free verify page]
  affects: [verify-page, indexer-api]
tech_stack:
  added: [indexerPublicDataProvider (server-side)]
  patterns: [server-side nullifier verification via fetch]
key_files:
  created: []
  modified:
    - lib/api/indexer-handler.ts
    - lib/queries/use-verify-proof.ts
    - src/routes/verify.tsx
decisions:
  - D-62 updated: verify page no longer requires wallet — server-side indexer API checks nullifiers
metrics:
  duration: 237s
  completed: 2026-04-09
---

# Quick Task 260409-rxk: Make Verify Page Work Without Wallet Connection Summary

Server-side nullifier verification endpoint eliminates wallet gate from /verify page — anyone with a link can verify proof of participation.

## Changes

### Task 1: Add verify-nullifier endpoint (4143351)
- Added `GET /api/indexer/verify-nullifier?nullifier=<hex>` to `lib/api/indexer-handler.ts`
- Queries indexer directly via `indexerPublicDataProvider`, parses ledger, checks `vote_nullifiers.member()`
- Validates nullifier as 64-char hex regex (T-quick-01 mitigation)
- Returns `{ nullifier, found: boolean }` — no wallet required
- 400 for missing/invalid nullifier, 503 for indexer errors, 500 for unexpected errors
- Falls back to `{ found: false }` if contract not deployed yet (not an error)

### Task 2: Rewrite useVerifyProof + remove wallet gate (6b7a3a6)
- Rewrote `useVerifyProof` hook to use TanStack Query with simple `fetch()` to the new endpoint
- Removed all wallet imports: `useWalletContext`, `createIndexerProvider`, `getContractAddress`, `hexToBytes`, `parseLedger`
- `needsWallet` is now typed as `false` constant — maintained for backward compatibility but always false
- Removed wallet connection UI block ("Connect Wallet to Verify") from `verify.tsx`
- Removed `useWalletContext` import from `verify.tsx`
- Destructured only needed fields: `isValid, isLoading, isError, error, refetch`

## Deviations from Plan

None — plan executed exactly as written.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: tampering | lib/api/indexer-handler.ts | T-quick-01 mitigated: nullifier param validated as 64-char hex before processing |

## Self-Check: PASSED

- `lib/api/indexer-handler.ts` — EXISTS (modified, route + handler added)
- `lib/queries/use-verify-proof.ts` — EXISTS (rewritten, no wallet deps)
- `src/routes/verify.tsx` — EXISTS (wallet gate removed)
- Commit `4143351` — FOUND
- Commit `6b7a3a6` — FOUND