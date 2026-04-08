import type { MidnightProviderSet } from "./types";
import { createZkConfigProvider } from "./indexer";

/**
 * Assembles the Midnight provider set from the connected 1am wallet's enabled API.
 *
 * Stores indexer connection config (URIs) instead of creating the real SDK provider,
 * because Turbopack's resolveAlias intercepts dynamic imports of @midnight-ntwrk/*
 * packages in the client bundle and resolves them to the stub module.
 *
 * The real SDK IndexerPublicDataProvider will be created lazily in Phase 4 via
 * createIndexerProvider() when contract interactions actually need it.
 *
 * @param enabledApi - The enabled API returned by window.midnight['1am'].connect()
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function assembleProviders(enabledApi: any): Promise<MidnightProviderSet> {
  // Get network config from the wallet (indexer URLs, prover server, network ID)
  const config = await enabledApi.getConfiguration();

  // Get the proving provider directly from the wallet
  const proofProvider = await enabledApi.getProvingProvider();

  // Store indexer connection config — real SDK provider created lazily in Phase 4.
  // Cannot call createIndexerProvider() here because Turbopack stubs the dynamic
  // import of @midnight-ntwrk/midnight-js-indexer-public-data-provider in client bundles.
  const indexerConfig = {
    indexerUri: config.indexerUri as string,
    indexerWsUri: config.indexerWsUri as string,
  };

  // ZK config provider: resolves circuit key URIs from the app's public folder.
  // Uses window.location.origin in browser, falls back to localhost for SSR.
  const baseUrl = typeof window !== "undefined"
    ? window.location.origin
    : "http://localhost:3000";
  const zkConfigProvider = await createZkConfigProvider(baseUrl);

  return {
    zkConfigProvider,
    indexerConfig,
    walletProvider: enabledApi,
    proofProvider,
  };
}
