---
phase: 13
plan: 03
subsystem: services
testing
status: completed
completed_date: 2026-04-10
tags: [services, unit-tests, mocking, midnight-sdk]
dependencies:
  - 13-01-PLAN.md
key-files:
  created:
    - lib/midnight/contract-service.test.ts
    - lib/midnight/invite-codes.test.ts
    - lib/midnight/ledger-utils.test.ts
    - lib/midnight/witness-impl.test.ts
deviations: []
---

# Phase 13 Plan 03: Service Layer Tests Summary

## Overview
Created comprehensive unit tests for the Midnight service layer functions using mocked providers. Tests verify contract interactions, invite code utilities, ledger operations, and witness implementations.

## What Was Built

### 1. Contract Service Tests (lib/midnight/contract-service.test.ts)
6 test suites, 16+ tests:
- **getContractAddress** - env var handling
- **deployPollContract** - provider requirements, wallet integration
- **callCreatePoll** - parameter passing, poll type handling, result extraction
- **callCastVote** - vote casting, option indices
- **callCastInviteVote** - invite vote parameters, code encoding
- **callAddInviteCodes** - batching (10 codes/batch), padding, empty handling

### 2. Invite Codes Tests (lib/midnight/invite-codes.test.ts)
5 test suites, 18+ tests:
- **generateInviteCodes** - count, length (10 chars), uniqueness, alphanumeric, hash generation
- **inviteCodeToBytes32** - SHA-256 hashing, consistency, case insensitivity
- **storeInviteCodes** - localStorage serialization, hex encoding
- **loadInviteCodes** - deserialization, error handling, missing data
- **formatCodesForCopy** - newline separation
- **formatCodesForCSV** - CSV format with headers

### 3. Ledger Utilities Tests (lib/midnight/ledger-utils.test.ts)
10 test suites, 24+ tests:
- **bytesToHex/hexToBytes** - encoding/decoding, padding, case handling
- **bigintToBytes32** - little-endian encoding, large numbers, zero
- **deriveTallyKey** - consistency, different options/polls
- **derivePollId** - 32-byte output, consistency, input sensitivity
- **deriveNullifier** - duplicate prevention hashing
- **deriveInviteKey** - invite code key derivation
- **readPoll** - member lookup, null handling
- **readPollCount** - counter reading
- **readTallies** - option counting, total calculation, missing tallies

### 4. Witness Implementation Tests (lib/midnight/witness-impl.test.ts)
2 test suites, 10+ tests:
- **createWitnesses** - witness creation, context passing, private state preservation
- **getSecretKeyFromWallet** - key derivation from coin public key, error handling

## Technical Approach
- Used `createMockProviders()` from lib/test/test-utils.ts for consistent mocking
- All tests mock external dependencies (no real network calls)
- Tests verify correct parameter passing to SDK functions
- Error cases tested (empty inputs, invalid data, exceptions)

## Verification
- `bun run test lib/midnight/` passes all 68+ tests
- No real network calls (fully mocked)
- Tests run in ~2 seconds

## Commits
- `9731937`: test(13-03): add service layer unit tests

## Deviations from Plan
None - plan executed exactly as written.

## Next Steps
Plan 04 will add tests for React Query data hooks.
