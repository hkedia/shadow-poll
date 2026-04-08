import { QueryClient } from "@tanstack/react-query";

let queryClient: QueryClient | null = null;

/**
 * Returns a singleton QueryClient instance.
 * Defaults are optimized for live polling data:
 * - staleTime: 10s (poll data refreshes frequently)
 * - gcTime: 5 minutes (keep cached data for navigation)
 * - refetchOnWindowFocus: true (refresh when user returns to tab)
 * - retry: 2 (retry failed indexer queries)
 */
export function getQueryClient(): QueryClient {
  if (!queryClient) {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 10_000,       // 10 seconds
          gcTime: 5 * 60_000,      // 5 minutes
          refetchOnWindowFocus: true,
          retry: 2,
          refetchInterval: false,   // Per-query opt-in for live polling
        },
        mutations: {
          retry: 0,                // Don't retry failed mutations (on-chain transactions)
        },
      },
    });
  }
  return queryClient;
}
