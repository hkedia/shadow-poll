"use client";

import { useQuery } from "@tanstack/react-query";
import { useWalletContext } from "@/lib/midnight/wallet-context";
import { pollKeys } from "./use-poll";
import type { PollWithId } from "@/lib/midnight/ledger-utils";

/**
 * Hook to fetch all polls from the indexer.
 *
 * NOTE: Like usePoll, the actual indexer iteration depends on the SDK's
 * PublicDataProvider contract state API. The queryFn will be completed in
 * Phase 4. For now, the hook is structured with correct keys and types.
 *
 * The indexer provides the full ledger state, which we can iterate to
 * build the poll list. In Phase 4, this will:
 * 1. Get contract state from the indexer
 * 2. Parse with parseLedger(state)
 * 3. Iterate ledger.polls via Symbol.iterator
 * 4. Map to PollWithId[]
 */
export function usePolls() {
  const { providers, status } = useWalletContext();
  const isConnected = status === "connected" && providers !== null;

  return useQuery({
    queryKey: pollKeys.lists(),
    queryFn: async (): Promise<PollWithId[]> => {
      if (!providers) return [];

      // Phase 4 will implement the actual indexer query:
      // 1. Create real SDK provider via createIndexerProvider(providers.indexerConfig)
      // 2. Query contract state and parse with parseLedger(state)
      // 3. Iterate ledger.polls via Symbol.iterator
      // 4. Map to PollWithId[]
      //
      // Placeholder: returns empty array until indexer query is wired in Phase 4
      return [];
    },
    enabled: isConnected,
    refetchInterval: 30_000, // Refresh every 30 seconds for trending data
  });
}
