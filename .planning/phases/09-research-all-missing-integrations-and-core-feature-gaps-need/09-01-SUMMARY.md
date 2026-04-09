---
phase: 09-research-all-missing-integrations-and-core-feature-gaps-need
plan: 01
subsystem: client-mutations
tags: [contract-service, poll-creation, voting, invite-codes, zk-proof]
dependency_graph:
  requires: [lib/midnight/contract-service.ts, lib/midnight/witness-impl.ts, lib/midnight/invite-codes.ts]
  provides: [lib/queries/use-create-poll.ts, lib/queries/use-vote-mutation.ts]
  affects: [src/routes/create-poll.tsx, src/routes/poll-detail.tsx]
tech_stack:
  added: []
  patterns: [direct-contract-call, optimistic-updates, invite-code-on-chain-commit]
key_files:
  created: []
  modified:
    - lib/queries/use-create-poll.ts
    - lib/queries/use-vote-mutation.ts
decisions:
  - "D-09-03: Browser calls contract service directly — no server intermediary for state-changing operations"
  - "Defensive fallback chain result?.private?.result ?? result?.result guards against result shape uncertainty (A1 from RESEARCH.md)"
  - "callAddInviteCodes called once per invite code in a for-of loop — sequential on-chain commitment"
metrics:
  duration: 95s
  completed: "2026-04-09"
  tasks_completed: 2
  files_changed: 2
---

# Phase 09 Plan 01: Restore Direct Contract Service Calls Summary

**One-liner:** Rewired poll creation and vote casting to call Midnight contract service directly from browser, replacing phantom server fetches that silently returned 404.

## What Was Built

Both critical mutation hooks were wired to non-existent server API routes (`/api/polls/create` and `/api/polls/vote`), causing every poll creation and every vote to fail silently. This plan restored the correct client-side contract architecture.

### useCreatePoll (`lib/queries/use-create-poll.ts`)
- Removed phantom `fetch("/api/polls/create")` call
- Added imports: `findPollContract`, `callCreatePoll`, `callAddInviteCodes`, `getContractAddress` from contract-service
- Implemented full flow: validate metadata → compute hash → get secret key + block number → find contract → call create_poll circuit
- Extracts real poll ID bytes from `result?.private?.result ?? result?.result` with explicit error if null
- For invite-only polls: `callAddInviteCodes` called once per code in a for-of loop to commit each hash on-chain
- Removed `CreatePollResponse` type (was only needed for phantom fetch shape)
- Removed mock `new Uint8Array(32)` bytes

### useVoteMutation (`lib/queries/use-vote-mutation.ts`)
- Removed phantom `fetch("/api/polls/vote")` call
- Added imports: `findPollContract`, `callCastVote`, `getContractAddress`, `getSecretKeyFromWallet`, `getCurrentBlockNumber`
- Implemented full flow: get secret key + block number → find contract → call cast_vote circuit
- Preserved all three optimistic update callbacks intact: `onMutate`, `onError`, `onSettled`

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all data paths are fully wired to real contract service calls.

## Threat Flags

None — no new network endpoints or trust boundaries introduced. Existing boundaries covered by plan's threat model.

## Self-Check: PASSED
- lib/queries/use-create-poll.ts: FOUND
- lib/queries/use-vote-mutation.ts: FOUND
- Commit fbde4c8: FOUND
