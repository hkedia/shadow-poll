---
status: partial
phase: 10-invite-code-improvements
source: [10-VERIFICATION.md]
started: 2026-04-09T00:00:00.000Z
updated: 2026-04-09T00:00:00.000Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Batch tx count on poll creation
expected: Creating a poll with N invite codes shows exactly 1 transaction in the 1am.xyz wallet prompt (not N separate prompts)
result: [pending]

### 2. Batch tx count post-creation
expected: Using "Add More Codes" after poll creation submits exactly 1 transaction regardless of how many codes are added
result: [pending]

### 3. Single-use enforcement at runtime
expected: Voting with invite code X from wallet A succeeds; attempting to vote with the same code X from wallet B (or the same wallet) is rejected with "Invite code already used"
result: [pending]

### 4. Full ZK compilation
expected: Running `bash contracts/scripts/compile.sh` (without `--skip-zk`) completes without errors and regenerates ZK keys
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
