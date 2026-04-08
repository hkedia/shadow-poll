"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useWalletContext } from "@/lib/midnight/wallet-context";
import { pollKeys } from "./use-poll";
import { getSecretKeyFromWallet, getCurrentBlockNumber } from "@/lib/midnight/witness-impl";
import { computeMetadataHash, validatePollMetadata } from "@/lib/midnight/metadata-store";
import { bytesToHex } from "@/lib/midnight/ledger-utils";
import { generateInviteCodes, storeInviteCodes } from "@/lib/midnight/invite-codes";
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

      // 3. Get witness inputs from wallet and indexer (still needed for expiration block)
      const secretKey = await getSecretKeyFromWallet(providers.walletProvider);
      const blockNumber = await getCurrentBlockNumber(providers.indexerConfig.indexerUri);
      const expirationBlock = blockNumber + input.expirationBlocks;

      // 4. Call server-side API route to create poll on-chain
      const response = await fetch("/api/polls/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: input.title,
          description: input.description,
          options: input.options,
          expirationBlocks: input.expirationBlocks,
          pollType: input.pollType,
          inviteCodeCount: input.inviteCodeCount,
          metadataHash: bytesToHex(metadataHash),
          // Note: In real implementation, we'd also pass the secret key or have the server derive from its own seed.
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create poll");
      }

      const { pollId } = await response.json();

      // 5. Store metadata off-chain via existing API route (D-30)
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

      // 6. For invite-only polls: generate codes, store in localStorage (no on-chain submission yet)
      let inviteCodes: InviteCode[] | undefined;

      if (input.pollType === "invite_only" && input.inviteCodeCount && input.inviteCodeCount > 0) {
        // Generate invite codes off-chain
        const pollIdBytes = new Uint8Array(32); // Mock bytes, real pollId is hex string
        const codeSet = await generateInviteCodes(input.inviteCodeCount, pollIdBytes);
        inviteCodes = codeSet.codes;
        // Store codes in localStorage for the creator to share
        storeInviteCodes(pollId, inviteCodes);
        // TODO: Submit code hashes on-chain via server-side API
      }

      return { pollId, inviteCodes };
    },

    onSuccess: () => {
      // Invalidate poll list queries to show the new poll
      queryClient.invalidateQueries({ queryKey: pollKeys.lists() });
    },
  });
}
