import { useQuery } from "@tanstack/react-query";
import { pollKeys } from "./use-poll";
import type { PollWithId } from "@/lib/midnight/ledger-utils";

/** Shape returned by GET /api/polls */
interface PollsApiResponse {
  currentBlockHeight: number;
  polls: Array<{
    id: string;
    metadataHash: string;
    optionCount: number;
    pollType: number;
    expirationBlock: string;
    creator: string;
  }>;
}

/**
 * Hook to fetch all polls from the on-chain contract state via the server-side
 * indexer API (/api/polls). Does NOT require a wallet connection — works for
 * any visitor to the site.
 *
 * Also exposes the current block height so callers can filter active vs closed
 * polls without a second request.
 *
 * Refreshes every 30 seconds to keep the list current.
 */
export function usePolls() {
  return useQuery({
    queryKey: pollKeys.lists(),
    queryFn: async (): Promise<{ polls: PollWithId[]; currentBlockHeight: number }> => {
      const response = await fetch("/api/polls");
      if (!response.ok) {
        throw new Error(`Failed to fetch polls: ${response.statusText}`);
      }

      const data: PollsApiResponse = await response.json();

      const polls: PollWithId[] = data.polls.map((poll) => ({
        id: poll.id,
        idBytes: hexToBytes(poll.id),
        data: {
          metadata_hash: hexToBytes(poll.metadataHash),
          option_count: BigInt(poll.optionCount),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          poll_type: poll.pollType as any,
          expiration_block: BigInt(poll.expirationBlock),
          creator: hexToBytes(poll.creator),
        },
      }));

      return { polls, currentBlockHeight: data.currentBlockHeight };
    },
    refetchInterval: 30_000,
  });
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}
