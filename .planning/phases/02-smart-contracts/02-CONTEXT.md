# Phase 2: Smart Contracts — Context

## Phase Goal

Compact smart contracts for poll creation and vote casting are compiled and their artifacts are served from the app.

## Requirements

| ID | Description |
|----|-------------|
| CONT-01 | Poll creation contract (title, description, options, type) |
| CONT-02 | Vote casting contract |
| CONT-03 | Compilation pipeline in `/contracts` producing WASM artifacts and ZK keys |
| CONT-04 | ZK keys served from `public/` with correct CORS headers |

## Success Criteria

1. A Compact contract exists that accepts poll title, description, options, and type — and compiles without errors
2. A Compact contract exists that accepts a vote on a poll — and compiles without errors
3. Running the compilation pipeline in `/contracts` produces deployable WASM artifacts and ZK keys
4. Compiled proving/verifying keys are accessible from the public folder with correct CORS headers

## Key Design Decisions

### D-20: Single Contract Architecture
Use a single "Poll Manager" contract rather than a factory pattern. One deployed contract manages all polls via map-based ledger state. Rationale: Midnight ZK proof generation is expensive per transaction — deploying a contract per poll would be terrible UX. A single contract with map-based state is the standard Midnight dApp pattern.

### D-21: Public Tallies, Private Voter Identity
Vote counts are public on-chain (anyone can see "Option A has 42 votes"), but no one can link a specific wallet to a specific option. The voter's wallet address is never stored alongside their choice. This is the natural privacy model for Phase 2 (public polls).

### D-22: Hash-Based Metadata Storage
Store only a commitment hash of poll metadata (title, description, option labels) on-chain. Full text is passed during poll creation and recoverable from the indexer's transaction history. Keeps the contract lean and avoids Compact's string limitations.

### D-23: Maximum 10 Poll Options
Cap at 10 options per poll. Simplifies the circuit to use `Vector<10, Counter>` for tallies. Covers the vast majority of real-world poll use cases.

### D-24: Block-Number-Based Expiration
Expire polls at a specific block height. Enforceable on-chain (contract can reject votes after the block). Less intuitive for users but cryptographically verifiable.

### D-25: Simple Manual Compilation Pipeline
`bun run compile:contracts` — runs Compact compile and copies keys to `public/zk-keys/`. No watch mode for Phase 2.

## Contract Design

### Structure
```
contracts/
  src/
    poll.compact          # Main Poll Manager contract
  managed/                # Compiled output (gitignored)
    poll.cjs
    poll.zkir
  scripts/
    compile.sh            # Compilation script
```

### Ledger State
- Poll registry: `Map<Bytes<32>, PollData>` — maps poll IDs to poll data
- Vote tallies: Per-poll `Vector<10, Counter>` — 10 counters, one per option
- Poll count: `Counter` — total number of polls created
- Creator: Per-poll `Bytes<32>` — creator's public key for ownership

### Circuits

| Circuit | Purpose | Inputs | Returns |
|---------|---------|--------|---------|
| `create_poll` | Register a new poll | metadata hash, option count, type, expiration block | `Bytes<32>` (poll ID) |
| `cast_vote` | Cast a vote on a specific poll option | poll ID, option index | `[]` |

### On-Chain vs Off-Chain

**On-chain (ledger):**
- Poll ID (hash-derived)
- Vote tallies per option (Vector<10, Counter>)
- Poll type enum (public / invite-only)
- Number of active options (Uint<8>)
- Expiration block number
- Creator public key (Bytes<32>)

**Off-chain (recovered from indexer):**
- Poll title
- Poll description
- Option labels (strings)

## Scope Exclusions (Phase 5+)
- Invite code ZK verification (CONT-05) — Phase 5
- Duplicate wallet vote prevention (CONT-06) — Phase 5
- Encrypted/hidden tallies — not in scope for v1

## Dependencies
- Phase 1 complete (UI shell exists for eventual integration)
- Compact compiler CLI available
- Midnight SDK packages already in `package.json`

## Plan Count
2 plans:
- **Plan 1:** Write the Compact contract and verify it compiles
- **Plan 2:** Build compilation pipeline scripts and serve ZK keys from `public/`
