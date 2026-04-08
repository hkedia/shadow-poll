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
import type { InviteCode } from "@/lib/midnight/invite-codes";

/** Input for creating a new poll. */
export interface CreatePollInput {
  title: string;
  description: string;
  options: string[];
  expirationBlocks: bigint; // number of blocks until expiration
  pollType: "public" | "invite_only"; // defaults to "public"
  inviteCodeCount?: number;           // number of invite codes to generate (for invite_only)
}

/** Result returned from a successful poll creation. */
export interface CreatePollResult {
  pollId: string; // hex-encoded poll ID
  inviteCodes?: InviteCode[]; // populated only for invite_only polls
}

type CreatePollResponse = {
  private?: {
    result?: Uint8Array;
  };
  result?: Uint8Array;
};

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
 * 7. For invite-only polls: generates codes, submits hashes, stores codes
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
      let contract: unknown;

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

      // 6. Call create_poll circuit with appropriate poll type
      const result = await callCreatePoll(contract, {
        metadataHash,
        optionCount: input.options.length,
        pollType: input.pollType === "invite_only" ? 1 : 0,
        expirationBlock,
      });

      // 7. Extract poll ID from the transaction result
      // The create_poll circuit returns Bytes<32> as the poll ID
      const createPollResponse = result as CreatePollResponse;
      const pollIdBytes: Uint8Array = createPollResponse.private?.result
        ?? createPollResponse.result
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

      // 9. For invite-only polls: generate codes, submit hashes, store in localStorage
      let inviteCodes: InviteCode[] | undefined;

      if (input.pollType === "invite_only" && input.inviteCodeCount && input.inviteCodeCount > 0) {
        // Generate invite codes off-chain
        const { generateInviteCodes, storeInviteCodes } = await import("@/lib/midnight/invite-codes");
        const codeSet = await generateInviteCodes(input.inviteCodeCount, pollIdBytes);
        inviteCodes = codeSet.codes;

        // Submit each code hash to the contract via add_invite_codes
        // Sequential submission — each tx must confirm. Consider batching in v2.
        const { callAddInviteCodes } = await import("@/lib/midnight/contract-service");
        for (const code of codeSet.codes) {
          await callAddInviteCodes(contract, {
            pollId: pollIdBytes,
            codeHash: code.hash,
          });
        }

        // Store codes in localStorage for the creator to share
        storeInviteCodes(pollId, inviteCodes);
      }

      return { pollId, inviteCodes };
    },

    onSuccess: () => {
      // Invalidate poll list queries to show the new poll
      queryClient.invalidateQueries({ queryKey: pollKeys.lists() });
    },
  });
}
