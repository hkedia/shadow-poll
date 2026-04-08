import type { IndexerPublicDataProvider, ZkConfigProvider } from "./types";

/**
 * Creates a Midnight indexer public data provider using the SDK.
 * Uses dynamic import because @midnight-ntwrk packages cannot be statically
 * imported in client bundles (they're Turbopack-stubbed).
 *
 * @param indexerUri - The indexer GraphQL HTTP endpoint (from wallet config)
 * @param indexerWsUri - The indexer WebSocket endpoint (from wallet config)
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

/**
 * Creates a ZK config provider that fetches proving/verifying keys from the app's public/ folder.
 * Keys are served at /zk-keys/{circuitName}.prover and /zk-keys/{circuitName}.verifier
 * with CORS headers configured in next.config.ts.
 */
export async function createZkConfigProvider(
  baseUrl: string,
): Promise<ZkConfigProvider> {
  // Simple URL-based provider — no SDK import needed.
  // The Midnight SDK's FetchZkConfigProvider does the same thing but with additional
  // fetch logic. For Phase 3, a simple URI resolver is sufficient since the keys
  // are served as static files from public/zk-keys/.
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  return {
    getProvingKeyURI: (circuitName: string) =>
      `${normalizedBase}/zk-keys/${circuitName}.prover`,
    getVerifyingKeyURI: (circuitName: string) =>
      `${normalizedBase}/zk-keys/${circuitName}.verifier`,
  };
}
