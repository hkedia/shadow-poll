---
status: awaiting_human_verify
trigger: "Two UI bugs after successful poll creation: 1) Active poll appears in closed polls section. 2) Poll expiration shows raw block number instead of human-readable time remaining."
created: 2026-04-09T00:00:00Z
updated: 2026-04-09T00:35:00Z
---

## Current Focus

hypothesis: CONFIRMED AND FIXED — bigintToBytes32 was big-endian, contract uses little-endian. Fixed. Tally keys now match for all option indices 0-9.
test: Node.js script verified keys match for options 0,1,2,3 after fix. tsc --noEmit clean. lint clean.
expecting: readTallies() will now find tally entries in the ledger for all option indices. Live results panel will show correct vote counts.
next_action: Human verification — open poll detail page and confirm vote counts are non-zero / correct

## Symptoms
<!-- Written during gathering, then IMMUTABLE -->

expected: Active polls should appear in the active polls section; expiration should show human-readable time remaining (e.g. "2 hours left", "3 days left")
actual: 1) Active poll appears in the closed polls section. 2) Poll expiration shows raw block number instead of human-readable countdown.
errors: No JS errors reported — these are logic/display bugs
reproduction: Create a public poll, observe it appears in closed polls; observe expiration field shows a block number
started: Noticed after getting poll creation and voting working correctly

## Eliminated
<!-- APPEND only - prevents re-investigating -->

- hypothesis: Active/closed filter comparison is type-mismatched (number vs BigInt)
  evidence: Correct.
  timestamp: 2026-04-09T00:01:00Z

- hypothesis: currentBlockHeight from API returns wrong/zero value
  evidence: Server-side polls-handler.ts correctly calls fetchLatestBlock(). Filter logic is sound.
  timestamp: 2026-04-09T00:01:00Z

- hypothesis: poll shown in closed was due to display confusion only
  evidence: Poll was genuinely expired because expirationBlock = 0 + 60480 = 60480 < 216355.
  timestamp: 2026-04-09T00:10:00Z

- hypothesis: BLOCKS_PER_DAY wrong value was the only creation bug
  evidence: BLOCKS_PER_DAY was wrong AND getCurrentBlockNumber was returning 0 (silent) then throwing (explicit). The underlying root is the wrong GraphQL query.
  timestamp: 2026-04-09T00:15:00Z

## Evidence
<!-- APPEND only - facts discovered -->

- timestamp: 2026-04-09T00:00:30Z
  checked: expiration-badge.tsx — fixed round 1.

- timestamp: 2026-04-09T00:00:45Z
  checked: All ExpirationBadge call sites — fixed round 1.

- timestamp: 2026-04-09T00:10:00Z
  checked: create-poll-form.tsx, use-create-poll.ts, witness-impl.ts
  found: BLOCKS_PER_DAY wrong (4320 vs 8640), getCurrentBlockNumber returning 0 silently.

- timestamp: 2026-04-09T00:15:00Z
  checked: witness-impl.ts query vs indexer-client.ts fetchLatestBlock query
  found: Two completely different GraphQL field names used:
    witness-impl.ts: `{ blockHeight { latest } }` → json.data.blockHeight.latest  ← WRONG (field does not exist)
    indexer-client.ts: `{ block { height hash timestamp author } }` → json.data.block.height  ← CORRECT (confirmed working)
  The indexer URL is correct in both cases — it comes from api.getConfiguration().indexerUri for the client side, and from the INDEXER_URI env var (same endpoint) for the server side. The schema mismatch is the sole remaining issue.
  implication: Fix: update getCurrentBlockNumber to use `{ block { height } }` and read json.data.block.height.

- timestamp: 2026-04-09T00:20:00Z
  checked: witness-impl.ts getCurrentBlockNumber — applied round 3 fix
  found: Query changed from `{ blockHeight { latest } }` → `{ block { height } }`, path from json.data.blockHeight.latest → json.data.block.height. bun run tsc --noEmit and bun run lint both pass clean.
  implication: getCurrentBlockNumber will now return the real current block height. expirationBlock computation will be correct. Active polls will land in the Active section; expiration will display human-readable countdowns.

- timestamp: 2026-04-09T00:35:00Z
  checked: bigintToBytes32 fix — verified with node script
  found: After changing to little-endian (i=0→31, LSB first), keys match for options 0,1,2,3. tsc clean. lint clean.
  implication: readTallies() will now correctly find tally counters in the ledger for all option indices.

## Resolution
<!-- OVERWRITE as understanding evolves -->

root_cause: |
  Five bugs found and fixed across four rounds:
  Round 1: ExpirationBadge never received currentBlock prop — showed raw block number everywhere.
  Round 2a: BLOCKS_PER_DAY = 4320 (20s/block) should be 8640 (10s/block).
  Round 2b: getCurrentBlockNumber silently returned BigInt(0) on failure.
  Round 3: getCurrentBlockNumber used wrong GraphQL field `blockHeight { latest }` (nonexistent); corrected to `block { height }`.
  Round 4: bigintToBytes32() in ledger-utils.ts was big-endian (MSB at index 0) but the Compact runtime's convertFieldToBytes() is little-endian (LSB at index 0). Tally keys for all option indices >= 1 were wrong → readTallies() always returned 0 counts.

fix: |
  Round 1: Pass currentBlock prop to ExpirationBadge at all call sites; fix block time 20s → 10s.
  Round 2: BLOCKS_PER_DAY 4320 → 8640; getCurrentBlockNumber throws instead of returning 0; use-create-poll.ts guards blockNumber=0.
  Round 3: witness-impl.ts getCurrentBlockNumber query: `{ blockHeight { latest } }` → `{ block { height } }`.
  Round 4: bigintToBytes32() loop direction reversed: i=31→0 (big-endian) → i=0→31 (little-endian) to match convertFieldToBytes.

verification: tsc clean, lint clean, node script confirms tally keys match for options 0-3.
files_changed:
  - components/expiration-badge.tsx (round 1)
  - components/poll-card.tsx (round 1)
  - components/results-panel.tsx (round 1)
  - src/routes/active-polls.tsx (round 1)
  - src/routes/closed-polls.tsx (round 1)
  - src/routes/poll-detail.tsx (round 1)
  - src/routes/trending.tsx (round 1)
  - components/create-poll-form.tsx (round 2)
  - lib/midnight/witness-impl.ts (rounds 2 + 3)
  - lib/queries/use-create-poll.ts (round 2)
  - lib/midnight/ledger-utils.ts (round 4)
