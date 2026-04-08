import { useMutation } from "@tanstack/react-query";
import { useWalletContext } from "@/lib/midnight/wallet-context";
import { findPollContract, callAddInviteCodes, getContractAddress } from "@/lib/midnight/contract-service";
import { getSecretKeyFromWallet, getCurrentBlockNumber } from "@/lib/midnight/witness-impl";
import { hexToBytes } from "@/lib/midnight/ledger-utils";

/** Parameters for adding invite code hashes to a poll. */
export interface AddInviteCodesParams {
  pollId: string;           // hex-encoded poll ID
  codeHashes: Uint8Array[]; // Pre-computed hashes from deriveInviteKey
}

/**
 * Mutation hook for submitting invite code hashes to the contract.
 *
 * Used when the poll creator needs to add more invite codes after initial
 * poll creation. Each code hash is submitted as a separate on-chain transaction
 * via the add_invite_codes circuit.
 *
 * Only the poll creator can call this successfully — the circuit asserts
 * that the caller's derived public key matches the poll's creator field.
 */
export function useAddInviteCodesMutation() {
  const { providers } = useWalletContext();

  return useMutation({
    mutationFn: async (params: AddInviteCodesParams): Promise<void> => {
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

      // Sequential submission — each tx must confirm before the next.
      // Consider batching in v2.
      const pollIdBytes = hexToBytes(params.pollId);
      for (const codeHash of params.codeHashes) {
        await callAddInviteCodes(contract, {
          pollId: pollIdBytes,
          codeHash,
        });
      }
    },
  });
}
