---
phase: quick/260410-ars-make-poll-page-show-live-results-vote-co
plan: 01
subsystem: frontend
tags: [poll-detail, wallet-free, usePoll, live-results, block-height]
dependency_graph:
  requires: [usePoll hook, /api/polls endpoint, /api/indexer/block endpoint]
  provides: [wallet-free poll viewing, currentBlockHeight from server API]
  affects: [src/routes/poll-detail.tsx, lib/queries/use-poll.ts]
tech_stack:
  added: []
  patterns: [unauthenticated API path for tallies, server-sourced block height]
key_files:
  created: []
  modified:
    - lib/queries/use-poll.ts
    - src/routes/poll-detail.tsx
decisions:
  - D-ARS-01: talliesQuery enabled without wallet; fetches from /api/polls?id= when unauthenticated
  - D-ARS-02: currentBlockHeight comes from /api/indexer/block via useQuery (30s refresh), not wallet-dependent getCurrentBlockNumber
  - D-ARS-03: WalletOnboarding overlay removed entirely — page is viewable without wallet
metrics:
  duration: 6min
  completed: "2026-04-10"
  tasks: 2
  files: 2
---

# Quick Task 260410-ars: Make Poll Page Show Live Results & Vote Counts Without Wallet

Removed wallet gate from poll detail page so all public on-chain data (poll info, live results, vote counts, expiration) is viewable without connecting a wallet. Wallet connection is only required for casting votes and viewing participation proofs.

## Deviations from Plan

None — plan executed exactly as written.

## Changes Summary

### Task 1: Make usePoll hook serve tallies and block height without wallet
- Added `SinglePollApiResponse` interface with `currentBlockHeight` and `tallies` fields
- Added `blockQuery` using TanStack Query to fetch block height from `/api/indexer/block` (30s refresh interval)
- Removed wallet gate from `talliesQuery` — `enabled: !!pollId` instead of `isConnected && !!pollId`
- Added unauthenticated tallies path: fetches `/api/polls?id=XXX` and parses `{ counts, total }` string arrays into `PollTallies` with `BigInt()` conversion
- Authenticated path preserved: uses `fetchPollWithTallies` for freshest data
- Added `currentBlockHeight` to return type

### Task 2: Remove wallet gate from poll detail page
- Removed `WalletOnboarding requiresWallet` from all 4 render states (loading, error, not-found, success)
- Removed `useEffect`/`useState` for `currentBlock` tracking
- Removed `getCurrentBlockNumber` import
- Removed `providers` from destructuring (only `status` needed for `isConnected`)
- Derived `currentBlock` from `currentBlockHeight` returned by `usePoll`
- Page now renders fully without wallet — only VotePanel and ProofPanel require connection

## Commits

| # | Commit | Description | Files |
|---|--------|-------------|-------|
| 1 | 954bb24 | make usePoll serve tallies and block height without wallet | lib/queries/use-poll.ts |
| 2 | 2ff00d7 | remove wallet gate from poll detail page | src/routes/poll-detail.tsx |

## Verification

- `bun run build` passes with no new errors
- `grep -c "WalletOnboarding" src/routes/poll-detail.tsx` = 0
- `grep -c "getCurrentBlockNumber" src/routes/poll-detail.tsx` = 0
- `grep -c "currentBlockHeight" lib/queries/use-poll.ts` = 3 (interface + query + return)
- `grep -c "currentBlockHeight" src/routes/poll-detail.tsx` = 2 (destructuring + derivation)

## Self-Check: PASSED

- FOUND: lib/queries/use-poll.ts
- FOUND: src/routes/poll-detail.tsx
- FOUND: commit 954bb24
- FOUND: commit 2ff00d7