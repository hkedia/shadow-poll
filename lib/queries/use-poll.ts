"use client";

import { useQuery } from "@tanstack/react-query";
import { useWalletContext } from "@/lib/midnight/wallet-context";
import type { PollWithId, PollTallies } from "@/lib/midnight/ledger-utils";
import { useMetadata } from "./use-metadata";
import type { PollMetadata } from "@/lib/midnight/metadata-store";
import { fetchPollWithTallies, getContractAddress } from "@/lib/midnight/contract-service";

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
 * Queries the indexer via fetchPollWithTallies() from the contract service.
 * Returns poll data, vote tallies, and off-chain metadata (via useMetadata).
 *
 * @param pollId - Hex-encoded poll ID. Pass null/undefined to disable.
 */
export function usePoll(pollId: string | null | undefined) {
  const { providers, status } = useWalletContext();
  const isConnected = status === "connected" && providers !== null;

  // Fetch on-chain poll data from the indexer
  // TODO: Deduplicate provider assembly across poll/tallies queries
  const pollQuery = useQuery({
    queryKey: pollKeys.detail(pollId ?? ""),
    queryFn: async (): Promise<PollWithId | null> => {
      if (!providers || !pollId) return null;

      const contractAddress = getContractAddress();
      if (!contractAddress) return null;

      const result = await fetchPollWithTallies(providers, contractAddress, pollId);
      return result?.poll ?? null;
    },
    enabled: isConnected && !!pollId,
    refetchInterval: 15_000, // Refresh every 15 seconds for live tallies
  });

  // Fetch on-chain vote tallies
  const talliesQuery = useQuery({
    queryKey: pollKeys.tallies(pollId ?? ""),
    queryFn: async (): Promise<PollTallies | null> => {
      if (!providers || !pollId) return null;

      const contractAddress = getContractAddress();
      if (!contractAddress) return null;

      const result = await fetchPollWithTallies(providers, contractAddress, pollId);
      return result?.tallies ?? null;
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
