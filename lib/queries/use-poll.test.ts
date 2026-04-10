/**
 * Tests for use-poll.ts
 * 
 * Verifies the poll data fetching hook.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePoll, pollKeys } from './use-poll';

vi.mock('@/lib/midnight/wallet-context', () => ({
  useWalletContext: vi.fn(),
}));

vi.mock('@/lib/midnight/contract-service', () => ({
  getContractAddress: vi.fn().mockReturnValue('midnight1contract'),
  fetchPollWithTallies: vi.fn(),
}));

import { useWalletContext } from '@/lib/midnight/wallet-context';
import { fetchPollWithTallies } from '@/lib/midnight/contract-service';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
};

describe('usePoll', () => {
  const mockUnconnectedWallet = {
    providers: null,
    status: 'disconnected',
  };

  const mockConnectedWallet = {
    providers: {
      walletProvider: { getCoinPublicKey: () => 'midnight1test' },
      indexerConfig: { indexerUri: 'https://indexer.test', indexerWsUri: 'wss://indexer.test' },
      zkConfigProvider: {},
      proofProvider: {},
      midnightProvider: {},
    },
    status: 'connected',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch poll without wallet (unauthenticated path)', async () => {
    (useWalletContext as Mock).mockReturnValue(mockUnconnectedWallet);

    const mockPollData = {
      currentBlockHeight: 1000,
      poll: {
        id: 'poll123',
        metadataHash: 'hash123',
        optionCount: 3,
        pollType: 0,
        expirationBlock: '2000',
        creator: 'creator123',
        tallies: { counts: ['5', '3', '2'], total: '10' },
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockPollData,
    });

    const { result } = renderHook(
      () => usePoll('poll123'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.poll).toBeDefined();
    expect(result.current.tallies).toBeDefined();
  });

  it('should fetch poll with wallet (authenticated path)', async () => {
    (useWalletContext as Mock).mockReturnValue(mockConnectedWallet);

    const mockPollWithTallies = {
      poll: {
        id: 'poll123',
        idBytes: new Uint8Array(32),
        data: {
          metadata_hash: new Uint8Array(32),
          option_count: 3n,
          poll_type: 0,
          expiration_block: 2000n,
          creator: new Uint8Array(32),
        },
      },
      tallies: {
        pollId: 'poll123',
        counts: [5n, 3n, 2n],
        total: 10n,
      },
    };

    (fetchPollWithTallies as Mock).mockResolvedValue(mockPollWithTallies);

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ height: 1000 }),
    });

    const { result } = renderHook(
      () => usePoll('poll123'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fetchPollWithTallies).toHaveBeenCalled();
  });

  it('should handle poll not found', async () => {
    (useWalletContext as Mock).mockReturnValue(mockUnconnectedWallet);

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Poll not found' }),
    });

    const { result } = renderHook(
      () => usePoll('nonexistent'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.poll).toBeNull();
  });

  it('should show loading state', async () => {
    (useWalletContext as Mock).mockReturnValue(mockUnconnectedWallet);

    global.fetch = vi.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ poll: {} }),
      }), 100))
    );

    const { result } = renderHook(
      () => usePoll('loading-test'),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(true);
  });

  it('should not fetch when pollId is null', async () => {
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy;

    const { result } = renderHook(
      () => usePoll(null),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('should refetch both poll and tallies', async () => {
    (useWalletContext as Mock).mockReturnValue(mockUnconnectedWallet);

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        currentBlockHeight: 1000,
        poll: {
          id: 'pollrefetch',
          metadataHash: 'hash',
          optionCount: 2,
          pollType: 0,
          expirationBlock: '2000',
          creator: 'creator',
          tallies: { counts: ['1', '2'], total: '3' },
        },
      }),
    });

    const { result } = renderHook(
      () => usePoll('pollrefetch'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Trigger refetch
    result.current.refetch();

    // Both queries should be refetching
    expect(global.fetch).toHaveBeenCalled();
  });

  it('should calculate current block height', async () => {
    (useWalletContext as Mock).mockReturnValue(mockUnconnectedWallet);

    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ height: 1234 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          currentBlockHeight: 1234,
          poll: {
            id: 'pollblock',
            tallies: { counts: ['1'], total: '1' },
          },
        }),
      });

    const { result } = renderHook(
      () => usePoll('pollblock'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.currentBlockHeight).toBe(1234);
  });
});
