"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { MetadataResponse, StoreMetadataRequest } from "@/lib/midnight/metadata-store";

/** Query key factory for metadata queries. */
export const metadataKeys = {
  all: ["metadata"] as const,
  detail: (pollId: string) => ["metadata", pollId] as const,
};

/**
 * Fetches poll metadata from the off-chain API route.
 */
async function fetchMetadata(pollId: string): Promise<MetadataResponse> {
  const res = await fetch(`/api/polls/metadata?pollId=${encodeURIComponent(pollId)}`);
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error("Metadata not found");
    }
    const body = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(body.error || `Failed to fetch metadata: ${res.status}`);
  }
  return res.json();
}

/**
 * Hook to fetch metadata for a single poll.
 *
 * @param pollId - Hex-encoded poll ID (64 chars). Pass null/undefined to disable.
 */
export function useMetadata(pollId: string | null | undefined) {
  return useQuery({
    queryKey: metadataKeys.detail(pollId ?? ""),
    queryFn: () => fetchMetadata(pollId!),
    enabled: !!pollId,
    staleTime: 60_000, // Metadata doesn't change after creation — 1 minute stale time
  });
}

/**
 * Mutation hook to store poll metadata via the API route.
 * Automatically seeds the query cache on success.
 */
export function useStoreMetadata() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: StoreMetadataRequest) => {
      const res = await fetch("/api/polls/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(body.error || `Failed to store metadata: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      // Seed the cache with the metadata we just stored
      const normalizedId = variables.pollId.toLowerCase();
      const cacheEntry: MetadataResponse = {
        pollId: normalizedId,
        metadata: variables.metadata,
        metadataHash: variables.metadataHash,
      };
      queryClient.setQueryData(metadataKeys.detail(normalizedId), cacheEntry);
    },
  });
}
