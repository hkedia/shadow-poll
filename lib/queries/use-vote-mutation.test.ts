/**
 * Tests for use-vote-mutation.ts
 * 
 * Verifies the voting mutation hook with optimistic updates.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useVoteMutation } from './use-vote-mutation';
import { pollKeys } from './use-poll';

vi.mock('@/lib/midnight/wallet-context', () => ({
  useWalletContext: vi.fn(),
}));

vi.mock('@/lib/midnight/contract-service', () => ({
  findPollContract: vi.fn(),
  callCastVote: vi.fn(),
  getContractAddress: vi.fn().mockReturnValue('midnight1contract'),
}));

vi.mock('@/lib/midnight/witness-impl', () => ({
  getSecretKeyFromWallet: vi.fn().mockResolvedValue(new Uint8Array(32)),
  getCurrentBlockNumber: vi.fn().mockResolvedValue(1000n),
}));

import { useWalletContext } from '@/lib/midnight/wallet-context';
import { findPollContract, callCastVote } from '@/lib/midnight/contract-service';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
};

describe('useVoteMutation', () => {
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

  const mockContract = { address: 'midnight1contract', callTx: {} };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw error when wallet not connected', async () => {
    (useWalletContext as Mock).mockReturnValue({ providers: null });

    const { result } = renderHook(
      () => useVoteMutation(),
      { wrapper: createWrapper() }
    );

    result.current.mutate({
      pollId: 'poll123',
      optionIndex: 0,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Wallet not connected');
  });

  it('should cast vote successfully', async () => {
    (useWalletContext as Mock).mockReturnValue({ providers: mockProviders });
    (findPollContract as Mock).mockResolvedValue(mockContract);
    (callCastVote as Mock).mockResolvedValue({ transaction: 'tx123' });

    const { result } = renderHook(
      () => useVoteMutation(),
      { wrapper: createWrapper() }
    );

    result.current.mutate({
      pollId: 'poll123',
      optionIndex: 1,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(callCastVote).toHaveBeenCalledWith(
      mockContract,
      expect.objectContaining({ optionIndex: 1 })
    );
  });

  it('should handle duplicate vote error', async () => {
    (useWalletContext as Mock).mockReturnValue({ providers: mockProviders });
    (findPollContract as Mock).mockResolvedValue(mockContract);
    (callCastVote as Mock).mockRejectedValue(new Error('Duplicate vote'));

    const { result } = renderHook(
      () => useVoteMutation(),
      { wrapper: createWrapper() }
    );

    result.current.mutate({
      pollId: 'poll123',
      optionIndex: 0,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toContain('Duplicate vote');
  });

  it('should invalidate poll queries on success', async () => {
    const queryClient = new QueryClient();
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    (useWalletContext as Mock).mockReturnValue({ providers: mockProviders });
    (findPollContract as Mock).mockResolvedValue(mockContract);
    (callCastVote as Mock).mockResolvedValue({ transaction: 'tx456' });

    const Wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useVoteMutation(), { wrapper: Wrapper });

    result.current.mutate({
      pollId: 'poll456',
      optionIndex: 2,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateQueriesSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: expect.arrayContaining(['poll']) })
    );
  });

  it('should optimistically update tallies', async () => {
    const queryClient = new QueryClient();
    const pollId = 'poll789';
    const initialTallies = {
      pollId,
      counts: [5n, 3n, 2n],
      total: 10n,
    };

    // Seed the cache with initial tallies
    queryClient.setQueryData(pollKeys.tallies(pollId), initialTallies);

    (useWalletContext as Mock).mockReturnValue({ providers: mockProviders });
    (findPollContract as Mock).mockResolvedValue(mockContract);
    (callCastVote as Mock).mockResolvedValue({ transaction: 'tx789' });

    const Wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useVoteMutation(), { wrapper: Wrapper });

    // Trigger mutation
    result.current.mutate({ pollId, optionIndex: 1 });

    // Check optimistic update happened
    const optimisticTallies = queryClient.getQueryData<{ counts: bigint[]; total: bigint }>(
      pollKeys.tallies(pollId)
    );
    expect(optimisticTallies?.counts[1]).toBe(4n);
    expect(optimisticTallies?.total).toBe(11n);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('should roll back on error', async () => {
    const queryClient = new QueryClient();
    const pollId = 'pollrollback';
    const initialTallies = {
      pollId,
      counts: [5n, 3n],
      total: 8n,
    };

    queryClient.setQueryData(pollKeys.tallies(pollId), initialTallies);

    (useWalletContext as Mock).mockReturnValue({ providers: mockProviders });
    (findPollContract as Mock).mockResolvedValue(mockContract);
    (callCastVote as Mock).mockRejectedValue(new Error('Vote failed'));

    const Wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useVoteMutation(), { wrapper: Wrapper });

    result.current.mutate({ pollId, optionIndex: 0 });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // Check rollback happened
    const rolledBackTallies = queryClient.getQueryData<{ counts: bigint[]; total: bigint }>(
      pollKeys.tallies(pollId)
    );
    expect(rolledBackTallies?.counts[0]).toBe(5n);
    expect(rolledBackTallies?.total).toBe(8n);
  });
});
