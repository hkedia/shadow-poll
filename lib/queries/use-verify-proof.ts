/**
 * Nullifier verification hook for Shadow Poll.
 *
 * Used by the /verify page to confirm that a given nullifier exists in the
 * on-chain vote_nullifiers map for a given poll. No wallet connection needed —
 * the server-side /api/indexer/verify-nullifier endpoint handles indexer access.
 *
 * Implements: ZKPR-02 (third-party proof verification)
 * Design decisions: D-62 updated — verify page no longer requires wallet
 */

import { useQuery } from "@tanstack/react-query";

/** Return type for useVerifyProof */
export interface VerifyProofResult {
  isValid: boolean | null; // null = not yet verified (loading)
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  needsWallet: false; // always false — server-side verification, no wallet needed
  refetch: () => void;
}

/**
 * Verifies a participation proof by checking the nullifier via server API.
 *
 * The verifier does NOT need a wallet — the server queries the indexer directly
 * and checks the on-chain vote_nullifiers map. The nullifier is a public hash
 * derived from poll_id + voter_sk, so membership alone proves a vote was cast.
 *
 * @param pollId - Hex-encoded poll ID (from URL param)
 * @param nullifier - Hex-encoded nullifier (from URL param)
 */
export function useVerifyProof(pollId: string, nullifier: string): VerifyProofResult {
  const hasParams = pollId.length > 0 && nullifier.length > 0;

  const query = useQuery({
    queryKey: ["verify-proof", pollId, nullifier],
    queryFn: async () => {
      const res = await fetch(
        `/api/indexer/verify-nullifier?nullifier=${encodeURIComponent(nullifier)}`,
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Verification request failed (${res.status})`);
      }
      const data = await res.json();
      return data.found as boolean;
    },
    enabled: hasParams,
    staleTime: 60_000, // verification result is stable — check once per minute
    retry: 1,
  });

  return {
    isValid: query.data !== undefined ? query.data : null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error instanceof Error ? query.error : null,
    needsWallet: false as const,
    refetch: query.refetch,
  };
}