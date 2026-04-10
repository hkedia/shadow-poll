/**
 * Tests for ledger-utils.ts
 * 
 * Verifies ledger reading utilities, key derivation, and data conversion.
 */

import { describe, it, expect } from 'vitest';
import {
  bytesToHex,
  hexToBytes,
  bigintToBytes32,
  deriveTallyKey,
  derivePollId,
  deriveNullifier,
  deriveInviteKey,
  readPoll,
  readPollCount,
  readTallies,
  type PollWithId,
  type PollTallies,
} from '@/lib/midnight/ledger-utils';

describe('ledger-utils', () => {
  describe('bytesToHex', () => {
    it('should convert bytes to hex string', () => {
      const bytes = new Uint8Array([0, 1, 255, 16]);
      const hex = bytesToHex(bytes);
      
      expect(hex).toBe('0001ff10');
    });

    it('should handle empty array', () => {
      const bytes = new Uint8Array();
      const hex = bytesToHex(bytes);
      
      expect(hex).toBe('');
    });

    it('should pad single digits', () => {
      const bytes = new Uint8Array([1, 2, 3]);
      const hex = bytesToHex(bytes);
      
      expect(hex).toBe('010203');
    });
  });

  describe('hexToBytes', () => {
    it('should convert hex string to bytes', () => {
      const hex = '0001ff10';
      const bytes = hexToBytes(hex);
      
      expect(bytes).toEqual(new Uint8Array([0, 1, 255, 16]));
    });

    it('should handle empty string', () => {
      const bytes = hexToBytes('');
      
      expect(bytes).toEqual(new Uint8Array());
    });

    it('should handle lowercase hex', () => {
      const bytes = hexToBytes('abcdef');
      
      expect(bytes).toEqual(new Uint8Array([0xab, 0xcd, 0xef]));
    });

    it('should handle uppercase hex', () => {
      const bytes = hexToBytes('ABCDEF');
      
      expect(bytes).toEqual(new Uint8Array([0xab, 0xcd, 0xef]));
    });
  });

  describe('bigintToBytes32', () => {
    it('should convert bigint to 32-byte array', () => {
      const value = 12345n;
      const bytes = bigintToBytes32(value);
      
      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBe(32);
    });

    it('should use little-endian encoding', () => {
      const value = 1n;
      const bytes = bigintToBytes32(value);
      
      // Little-endian: LSB at index 0
      expect(bytes[0]).toBe(1);
      expect(bytes[1]).toBe(0);
      expect(bytes[31]).toBe(0);
    });

    it('should convert large numbers', () => {
      const value = 0x123456789abcdefn;
      const bytes = bigintToBytes32(value);
      
      expect(bytes.length).toBe(32);
      // Verify first few bytes contain the value in little-endian
      expect(bytes[0]).toBe(0xef);
      expect(bytes[1]).toBe(0xcd);
      expect(bytes[2]).toBe(0xab);
      expect(bytes[3]).toBe(0x89);
    });

    it('should handle zero', () => {
      const bytes = bigintToBytes32(0n);
      
      expect(bytes).toEqual(new Uint8Array(32));
    });
  });

  describe('deriveTallyKey', () => {
    it('should produce consistent key', async () => {
      const pollId = new Uint8Array(32).fill(1);
      const key1 = await deriveTallyKey(pollId, 0);
      const key2 = await deriveTallyKey(pollId, 0);
      
      expect(key1).toEqual(key2);
    });

    it('should produce 32-byte key', async () => {
      const pollId = new Uint8Array(32).fill(2);
      const key = await deriveTallyKey(pollId, 0);
      
      expect(key.length).toBe(32);
    });

    it('should produce different keys for different options', async () => {
      const pollId = new Uint8Array(32).fill(3);
      const key0 = await deriveTallyKey(pollId, 0);
      const key1 = await deriveTallyKey(pollId, 1);
      
      expect(key0).not.toEqual(key1);
    });

    it('should produce different keys for different polls', async () => {
      const pollId1 = new Uint8Array(32).fill(4);
      const pollId2 = new Uint8Array(32).fill(5);
      const key1 = await deriveTallyKey(pollId1, 0);
      const key2 = await deriveTallyKey(pollId2, 0);
      
      expect(key1).not.toEqual(key2);
    });
  });

  describe('derivePollId', () => {
    it('should produce 32-byte poll ID', async () => {
      const metadataHash = new Uint8Array(32).fill(1);
      const creator = new Uint8Array(32).fill(2);
      const countBytes = new Uint8Array(32).fill(0);
      
      const pollId = await derivePollId(metadataHash, creator, countBytes);
      
      expect(pollId.length).toBe(32);
    });

    it('should produce consistent ID for same inputs', async () => {
      const metadataHash = new Uint8Array(32).fill(3);
      const creator = new Uint8Array(32).fill(4);
      const countBytes = new Uint8Array(32).fill(5);
      
      const id1 = await derivePollId(metadataHash, creator, countBytes);
      const id2 = await derivePollId(metadataHash, creator, countBytes);
      
      expect(id1).toEqual(id2);
    });

    it('should produce different IDs for different metadata', async () => {
      const creator = new Uint8Array(32).fill(6);
      const countBytes = new Uint8Array(32).fill(0);
      
      const id1 = await derivePollId(new Uint8Array(32).fill(1), creator, countBytes);
      const id2 = await derivePollId(new Uint8Array(32).fill(2), creator, countBytes);
      
      expect(id1).not.toEqual(id2);
    });
  });

  describe('deriveNullifier', () => {
    it('should produce 32-byte nullifier', async () => {
      const pollId = new Uint8Array(32).fill(1);
      const voterSk = new Uint8Array(32).fill(2);
      
      const nullifier = await deriveNullifier(pollId, voterSk);
      
      expect(nullifier.length).toBe(32);
    });

    it('should produce consistent nullifier for same inputs', async () => {
      const pollId = new Uint8Array(32).fill(3);
      const voterSk = new Uint8Array(32).fill(4);
      
      const nullifier1 = await deriveNullifier(pollId, voterSk);
      const nullifier2 = await deriveNullifier(pollId, voterSk);
      
      expect(nullifier1).toEqual(nullifier2);
    });

    it('should produce different nullifiers for different polls', async () => {
      const voterSk = new Uint8Array(32).fill(5);
      
      const nullifier1 = await deriveNullifier(new Uint8Array(32).fill(1), voterSk);
      const nullifier2 = await deriveNullifier(new Uint8Array(32).fill(2), voterSk);
      
      expect(nullifier1).not.toEqual(nullifier2);
    });

    it('should produce different nullifiers for different voters', async () => {
      const pollId = new Uint8Array(32).fill(6);
      
      const nullifier1 = await deriveNullifier(pollId, new Uint8Array(32).fill(1));
      const nullifier2 = await deriveNullifier(pollId, new Uint8Array(32).fill(2));
      
      expect(nullifier1).not.toEqual(nullifier2);
    });
  });

  describe('deriveInviteKey', () => {
    it('should produce 32-byte invite key', async () => {
      const pollId = new Uint8Array(32).fill(1);
      const inviteCode = new Uint8Array(32).fill(2);
      
      const key = await deriveInviteKey(pollId, inviteCode);
      
      expect(key.length).toBe(32);
    });

    it('should produce consistent key for same inputs', async () => {
      const pollId = new Uint8Array(32).fill(3);
      const inviteCode = new Uint8Array(32).fill(4);
      
      const key1 = await deriveInviteKey(pollId, inviteCode);
      const key2 = await deriveInviteKey(pollId, inviteCode);
      
      expect(key1).toEqual(key2);
    });

    it('should produce different keys for different polls', async () => {
      const inviteCode = new Uint8Array(32).fill(5);
      
      const key1 = await deriveInviteKey(new Uint8Array(32).fill(1), inviteCode);
      const key2 = await deriveInviteKey(new Uint8Array(32).fill(2), inviteCode);
      
      expect(key1).not.toEqual(key2);
    });

    it('should produce different keys for different invite codes', async () => {
      const pollId = new Uint8Array(32).fill(6);
      
      const key1 = await deriveInviteKey(pollId, new Uint8Array(32).fill(1));
      const key2 = await deriveInviteKey(pollId, new Uint8Array(32).fill(2));
      
      expect(key1).not.toEqual(key2);
    });
  });

  describe('readPoll', () => {
    it('should return poll data if member exists', () => {
      const pollId = new Uint8Array(32).fill(1);
      const mockPollData = {
        metadata_hash: new Uint8Array(32),
        option_count: 3n,
        poll_type: 0,
        expiration_block: 1000n,
        creator: new Uint8Array(32),
      };

      const ledger = {
        polls: {
          member: () => true,
          lookup: () => mockPollData,
        },
      };

      const result = readPoll(ledger as unknown as Parameters<typeof readPoll>[0], pollId);
      
      expect(result).toEqual(mockPollData);
    });

    it('should return null if poll not found', () => {
      const pollId = new Uint8Array(32).fill(99);
      
      const ledger = {
        polls: {
          member: () => false,
        },
      };

      const result = readPoll(ledger as unknown as Parameters<typeof readPoll>[0], pollId);
      
      expect(result).toBeNull();
    });
  });

  describe('readPollCount', () => {
    it('should return poll count from ledger', () => {
      const ledger = {
        poll_count: 42n,
      };

      const count = readPollCount(ledger);
      
      expect(count).toBe(42n);
    });

    it('should handle zero count', () => {
      const ledger = {
        poll_count: 0n,
      };

      const count = readPollCount(ledger);
      
      expect(count).toBe(0n);
    });
  });

  describe('readTallies', () => {
    it('should return tallies for all options', async () => {
      const pollId = new Uint8Array(32).fill(1);
      const optionCount = 3;

      const ledger = {
        tallies: {
          member: () => true,
          lookup: () => ({
            read: () => 5n,
          }),
        },
      };

      const tallies = await readTallies(ledger as unknown as Parameters<typeof readTallies>[0], pollId, optionCount);
      
      expect(tallies.pollId).toBe(bytesToHex(pollId));
      expect(tallies.counts).toHaveLength(3);
      expect(tallies.counts.every(c => c === 5n)).toBe(true);
      expect(tallies.total).toBe(15n);
    });

    it('should return zero for options without tallies', async () => {
      const pollId = new Uint8Array(32).fill(2);
      const optionCount = 2;

      const ledger = {
        tallies: {
          member: () => false,
        },
      };

      const tallies = await readTallies(ledger as unknown as Parameters<typeof readTallies>[0], pollId, optionCount);
      
      expect(tallies.counts).toEqual([0n, 0n]);
      expect(tallies.total).toBe(0n);
    });

    it('should handle mixed tallies', async () => {
      const pollId = new Uint8Array(32).fill(3);
      let callCount = 0;

      const ledger = {
        tallies: {
          member: () => callCount++ === 0, // Only first option has tally
          lookup: () => ({
            read: () => 10n,
          }),
        },
      };

      const tallies = await readTallies(ledger as unknown as Parameters<typeof readTallies>[0], pollId, 2);
      
      expect(tallies.counts).toEqual([10n, 0n]);
      expect(tallies.total).toBe(10n);
    });
  });
});
