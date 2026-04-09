import { useQuery } from "@tanstack/react-query";
import { useWalletContext } from "@/lib/midnight/wallet-context";
import type { PollTallies } from "@/lib/midnight/ledger-utils";
import { fetchPollWithTallies, getContractAddress } from "@/lib/midnight/contract-service";
import { pollKeys } from "./use-poll";

/**
 * Fetches the vote tallies for a single poll from the on-chain contract state.
 *
 * Wallet-gated: returns null when no wallet is connected (tallies require
 * a live indexer read via the Midnight SDK).
 *
 * Refreshes every 15 seconds so listing pages stay current.
 *
 * @param pollId - Hex-encoded poll ID. Pass null/undefined to disable.
 */
export function usePollTallies(pollId: string | null | undefined) {
  const { providers, status } = useWalletContext();
  const isConnected = status === "connected" && providers !== null;

  return useQuery({
    queryKey: pollKeys.tallies(pollId ?? ""),
    queryFn: async (): Promise<PollTallies | null> => {
      if (!providers || !pollId) return null;

      const contractAddress = getContractAddress();
      if (!contractAddress) return null;

      const result = await fetchPollWithTallies(providers, contractAddress, pollId);
      return result?.tallies ?? null;
    },
    enabled: isConnected && !!pollId,
    refetchInterval: 15_000,
  });
}
