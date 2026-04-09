---
status: awaiting_human_verify
trigger: "When trying to create a poll, after approving the transaction, the UI shows: 'Unexpected error submitting scoped transaction '<unnamed>': Error: 'prove' returned an error: Error: Payload too large or too deeply nested.'"
created: 2026-04-09T00:00:00Z
updated: 2026-04-09T06:45:00Z
---

## Current Focus
<!-- OVERWRITE on each update - reflects NOW -->

hypothesis: CONFIRMED — VITE_POLL_CONTRACT_ADDRESS in .env.local points at the old contract (03207a...) which has the old verifier keys stored on-chain. The new contract (7aa409...) from deployment.json was deployed with the new compiled keys but .env.local was never updated. The app serves new verifier keys (from public/zk-keys/) but tries to interact with the old on-chain contract that has different (old) verifier keys embedded — causing the mismatch.
test: Update VITE_POLL_CONTRACT_ADDRESS in .env.local to 7aa409f5f1790928832e5b41fe6da09f7658666ecd262cd3901ea00da1bc688b. Restart Vite dev server. Retry poll creation.
expecting: Verifier key mismatch error disappears; poll creation succeeds.
next_action: Awaiting human verification — user must restart Vite dev server (Ctrl+C then bun run dev) then retry poll creation

## Symptoms
<!-- Written during gathering, then IMMUTABLE -->

expected: Poll should be created successfully after approving the transaction
actual: After approving the transaction, an error appears: "Unexpected error submitting scoped transaction '<unnamed>': Error: 'prove' returned an error: Error: Payload too large or too deeply nested"
errors: Unexpected error submitting scoped transaction '<unnamed>': Error: 'prove' returned an error: Error: Payload too large or too deeply nested
reproduction: Try to create a poll and approve the transaction
started: Unknown — user reported this issue now. Both the Vite dev server and Bun server are running.

## Eliminated
<!-- APPEND only - prevents re-investigating -->

- hypothesis: Oversized string/byte fields (poll title, description, options) passed to the circuit
  evidence: All circuit inputs are Bytes<32> (metadata_hash), Uint<8> (option_count), PollType (enum), Uint<64> (expiration_block) — all small fixed-size types. Text fields are stored off-chain; only their SHA-256 hash goes on-chain.
  timestamp: 2026-04-09T02:00:00Z

- hypothesis: Private transcript (witnesses) is too large
  evidence: Witnesses are local_secret_key() → Bytes<32> and current_block_number() → Uint<64> — only 40 bytes total. These are pushed to privateTranscriptOutputs and cannot be the cause.
  timestamp: 2026-04-09T02:30:00Z

- hypothesis: FetchZkConfigProvider URL construction or ZK key download is the problem
  evidence: Key files load correctly (verified by file existence in public/zk-keys/). ProofStation error is at the prove step, not the key fetch step.
  timestamp: 2026-04-09T03:00:00Z

## Evidence
<!-- APPEND only - facts discovered -->

- timestamp: 2026-04-09T02:00:00Z
  checked: contracts/src/poll.compact — create_poll circuit
  found: create_poll does 10 conditional tallies.insertDefault() calls (one for each possible option index 0–9), guarded by if (d_option_count > N). Also does 1 polls.insert() and 1 poll_count.increment().
  implication: Each queryLedgerState call appends to partialProofData.publicTranscript. With 10 tally inserts + 1 poll insert + 1 counter read + 1 counter increment, the transcript can have up to 13 entries, each containing encoded StateValue blobs.

- timestamp: 2026-04-09T02:30:00Z
  checked: contracts/managed/keys/ — file sizes
  found: create_poll.prover = 19.5 MB (vs cast_vote = 5.2 MB, cast_invite_vote = 5.2 MB, add_invite_codes = 2.8 MB). create_poll.bzkir = 1568 bytes (vs 320-500 bytes for other circuits).
  implication: create_poll is the most complex circuit by a factor of ~4x. The circuit complexity directly inflates the ZK proof payload sent to ProofStation.

