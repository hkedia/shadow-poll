"use client";

import { useQuery } from "@tanstack/react-query";
import { useWalletContext } from "@/lib/midnight/wallet-context";
import { pollKeys } from "./use-poll";
import type { PollWithId } from "@/lib/midnight/ledger-utils";
import { fetchAllPolls, getContractAddress } from "@/lib/midnight/contract-service";

/**
 * Hook to fetch all polls from the on-chain contract state.
 *
 * Queries the indexer via fetchAllPolls() from the contract service.
 * Returns an array of all polls with their IDs and on-chain data.
 * Refreshes every 30 seconds to keep the trending list current.
 */
export function usePolls() {
  const { providers, status } = useWalletContext();
  const isConnected = status === "connected" && providers !== null;

  return useQuery({
    queryKey: pollKeys.lists(),
    queryFn: async (): Promise<PollWithId[]> => {
      if (!providers) return [];

      const contractAddress = getContractAddress();
      if (!contractAddress) return [];

      return fetchAllPolls(providers, contractAddress);
    },
    enabled: isConnected,
    refetchInterval: 30_000, // Refresh every 30 seconds for trending data
  });
}
