# Phase 10 Context: Invite Code Improvements

## Problem Statement

Two bugs in the current invite-only poll system need to be fixed:

1. **N transactions for N invite codes**: The `add_invite_codes` circuit accepts a single `code_hash: Bytes<32>`, so adding 10 codes requires 10 separate on-chain transactions. The user should be able to submit one transaction with all hashes.

2. **Invite codes are reusable**: The `cast_invite_vote` circuit verifies that an invite code hash exists in `invite_codes` but never marks it as used. Any user who learns a valid code can vote with it repeatedly (on different wallets). The nullifier only prevents the same wallet from voting twice.

## Root Cause Analysis

### Bug 1: Single-hash interface in `add_invite_codes`
- `contracts/src/poll.compact` L252-274: Circuit signature is `add_invite_codes(poll_id, code_hash: Bytes<32>)`
- `lib/queries/use-add-invite-codes.ts` L52-56: Iterates over hashes and calls `callAddInviteCodes` once per hash
- `lib/queries/use-create-poll.ts` L139-143: Same loop pattern at poll creation time
- **Fix**: Change contract to accept `Vector<#N, Bytes<32>>` and loop internally. Update TypeScript callers to pass all hashes at once in a single array.

### Bug 2: Invite codes not marked as used
- `contracts/src/poll.compact` L230-232: Checks `invite_codes.member(d_invite_key)` and asserts it's present, but never removes or flags it
- `invite_codes` map stores `Boolean` value — currently always `true` on insert
- **Fix**: After verifying membership AND the value is `true`, overwrite the entry with `false` (mark as spent). The membership check changes to: member AND value == true.

## Key Constraints

- Compact circuits must have fixed-size inputs — use generic numeric parameter `#N` for the vector length
- The ZK circuit and TypeScript caller must agree on the vector size at call time
- Compact `for (const hash of hashes) { ... }` iterates over `Vector<N, T>`
- `Map.insert(key, value)` in Compact overwrites existing entries — safe to re-insert with `false`
- After this change, the contract must be recompiled and ZK keys regenerated

## Files To Change

| File | Change |
|------|--------|
| `contracts/src/poll.compact` | Batch `add_invite_codes<#N>`, mark invite codes as used in `cast_invite_vote` |
| `contracts/managed/contract/index.d.ts` | Update type signature for `add_invite_codes` |
| `lib/midnight/contract-service.ts` | Update `callAddInviteCodes` to accept array, pass as vector |
| `lib/queries/use-add-invite-codes.ts` | Pass all hashes in one call |
| `lib/queries/use-create-poll.ts` | Pass all hashes in one call at creation |
