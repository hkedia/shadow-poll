---
phase: 10-invite-code-improvements
verified: 2026-04-09T00:00:00Z
status: human_needed
score: 4/4 must-haves verified
gaps: []
human_verification:
  - test: "Create an invite-only poll with 10 codes and confirm exactly 1 transaction is submitted"
    expected: "The blockchain shows a single add_invite_codes transaction, not 10 separate ones"
    why_human: "Transaction count on Midnight Preview requires a live wallet + network connection — cannot verify programmatically from code alone"
  - test: "Add extra invite codes post-creation and confirm exactly 1 transaction"
    expected: "The useAddInviteCodesMutation hook submits one tx regardless of N codes (N ≤ 10)"
    why_human: "Requires a connected wallet and deployed contract on Preview network"
  - test: "Vote with an invite code, then attempt to vote again with a different wallet using the same code"
    expected: "First vote succeeds; second vote is rejected with 'Invite code already used' error"
    why_human: "End-to-end ZK proof generation + rejection requires two wallet sessions and a live contract"
  - test: "Compile the contract with full ZK key generation (not --skip-zk)"
    expected: "bash contracts/scripts/compile.sh succeeds and produces updated ZK keys in public/"
    why_human: "Full ZK compilation is slow and was deferred; --skip-zk compile was verified by the agent but ZK key coherence needs human confirmation before production deployment"
---

# Phase 10: Invite Code Improvements — Verification Report

