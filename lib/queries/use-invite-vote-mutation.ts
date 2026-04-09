import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useWalletContext } from "@/lib/midnight/wallet-context";
import { pollKeys } from "./use-poll";
import type { PollTallies } from "@/lib/midnight/ledger-utils";
import { findPollContract, callCastInviteVote, getContractAddress } from "@/lib/midnight/contract-service";
import { getSecretKeyFromWallet, getCurrentBlockNumber } from "@/lib/midnight/witness-impl";
import { hexToBytes } from "@/lib/midnight/ledger-utils";
import { inviteCodeToBytes32 } from "@/lib/midnight/invite-codes";

/** Parameters for casting an invite-only vote. */
export interface CastInviteVoteParams {
  pollId: string;         // hex-encoded poll ID
  optionIndex: number;    // 0-based option index
  inviteCode: string;     // Human-readable invite code (e.g., "A3K9F2X7B1")
}

/**
 * Mutation hook for casting a vote on an invite-only poll.
 *
 * Mirrors useVoteMutation but calls cast_invite_vote with an invite code.
 * The invite code string is normalized (uppercased) and hashed to Bytes<32>
 * before being passed to the circuit as a private ZK input.
 *
 * Implements the same optimistic tally updates as useVoteMutation:
 * - On mutate: immediately increments the chosen option's count in the cache
 * - On error: rolls back to the previous tally counts
 * - On settlement: invalidates the query to fetch the real on-chain state
 */
export function useInviteVoteMutation() {
  const queryClient = useQueryClient();
  const { providers } = useWalletContext();

  return useMutation({
    mutationFn: async (params: CastInviteVoteParams): Promise<void> => {
      if (!providers) {
        throw new Error("Wallet not connected");
      }

      const contractAddress = getContractAddress();
      if (!contractAddress) {
        throw new Error("No contract deployed");
      }

      // Get witness inputs from wallet and indexer
      const secretKey = await getSecretKeyFromWallet(providers.walletProvider);
      const blockNumber = await getCurrentBlockNumber(providers.indexerConfig.indexerUri);

      // Connect to the deployed contract
      const contract = await findPollContract(
        providers,
        contractAddress,
        secretKey,
        blockNumber,
      );

      // Convert the invite code string to Bytes<32> (async — uses crypto.subtle)
      // Case-insensitive: inviteCodeToBytes32 uppercases before hashing
      const codeBytes = await inviteCodeToBytes32(params.inviteCode);

      // Call the cast_invite_vote circuit on-chain
      await callCastInviteVote(contract, {
        pollId: hexToBytes(params.pollId),
        optionIndex: params.optionIndex,
        inviteCode: codeBytes,
      });
    },

    onMutate: async (params: CastInviteVoteParams) => {
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

      // "Invite code already used" is an expected contract assertion, not a bug.
      // The error propagates via inviteVoteMutation.error.message for the UI to display
      // a user-friendly message.
    },

    onSettled: (_data, _error, params) => {
      // Always invalidate to fetch the real on-chain state
      queryClient.invalidateQueries({ queryKey: pollKeys.tallies(params.pollId) });
      queryClient.invalidateQueries({ queryKey: pollKeys.detail(params.pollId) });
    },
  });
}
