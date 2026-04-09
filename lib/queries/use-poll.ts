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

/** Server response shape for a single poll from GET /api/polls?id= */
interface PollOnChain {
  id: string;
  metadataHash: string;
  optionCount: number;
  pollType: number;
  expirationBlock: string;
  creator: string;
}

/**
 * Hook to fetch a single poll's on-chain data and tallies.
 *
 * Two-path fetching (per D-09-06/07):
 * - Unauthenticated: fetches via GET /api/polls?id= (no wallet required)
 * - Authenticated: uses live indexer via fetchPollWithTallies() (wallet connected)
 *
 * Tallies remain wallet-gated (require live indexer reads).
 *
 * @param pollId - Hex-encoded poll ID. Pass null/undefined to disable.
 */
export function usePoll(pollId: string | null | undefined) {
  const { providers, status } = useWalletContext();
  const isConnected = status === "connected" && providers !== null;

  // Fetch on-chain poll data — enabled for all visitors (no wallet required)
  const pollQuery = useQuery({
    queryKey: pollKeys.detail(pollId ?? ""),
    queryFn: async (): Promise<PollWithId | null> => {
      if (!pollId) return null;

      // Unauthenticated path: fetch via server API (no wallet required)
      // Per D-09-06/07: remove isConnected gate for read queries
      const contractAddress = getContractAddress();

      if (!providers || !contractAddress) {
        // No wallet — use server API (returns data from indexer without wallet)
        const res = await fetch(`/api/polls?id=${encodeURIComponent(pollId)}`);
        if (!res.ok) return null;
        const data = await res.json();
        const p = data.poll as PollOnChain | undefined;
        if (!p) return null;

        // Map server response to PollWithId shape
        const { hexToBytes } = await import("@/lib/midnight/ledger-utils");
        const { PollType } = await import("@/contracts/managed/contract");
        const pollIdBytes = hexToBytes(p.id);
        return {
          id: p.id,
          idBytes: pollIdBytes,
          data: {
            metadata_hash: hexToBytes(p.metadataHash),
            option_count: BigInt(p.optionCount),
            poll_type: p.pollType === 1 ? PollType.invite_only : PollType.public_poll,
            expiration_block: BigInt(p.expirationBlock),
            creator: hexToBytes(p.creator),
          },
        };
      }

      // Authenticated path: use live indexer via fetchPollWithTallies (wallet connected)
      const result = await fetchPollWithTallies(providers, contractAddress, pollId);
      return result?.poll ?? null;
    },
    enabled: !!pollId, // Removed isConnected gate (per D-09-06)
    refetchInterval: 15_000,
  });

  // Fetch on-chain vote tallies — wallet-gated (require live indexer reads)
  const talliesQuery = useQuery({
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
