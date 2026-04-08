---
phase: 05-invite-only-polls
plan: 02
subsystem: service-layer
tags: [invite-codes, contract-service, mutations, localStorage, SHA-256, crypto]

# Dependency graph
requires:
  - phase: 05-invite-only-polls
    plan: 01
    provides: "Compiled contract with cast_invite_vote, add_invite_codes circuits, deriveInviteKey utility"
provides:
  - "generateInviteCodes, inviteCodeToBytes32, storeInviteCodes, loadInviteCodes utilities"
  - "callCastInviteVote, callAddInviteCodes contract service functions"
  - "useInviteVoteMutation hook for casting invite-only votes"
  - "useAddInviteCodesMutation hook for submitting code hashes"
  - "useCreatePoll updated with pollType and inviteCodeCount support"
affects: [05-invite-only-polls, contract-service, query-hooks]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "crypto.getRandomValues() for secure random invite code generation"
    - "crypto.subtle.digest('SHA-256') for deterministic code-to-bytes conversion"
    - "Dynamic import for invite-codes.ts in useCreatePoll (keeps public poll path lightweight)"
    - "Sequential on-chain tx submission for invite code hashes (one per add_invite_codes call)"
    - "localStorage with hex serialization for invite code persistence (D-53)"

key-files:
  created:
    - lib/midnight/invite-codes.ts
    - lib/queries/use-invite-vote-mutation.ts
    - lib/queries/use-add-invite-codes.ts
  modified:
    - lib/midnight/contract-service.ts
    - lib/midnight/contract-types.ts
    - lib/queries/use-create-poll.ts
    - lib/queries/use-vote-mutation.ts
    - components/create-poll-form.tsx

key-decisions:
  - "inviteCodeToBytes32 uses SHA-256 to normalize variable-length code strings to fixed 32 bytes"
  - "Code generation uses crypto.getRandomValues() — never Math.random() — for cryptographic security"
  - "Case-insensitive codes: uppercase normalization before hashing so users can type any case"
  - "Dynamic import for invite-codes.ts in create-poll hook — only loaded for invite_only polls"

patterns-established:
  - "Invite code lifecycle: generate → hash → submit hashes → store in localStorage → share codes"
  - "Optimistic tally updates for invite vote mutations (same pattern as public votes)"
  - "Sequential tx submission for batch code hashes (v2 batching noted)"

requirements-completed: [POLL-02, POLL-05, POLL-06, CONT-05, CONT-06]

# Metrics
duration: 5min
completed: 2026-04-08
---

# Phase 5 Plan 02: Service Layer for Invite-Only Polls Summary

**TypeScript service layer with crypto-secure invite code generation, contract interaction functions for invite-only circuits, and TanStack Query mutations — 3 new files, 5 modified, all wired to Plan 01's compiled contract**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-08T10:16:19Z
- **Completed:** 2026-04-08T10:21:30Z
- **Tasks:** 4
- **Files created:** 3
- **Files modified:** 5

## Accomplishments

- Created `invite-codes.ts` with secure random code generation (crypto.getRandomValues), SHA-256 hashing (inviteCodeToBytes32), localStorage persistence, and clipboard/CSV formatters
- Added `callCastInviteVote` and `callAddInviteCodes` to contract-service.ts matching exact circuit parameter order
- Updated `useCreatePoll` to support `pollType: "invite_only"` with automatic code generation, on-chain hash submission, and localStorage storage
- Created `useInviteVoteMutation` with invite code string → Bytes<32> conversion and optimistic tally updates
- Created `useAddInviteCodesMutation` for batch code hash submission (sequential tx per code)
- Updated `useVoteMutation` to document "Already voted" contract assertion as expected behavior

## Task Commits

Each task was committed atomically:

1. **Task 1: Create invite code generation utility** — `2d825b5` (feat)
2. **Task 2: Add contract service functions for invite-only circuits** — `ec85dbe` (feat)
3. **Task 3: Update useCreatePoll for invite-only support** — `17162d0` (feat)
4. **Task 4: Create useInviteVoteMutation and useAddInviteCodesMutation** — `7d9b6e6` (feat)

