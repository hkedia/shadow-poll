import type { IndexerPublicDataProvider } from "./types";

/**
 * Creates a Midnight indexer public data provider using the SDK.
 * Uses dynamic import because @midnight-ntwrk packages cannot be statically
 * imported in client bundles (they're Turbopack-stubbed).
 *
 * @param indexerUri - The indexer GraphQL HTTP endpoint (from api.getConfiguration())
 * @param indexerWsUri - The indexer WebSocket endpoint (from api.getConfiguration())
 */
export async function createIndexerProvider(
  indexerUri: string,
  indexerWsUri: string,
): Promise<IndexerPublicDataProvider> {
  const { indexerPublicDataProvider } = await import(
    "@midnight-ntwrk/midnight-js-indexer-public-data-provider"
  );
  // The SDK factory returns PublicDataProvider which satisfies our structural
  // IndexerPublicDataProvider interface. Cast through unknown because the SDK
  // type has additional methods beyond our structural subset.
  return indexerPublicDataProvider(indexerUri, indexerWsUri) as unknown as IndexerPublicDataProvider;
}
