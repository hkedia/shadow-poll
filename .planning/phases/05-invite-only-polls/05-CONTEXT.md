# Phase 5: Invite-Only Polls — Context

## Goal

Users can create private polls with invite codes, and only holders of valid codes can vote — with ZK verification and duplicate vote prevention.

## Requirements

| ID | Description |
|----|-------------|
| POLL-02 | Create invite-only poll on-chain |
| POLL-05 | Vote on invite-only poll with invite code + ZK verification |
| POLL-06 | Generate and manage invite codes off-chain |
| CONT-05 | ZK proof of valid invite code in contract |
| CONT-06 | Prevent duplicate wallet votes |

## Success Criteria

1. User can create an invite-only poll and generate shareable invite codes off-chain
2. User with a valid invite code can vote on an invite-only poll, with the code verified via ZK proof in the contract
3. The same wallet cannot vote twice on the same poll — the contract rejects duplicate votes
4. The Create Poll form toggle between Public and Invite-Only correctly gates the invite code workflow

## Design Decisions

### D-50: Hash-list for invite code verification

**Decision:** Store invite code hashes in a Compact `Map<Bytes<32>, Boolean>` on-chain. Voter provides raw code as a private witness; the circuit hashes it and checks membership.

**Rationale:** Simpler than Merkle trees for v1. Practical invite count is ≤100 per poll, and Map handles this fine. Merkle tree can be a v2 optimization.

**Key:** `invite_codes` ledger map, keyed by `hash(poll_id, code)`.

### D-51: Duplicate vote prevention for all polls (nullifier pattern)

**Decision:** Add a nullifier-based duplicate vote check to **all** polls (public + invite-only), not just invite-only.

**Rationale:** CONT-06 says "same wallet cannot vote twice on same poll" without scoping it to invite-only. The nullifier pattern is lightweight: `nullifier = hash(poll_id, voter_secret_key)`. Stored in a `vote_nullifiers` ledger Map. Reveals nothing about the voter's choice.

**Impact:** This modifies the existing `cast_vote` circuit for public polls (breaking change — requires contract redeployment).

### D-52: Separate circuits for public vs invite-only voting

**Decision:** Create a new `cast_invite_vote` circuit for invite-only polls. Keep `cast_vote` for public polls (with nullifier addition).

**Rationale:** Public voters shouldn't pay proving overhead for invite code verification they don't use. Shared logic (expiration check, tally increment, nullifier check) extracted into `pure circuit` helpers.

### D-53: Browser-only invite code storage

**Decision:** Invite codes are generated and stored client-side only (localStorage + clipboard). No server-side storage.

**Rationale:** Maintains the "zero PII stored server-side" constraint. Creator distributes codes immediately. UX affordances: "Copy All", "Download CSV".

### D-54: Separate `add_invite_codes` circuit

**Decision:** Invite code commitments (hashes) are submitted via a separate `add_invite_codes` circuit, not at poll creation time.

**Rationale:** Decouples creation from invite management. Supports adding codes later. Avoids Compact's limitations with complex/variable-length parameter types. Circuit asserts caller == poll creator.

## Existing Contract State

The current `poll.compact` has:
- `PollType` enum with `invite_only` variant already defined (unused)
- `create_poll` circuit accepting `poll_type` parameter (stored but not acted upon)
- `cast_vote` circuit with no invite code check and no duplicate vote prevention
- Flat tally map with `derive_tally_key(poll_id, option_index_bytes)`
- `local_secret_key()` and `current_block_number()` witnesses

### New Ledger State Needed

```compact
// Invite code hashes: key = hash(poll_id, invite_code) → Boolean
export ledger invite_codes: Map<Bytes<32>, Boolean>;

// Vote nullifiers: key = hash(poll_id, voter_sk) → Boolean
export ledger vote_nullifiers: Map<Bytes<32>, Boolean>;
```

### New/Modified Circuits Needed

1. **`cast_vote` (modified)** — Add nullifier derivation + duplicate check
2. **`cast_invite_vote` (new)** — Invite code verification + nullifier + vote
3. **`add_invite_codes` (new)** — Creator adds code hashes after poll creation

### New Pure Circuits Needed

```compact
pure circuit derive_invite_key(poll_id: Bytes<32>, invite_code: Bytes<32>): Bytes<32>
pure circuit derive_nullifier(poll_id: Bytes<32>, voter_sk: Bytes<32>): Bytes<32>
```

## TypeScript Service Layer Changes

- `callCastVote()` — add nullifier computation to witness
- `callCastInviteVote()` — new function, takes invite code + computes nullifier
- `callAddInviteCodes()` — new function, creator submits code hashes
- `generateInviteCodes(count)` — off-chain utility, returns { codes, hashes }

## UI Changes

- **Create Poll form**: Toggle Public/Invite-Only. When invite-only: code count selector, generate button, code list with copy/download.
- **Poll Detail page**: If invite-only, show "Enter Invite Code" input before voting panel.
- **Poll Card / Trending**: Badge indicating invite-only polls.

## Assumptions

- Compact `Map` can handle ~100 entries per poll for invite code hashes
- `persistentHash` is sufficient for nullifier derivation, invite code hashing, and invite key derivation
- Contract redeployment is required (new ledger fields = new contract address)
- Invite codes are 8–12 alphanumeric characters, hashed to Bytes<32> before on-chain storage
- The existing `cast_vote` circuit's signature does not change (poll_id, option_index) — nullifier is derived internally from witness
