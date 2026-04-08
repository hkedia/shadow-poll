/**
 * Participation proof generation hook for Shadow Poll.
 *
 * Derives the voter's nullifier from their wallet secret key and confirms
 * it exists on-chain in the vote_nullifiers ledger map. Returns proof data
 * for the ProofPanel component to render share UI.
 *
 * Implements: ZKPR-01 (client-side participation proof generation)
 * Design decisions: D-60 (hybrid off-chain proof), D-62 (verify page reads on-chain)
 *
 * ALL @midnight-ntwrk/* and contract imports are dynamic (Turbopack constraint).
 */

import { useQuery } from "@tanstack/react-query";
import { useWalletContext } from "@/lib/midnight/wallet-context";
import { getContractAddress } from "@/lib/midnight/contract-service";

/** Return type for useParticipationProof */
export interface ParticipationProof {
  hasVoted: boolean;        // true if nullifier found on-chain
  nullifier: string | null; // hex-encoded nullifier (when hasVoted is true)
  proofUrl: string | null;  // /verify?pollId=...&nullifier=... URL (when hasVoted is true)
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Generates and verifies a participation proof for the given poll.
 *
 * Requires wallet to be connected — returns hasVoted: false with isLoading: false
 * immediately when the wallet is disconnected.
 *
 * @param pollId - Hex-encoded poll ID
 */
export function useParticipationProof(pollId: string): ParticipationProof {
  const { status, providers } = useWalletContext();
  const isConnected = status === "connected" && providers !== null;
  const contractAddress = getContractAddress();

  const query = useQuery({
    queryKey: ["participation-proof", pollId, status],
    queryFn: async () => {
      if (!providers || !contractAddress) {
        return { hasVoted: false, nullifier: null, proofUrl: null };
      }

      // Step 1: Get the voter's secret key from the wallet (dynamic import — Turbopack safe)
      const { getSecretKeyFromWallet } = await import("@/lib/midnight/witness-impl");
      const voterSk = await getSecretKeyFromWallet(providers.walletProvider);

      // Step 2: Convert hex poll ID to bytes and derive the nullifier
      const { hexToBytes, bytesToHex, deriveNullifier } = await import("@/lib/midnight/ledger-utils");
      const pollIdBytes = hexToBytes(pollId);
      const nullifierBytes = await deriveNullifier(pollIdBytes, voterSk);

      // Step 3: Query the on-chain vote_nullifiers map
      const { createIndexerProvider } = await import("@/lib/midnight/indexer");
      const { ledger: parseLedger } = await import("@/contracts/managed/contract");

      const publicDataProvider = await createIndexerProvider(
        providers.indexerConfig.indexerUri,
        providers.indexerConfig.indexerWsUri,
      );

      const state = await publicDataProvider.queryContractState(contractAddress);
      if (!state) {
        return { hasVoted: false, nullifier: null, proofUrl: null };
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ledgerState = parseLedger(state as any);
      const hasVoted = ledgerState.vote_nullifiers.member(nullifierBytes);

      if (!hasVoted) {
        return { hasVoted: false, nullifier: null, proofUrl: null };
      }

      // Step 4: Assemble the proof URL
      const nullifierHex = bytesToHex(nullifierBytes);
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const proofUrl = `${origin}/verify?pollId=${pollId}&nullifier=${nullifierHex}`;

      return {
        hasVoted: true,
        nullifier: nullifierHex,
        proofUrl,
      };
    },
    enabled: isConnected && Boolean(contractAddress) && pollId.length > 0,
    staleTime: 30_000, // re-check every 30s (proof status shouldn't change often)
    retry: 1,
  });

  return {
    hasVoted: query.data?.hasVoted ?? false,
    nullifier: query.data?.nullifier ?? null,
    proofUrl: query.data?.proofUrl ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error instanceof Error ? query.error : null,
    refetch: query.refetch,
  };
}
