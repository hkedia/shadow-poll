"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useWalletContext } from "@/lib/midnight/wallet-context";
import { pollKeys } from "./use-poll";
import type { PollTallies } from "@/lib/midnight/ledger-utils";

/** Parameters for casting a vote. */
export interface CastVoteParams {
  pollId: string;       // hex-encoded poll ID
  optionIndex: number;  // 0-based option index
}

/**
 * Mutation hook for casting a vote on a poll.
 *
 * Implements optimistic tally updates (DATA-04):
 * - On mutate: immediately increments the chosen option's count in the cache
 * - On error: rolls back to the previous tally counts
 * - On settlement: invalidates the query to fetch the real on-chain state
 *
 * NOTE: The actual on-chain transaction (calling the cast_vote circuit) will be
 * implemented in Phase 4. This hook defines the optimistic update pattern and
 * cache management. Phase 4 will fill in the mutationFn with the real SDK call.
 */
export function useVoteMutation() {
  const queryClient = useQueryClient();
  const { providers } = useWalletContext();

  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    mutationFn: async (_params: CastVoteParams): Promise<void> => {
      if (!providers) {
        throw new Error("Wallet not connected");
      }

      // Phase 4 will implement the actual on-chain transaction:
      // 1. Get the deployed contract instance via providers
      // 2. Call contract.cast_vote(hexToBytes(params.pollId), BigInt(params.optionIndex))
      // 3. Wait for transaction confirmation
      //
      // For now, throw to indicate the real implementation is pending
      throw new Error("Vote transaction not yet implemented — wired in Phase 4");
    },

    onMutate: async (params: CastVoteParams) => {
      // Cancel any outgoing refetches for this poll's tallies
      await queryClient.cancelQueries({ queryKey: pollKeys.tallies(params.pollId) });

      // Snapshot the previous tally data for rollback
      const previousTallies = queryClient.getQueryData<PollTallies>(
        pollKeys.tallies(params.pollId),
      );

      // Optimistically update the tally cache
      if (previousTallies) {
        const optimisticCounts = [...previousTallies.counts];
        if (params.optionIndex >= 0 && params.optionIndex < optimisticCounts.length) {
          optimisticCounts[params.optionIndex] = optimisticCounts[params.optionIndex] + BigInt(1);
        }
        const optimisticTallies: PollTallies = {
          ...previousTallies,
          counts: optimisticCounts,
          total: previousTallies.total + BigInt(1),
        };
        queryClient.setQueryData(
          pollKeys.tallies(params.pollId),
          optimisticTallies,
        );
      }

      // Return the snapshot for rollback
      return { previousTallies };
    },

    onError: (_error, params, context) => {
      // Roll back to the previous tally data
      if (context?.previousTallies) {
        queryClient.setQueryData(
          pollKeys.tallies(params.pollId),
          context.previousTallies,
        );
      }
    },

    onSettled: (_data, _error, params) => {
      // Always invalidate to fetch the real on-chain state
      queryClient.invalidateQueries({ queryKey: pollKeys.tallies(params.pollId) });
      queryClient.invalidateQueries({ queryKey: pollKeys.detail(params.pollId) });
    },
  });
}
