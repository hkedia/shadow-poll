/**
 * Tests for invite-codes.ts
 * 
 * Verifies invite code generation, hashing, and validation utilities.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateInviteCodes,
  inviteCodeToBytes32,
  storeInviteCodes,
  loadInviteCodes,
  formatCodesForCopy,
  formatCodesForCSV,
  type InviteCode,
} from './invite-codes';

describe('invite-codes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset localStorage mock
    localStorage.clear();
  });

  describe('generateInviteCodes', () => {
    it('should generate requested number of codes', async () => {
      const pollId = new Uint8Array(32).fill(1);
      const codeSet = await generateInviteCodes(5, pollId);

      expect(codeSet.codes).toHaveLength(5);
      expect(codeSet.pollId).toBe(bytesToHex(pollId));
      expect(codeSet.createdAt).toBeDefined();
    });

    it('should generate codes of correct length', async () => {
      const pollId = new Uint8Array(32).fill(2);
      const codeSet = await generateInviteCodes(3, pollId);

      codeSet.codes.forEach(code => {
        expect(code.code).toHaveLength(10);
      });
    });

    it('should generate unique codes', async () => {
      const pollId = new Uint8Array(32).fill(3);
      const codeSet = await generateInviteCodes(10, pollId);

      const uniqueCodes = new Set(codeSet.codes.map(c => c.code));
      expect(uniqueCodes.size).toBe(10);
    });

    it('should only contain alphanumeric characters', async () => {
      const pollId = new Uint8Array(32).fill(4);
      const codeSet = await generateInviteCodes(20, pollId);

      codeSet.codes.forEach(code => {
        expect(code.code).toMatch(/^[A-Z0-9]+$/);
      });
    });

    it('should generate 32-byte codeBytes for each code', async () => {
      const pollId = new Uint8Array(32).fill(5);
      const codeSet = await generateInviteCodes(3, pollId);

      codeSet.codes.forEach(code => {
        expect(code.codeBytes).toBeInstanceOf(Uint8Array);
        expect(code.codeBytes.length).toBe(32);
      });
    });

    it('should generate 32-byte hash for each code', async () => {
      const pollId = new Uint8Array(32).fill(6);
      const codeSet = await generateInviteCodes(3, pollId);

      codeSet.codes.forEach(code => {
        expect(code.hash).toBeInstanceOf(Uint8Array);
        expect(code.hash.length).toBe(32);
        expect(code.hashHex).toBeDefined();
        expect(code.hashHex).toHaveLength(64); // hex string
      });
    });

    it('should generate different hashes for different polls with same code', async () => {
      const pollId1 = new Uint8Array(32).fill(7);
      const pollId2 = new Uint8Array(32).fill(8);

      const set1 = await generateInviteCodes(1, pollId1);
      const set2 = await generateInviteCodes(1, pollId2);

      // Same code string would have different hashes because of different pollId
      expect(set1.codes[0].hashHex).not.toBe(set2.codes[0].hashHex);
    });
  });

  describe('inviteCodeToBytes32', () => {
    it('should convert code to 32-byte array', async () => {
      const bytes = await inviteCodeToBytes32('TESTCODE12');
      
      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBe(32);
    });

    it('should produce consistent results for same code', async () => {
      const bytes1 = await inviteCodeToBytes32('SAMECODE');
      const bytes2 = await inviteCodeToBytes32('SAMECODE');
      
      expect(bytes1).toEqual(bytes2);
    });

    it('should handle case insensitively', async () => {
      const bytes1 = await inviteCodeToBytes32('testcode');
      const bytes2 = await inviteCodeToBytes32('TESTCODE');
      
      expect(bytes1).toEqual(bytes2);
    });

    it('should trim whitespace', async () => {
      const bytes1 = await inviteCodeToBytes32('CODE');
      const bytes2 = await inviteCodeToBytes32('  CODE  ');
      
      expect(bytes1).toEqual(bytes2);
    });

    it('should produce different results for different codes', async () => {
      const bytes1 = await inviteCodeToBytes32('CODEONE');
      const bytes2 = await inviteCodeToBytes32('CODETWO');
      
      expect(bytes1).not.toEqual(bytes2);
    });
  });

  describe('storeInviteCodes', () => {
    it('should store codes in localStorage', () => {
      const pollIdHex = 'abcd1234';
      const codes: InviteCode[] = [
        {
          code: 'CODE1',
          codeBytes: new Uint8Array(32).fill(1),
          hash: new Uint8Array(32).fill(2),
          hashHex: 'hash1hex',
        },
      ];

      storeInviteCodes(pollIdHex, codes);

      const stored = localStorage.getItem(`shadow-poll:invite-codes:${pollIdHex}`);
      expect(stored).toBeDefined();
      
      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].code).toBe('CODE1');
    });

    it('should serialize Uint8Arrays as hex', () => {
      const pollIdHex = 'test1234';
      const codes: InviteCode[] = [
        {
          code: 'TEST',
          codeBytes: new Uint8Array([1, 2, 3, 4]),
          hash: new Uint8Array([5, 6, 7, 8]),
          hashHex: 'testhash',
        },
      ];

      storeInviteCodes(pollIdHex, codes);

      const stored = localStorage.getItem(`shadow-poll:invite-codes:${pollIdHex}`);
      const parsed = JSON.parse(stored!);
      
      expect(parsed[0].codeBytesHex).toBeDefined();
      expect(typeof parsed[0].codeBytesHex).toBe('string');
    });
  });

  describe('loadInviteCodes', () => {
    it('should load stored codes', () => {
      const pollIdHex = 'load1234';
      const stored = [
        {
          code: 'LOAD1',
          codeBytesHex: '01020304',
          hashHex: '05060708',
        },
      ];

      localStorage.setItem(
        `shadow-poll:invite-codes:${pollIdHex}`,
        JSON.stringify(stored)
      );

      const codes = loadInviteCodes(pollIdHex);

      expect(codes).toHaveLength(1);
      expect(codes![0].code).toBe('LOAD1');
      expect(codes![0].codeBytes).toBeInstanceOf(Uint8Array);
    });

    it('should return null when no codes stored', () => {
      const codes = loadInviteCodes('nonexistent');
      expect(codes).toBeNull();
    });

    it('should return null for invalid JSON', () => {
      localStorage.setItem('shadow-poll:invite-codes:bad', 'not-json');
      const codes = loadInviteCodes('bad');
      expect(codes).toBeNull();
    });

    it('should deserialize hex to Uint8Array', () => {
      const pollIdHex = 'hex1234';
      const stored = [
        {
          code: 'HEXTEST',
          codeBytesHex: 'aabbccdd',
          hashHex: '11223344',
        },
      ];

      localStorage.setItem(
        `shadow-poll:invite-codes:${pollIdHex}`,
        JSON.stringify(stored)
      );

      const codes = loadInviteCodes(pollIdHex);
      
      expect(codes![0].codeBytes).toEqual(
        new Uint8Array([0xaa, 0xbb, 0xcc, 0xdd])
      );
    });
  });

  describe('formatCodesForCopy', () => {
    it('should format codes as newline-separated string', () => {
      const codes: InviteCode[] = [
        { code: 'CODE1', codeBytes: new Uint8Array(), hash: new Uint8Array(), hashHex: '' },
        { code: 'CODE2', codeBytes: new Uint8Array(), hash: new Uint8Array(), hashHex: '' },
        { code: 'CODE3', codeBytes: new Uint8Array(), hash: new Uint8Array(), hashHex: '' },
      ];

      const formatted = formatCodesForCopy(codes);
      
      expect(formatted).toBe('CODE1\nCODE2\nCODE3');
    });

    it('should handle single code', () => {
      const codes: InviteCode[] = [
        { code: 'ONLY', codeBytes: new Uint8Array(), hash: new Uint8Array(), hashHex: '' },
      ];

      const formatted = formatCodesForCopy(codes);
      
      expect(formatted).toBe('ONLY');
    });

    it('should handle empty array', () => {
      const formatted = formatCodesForCopy([]);
      expect(formatted).toBe('');
    });
  });

  describe('formatCodesForCSV', () => {
    it('should format as CSV with header', () => {
      const codes: InviteCode[] = [
        { code: 'CSV1', codeBytes: new Uint8Array(), hash: new Uint8Array(), hashHex: 'hash1' },
        { code: 'CSV2', codeBytes: new Uint8Array(), hash: new Uint8Array(), hashHex: 'hash2' },
      ];

      const csv = formatCodesForCSV(codes, 'Test Poll');
      
      expect(csv).toContain('# Invite codes for: Test Poll');
      expect(csv).toContain('Code,Hash');
      expect(csv).toContain('CSV1,hash1');
      expect(csv).toContain('CSV2,hash2');
    });

    it('should include all codes', () => {
      const codes: InviteCode[] = Array(5).fill(null).map((_, i) => ({
        code: `CODE${i}`,
        codeBytes: new Uint8Array(),
        hash: new Uint8Array(),
        hashHex: `hash${i}`,
      }));

      const csv = formatCodesForCSV(codes, 'Multi Poll');
      
      expect(csv.split('\n').length).toBe(7); // header comment + header + 5 codes
    });
  });
});

// Helper function
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
