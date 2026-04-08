/**
 * Contract interaction service for Shadow Poll.
 *
 * This is the single module through which ALL contract interactions flow.
 * It wraps the Midnight SDK's contract APIs behind dynamic imports to comply
 * with the Turbopack stubbing constraint (all @midnight-ntwrk/* imports must
 * be dynamic — never at module top level).
 *
 * Exports:
 *   - deployPollContract — deploys a fresh Poll Manager contract
 *   - findPollContract — finds an already-deployed contract by address
 *   - callCreatePoll — calls the create_poll circuit
 *   - callCastVote — calls the cast_vote circuit
 *   - callCastInviteVote — calls the cast_invite_vote circuit
 *   - callAddInviteCodes — calls the add_invite_codes circuit
 *   - getContractAddress — reads the canonical contract address from env
 *   - fetchAllPolls — queries contract state for all polls
 *   - fetchPollWithTallies — fetches a single poll with its vote tallies
 */

import type { PollWithId, PollTallies } from "./ledger-utils";
import type { MidnightProviderSet } from "./types";
import type { PollData } from "@/contracts/managed/contract";

/** Parameters for creating a new poll on-chain. */
export interface CreatePollParams {
  metadataHash: Uint8Array;
  optionCount: number;
  pollType: number; // PollType enum value (0 = public_poll, 1 = invite_only)
  expirationBlock: bigint;
}

/** Parameters for casting a vote on-chain. */
export interface CastVoteParams {
  pollId: Uint8Array;
  optionIndex: number;
}

/**
 * Builds a compiled contract with witnesses and asset paths attached.
 * This is the shared setup for both deploy and find operations.
 *
 * ALL imports are dynamic (Turbopack constraint).
 */
async function buildCompiledContract(
  secretKey: Uint8Array,
  blockNumber: bigint,
) {
  const { CompiledContract } = await import("@midnight-ntwrk/compact-js");
  const { Contract } = await import("@/contracts/managed/contract");
  const { createWitnesses } = await import("./witness-impl");

  const witnesses = createWitnesses(secretKey, blockNumber);

  // The compiled contract's Contract class and the SDK's Contract.Any have
  // slightly different shapes (provableCircuits vs impureCircuits). We build
  // the compiled contract step by step, using type assertions to bridge the
  // gap between the Compact compiler output and the SDK's effect types.
  // The runtime behavior is correct — these casts only satisfy TypeScript.
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const compiled = (CompiledContract.make as any)("poll-manager", Contract);
  const withWit = (CompiledContract.withWitnesses as any)(compiled, witnesses);
  const withAssets = (CompiledContract.withCompiledFileAssets as any)(withWit, "contracts/managed");
  /* eslint-enable @typescript-eslint/no-explicit-any */

  return withAssets;
}

/**
 * Assembles MidnightProviders from the app's MidnightProviderSet.
 * Wraps the providers.ts assembleMidnightProviders with dynamic import.
 */
async function getProviders(providerSet: MidnightProviderSet) {
  const { assembleMidnightProviders } = await import("./providers");
  return assembleMidnightProviders(providerSet);
}

/**
 * Deploys a fresh Poll Manager contract to the Midnight network.
 *
 * This creates a new on-chain instance of the Poll Manager contract.
 * In the single-contract architecture (D-20), this should only be called once.
 * All subsequent interactions should use findPollContract.
 *
 * @param providerSet - The MidnightProviderSet from useWallet()
 * @param secretKey - 32-byte secret key from getSecretKeyFromWallet()
 * @param blockNumber - Current block number from getCurrentBlockNumber()
 * @returns The deployed contract with callTx interface and contract address
 */
export async function deployPollContract(
  providerSet: MidnightProviderSet,
  secretKey: Uint8Array,
  blockNumber: bigint,
) {
  const { deployContract } = await import("@midnight-ntwrk/midnight-js-contracts");

  const providers = await getProviders(providerSet);
  const compiledContract = await buildCompiledContract(secretKey, blockNumber);

  // Deploy with no private state (all Poll Manager ledger fields are public).
  // The SDK's deployContract overload for Contract<undefined> takes base options only.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deployed = await (deployContract as any)(providers, {
    compiledContract,
  });

  return deployed;
}

