import { useQuery } from "@tanstack/react-query";
import { useWalletContext } from "@/lib/midnight/wallet-context";
import { pollKeys } from "./use-poll";
import type { PollWithId } from "@/lib/midnight/ledger-utils";
// import removed: using API routes instead

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
      // Fetch polls from server-side API (mock data for now)
      const response = await fetch("/api/polls");
      if (!response.ok) {
        console.error("Failed to fetch polls:", response.statusText);
        return [];
      }
      
      const data = await response.json();
      // Transform API response to PollWithId[] (mock shape)
      // For now, we'll map the mock data to the expected shape.
      // The real implementation will return proper PollWithId objects.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data.map((poll: any) => ({
        id: poll.id,
        idBytes: new Uint8Array(32), // placeholder
        data: {
          metadata_hash: new Uint8Array(32),
          option_count: BigInt(poll.options.length),
          expiration_block: poll.expirationBlock,
          poll_type: poll.pollType === "invite_only" ? 1 : 0,
          creator: poll.creator,
          // other fields as needed
        },
      }));
    },
    enabled: isConnected,
    refetchInterval: 30_000, // Refresh every 30 seconds for trending data
  });
}
