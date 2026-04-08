/**
 * Global analytics aggregation hook for Shadow Poll.
 *
 * Fetches all polls from the on-chain contract state, reads all vote tallies,
 * and aggregates them into global statistics for the /stats page.
 *
 * Implements: PAGE-05 (Stats / Analytics page)
 * Design decisions: D-63 (global-only analytics, no per-wallet tracking)
 *
 * Performance: Single contract state fetch (not N+1). All tally reads happen
 * in-memory from the single ledger snapshot. Safe for testnet scale.
 *
 * ALL @midnight-ntwrk/* and contract imports are dynamic (Turbopack constraint).
 */

import { useQuery } from "@tanstack/react-query";
import { useWalletContext } from "@/lib/midnight/wallet-context";
import { getContractAddress } from "@/lib/midnight/contract-service";
import type { PollWithId, PollTallies } from "@/lib/midnight/ledger-utils";

/** Aggregated global statistics for the /stats page. */
export interface StatsData {
  totalPolls: number;
  totalVotes: bigint;
  activePolls: number;
  publicPolls: number;
  inviteOnlyPolls: number;
  avgVotesPerPoll: number;        // floating point, formatted in UI
  mostVotedPoll: (PollWithId & { tallies: PollTallies }) | null;
}

/**
 * Aggregates global poll statistics from on-chain contract state.
 *
 * Requires wallet connection for indexer access. Returns null data
 * while loading or when wallet is disconnected.
 */
export function useStats() {
  const { status, providers } = useWalletContext();
  const isConnected = status === "connected" && providers !== null;
  const contractAddress = getContractAddress();

  const query = useQuery<StatsData>({
    queryKey: ["stats"],
    queryFn: async () => {
      if (!providers) {
        throw new Error("Wallet not connected");
      }
      if (!contractAddress) {
        // No contract address configured — return empty stats rather than erroring
        return {
          totalPolls: 0,
          totalVotes: BigInt(0),
          activePolls: 0,
          publicPolls: 0,
          inviteOnlyPolls: 0,
          avgVotesPerPoll: 0,
          mostVotedPoll: null,
        };
      }

      // Fetch all polls (single contract state fetch)
      const { fetchAllPolls } = await import("@/lib/midnight/contract-service");
      const polls = await fetchAllPolls(providers, contractAddress);

      if (polls.length === 0) {
        return {
          totalPolls: 0,
          totalVotes: BigInt(0),
          activePolls: 0,
          publicPolls: 0,
          inviteOnlyPolls: 0,
          avgVotesPerPoll: 0,
          mostVotedPoll: null,
        };
      }

      // Get current block number for "active" calculation
      const { getCurrentBlockNumber } = await import("@/lib/midnight/witness-impl");
      const currentBlock = await getCurrentBlockNumber(providers.indexerConfig.indexerUri);

      // Fetch tallies for all polls using a single ledger snapshot for efficiency
      const { createIndexerProvider } = await import("@/lib/midnight/indexer");
      const { ledger: parseLedger } = await import("@/contracts/managed/contract");
      const { readTallies } = await import("@/lib/midnight/ledger-utils");

      const publicDataProvider = await createIndexerProvider(
        providers.indexerConfig.indexerUri,
        providers.indexerConfig.indexerWsUri,
      );
      const state = await publicDataProvider.queryContractState(contractAddress);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ledgerState = state ? parseLedger(state as any) : null;

      // Aggregate statistics
      let totalVotes = BigInt(0);
      let activePolls = 0;
      let publicPolls = 0;
      let inviteOnlyPolls = 0;
      let mostVotedPoll: (PollWithId & { tallies: PollTallies }) | null = null;

      for (const poll of polls) {
        // Active poll check (D-24: block-based expiration)
        if (currentBlock > BigInt(0) && poll.data.expiration_block > currentBlock) {
          activePolls++;
        }

        // Public / invite-only split (Number() cast avoids compact-runtime enum import)
        if (Number(poll.data.poll_type) === 0) {
          publicPolls++;
        } else {
          inviteOnlyPolls++;
        }

        // Tally aggregation
        if (ledgerState) {
          const tallies = await readTallies(
            ledgerState,
            poll.idBytes,
            Number(poll.data.option_count),
          );
          totalVotes += tallies.total;

          // Track most-voted poll
          if (!mostVotedPoll || tallies.total > mostVotedPoll.tallies.total) {
            mostVotedPoll = { ...poll, tallies };
          }
        }
      }

      const totalPolls = polls.length;
      const avgVotesPerPoll = totalPolls > 0
        ? Number(totalVotes) / totalPolls
        : 0;

      return {
        totalPolls,
        totalVotes,
        activePolls,
        publicPolls,
        inviteOnlyPolls,
        avgVotesPerPoll,
        mostVotedPoll,
      };
    },
    enabled: isConnected,
    staleTime: 60_000,  // stats update at most every 60 seconds
    refetchInterval: 60_000,
    retry: 1,
  });

  return {
    stats: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error instanceof Error ? query.error : null,
    refetch: query.refetch,
  };
}