- timestamp: 2026-04-09T03:00:00Z
  checked: contracts/managed/contract/index.js — compiled create_poll implementation
  found: The compiled JS for create_poll contains 10 separate __compactRuntime.queryLedgerState() calls with { push: { storage: true, value: StateValue.newCell(...).encode() } } for the tally insertDefault operations, plus the poll insert and counter increment. These all serialize into publicTranscript.
  implication: The publicTranscript payload is too large for ProofStation's limit. This directly explains the "Payload too large" error.

- timestamp: 2026-04-09T04:00:00Z
  checked: lib/midnight/ledger-utils.ts — readTallies function (lines 155-164)
  found: readTallies() already guards each tally read with `if (ledger.tallies.member(tallyKey))` — if a tally key is missing, it returns 0n instead of erroring. This means tally entries don't need to be pre-initialized.
  implication: It is safe to remove tally pre-initialization from create_poll and instead initialize lazily in cast_vote/cast_invite_vote.

- timestamp: 2026-04-09T05:00:00Z
  checked: Compact Map API in cast_vote and cast_invite_vote
  found: Both circuits currently call tallies.lookup(tally_key).increment(1) — this requires the tally entry to already exist. Compact's Map supports insertDefault to initialize a Counter at 0 if not present. We can replace lookup().increment() with insertDefault() + lookup().increment() to lazy-init on first vote.
  implication: Fix is clean: (1) remove 10 insertDefault calls from create_poll, (2) add insertDefault call before lookup().increment() in both cast_vote and cast_invite_vote.

- timestamp: 2026-04-09T06:35:00Z
  checked: .env.local and deployment.json
  found: .env.local has VITE_POLL_CONTRACT_ADDRESS=03207a5c6eab8f88b18fcd4661daa6a9f66b74c553862c39f4359d831b14e73c (old contract). deployment.json has contractAddress=7aa409f5f1790928832e5b41fe6da09f7658666ecd262cd3901ea00da1bc688b (new contract, deployed 2026-04-09T00:48:52Z after the recompile).
  implication: App is sending transactions to the old on-chain contract (which has old verifier keys stored on-chain) while serving new verifier keys (from public/zk-keys/ which was updated by the recompile). This is a simple stale env var.

- timestamp: 2026-04-09T06:37:00Z
  checked: contracts/managed/keys/*.verifier vs public/zk-keys/keys/*.verifier (md5sum comparison)
  found: All 4 verifier files are byte-for-byte identical between managed/keys and public/zk-keys/keys — the compile script correctly copied them. No issue with key serving.
  implication: The only problem is the contract address. Fix is to update VITE_POLL_CONTRACT_ADDRESS in .env.local to match the new deployment.

## Resolution
<!-- OVERWRITE as understanding evolves -->

root_cause: Two-part root cause: (1) The original create_poll circuit pre-initialized up to 10 tally Counter entries in a single ZK circuit execution — each insertDefault generated a queryLedgerState call that inflated partialProofData.publicTranscript, exceeding ProofStation's payload limit. (2) After fixing (1) and recompiling, a new contract was deployed with the new verifier keys, but VITE_POLL_CONTRACT_ADDRESS in .env.local still pointed at the old contract address (old verifier keys on-chain), causing a verifier key mismatch when the app tried to interact with the old contract while serving new verifier keys.
fix: (1) Removed all 10 tallies.insertDefault() calls from create_poll; moved lazy tally init to cast_vote and cast_invite_vote. Recompiled. (2) Updated VITE_POLL_CONTRACT_ADDRESS in .env.local from 03207a... to 7aa409f5f1790928832e5b41fe6da09f7658666ecd262cd3901ea00da1bc688b (the newly deployed contract). Requires Vite dev server restart.
verification: Awaiting user confirmation after restarting dev server.
files_changed: [contracts/src/poll.compact, contracts/managed/contract/index.js, contracts/managed/contract/index.d.ts, contracts/managed/contract/index.js.map, contracts/managed/keys/create_poll.prover, contracts/managed/keys/cast_vote.prover, contracts/managed/keys/cast_invite_vote.prover, contracts/managed/keys/create_poll.verifier, contracts/managed/keys/cast_vote.verifier, contracts/managed/keys/cast_invite_vote.verifier, contracts/managed/zkir/create_poll.bzkir, contracts/managed/zkir/cast_vote.bzkir, contracts/managed/zkir/cast_invite_vote.bzkir, public/zk-keys/keys/*, public/zk-keys/zkir/*, .env.local]
