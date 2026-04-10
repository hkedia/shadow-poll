/**
 * Tests for use-metadata.ts
 * 
 * Verifies the metadata query and mutation hooks.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMetadata, useStoreMetadata, metadataKeys } from '@/lib/queries/use-metadata';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }): React.ReactElement {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
};

describe('useMetadata', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch metadata for poll', async () => {
    const mockMetadata = {
      pollId: 'poll123',
      metadata: {
        title: 'Test Poll',
        description: 'Test Description',
        options: ['Option 1', 'Option 2'],
        createdAt: new Date().toISOString(),
      },
      metadataHash: 'hash123',
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockMetadata,
    });

    const { result } = renderHook(
      () => useMetadata('poll123'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockMetadata);
  });

  it('should handle missing metadata', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Not found' }),
    });

    const { result } = renderHook(
      () => useMetadata('nonexistent'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toContain('not found');
  });

  it('should not fetch when pollId is null', async () => {
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy;

    const { result } = renderHook(
      () => useMetadata(null),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe('idle');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('should cache metadata results', async () => {
    const mockMetadata = {
      pollId: 'poll456',
      metadata: { title: 'Cached Poll', description: 'Test', options: ['A'] },
      metadataHash: 'hash456',
    };

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockMetadata,
    });
    global.fetch = fetchSpy;

    const queryClient = new QueryClient();
    const Wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    // First render - should fetch
    const { rerender } = renderHook(
      ({ pollId }: { pollId: string }) => useMetadata(pollId),
      {
        wrapper: Wrapper,
        initialProps: { pollId: 'poll456' },
      }
    );

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));

    // Re-render with same pollId - should use cache
    rerender({ pollId: 'poll456' });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});

describe('useStoreMetadata', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should store metadata successfully', async () => {
    const mockResponse = { success: true, pollId: 'poll789' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(
      () => useStoreMetadata(),
      { wrapper: createWrapper() }
    );

    result.current.mutate({
      pollId: 'poll789',
      metadata: {
        title: 'New Poll',
        description: 'Description',
        options: ['A', 'B'],
        createdAt: new Date().toISOString(),
      },
      metadataHash: 'hash789',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/polls/metadata',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });

  it('should handle server error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Server error' }),
    });

    const { result } = renderHook(
      () => useStoreMetadata(),
      { wrapper: createWrapper() }
    );

    result.current.mutate({
      pollId: 'poll999',
      metadata: { title: 'Test', description: 'Test', options: ['A'] },
      metadataHash: 'hash999',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toContain('Server error');
  });

  it('should seed cache on success', async () => {
    const queryClient = new QueryClient();
    const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    const Wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useStoreMetadata(), { wrapper: Wrapper });

    const request = {
      pollId: 'pollabc',
      metadata: { title: 'Seeded', description: 'Test', options: ['X'] },
      metadataHash: 'hashabc',
    };

    result.current.mutate(request);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(setQueryDataSpy).toHaveBeenCalledWith(
      metadataKeys.detail('pollabc'),
      expect.objectContaining({ pollId: 'pollabc' })
    );
  });
});
