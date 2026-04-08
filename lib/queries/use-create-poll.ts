"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useWalletContext } from "@/lib/midnight/wallet-context";
import { pollKeys } from "./use-poll";
import {
  deployPollContract,
  findPollContract,
  callCreatePoll,
  getContractAddress,
} from "@/lib/midnight/contract-service";
import { createWitnesses, getSecretKeyFromWallet, getCurrentBlockNumber } from "@/lib/midnight/witness-impl";
import { computeMetadataHash, validatePollMetadata } from "@/lib/midnight/metadata-store";
import { bytesToHex } from "@/lib/midnight/ledger-utils";

/** Input for creating a new poll. */
export interface CreatePollInput {
  title: string;
  description: string;
  options: string[];
  expirationBlocks: bigint; // number of blocks until expiration
}

/** Result returned from a successful poll creation. */
export interface CreatePollResult {
  pollId: string; // hex-encoded poll ID
}

/**
 * Mutation hook for creating a new poll on-chain.
 *
 * Handles the full poll creation flow:
 * 1. Validates metadata (title, description, options)
 * 2. Computes metadata hash (SHA-256 commitment stored on-chain)
 * 3. Deploys or finds the Poll Manager contract
 * 4. Calls create_poll circuit with hash, option count, type, expiration
 * 5. Stores metadata off-chain via /api/polls/metadata
 * 6. Returns the hex-encoded poll ID
 */
export function useCreatePoll() {
  const queryClient = useQueryClient();
  const { providers } = useWalletContext();

  return useMutation({
    mutationFn: async (input: CreatePollInput): Promise<CreatePollResult> => {
      if (!providers) {
        throw new Error("Wallet not connected");
      }

      // 1. Validate metadata (T-04-05 mitigation)
      const validationError = validatePollMetadata({
        title: input.title,
        description: input.description,
        options: input.options,
      });
      if (validationError) {
        throw new Error(validationError);
      }

      // 2. Compute metadata hash (SHA-256 commitment)
      const metadataHash = await computeMetadataHash({
        title: input.title,
        description: input.description,
        options: input.options,
      });

      // 3. Get witness inputs from wallet and indexer
      const secretKey = await getSecretKeyFromWallet(providers.walletProvider);
      const blockNumber = await getCurrentBlockNumber(providers.indexerConfig.indexerUri);
      const witnesses = createWitnesses(secretKey, blockNumber);

      // 4. Calculate expiration block
      const expirationBlock = blockNumber + input.expirationBlocks;

      // 5. Deploy or find the Poll Manager contract
      const contractAddress = getContractAddress();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let contract: any;

      if (!contractAddress) {
        // No contract deployed yet — deploy a fresh one (D-20: single contract)
        contract = await deployPollContract(providers, secretKey, blockNumber);
      } else {
        // Contract exists — connect to it
        contract = await findPollContract(
          providers,
          contractAddress,
          secretKey,
          blockNumber,
        );
      }

      // Suppress unused variable warning — witnesses are consumed by buildCompiledContract
      // inside deploy/find, but TypeScript can't see that
      void witnesses;

      // 6. Call create_poll circuit (PollType.public_poll = 0)
      const result = await callCreatePoll(contract, {
        metadataHash,
        optionCount: input.options.length,
        pollType: 0, // public_poll
        expirationBlock,
      });

      // 7. Extract poll ID from the transaction result
      // The create_poll circuit returns Bytes<32> as the poll ID
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pollIdBytes: Uint8Array = (result as any)?.private?.result
        ?? (result as any)?.result
        ?? new Uint8Array(32);
      const pollId = bytesToHex(pollIdBytes);

      // 8. Store metadata off-chain via API route (D-30)
      await fetch("/api/polls/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pollId,
          metadata: {
            title: input.title,
            description: input.description,
            options: input.options,
            createdAt: new Date().toISOString(),
          },
          metadataHash: bytesToHex(metadataHash),
        }),
      });

      return { pollId };
    },

    onSuccess: () => {
      // Invalidate poll list queries to show the new poll
      queryClient.invalidateQueries({ queryKey: pollKeys.lists() });
    },
  });
}