## Files Created/Modified

- `lib/midnight/invite-codes.ts` — **NEW** — Invite code generation (crypto.getRandomValues), SHA-256 hashing, localStorage store/load, clipboard/CSV formatters (205 lines)
- `lib/midnight/contract-service.ts` — Added callCastInviteVote and callAddInviteCodes with CastInviteVoteParams and AddInviteCodeParams interfaces (298→358 lines)
- `lib/midnight/contract-types.ts` — Re-exported ImpureCircuits type from compiled contract
- `lib/queries/use-create-poll.ts` — Added pollType and inviteCodeCount to input, invite code generation + hash submission flow for invite_only polls (137→161 lines)
- `lib/queries/use-invite-vote-mutation.ts` — **NEW** — useInviteVoteMutation hook with code→Bytes<32> conversion and optimistic updates (115 lines)
- `lib/queries/use-add-invite-codes.ts` — **NEW** — useAddInviteCodesMutation hook with sequential hash submission (63 lines)
- `lib/queries/use-vote-mutation.ts` — Added "Already voted" error documentation comment
- `components/create-poll-form.tsx` — Added `pollType: "public"` to existing mutation call (Rule 3 fix)

## Decisions Made

- **SHA-256 for code-to-bytes:** `inviteCodeToBytes32` uses `crypto.subtle.digest("SHA-256")` to normalize variable-length code strings to fixed Bytes<32>. This is deterministic and consistent with the contract's hash-based verification.
- **Case-insensitive codes:** Uppercase normalization before hashing means users can type "a3k9f2x7b1" or "A3K9F2X7B1" and get the same hash. Better UX with no security trade-off.
- **Dynamic imports for invite path:** `invite-codes.ts` is loaded via `await import()` only when creating invite_only polls, keeping the public poll creation path lightweight.
- **Sequential tx submission:** Each invite code hash requires a separate `add_invite_codes` transaction. Compact v0.19 doesn't support batch arrays, so this is the only option. V2 batching noted in comments.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed create-poll-form.tsx missing pollType**
- **Found during:** Task 3
- **Issue:** Adding required `pollType` field to `CreatePollInput` broke the existing `components/create-poll-form.tsx` which didn't pass it
- **Fix:** Added `pollType: "public"` to the existing mutation call in `create-poll-form.tsx`
- **Files modified:** `components/create-poll-form.tsx`
- **Commit:** `17162d0`

## Issues Encountered

None beyond the auto-fixed deviation above.

## Next Phase Readiness

- All service-layer functions ready for Plan 03 to wire into UI components
- `useInviteVoteMutation` can be called from an invite-only poll voting form
- `useAddInviteCodesMutation` can be called from a creator-facing code management panel
- `useCreatePoll` now accepts `pollType: "invite_only"` with `inviteCodeCount` — the create poll form just needs a poll type selector
- `loadInviteCodes` and `formatCodesForCopy`/`formatCodesForCSV` are ready for a code sharing modal

## Self-Check: PASSED

- ✅ `lib/midnight/invite-codes.ts` exists with all 6 exports
- ✅ `lib/midnight/contract-service.ts` exports callCastInviteVote and callAddInviteCodes
- ✅ `lib/queries/use-invite-vote-mutation.ts` exports useInviteVoteMutation
- ✅ `lib/queries/use-add-invite-codes.ts` exports useAddInviteCodesMutation
- ✅ `lib/queries/use-create-poll.ts` supports pollType: "invite_only"
- ✅ No top-level @midnight-ntwrk imports in any new or modified file
- ✅ TypeScript compiles without errors (npx tsc --noEmit)
- ✅ Commit 2d825b5 exists (Task 1)
- ✅ Commit ec85dbe exists (Task 2)
- ✅ Commit 17162d0 exists (Task 3)
- ✅ Commit 7d9b6e6 exists (Task 4)

---
*Phase: 05-invite-only-polls*
*Completed: 2026-04-08*