**Phase Goal:** Fix two invite-code bugs: (1) batch `add_invite_codes` so N codes cost 1 transaction, (2) single-use enforcement so a code cannot be reused across different wallets.
**Verified:** 2026-04-09
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (from ROADMAP.md success_criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Creating an invite-only poll with 10 codes submits exactly 1 on-chain transaction (not 10) | ✓ VERIFIED | `use-create-poll.ts:139` — single `callAddInviteCodes(contract, { codeHashes: inviteCodes.map(c => c.hash) })` call; old N-iteration loop removed in commit `6b1a11f` |
| 2 | Adding more invite codes post-creation submits exactly 1 transaction regardless of how many codes are added | ✓ VERIFIED | `use-add-invite-codes.ts:51` — single `callAddInviteCodes(contract, { codeHashes: params.codeHashes })` call; old per-hash loop removed in commit `aa9c8ec` |
| 3 | Voting with an invite code succeeds the first time and is rejected the second time (with a different wallet) | ✓ VERIFIED (code) / ? HUMAN (runtime) | `poll.compact:233-234` — `assert(invite_codes.lookup(d_invite_key), "Invite code already used")` + `invite_codes.insert(d_invite_key, false)` added in commit `aa20128` |
| 4 | The contract compiles without errors and TypeScript build passes | ✓ VERIFIED | `bun run build` passes with zero TypeScript errors (only pre-existing `node_modules` WASM warnings); contract compile with `--skip-zk` confirmed by SUMMARY.md and commit message |

**Score:** 4/4 truths verified at code level; 3 require human confirmation for runtime behavior.

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `contracts/src/poll.compact` | `add_invite_codes` accepts `Vector<10, Bytes<32>>`; `cast_invite_vote` marks code spent | ✓ VERIFIED | Line 257: `code_hashes: Vector<10, Bytes<32>>`; Lines 233-234: lookup + insert false |
| `contracts/managed/contract/index.d.ts` | `code_hashes_0: Uint8Array[]` in both ImpureCircuits and ProvableCircuits | ✓ VERIFIED | Lines 32, 50: `code_hashes_0: Uint8Array[]` — compiler-regenerated match |
| `lib/midnight/contract-service.ts` | `AddInviteCodesParams` with `codeHashes: Uint8Array[]`; padding to 10; single `callTx` call | ✓ VERIFIED | Lines 215-246: interface correct, padding loop present, single `contract.callTx.add_invite_codes(params.pollId, padded)` call |
| `lib/queries/use-add-invite-codes.ts` | Single `callAddInviteCodes` call (no loop) | ✓ VERIFIED | Lines 51-54: single batch call; no loop present; old loop removed in diff |
| `lib/queries/use-create-poll.ts` | Single `callAddInviteCodes` call at poll creation (no loop) | ✓ VERIFIED | Lines 139-142: single batch call with `.map(c => c.hash)`; old loop removed in diff |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `use-create-poll.ts` | `contract-service.ts::callAddInviteCodes` | import + single call | ✓ WIRED | `import { callAddInviteCodes }` at line 12; called at line 139 |
| `use-add-invite-codes.ts` | `contract-service.ts::callAddInviteCodes` | import + single call | ✓ WIRED | `import { ..., callAddInviteCodes }` at line 3; called at line 51 |
| `contract-service.ts` | `contracts/managed/contract` | `contract.callTx.add_invite_codes` | ✓ WIRED | Line 242: `contract.callTx.add_invite_codes(params.pollId, padded)` |
| `poll.compact::cast_invite_vote` | `invite_codes` ledger | lookup (used-check) + insert (mark-spent) | ✓ WIRED | Lines 233-234: both operations present |
| `poll.compact::add_invite_codes` | `invite_codes` ledger | Vector loop + zero-skip | ✓ WIRED | Lines 276-282: `for` loop iterating `code_hashes`, zero-byte skip guard |

---

## Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| `use-create-poll.ts` | `inviteCodes.map(c => c.hash)` | `generateInviteCodes()` → `InviteCode.hash` | Yes — real Uint8Array hashes from crypto | ✓ FLOWING |
| `contract-service.ts` | `padded` (Vector<10>) | `params.codeHashes` + zero-padding | Yes — real hashes plus zero fills | ✓ FLOWING |
| `poll.compact` | `invite_codes` map | `invite_codes.insert(d_code_hash, true)` / `insert(false)` | Yes — on-chain Boolean flag | ✓ FLOWING |

---

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| TypeScript build succeeds with no errors | `bun run build` | `✓ built in 2.90s` — zero TS errors | ✓ PASS |
| No residual single-hash `codeHash` references remain | `grep -rn "codeHash:" lib/ src/` | 0 matches | ✓ PASS |
| Single `callTx.add_invite_codes` call in service (not in a loop) | Grep for `for.*codeHash\|await callAddInviteCodes` patterns | No loops; both hook files have exactly 1 `await callAddInviteCodes(...)` | ✓ PASS |
| Single-use enforcement: `lookup` + `insert false` both present | `grep "invite_codes.lookup\|invite_codes.insert.*false"` in contract | Lines 233-234 both present | ✓ PASS |
| Full ZK compilation | Requires live Compact toolchain | Not run (deferred — slow) | ? SKIP |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| CONT-05 | Phase 10 Plan 01 (hardening) | Invite-only poll votes verified via ZK proof of valid invite code | ✓ SATISFIED (hardened) | `cast_invite_vote` now additionally asserts `lookup == true` and marks code spent — single-use enforcement extends the existing ZK membership check |
| CONT-06 | Phase 10 Plan 01 (hardening) | Contract prevents same wallet from voting twice on the same poll | ✓ SATISFIED (unchanged) | Nullifier check at lines 238-241 in `cast_invite_vote` and lines 186-189 in `cast_vote` — pre-existing and untouched in Phase 10; no regression |

**Traceability note:** REQUIREMENTS.md maps both CONT-05 and CONT-06 to **Phase 5** (original implementation). Phase 10 is documented in the ROADMAP.md as *"hardening"* these requirements. The traceability table in REQUIREMENTS.md is not updated to reflect Phase 10 as a secondary hardening phase — this is a minor documentation gap but does not affect code correctness. No requirement is orphaned or unimplemented.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| _None found_ | — | — | — | — |

No TODOs, FIXMEs, placeholder returns, empty handlers, or stub patterns detected in any of the 4 modified files.

---

## Human Verification Required

### 1. Batch Transaction Count — Poll Creation

**Test:** With a connected 1am.xyz wallet on Midnight Preview, create an invite-only poll and request 10 invite codes. Monitor the wallet transaction approval dialogs or the Preview block explorer.
**Expected:** Exactly **1** `add_invite_codes` transaction is submitted (not 10 separate transactions).
**Why human:** Transaction submission requires a live wallet, deployed contract, and network — cannot be verified by static code analysis alone.

### 2. Batch Transaction Count — Post-Creation Add

**Test:** After creating a poll, use the InviteCodePanel to add additional codes (e.g., 5 codes). Confirm the transaction count.
**Expected:** Exactly **1** `add_invite_codes` transaction regardless of how many codes are added (up to 10).
**Why human:** Same as above — requires live network interaction.

### 3. Single-Use Enforcement at Runtime

**Test:** (a) Vote on an invite-only poll with wallet A using invite code X — vote should succeed. (b) Switch to wallet B and attempt to vote with the same invite code X — the circuit should reject it.
**Expected:** Vote (a) succeeds; vote (b) is rejected with the on-chain assertion message `"Invite code already used"`.
**Why human:** Requires two wallet sessions, ZK proof generation, and a live Preview network contract to exercise the `invite_codes.lookup` / `insert false` path end-to-end.

### 4. Full ZK Compilation

**Test:** Run `bash contracts/scripts/compile.sh` (without `--skip-zk`) and verify that fresh ZK proving/verifying keys are generated in `public/contracts/managed/`.
**Expected:** Compilation succeeds; the new `Vector<10, Bytes<32>>` signature generates updated key files with no errors.
**Why human:** Full ZK compilation is slow and was deferred by the agent (only `--skip-zk` was run). Updated ZK keys are required before production deployment or real voting.

---

## Gaps Summary

No gaps. All four code-level must-haves are verified:

1. **Batch submission — contract:** `add_invite_codes` signature updated to `Vector<10, Bytes<32>>` with zero-byte skip logic.
2. **Batch submission — TypeScript:** `callAddInviteCodes` pads to 10 elements and issues one `callTx` call.
3. **Single-use enforcement — contract:** `cast_invite_vote` asserts `lookup == true` and sets flag to `false` after use.
4. **Hook migration:** Both `useCreatePoll` and `useAddInviteCodesMutation` removed their N-iteration loops and now call `callAddInviteCodes` once with the full hash array.

The 4 human-verification items are runtime and network-level confirmation of the correct code — not code gaps.

---

_Verified: 2026-04-09_
_Verifier: gsd-verifier (automated static analysis)_
