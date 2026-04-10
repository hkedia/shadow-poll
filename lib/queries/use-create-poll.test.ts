/**
 * Tests for use-create-poll.ts
 * 
 * Verifies the poll creation mutation hook behavior.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCreatePoll } from './use-create-poll';

// Mock dependencies
vi.mock('@/lib/midnight/wallet-context', () => ({
  useWalletContext: vi.fn(),
}));

vi.mock('@/lib/midnight/contract-service', () => ({
  getContractAddress: vi.fn().mockReturnValue('midnight1contractaddress'),
}));

vi.mock('@/lib/midnight/witness-impl', () => ({
  getSecretKeyFromWallet: vi.fn().mockResolvedValue(new Uint8Array(32).fill(1)),
  getCurrentBlockNumber: vi.fn().mockResolvedValue(1000n),
}));

vi.mock('@/lib/midnight/metadata-store', () => ({
  computeMetadataHash: vi.fn().mockResolvedValue(new Uint8Array(32).fill(2)),
  validatePollMetadata: vi.fn().mockReturnValue(null),
}));

import { useWalletContext } from '@/lib/midnight/wallet-context';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
};

describe('useCreatePoll', () => {
  const mockProviders = {
    walletProvider: {
      getCoinPublicKey: () => 'midnight1test',
      balanceTx: vi.fn(),
      getEncryptionPublicKey: () => 'enc1test',
    },
    indexerConfig: {
      indexerUri: 'https://indexer.test',
      indexerWsUri: 'wss://indexer.test',
    },
    zkConfigProvider: { getProvingKeyURI: () => '', getVerifyingKeyURI: () => '' },
    proofProvider: { proveTx: vi.fn() },
    midnightProvider: { submitTx: vi.fn() },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw error when wallet not connected', async () => {
    (useWalletContext as Mock).mockReturnValue({ providers: null });

    const { result } = renderHook(() => useCreatePoll(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      title: 'Test Poll',
      description: 'Test Description',
      options: ['Option 1', 'Option 2'],
      expirationBlocks: 100n,
      pollType: 'public',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Wallet not connected');
  });

  it('should validate metadata before creating', async () => {
    const { validatePollMetadata } = await import('@/lib/midnight/metadata-store');
    (validatePollMetadata as Mock).mockReturnValue('Title is required');
    (useWalletContext as Mock).mockReturnValue({ providers: mockProviders });

    const { result } = renderHook(() => useCreatePoll(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      title: '',
      description: 'Test',
      options: ['A'],
      expirationBlocks: 100n,
      pollType: 'public',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Title is required');
  });

  it('should throw if block number is zero', async () => {
    const { getCurrentBlockNumber, getSecretKeyFromWallet } = await import('@/lib/midnight/witness-impl');
    const { validatePollMetadata } = await import('@/lib/midnight/metadata-store');
    
    // Ensure validation passes
    (validatePollMetadata as Mock).mockReturnValue(null);
    
    // Mock block number to return 0
    (getCurrentBlockNumber as Mock).mockResolvedValue(0n);
    (getSecretKeyFromWallet as Mock).mockResolvedValue(new Uint8Array(32).fill(1));
    (useWalletContext as Mock).mockReturnValue({ providers: mockProviders });

    const { result } = renderHook(() => useCreatePoll(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      title: 'Test Poll',
      description: 'Test',
      options: ['A'],
      expirationBlocks: 100n,
      pollType: 'public',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toContain('block number');
  });
});
