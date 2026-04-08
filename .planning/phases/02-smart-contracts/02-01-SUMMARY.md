# Plan 02-01 Summary: Write Poll Manager Compact Contract

## Status: COMPLETE

## What Was Done

Wrote the Compact Poll Manager smart contract at `contracts/src/poll.compact` with two exported circuits (`create_poll` and `cast_vote`) and verified successful compilation with `compact compile +0.28.0 --skip-zk`.

## Artifacts Created

| File | Purpose |
|------|---------|
| `contracts/src/poll.compact` | Poll Manager smart contract (Compact v0.19+) |
| `contracts/managed/contract/index.js` | Compiled JS contract module |
| `contracts/managed/contract/index.d.ts` | TypeScript declarations |
| `contracts/managed/zkir/create_poll.zkir` | ZK IR for create_poll circuit |
| `contracts/managed/zkir/cast_vote.zkir` | ZK IR for cast_vote circuit |

## Key Design Decisions Implemented

- **D-20:** Single Poll Manager contract with map-based ledger state
- **D-21:** Voter identity never stored alongside vote choice; poll_id and option_index are disclosed but voter wallet is not linked
- **D-22:** Poll metadata stored as commitment hash (`Bytes<32>`) on-chain
- **D-23:** Max 10 options per poll, enforced via assert; tally initialisation covers 0-9 conditionally
- **D-24:** Block-number-based expiration via `current_block_number()` witness with assert

## Contract Architecture

### Ledger State (flat key scheme)
- `polls: Map<Bytes<32>, PollData>` — poll registry
- `tallies: Map<Bytes<32>, Counter>` — flat tally map using composite key `hash(poll_id, option_index_as_bytes)`
- `poll_count: Counter` — global poll counter

### Circuits
- `create_poll(metadata_hash, option_count, poll_type, expiration_block) → Bytes<32>` (poll ID)
- `cast_vote(poll_id, option_index) → []`

### Witnesses
- `local_secret_key()` — caller's secret key for identity derivation
- `current_block_number()` — current block number for expiration checks

## Compilation Issues Resolved

1. **Nested Map<Map<Counter>> not supported** — Compact cannot chain `.lookup().lookup().increment()` on nested map types. Resolved by flattening to a single `Map<Bytes<32>, Counter>` with composite keys derived via `persistentHash`.

2. **Witness disclosure requirements** — All circuit parameters flow through ZK proofs and need explicit `disclose()` before being used in ledger operations. All public data (metadata_hash, option_count, poll_type, expiration_block, poll_id, option_index) are disclosed at circuit entry. The voter's secret key and derived public key are disclosed only where needed (creator field), never alongside vote choice.

## Requirements Satisfied

- **CONT-01:** Poll creation contract accepts metadata hash, option count, poll type, and expiration block ✅
- **CONT-02:** Vote casting contract accepts poll ID and option index ✅
