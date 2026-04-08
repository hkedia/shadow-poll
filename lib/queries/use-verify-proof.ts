/**
 * Nullifier verification hook for Shadow Poll.
 *
 * Used by the /verify page to confirm that a given nullifier exists in the
 * on-chain vote_nullifiers map for a given poll. No wallet secret key needed —
 * the nullifier is provided directly from the URL params.
 *
 * Implements: ZKPR-02 (third-party proof verification)
 * Design decisions: D-62 (verify page reads on-chain vote_nullifiers live)
 *
 * Requires wallet connection for indexer access.
 */

import { useQuery } from "@tanstack/react-query";
import { useWalletContext } from "@/lib/midnight/wallet-context";
import { getContractAddress } from "@/lib/midnight/contract-service";
import { hexToBytes } from "@/lib/midnight/ledger-utils";
import { createIndexerProvider } from "@/lib/midnight/indexer";
import { ledger as parseLedger } from "@/contracts/managed/contract";

/** Return type for useVerifyProof */
export interface VerifyProofResult {
  isValid: boolean | null; // null = not yet verified (loading or no wallet)
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  needsWallet: boolean;    // true when wallet not connected
  refetch: () => void;
}

/**
 * Verifies a participation proof by checking the nullifier on-chain.
 *
 * The verifier does NOT need to know the voter's secret key — only the
 * nullifier (a public hash derived from poll_id + voter_sk). The on-chain
 * vote_nullifiers map is the source of truth.
 *
 * @param pollId - Hex-encoded poll ID (from URL param)
 * @param nullifier - Hex-encoded nullifier (from URL param)
 */
export function useVerifyProof(pollId: string, nullifier: string): VerifyProofResult {
  const { status, providers } = useWalletContext();
  const isConnected = status === "connected" && providers !== null;
  const contractAddress = getContractAddress();

  const hasParams = pollId.length > 0 && nullifier.length > 0;

  const query = useQuery({
    queryKey: ["verify-proof", pollId, nullifier],
    queryFn: async () => {
      if (!providers || !contractAddress) {
        throw new Error("Wallet not connected or contract address not configured");
      }

      // Convert hex nullifier to bytes for the Map.member() check
      const nullifierBytes = hexToBytes(nullifier);

      // Query the on-chain contract state
      const publicDataProvider = await createIndexerProvider(
        providers.indexerConfig.indexerUri,
        providers.indexerConfig.indexerWsUri,
      );

      const state = await publicDataProvider.queryContractState(contractAddress);
      if (!state) return false;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ledgerState = parseLedger(state.data);
      return ledgerState.vote_nullifiers.member(nullifierBytes);
    },
    enabled: isConnected && Boolean(contractAddress) && hasParams,
    staleTime: 60_000, // verification result is stable — check once per minute
    retry: 1,
  });

  return {
    isValid: query.data !== undefined ? query.data : null,
    isLoading: query.isLoading && isConnected,
    isError: query.isError,
    error: query.error instanceof Error ? query.error : null,
    needsWallet: !isConnected,
    refetch: query.refetch,
  };
}
