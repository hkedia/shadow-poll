---
phase: 05-invite-only-polls
plan: 01
subsystem: contracts
tags: [compact, zk-proof, nullifier, invite-code, persistentHash, duplicate-prevention]

# Dependency graph
requires:
  - phase: 02-smart-contracts
    provides: "Base poll.compact with create_poll, cast_vote, PollType enum, PollData struct"
provides:
  - "vote_nullifiers ledger Map for duplicate vote prevention on all polls"
  - "invite_codes ledger Map for invite code hash commitments"
  - "derive_nullifier pure circuit for deterministic voter+poll nullifier"
  - "derive_invite_key pure circuit for invite code hash derivation"
  - "cast_invite_vote circuit with ZK invite code verification + nullifier"
  - "add_invite_codes circuit with creator-gated code hash submission"
  - "deriveNullifier and deriveInviteKey TypeScript hash utilities"
affects: [05-invite-only-polls, contract-service]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Nullifier pattern: hash(poll_id, voter_sk) for duplicate vote prevention"
    - "Private ZK input pattern: invite_code not disclosed, only its hash checked"
    - "Creator-gated circuit: derive_public_key(sk) == poll_data.creator assertion"

key-files:
  created: []
  modified:
    - contracts/src/poll.compact
    - lib/midnight/ledger-utils.ts

key-decisions:
  - "One invite code per add_invite_codes call — avoids Compact variable-length array limitations"
  - "Nullifier derived from voter_sk not invite_code — ensures one vote per wallet regardless of codes held"
  - "invite_code parameter NOT disclosed in cast_invite_vote — ZK privacy preserved"
  - "code_hash IS disclosed in add_invite_codes — already a hash, reveals nothing about raw code"

patterns-established:
  - "Nullifier pattern: derive_nullifier(poll_id, voter_sk) → check + insert into vote_nullifiers Map"
  - "Poll type routing: cast_vote for public_poll, cast_invite_vote for invite_only"
  - "Creator verification: derive_public_key(local_secret_key()) == poll_data.creator"

requirements-completed: [CONT-05, CONT-06]

# Metrics
duration: 4min
completed: 2026-04-08
---

# Phase 5 Plan 01: Contract Extensions for Invite-Only Polls Summary

**Compact contract extended with nullifier-based duplicate vote prevention, ZK invite code verification, and creator-gated code management — 2 new ledger maps, 2 pure circuits, 2 new circuits, 1 modified circuit, plus matching TypeScript hash utilities**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-08T10:09:57Z
- **Completed:** 2026-04-08T10:13:30Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments

- Added nullifier-based duplicate vote prevention to cast_vote (all public polls now prevent double-voting)
- Added cast_invite_vote circuit with private invite code ZK verification and nullifier protection
- Added add_invite_codes circuit with creator-only gating via public key derivation
- Added deriveNullifier and deriveInviteKey TypeScript utilities matching the Compact pure circuits exactly

## Task Commits

Each task was committed atomically:

1. **Task 1: Add new ledger state, pure circuits, and modify cast_vote with nullifier** - `23a32c4` (feat)
2. **Task 2: Add cast_invite_vote and add_invite_codes circuits** - `2146892` (feat)
3. **Task 3: Add TypeScript hash derivation utilities and recompile contract** - `257bc27` (feat)

## Files Created/Modified

- `contracts/src/poll.compact` — Extended with vote_nullifiers + invite_codes maps, derive_nullifier + derive_invite_key pure circuits, modified cast_vote with poll type gate + nullifier, new cast_invite_vote + add_invite_codes circuits (180→296 lines)
- `lib/midnight/ledger-utils.ts` — Added deriveNullifier and deriveInviteKey async functions using dynamic compact-runtime import (151→187 lines)

## Decisions Made

- **One code per call for add_invite_codes:** Compact v0.19 doesn't support variable-length arrays in circuit parameters. Creator calls the circuit N times for N codes. Simple, reliable, no batch complexity.
- **Nullifier from voter_sk not invite_code:** Using the voter's secret key ensures one vote per wallet regardless of how many invite codes they possess. This matches D-51.
- **invite_code stays private:** The `invite_code` parameter in `cast_invite_vote` is never disclosed — only its derived hash (`invite_key`) crosses the ZK boundary for ledger lookup. This is the core privacy guarantee.
- **code_hash is disclosed in add_invite_codes:** Since `code_hash` is already `hash(poll_id, raw_code)`, disclosing it reveals nothing about the raw invite code (preimage resistance).

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Compiled contract artifacts in `contracts/managed/` include types for all new circuits (cast_invite_vote, add_invite_codes)
- TypeScript hash utilities ready for Plan 02 to wire up contract-service layer
- Generated ZKIR files: cast_vote.zkir, cast_invite_vote.zkir, add_invite_codes.zkir, create_poll.zkir
- Plan 02 can now implement the service functions that call these circuits
- Plan 03 can wire the UI components for invite code management and voting

## Self-Check: PASSED

- ✅ `contracts/src/poll.compact` exists with all 5 pure circuits and 4 export circuits
- ✅ `lib/midnight/ledger-utils.ts` exports deriveNullifier and deriveInviteKey
- ✅ Commit 23a32c4 exists (Task 1)
- ✅ Commit 2146892 exists (Task 2)
- ✅ Commit 257bc27 exists (Task 3)
- ✅ Contract compiles without errors
- ✅ TypeScript compiles without errors
- ✅ No top-level @midnight-ntwrk imports in ledger-utils.ts

---
*Phase: 05-invite-only-polls*
*Completed: 2026-04-08*
