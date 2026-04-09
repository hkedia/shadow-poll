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
 * poll creation. All code hashes are submitted in a single on-chain transaction
 * via the add_invite_codes circuit (batch mode, up to 10 codes per call).
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

      // Submit all invite code hashes in a single on-chain transaction.
      const pollIdBytes = hexToBytes(params.pollId);
      await callAddInviteCodes(contract, {
        pollId: pollIdBytes,
        codeHashes: params.codeHashes,
      });
    },
  });
}
