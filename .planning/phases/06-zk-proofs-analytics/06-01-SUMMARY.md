---
phase: 06-zk-proofs-analytics
plan: "01"
subsystem: service-layer
tags: [zk-proofs, analytics, proof-badge, participation-proof, nullifier, statistics]
dependency_graph:
  requires:
    - lib/midnight/ledger-utils.ts
    - lib/midnight/witness-impl.ts
    - lib/midnight/contract-service.ts
    - lib/midnight/indexer.ts
    - lib/midnight/wallet-context.tsx
  provides:
    - lib/midnight/proof-badge.ts
    - lib/queries/use-participation-proof.ts
    - lib/queries/use-verify-proof.ts
    - lib/queries/use-stats.ts
  affects:
    - Plan 06-02 UI components (consumes all four artifacts)
tech_stack:
  added: []
  patterns:
    - Dynamic import for all @midnight-ntwrk/* (Turbopack constraint)
    - TanStack Query with staleTime and enabled guard
    - Nullifier-based participation proof (hash(poll_id, voter_sk))
    - Pure SVG generation with XML escaping
key_files:
  created:
    - lib/midnight/proof-badge.ts
    - lib/queries/use-participation-proof.ts
    - lib/queries/use-verify-proof.ts
    - lib/queries/use-stats.ts
  modified: []
decisions:
  - "D-60: Hybrid off-chain participation proof — nullifier-based, no new contract circuit"
  - "D-61: Dual sharing format — verification URL + client-side SVG badge download"
  - "D-62: Verify page reads on-chain vote_nullifiers map live via indexer"
  - "D-63: Global-only analytics — totalPolls, totalVotes, activePolls, public/invite split, avgVotes, mostVotedPoll"
metrics:
  duration_minutes: 3
  completed_date: "2026-04-08"
  tasks_completed: 4
  files_created: 4
  files_modified: 0
requirements: [ZKPR-01, ZKPR-02, ZKPR-03, PAGE-05]
---

# Phase 06 Plan 01: ZK Proofs & Analytics Service Layer Summary

**One-liner:** Nullifier-based participation proof hooks and SVG badge generator using on-chain `vote_nullifiers` map, plus global analytics aggregation from ledger state.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create SVG proof badge generator | 8be6336 | lib/midnight/proof-badge.ts |
| 2 | Create participation proof hook | 22121e1 | lib/queries/use-participation-proof.ts |
| 3 | Create nullifier verification hook | 76a6fb6 | lib/queries/use-verify-proof.ts |
| 4 | Create global analytics hook | 74bb7a7 | lib/queries/use-stats.ts |

## What Was Built

### `lib/midnight/proof-badge.ts`
Pure SVG badge generator using Aether design tokens. No dependencies — returns a 400×220px SVG string with participant's nullifier, poll title, and verify URL. XML-escaped to prevent injection.

### `lib/queries/use-participation-proof.ts`
`useParticipationProof(pollId)` hook that:
1. Gets voter's secret key via `getSecretKeyFromWallet(providers.walletProvider)`
2. Derives nullifier via `deriveNullifier(pollIdBytes, voterSk)` using persistentHash
3. Queries `vote_nullifiers.member(nullifierBytes)` from live contract state
4. Returns `{ hasVoted, nullifier, proofUrl, isLoading, isError, error, refetch }`

### `lib/queries/use-verify-proof.ts`
`useVerifyProof(pollId, nullifier)` hook for third-party verification. Takes URL params, checks `vote_nullifiers.member()` on-chain. No secret key needed. Returns `{ isValid, needsWallet }`.

### `lib/queries/use-stats.ts`
`useStats()` hook that fetches all polls + reads tallies from a single ledger snapshot. Aggregates 7 metrics: totalPolls, totalVotes, activePolls, publicPolls, inviteOnlyPolls, avgVotesPerPoll, mostVotedPoll. 60s staleTime.

## Decisions Made

- **D-60:** Hybrid off-chain participation proof — nullifier-based, no new Compact circuit required
- **D-61:** Dual sharing format — verification URL + client-side SVG badge download
- **D-62:** Verify page reads `vote_nullifiers.member()` live — cannot be spoofed without preimage of persistentHash
- **D-63:** Global-only analytics — no per-wallet tracking, only public tally data

## Deviations from Plan

None — plan executed exactly as written. All four service-layer artifacts created and TypeScript-clean.

## Known Stubs

None — all hooks are fully implemented. Data flows from on-chain state to return types without placeholder values.

## Threat Flags

None — no new network endpoints, auth paths, or schema changes introduced. All existing threat mitigations implemented as planned (T-06-01 through T-06-04 from plan threat model).

## Self-Check: PASSED

Files created:
- ✅ lib/midnight/proof-badge.ts
- ✅ lib/queries/use-participation-proof.ts
- ✅ lib/queries/use-verify-proof.ts
- ✅ lib/queries/use-stats.ts

Commits verified:
- ✅ 8be6336 feat(06-01): create SVG proof badge generator
- ✅ 22121e1 feat(06-01): create participation proof hook
- ✅ 76a6fb6 feat(06-01): create nullifier verification hook
- ✅ 74bb7a7 feat(06-01): create global analytics hook
