/**
 * Contract testing utilities for testkit-js simulator.
 * 
 * These helpers provide a simplified interface for testing Compact contracts
 * in a simulated Midnight ledger environment.
 */

import { describe, it, expect, beforeAll } from 'vitest';

// Types for test environment (mocked for unit test compatibility)
export interface TestEnvironment {
  createUser: () => TestSession;
  deployContract: (compiledContract: unknown) => Promise<TestContract>;
  getBlockNumber: () => bigint;
}

export interface TestSession {
  address: string;
  secretKey: Uint8Array;
}

export interface TestContract {
  address: string;
  callTx: {
    create_poll: (params: CreatePollParams) => Promise<CreatePollResult>;
    cast_vote: (params: CastVoteParams) => Promise<void>;
    cast_invite_vote: (params: CastInviteVoteParams) => Promise<void>;
    add_invite_codes: (params: AddInviteCodesParams) => Promise<void>;
  };
  state: {
    polls: Map<string, unknown>;
    tallies: Map<string, bigint>;
    vote_nullifiers: Map<string, boolean>;
    invite_codes: Map<string, boolean>;
  };
}

export interface CreatePollParams {
  metadataHash: Uint8Array;
  optionCount: number;
  pollType: number;
  expirationBlock: bigint;
}

export interface CreatePollResult {
  pollId: Uint8Array;
}

export interface CastVoteParams {
  pollId: Uint8Array;
  optionIndex: number;
  voterSecretKey?: Uint8Array;
}

export interface CastInviteVoteParams {
  pollId: Uint8Array;
  optionIndex: number;
  inviteCode: Uint8Array;
  voterSecretKey?: Uint8Array;
}

export interface AddInviteCodesParams {
  pollId: Uint8Array;
  codeHashes: Uint8Array[];
}

/**
 * Creates a mock test environment for contract testing.
 * In a real testkit-js environment, this would connect to the simulator.
 */
export async function setupTestEnvironment(): Promise<TestEnvironment> {
  // Mock implementation - in real usage, this would use testkit-js TestEnvironment
  let blockNumber = 1000n;
  const users: TestSession[] = [];
  
  return {
    createUser: () => {
      const user: TestSession = {
        address: `midnight1user${users.length}`,
        secretKey: new Uint8Array(32).fill(users.length + 1),
      };
      users.push(user);
      return user;
    },
    deployContract: async () => {
      // Return a mock contract - in real tests this would load from compiled JSON
      throw new Error('Deploy contract requires testkit-js simulator. Use integration tests.');
    },
    getBlockNumber: () => blockNumber++,
  };
}

/**
 * Creates a test user session.
 */
export function createTestUser(env: TestEnvironment): TestSession {
  return env.createUser();
}

/**
 * Deploys the poll contract to the simulator.
 * Note: Requires actual testkit-js simulator environment.
 */
export async function deployPollContract(
  session: TestSession,
): Promise<TestContract> {
  // This is a placeholder - real implementation requires testkit-js
  throw new Error(
    'deployPollContract requires @midnight-ntwrk/testkit-js simulator. ' +
    'Ensure tests are run with the contracts test project.'
  );
}

/**
 * Generates a deterministic poll ID for testing.
 */
export async function generatePollId(
  metadataHash: Uint8Array,
  creator: Uint8Array,
  count: number,
): Promise<Uint8Array> {
  const data = new Uint8Array([...metadataHash, ...creator, count]);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(hashBuffer);
}

/**
 * Generates an invite code hash for testing.
 */
export async function generateInviteCodeHash(
  pollId: Uint8Array,
  code: string,
): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const codeBytes = encoder.encode(code.toUpperCase().trim());
  const data = new Uint8Array([...pollId, ...codeBytes]);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(hashBuffer);
}

/**
 * Converts bytes to hex string.
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Converts hex string to bytes.
 */
export function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

/**
 * Generates a tally key for testing.
 */
export async function generateTallyKey(
  pollId: Uint8Array,
  optionIndex: number,
): Promise<Uint8Array> {
  const indexBytes = new Uint8Array(32);
  indexBytes[0] = optionIndex;
  const data = new Uint8Array([...pollId, ...indexBytes]);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(hashBuffer);
}

/**
 * Generates a vote nullifier for testing.
 */
export async function generateNullifier(
  pollId: Uint8Array,
  voterSecretKey: Uint8Array,
): Promise<Uint8Array> {
  const data = new Uint8Array([...pollId, ...voterSecretKey]);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(hashBuffer);
}
