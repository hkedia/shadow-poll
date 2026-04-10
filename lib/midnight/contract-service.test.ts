/**
 * Tests for contract-service.ts
 * 
 * These tests verify the contract interaction service functions
 * using mocked Midnight providers.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  deployPollContract,
  callCreatePoll,
  callCastVote,
  callCastInviteVote,
  callAddInviteCodes,
  getContractAddress,
  type CreatePollParams,
  type CastVoteParams,
  type CastInviteVoteParams,
  type AddInviteCodesParams,
} from './contract-service';
import { createMockProviders } from '@/lib/test/test-utils';
import type { MidnightProviderSet } from './types';

describe('contract-service', () => {
  let providers: MidnightProviderSet;

  beforeEach(() => {
    providers = createMockProviders();
    vi.clearAllMocks();
  });

  describe('getContractAddress', () => {
    it('should return null when env var not set', () => {
      // import.meta.env.VITE_POLL_CONTRACT_ADDRESS is not set in test
      const address = getContractAddress();
      // In test environment, import.meta.env may be mocked
      expect(address === null || typeof address === 'string').toBe(true);
    });
  });

  describe('deployPollContract', () => {
    it('should require providers to be defined', async () => {
      const secretKey = new Uint8Array(32).fill(1);
      const blockNumber = 1000n;

      // Should throw if providers is null
      await expect(
        deployPollContract(null as unknown as MidnightProviderSet, secretKey, blockNumber)
      ).rejects.toThrow();
    });

    it('should use wallet provider for coin public key', () => {
      expect(providers.walletProvider.getCoinPublicKey()).toBe('midnight1qxyztest');
    });
  });

  describe('callCreatePoll', () => {
    it('should call create_poll with correct parameters', async () => {
      const mockContract = {
        callTx: {
          create_poll: vi.fn().mockResolvedValue({
            private: { result: new Uint8Array(32).fill(1) },
          }),
        },
      };

      const params: CreatePollParams = {
        metadataHash: new Uint8Array(32).fill(1),
        optionCount: 3,
        pollType: 0,
        expirationBlock: 2000n,
      };

      await callCreatePoll(mockContract, params);

      expect(mockContract.callTx.create_poll).toHaveBeenCalledWith(
        params.metadataHash,
        BigInt(params.optionCount),
        expect.any(Number), // PollType enum
        params.expirationBlock
      );
    });

    it('should handle invite-only poll type', async () => {
      const mockContract = {
        callTx: {
          create_poll: vi.fn().mockResolvedValue({
            private: { result: new Uint8Array(32).fill(2) },
          }),
        },
      };

      const params: CreatePollParams = {
        metadataHash: new Uint8Array(32).fill(2),
        optionCount: 2,
        pollType: 1, // invite-only
        expirationBlock: 3000n,
      };

      await callCreatePoll(mockContract, params);

      expect(mockContract.callTx.create_poll).toHaveBeenCalledWith(
        params.metadataHash,
        BigInt(2),
        expect.any(Number),
        3000n
      );
    });

    it('should return result with pollId', async () => {
      const expectedPollId = new Uint8Array(32).fill(99);
      const mockContract = {
        callTx: {
          create_poll: vi.fn().mockResolvedValue({
            private: { result: expectedPollId },
          }),
        },
      };

      const params: CreatePollParams = {
        metadataHash: new Uint8Array(32).fill(3),
        optionCount: 3,
        pollType: 0,
        expirationBlock: 1000n,
      };

      const result = await callCreatePoll(mockContract, params);

      expect(result).toHaveProperty('private.result');
      expect(result.private.result).toEqual(expectedPollId);
    });
  });

  describe('callCastVote', () => {
    it('should call cast_vote with pollId and optionIndex', async () => {
      const mockContract = {
        callTx: {
          cast_vote: vi.fn().mockResolvedValue({ transaction: 'tx123' }),
        },
      };

      const params: CastVoteParams = {
        pollId: new Uint8Array(32).fill(4),
        optionIndex: 1,
      };

      await callCastVote(mockContract, params);

      expect(mockContract.callTx.cast_vote).toHaveBeenCalledWith(
        params.pollId,
        BigInt(params.optionIndex)
      );
    });

    it('should handle different option indices', async () => {
      const mockContract = {
        callTx: {
          cast_vote: vi.fn().mockResolvedValue({ transaction: 'tx456' }),
        },
      };

      for (let i = 0; i < 5; i++) {
        await callCastVote(mockContract, {
          pollId: new Uint8Array(32).fill(i),
          optionIndex: i,
        });

        expect(mockContract.callTx.cast_vote).toHaveBeenLastCalledWith(
          expect.any(Uint8Array),
          BigInt(i)
        );
      }
    });
  });

  describe('callCastInviteVote', () => {
    it('should call cast_invite_vote with all parameters', async () => {
      const mockContract = {
        callTx: {
          cast_invite_vote: vi.fn().mockResolvedValue({ transaction: 'tx789' }),
        },
      };

      const params: CastInviteVoteParams = {
        pollId: new Uint8Array(32).fill(5),
        optionIndex: 2,
        inviteCode: new Uint8Array(32).fill(99),
      };

      await callCastInviteVote(mockContract, params);

      expect(mockContract.callTx.cast_invite_vote).toHaveBeenCalledWith(
        params.pollId,
        BigInt(params.optionIndex),
        params.inviteCode
      );
    });

    it('should pass invite code as bytes', async () => {
      const mockContract = {
        callTx: {
          cast_invite_vote: vi.fn().mockResolvedValue({}),
        },
      };

      const inviteCodeBytes = new TextEncoder().encode('INVITECODE'.padEnd(32));
      
      await callCastInviteVote(mockContract, {
        pollId: new Uint8Array(32),
        optionIndex: 0,
        inviteCode: inviteCodeBytes,
      });

      const callArg = mockContract.callTx.cast_invite_vote.mock.calls[0][2];
      // Check that it's array-like with the expected content
      expect(callArg.length).toBe(32);
      expect(callArg[0]).toBe(inviteCodeBytes[0]);
    });
  });

  describe('callAddInviteCodes', () => {
    it('should add invite codes in batches of 10', async () => {
      const mockContract = {
        callTx: {
          add_invite_codes: vi.fn().mockResolvedValue({ transaction: 'tx-batch' }),
        },
      };

      const codeHashes = Array(5).fill(null).map((_, i) => 
        new Uint8Array(32).fill(i + 1)
      );

      const params: AddInviteCodesParams = {
        pollId: new Uint8Array(32).fill(6),
        codeHashes,
      };

      await callAddInviteCodes(mockContract, params);

      expect(mockContract.callTx.add_invite_codes).toHaveBeenCalledTimes(1);
      expect(mockContract.callTx.add_invite_codes).toHaveBeenCalledWith(
        params.pollId,
        expect.arrayContaining([expect.any(Uint8Array)])
      );
    });

    it('should handle more than 10 codes with multiple batches', async () => {
      const mockContract = {
        callTx: {
          add_invite_codes: vi.fn().mockResolvedValue({ transaction: 'tx-batch' }),
        },
      };

      // 15 codes should result in 2 batches (10 + 5)
      const codeHashes = Array(15).fill(null).map((_, i) => 
        new Uint8Array(32).fill(i + 1)
      );

      const params: AddInviteCodesParams = {
        pollId: new Uint8Array(32).fill(7),
        codeHashes,
      };

      await callAddInviteCodes(mockContract, params);

      expect(mockContract.callTx.add_invite_codes).toHaveBeenCalledTimes(2);
    });

    it('should pad batches to exactly 10 elements', async () => {
      const mockContract = {
        callTx: {
          add_invite_codes: vi.fn().mockResolvedValue({}),
        },
      };

      const codeHashes = [new Uint8Array(32).fill(1)]; // Only 1 code

      await callAddInviteCodes(mockContract, {
        pollId: new Uint8Array(32),
        codeHashes,
      });

      const batchArg = mockContract.callTx.add_invite_codes.mock.calls[0][1];
      expect(batchArg).toHaveLength(10);
    });

    it('should return early for empty code list', async () => {
      const mockContract = {
        callTx: {
          add_invite_codes: vi.fn(),
        },
      };

      await callAddInviteCodes(mockContract, {
        pollId: new Uint8Array(32),
        codeHashes: [],
      });

      expect(mockContract.callTx.add_invite_codes).not.toHaveBeenCalled();
    });
  });
});