/**
 * Finds an already-deployed Poll Manager contract on the Midnight network.
 *
 * This connects to an existing on-chain contract instance by its address.
 * The returned object provides the callTx interface for circuit invocations.
 *
 * @param providerSet - The MidnightProviderSet from useWallet()
 * @param contractAddress - The on-chain address of the deployed contract
 * @param secretKey - 32-byte secret key from getSecretKeyFromWallet()
 * @param blockNumber - Current block number from getCurrentBlockNumber()
 * @returns The found contract with callTx interface
 */
export async function findPollContract(
  providerSet: MidnightProviderSet,
  contractAddress: string,
  secretKey: Uint8Array,
  blockNumber: bigint,
) {
  const { findDeployedContract } = await import("@midnight-ntwrk/midnight-js-contracts");

  const providers = await getProviders(providerSet);
  const compiledContract = await buildCompiledContract(secretKey, blockNumber);

  // Find with no private state (all Poll Manager ledger fields are public).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const found = await (findDeployedContract as any)(providers, {
    compiledContract,
    contractAddress,
  });

  return found;
}

/**
 * Calls the create_poll circuit on a deployed/found contract.
 *
 * This submits a transaction that creates a new poll on-chain.
 * The circuit takes the metadata hash, option count, poll type, and expiration block.
 * It returns the poll ID (Bytes<32>) as the circuit return value.
 *
 * @param contract - A deployed or found contract with callTx interface
 * @param params - Poll creation parameters
 * @returns The finalized transaction data including the poll ID in private.result
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function callCreatePoll(contract: any, params: CreatePollParams) {
  const { PollType } = await import("@/contracts/managed/contract");

  const pollTypeEnum = params.pollType === 1
    ? PollType.invite_only
    : PollType.public_poll;

  const result = await contract.callTx.create_poll(
    params.metadataHash,
    BigInt(params.optionCount),
    pollTypeEnum,
    params.expirationBlock,
  );

  return result;
}

/**
 * Calls the cast_vote circuit on a deployed/found contract.
 *
 * This submits a transaction that casts a vote on an existing poll.
 * The circuit takes the poll ID and option index.
 * It returns [] (empty tuple) — the vote is recorded in the ledger tallies.
 *
 * @param contract - A deployed or found contract with callTx interface
 * @param params - Vote casting parameters
 * @returns The finalized transaction data
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function callCastVote(contract: any, params: CastVoteParams) {
  const result = await contract.callTx.cast_vote(
    params.pollId,
    BigInt(params.optionIndex),
  );

  return result;
}

/** Parameters for casting an invite-only vote on-chain. */
export interface CastInviteVoteParams {
  pollId: Uint8Array;
  optionIndex: number;
  inviteCode: Uint8Array; // Bytes<32> derived from inviteCodeToBytes32()
}

/**
 * Calls the cast_invite_vote circuit on a deployed/found contract.
 *
 * This submits a transaction that casts a vote on an invite-only poll.
 * The invite code is passed as a private parameter — it is NOT disclosed
 * in the ZK proof. The circuit verifies the code by hashing it and checking
 * the hash against the on-chain invite_codes map.
 *
 * @param contract - A deployed or found contract with callTx interface
 * @param params - Invite vote parameters including the private invite code
 * @returns The finalized transaction data
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function callCastInviteVote(contract: any, params: CastInviteVoteParams) {
  const result = await contract.callTx.cast_invite_vote(
    params.pollId,
    BigInt(params.optionIndex),
    params.inviteCode,
  );
  return result;
}

/** Parameters for adding an invite code hash on-chain. */
export interface AddInviteCodeParams {
  pollId: Uint8Array;
  codeHash: Uint8Array; // Pre-computed deriveInviteKey(pollId, codeBytes)
}

