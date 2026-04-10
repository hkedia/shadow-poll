/**
 * Tests for witness-impl.ts
 * 
 * Verifies witness creation functions for contract circuits.
 */

import { describe, it, expect } from 'vitest';
import {
  createWitnesses,
  getSecretKeyFromWallet,
} from './witness-impl';
import type { WalletProviderApi } from './types';

describe('witness-impl', () => {
  describe('createWitnesses', () => {
    it('should create witnesses with secret key and block number', () => {
      const secretKey = new Uint8Array(32).fill(1);
      const blockNumber = 1000n;

      const witnesses = createWitnesses<unknown>(secretKey, blockNumber);

      expect(witnesses).toHaveProperty('local_secret_key');
      expect(witnesses).toHaveProperty('current_block_number');
    });

    it('should return secret key from local_secret_key witness', () => {
      const secretKey = new Uint8Array(32).fill(99);
      const witnesses = createWitnesses<unknown>(secretKey, 1000n);

      const context = { privateState: {} };
      const [newContext, returnedKey] = witnesses.local_secret_key(context);

      expect(returnedKey).toEqual(secretKey);
      expect(newContext).toBe(context); // Context passed through unchanged
    });

    it('should return block number from current_block_number witness', () => {
      const blockNumber = 5000n;
      const witnesses = createWitnesses<unknown>(new Uint8Array(32), blockNumber);

      const context = { privateState: {} };
      const [newContext, returnedBlock] = witnesses.current_block_number(context);

      expect(returnedBlock).toBe(blockNumber);
      expect(newContext).toBe(context); // Context passed through unchanged
    });

    it('should maintain private state through witnesses', () => {
      type PS = { counter: number };
      const privateState: PS = { counter: 42 };

      const witnesses = createWitnesses<PS>(new Uint8Array(32), 1000n);

      const context1 = { privateState };
      const [newState1, _key] = witnesses.local_secret_key(context1);
      const context2 = { privateState: newState1 };
      const [newState2, _block] = witnesses.current_block_number(context2);

      expect(newState2).toBe(privateState);
      expect(newState2.counter).toBe(42);
    });
  });

  describe('getSecretKeyFromWallet', () => {
    it('should derive key from coin public key', async () => {
      const mockWalletProvider: WalletProviderApi = {
        getCoinPublicKey: () => 'midnight1testaddress',
        balanceTx: async () => ({}),
        getEncryptionPublicKey: () => 'enc1test',
      };

      const secretKey = await getSecretKeyFromWallet(mockWalletProvider);

      expect(secretKey).toBeInstanceOf(Uint8Array);
      expect(secretKey.length).toBe(32);
    });

    it('should produce consistent key for same coin public key', async () => {
      const mockWalletProvider: WalletProviderApi = {
        getCoinPublicKey: () => 'consistent-address',
        balanceTx: async () => ({}),
        getEncryptionPublicKey: () => 'enc1test',
      };

      const key1 = await getSecretKeyFromWallet(mockWalletProvider);
      const key2 = await getSecretKeyFromWallet(mockWalletProvider);

      expect(key1).toEqual(key2);
    });

    it('should produce different keys for different addresses', async () => {
      const provider1: WalletProviderApi = {
        getCoinPublicKey: () => 'address-1',
        balanceTx: async () => ({}),
        getEncryptionPublicKey: () => 'enc1',
      };
      const provider2: WalletProviderApi = {
        getCoinPublicKey: () => 'address-2',
        balanceTx: async () => ({}),
        getEncryptionPublicKey: () => 'enc2',
      };

      const key1 = await getSecretKeyFromWallet(provider1);
      const key2 = await getSecretKeyFromWallet(provider2);

      expect(key1).not.toEqual(key2);
    });

    it('should return zero key if coin public key unavailable', async () => {
      const mockWalletProvider: WalletProviderApi = {
        getCoinPublicKey: () => '',
        balanceTx: async () => ({}),
        getEncryptionPublicKey: () => 'enc1test',
      };

      const secretKey = await getSecretKeyFromWallet(mockWalletProvider);

      expect(secretKey).toEqual(new Uint8Array(32));
    });

    it('should return zero key if getCoinPublicKey throws', async () => {
      const mockWalletProvider: WalletProviderApi = {
        getCoinPublicKey: () => { throw new Error('Wallet locked'); },
        balanceTx: async () => ({}),
        getEncryptionPublicKey: () => 'enc1test',
      };

      const secretKey = await getSecretKeyFromWallet(mockWalletProvider);

      expect(secretKey).toEqual(new Uint8Array(32));
    });
  });
});
