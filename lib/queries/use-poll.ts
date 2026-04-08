"use client";

import { useQuery } from "@tanstack/react-query";
import { useWalletContext } from "@/lib/midnight/wallet-context";
import type { PollWithId, PollTallies } from "@/lib/midnight/ledger-utils";
import { useMetadata } from "./use-metadata";
import type { PollMetadata } from "@/lib/midnight/metadata-store";

/** Query key factory for poll queries. */
export const pollKeys = {
  all: ["polls"] as const,
  lists: () => [...pollKeys.all, "list"] as const,
  detail: (pollId: string) => [...pollKeys.all, "detail", pollId] as const,
  tallies: (pollId: string) => [...pollKeys.all, "tallies", pollId] as const,
};

/** Combined poll data for UI consumption. */
export interface PollDetail {
  poll: PollWithId;
  tallies: PollTallies;
  metadata: PollMetadata | null;
}

/**
 * Hook to fetch a single poll's on-chain data and tallies.
 *
 * NOTE: In Phase 3, this hook defines the query structure but the actual
 * indexer query implementation depends on how the SDK's PublicDataProvider
 * exposes contract state. The queryFn will be completed in Phase 4 when
 * findDeployedContract() is wired. For now, the hook is structured with
 * the correct keys, types, and options so Phase 4 only needs to fill in
 * the data fetching logic.
 *
 * @param pollId - Hex-encoded poll ID. Pass null/undefined to disable.
 */
export function usePoll(pollId: string | null | undefined) {
  const { providers, status } = useWalletContext();
  const isConnected = status === "connected" && providers !== null;

  // Fetch on-chain poll data from the indexer
  const pollQuery = useQuery({
    queryKey: pollKeys.detail(pollId ?? ""),
    queryFn: async (): Promise<PollWithId | null> => {
      if (!providers || !pollId) return null;

      // Phase 4 will implement the actual indexer query here:
      // 1. Create real SDK provider via createIndexerProvider(providers.indexerConfig)
      // 2. Query contract state and parse with parseLedger(state)
      // 3. Call readPoll(ledger, hexToBytes(pollId))
      //
      // Placeholder: returns null until indexer query is wired in Phase 4
      return null;
    },
    enabled: isConnected && !!pollId,
    refetchInterval: 15_000, // Refresh every 15 seconds for live tallies
  });

  // Fetch on-chain vote tallies
  const talliesQuery = useQuery({
    queryKey: pollKeys.tallies(pollId ?? ""),
    queryFn: async (): Promise<PollTallies | null> => {
      if (!providers || !pollId) return null;

      // Phase 4 will implement: readTallies(ledger, hexToBytes(pollId), optionCount)
      // Placeholder: returns null until indexer query is wired in Phase 4
      return null;
    },
    enabled: isConnected && !!pollId && pollQuery.data !== null,
    refetchInterval: 15_000,
  });

  // Fetch off-chain metadata (already functional via API route)
  const metadataQuery = useMetadata(pollId);

  return {
    poll: pollQuery.data ?? null,
    tallies: talliesQuery.data ?? null,
    metadata: metadataQuery.data?.metadata ?? null,
    isLoading: pollQuery.isLoading || talliesQuery.isLoading,
    isError: pollQuery.isError || talliesQuery.isError,
    error: pollQuery.error || talliesQuery.error,
    refetch: () => {
      pollQuery.refetch();
      talliesQuery.refetch();
    },
  };
}
