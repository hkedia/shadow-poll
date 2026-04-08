import type { MidnightProviderSet } from "./types";

const MIDNIGHT_PREVIEW_INDEXER_URL =
  process.env.NEXT_PUBLIC_MIDNIGHT_INDEXER_URL ??
  "https://indexer.midnight.network/api/v1/graphql";

const MIDNIGHT_PREVIEW_ZK_CONFIG_URL =
  process.env.NEXT_PUBLIC_MIDNIGHT_ZK_CONFIG_URL ??
  "https://zk.midnight.network/";

/**
 * Assembles the full Midnight provider set required for contract interactions.
 * Provider types are loose in Phase 1 — tightened in Phase 3 with full indexer wiring.
 * @param walletApi - The 1am.xyz wallet API object (window.midnight['1am'])
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function assembleProviders(walletApi: any): Promise<MidnightProviderSet> {
  // Dynamic imports to avoid SSR issues with WASM packages
  const { FetchZkConfigProvider } = await import(
    "@midnight-ntwrk/midnight-js-fetch-zk-config-provider"
  );
  const { indexerPublicDataProvider } = await import(
    "@midnight-ntwrk/midnight-js-indexer-public-data-provider"
  );

  const zkConfigProvider = new FetchZkConfigProvider(
    MIDNIGHT_PREVIEW_ZK_CONFIG_URL,
    fetch.bind(globalThis)
  );

  // indexerPublicDataProvider requires queryURL + subscriptionURL (WebSocket)
  const subscriptionURL = MIDNIGHT_PREVIEW_INDEXER_URL.replace(
    /^https?:\/\//,
    "wss://"
  ).replace(/\/graphql$/, "/graphql");

  const indexerProvider = indexerPublicDataProvider(
    MIDNIGHT_PREVIEW_INDEXER_URL,
    subscriptionURL
  );

  // Wallet provider: wraps the 1am.xyz API
  const walletProvider = walletApi;

  // Proof provider: uses the wallet's built-in proof generation
  const proofProvider = walletApi;

  return {
    zkConfigProvider,
    indexerPublicDataProvider: indexerProvider,
    walletProvider,
    proofProvider,
  };
}
