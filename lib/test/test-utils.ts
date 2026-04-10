import { vi } from 'vitest';
import type { MidnightProviderSet } from '../midnight/types';

export function createMockWalletProvider() {
  return {
    balanceTx: vi.fn().mockResolvedValue({}),
    getCoinPublicKey: vi.fn().mockReturnValue('midnight1qxyztest'),
    getEncryptionPublicKey: vi.fn().mockReturnValue('enc1test'),
  };
}

export function createMockZkConfigProvider() {
  return {
    getProvingKeyURI: vi.fn().mockReturnValue('https://example.com/proving.key'),
    getVerifyingKeyURI: vi.fn().mockReturnValue('https://example.com/verifying.key'),
  };
}

export function createMockProofProvider() {
  return {
    proveTx: vi.fn().mockResolvedValue({
      transaction: 'mock-tx-id',
    }),
  };
}

export function createMockMidnightProvider() {
  return {
    submitTx: vi.fn().mockResolvedValue('mock-submission-id'),
  };
}

export function createMockIndexerConfig() {
  return {
    indexerUri: 'https://indexer.preview.midnight.network/api/v3/graphql',
    indexerWsUri: 'wss://indexer.preview.midnight.network/api/v3/graphql/ws',
  };
}

export function createMockPrivateStateProvider() {
  return {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
  };
}

export function createMockProviders(): MidnightProviderSet {
  return {
    walletProvider: createMockWalletProvider(),
    zkConfigProvider: createMockZkConfigProvider(),
    proofProvider: createMockProofProvider(),
    indexerConfig: createMockIndexerConfig(),
    midnightProvider: createMockMidnightProvider(),
  };
}

// Re-export Testing Library helpers
export * from '@testing-library/react';
