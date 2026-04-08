/**
 * Ledger read utilities for Shadow Poll.
 *
 * These functions parse raw ledger state from the indexer into typed poll data.
 * They mirror the on-chain data structures from the Poll Manager Compact contract.
 *
 * IMPORTANT: Functions that use the compact-runtime (deriveTallyKey, derivePollId)
 * must be called via dynamic import in client code due to Turbopack stubbing.
 */

import type { PollData, Ledger } from "@/contracts/managed/contract";

/** Poll data with its ID, for UI consumption. */
export interface PollWithId {
  id: string;          // hex-encoded poll ID
  idBytes: Uint8Array; // raw poll ID bytes
  data: PollData;
}

/** Vote tallies for a single poll, indexed by option. */
export interface PollTallies {
  pollId: string;
  counts: bigint[];    // tally count per option index (length = option_count)
  total: bigint;       // sum of all option counts
}

/**
 * Converts a Uint8Array to a hex string.
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Converts a hex string to a Uint8Array.
 */
export function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Converts a bigint to a 32-byte Uint8Array (big-endian).
 * Matches the Compact `as Bytes<32>` cast behavior.
 */
export function bigintToBytes32(value: bigint): Uint8Array {
  const bytes = new Uint8Array(32);
  let remaining = value;
  for (let i = 31; i >= 0; i--) {
    bytes[i] = Number(remaining & BigInt(0xff));
    remaining >>= BigInt(8);
  }
  return bytes;
}

/**
 * Derives a tally key matching the contract's derive_tally_key pure circuit.
 * tally_key = persistentHash<Vector<2, Bytes<32>>>([poll_id, option_index_as_bytes])
 *
 * Uses dynamic import for the compact runtime (cannot be statically imported in client code).
 */
export async function deriveTallyKey(
  pollId: Uint8Array,
  optionIndex: number,
): Promise<Uint8Array> {
  const { persistentHash, CompactTypeVector, CompactTypeBytes } = await import(
    "@midnight-ntwrk/compact-runtime"
  );
  const optionBytes = bigintToBytes32(BigInt(optionIndex));
  // Construct the runtime type descriptor for Vector<2, Bytes<32>>
  const vectorType = new CompactTypeVector(2, new CompactTypeBytes(32));
  return persistentHash(vectorType, [pollId, optionBytes]);
}

/**
 * Derives a poll ID matching the contract's derive_poll_id pure circuit.
 * poll_id = persistentHash<Vector<3, Bytes<32>>>([metadata_hash, creator, count_bytes])
 */
export async function derivePollId(
  metadataHash: Uint8Array,
  creator: Uint8Array,
  countBytes: Uint8Array,
): Promise<Uint8Array> {
  const { persistentHash, CompactTypeVector, CompactTypeBytes } = await import(
    "@midnight-ntwrk/compact-runtime"
  );
  const vectorType = new CompactTypeVector(3, new CompactTypeBytes(32));
  return persistentHash(vectorType, [metadataHash, creator, countBytes]);
}

/**
 * Derives a vote nullifier matching the contract's derive_nullifier pure circuit.
 * nullifier = persistentHash<Vector<2, Bytes<32>>>([poll_id, voter_sk])
 *
 * The nullifier is deterministic: same wallet + same poll always produces the same value.
 * This allows duplicate vote detection without revealing voter identity.
 */
export async function deriveNullifier(
  pollId: Uint8Array,
  voterSk: Uint8Array,
): Promise<Uint8Array> {
  const { persistentHash, CompactTypeVector, CompactTypeBytes } = await import(
    "@midnight-ntwrk/compact-runtime"
  );
  const vectorType = new CompactTypeVector(2, new CompactTypeBytes(32));
  return persistentHash(vectorType, [pollId, voterSk]);
}

/**
 * Derives an invite code key matching the contract's derive_invite_key pure circuit.
 * key = persistentHash<Vector<2, Bytes<32>>>([poll_id, invite_code])
 *
 * Used client-side by the creator to compute code hashes before submitting to add_invite_codes,
 * and by voters to pre-validate their invite code before submitting cast_invite_vote.
 */
export async function deriveInviteKey(
  pollId: Uint8Array,
  inviteCode: Uint8Array,
): Promise<Uint8Array> {
  const { persistentHash, CompactTypeVector, CompactTypeBytes } = await import(
    "@midnight-ntwrk/compact-runtime"
  );
  const vectorType = new CompactTypeVector(2, new CompactTypeBytes(32));
  return persistentHash(vectorType, [pollId, inviteCode]);
}

/**
 * Reads a single poll from the ledger by its ID.
 * Returns null if the poll does not exist.
 *
 * @param ledger - Parsed ledger from parseLedger(state)
 * @param pollId - Raw poll ID bytes
 */
export function readPoll(
  ledger: Pick<Ledger, "polls">,
  pollId: Uint8Array,
): PollData | null {
  if (!ledger.polls.member(pollId)) return null;
  return ledger.polls.lookup(pollId);
}

/**
 * Reads the global poll count from the ledger.
 */
export function readPollCount(
  ledger: Pick<Ledger, "poll_count">,
): bigint {
  return ledger.poll_count;
}

/**
 * Reads vote tallies for a poll across all its options.
 *
 * @param ledger - Parsed ledger from parseLedger(state)
 * @param pollId - Raw poll ID bytes
 * @param optionCount - Number of options in the poll
 */
export async function readTallies(
  ledger: Pick<Ledger, "tallies">,
  pollId: Uint8Array,
  optionCount: number,
): Promise<PollTallies> {
  const counts: bigint[] = [];
  let total = BigInt(0);

  for (let i = 0; i < optionCount; i++) {
    const tallyKey = await deriveTallyKey(pollId, i);
    if (ledger.tallies.member(tallyKey)) {
      const count = ledger.tallies.lookup(tallyKey).read();
      counts.push(count);
      total += count;
    } else {
      counts.push(BigInt(0));
    }
  }

  return {
    pollId: bytesToHex(pollId),
    counts,
    total,
  };
}
