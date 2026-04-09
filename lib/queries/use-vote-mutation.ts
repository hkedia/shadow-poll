import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useWalletContext } from "@/lib/midnight/wallet-context";
import { pollKeys } from "./use-poll";
import type { PollTallies } from "@/lib/midnight/ledger-utils";
import { hexToBytes } from "@/lib/midnight/ledger-utils";
import {
  findPollContract,
  callCastVote,
  getContractAddress,
} from "@/lib/midnight/contract-service";
import {
  getSecretKeyFromWallet,
  getCurrentBlockNumber,
} from "@/lib/midnight/witness-impl";

/** Parameters for casting a vote. */
export interface CastVoteParams {
  pollId: string;       // hex-encoded poll ID
  optionIndex: number;  // 0-based option index
}

/**
 * Mutation hook for casting a vote on a poll.
 *
 * Calls the cast_vote circuit on-chain via the contract service.
 * Implements optimistic tally updates (DATA-04):
 * - On mutate: immediately increments the chosen option's count in the cache
 * - On error: rolls back to the previous tally counts
 * - On settlement: invalidates the query to fetch the real on-chain state
 */
export function useVoteMutation() {
  const queryClient = useQueryClient();
  const { providers } = useWalletContext();

  return useMutation({
    mutationFn: async (params: CastVoteParams): Promise<void> => {
      if (!providers) {
        throw new Error("Wallet not connected");
      }

      const contractAddress = getContractAddress();
      if (!contractAddress) {
        throw new Error("No contract deployed");
      }

      // Get witness inputs from wallet and indexer (per D-09-05)
      const secretKey = await getSecretKeyFromWallet(providers.walletProvider);
      const blockNumber = await getCurrentBlockNumber(providers.indexerConfig.indexerUri);

      // Connect to the deployed contract — always fresh (avoid stale block height)
      const contract = await findPollContract(
        providers,
        contractAddress,
        secretKey,
        blockNumber,
      );

      // Call cast_vote circuit on-chain
      await callCastVote(contract, {
        pollId: hexToBytes(params.pollId),
        optionIndex: params.optionIndex,
      });
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

      // "Already voted on this poll" is an expected contract assertion, not a bug.
      // The error propagates via voteMutation.error.message for the UI to display
      // a user-friendly "You have already voted on this poll" message.
    },

    onSettled: (_data, _error, params) => {
      // Always invalidate to fetch the real on-chain state
      queryClient.invalidateQueries({ queryKey: pollKeys.tallies(params.pollId) });
      queryClient.invalidateQueries({ queryKey: pollKeys.detail(params.pollId) });
    },
  });
}