/**
 * Calls the add_invite_codes circuit on a deployed/found contract.
 *
 * Submits a single invite code hash to the contract. The hash is the
 * pre-computed deriveInviteKey(poll_id, invite_code_bytes). Only the poll
 * creator can call this successfully — the circuit asserts caller == creator.
 *
 * For N invite codes, call this function N times.
 *
 * @param contract - A deployed or found contract with callTx interface
 * @param params - Code hash submission parameters
 * @returns The finalized transaction data
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function callAddInviteCodes(contract: any, params: AddInviteCodeParams) {
  const result = await contract.callTx.add_invite_codes(
    params.pollId,
    params.codeHash,
  );
  return result;
}

/**
 * Returns the canonical contract address from the environment variable.
 *
 * Strategy (per open question 1): Uses NEXT_PUBLIC_POLL_CONTRACT_ADDRESS.
 * If set, findPollContract uses it. If empty, the app deploys on first use.
 *
 * @returns The contract address string, or null if not configured
 */
export function getContractAddress(): string | null {
  const address = process.env.NEXT_PUBLIC_POLL_CONTRACT_ADDRESS;
  return address && address.trim().length > 0 ? address.trim() : null;
}

/**
 * Queries the on-chain contract state and returns all polls.
 *
 * Gets the full contract state from the indexer, parses the ledger,
 * and iterates the polls Map to build a typed array.
 *
 * @param providerSet - The MidnightProviderSet from useWallet()
 * @param contractAddress - The deployed contract address
 * @returns Array of polls with their IDs
 */
export async function fetchAllPolls(
  providerSet: MidnightProviderSet,
  contractAddress: string,
): Promise<PollWithId[]> {
  const { createIndexerProvider } = await import("./indexer");
  const { ledger: parseLedger } = await import("@/contracts/managed/contract");
  const { bytesToHex } = await import("./ledger-utils");

  const publicDataProvider = await createIndexerProvider(
    providerSet.indexerConfig.indexerUri,
    providerSet.indexerConfig.indexerWsUri,
  );

  const state = await publicDataProvider.queryContractState(contractAddress);
  if (!state) return [];

  // Parse the raw contract state into typed ledger data.
  // Cast through any because our structural IndexerPublicDataProvider returns
  // unknown, but the real SDK returns ContractState (which is StateValue).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ledgerState = parseLedger(state as any);
  const polls: PollWithId[] = [];

  // Iterate the polls Map using Symbol.iterator
  for (const [idBytes, data] of ledgerState.polls) {
    polls.push({
      id: bytesToHex(idBytes),
      idBytes,
      data: data as PollData,
    });
  }

  return polls;
}

/**
 * Fetches a single poll with its vote tallies.
 *
 * Gets the contract state, parses the ledger, reads the specific poll,
 * and derives tally keys to read vote counts for each option.
 *
 * @param providerSet - The MidnightProviderSet from useWallet()
 * @param contractAddress - The deployed contract address
 * @param pollIdHex - Hex-encoded poll ID
 * @returns Poll data with tallies, or null if not found
 */
export async function fetchPollWithTallies(
  providerSet: MidnightProviderSet,
  contractAddress: string,
  pollIdHex: string,
): Promise<{ poll: PollWithId; tallies: PollTallies } | null> {
  const { createIndexerProvider } = await import("./indexer");
  const { ledger: parseLedger } = await import("@/contracts/managed/contract");
  const { hexToBytes, readPoll, readTallies, bytesToHex } = await import("./ledger-utils");

  const publicDataProvider = await createIndexerProvider(
    providerSet.indexerConfig.indexerUri,
    providerSet.indexerConfig.indexerWsUri,
  );

  const state = await publicDataProvider.queryContractState(contractAddress);
  if (!state) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ledgerState = parseLedger(state as any);
  const pollIdBytes = hexToBytes(pollIdHex);
  const pollData = readPoll(ledgerState, pollIdBytes);

  if (!pollData) return null;

  const tallies = await readTallies(
    ledgerState,
    pollIdBytes,
    Number(pollData.option_count),
  );

  return {
    poll: {
      id: bytesToHex(pollIdBytes),
      idBytes: pollIdBytes,
      data: pollData,
    },
    tallies,
  };
}
