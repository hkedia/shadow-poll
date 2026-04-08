import type { MidnightProviderSet } from "./types";
import { createZkConfigProvider } from "./indexer";

/**
 * Assembles the Midnight provider set from the connected 1am wallet's enabled API.
 *
 * Stores indexer connection config (URIs) instead of creating the real SDK provider,
 * because Turbopack's resolveAlias intercepts dynamic imports of @midnight-ntwrk/*
 * packages in the client bundle and resolves them to the stub module.
 *
 * The real SDK provider is created lazily via assembleMidnightProviders() when
 * contract interactions actually need it.
 *
 * @param enabledApi - The enabled API returned by window.midnight['1am'].connect()
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function assembleProviders(enabledApi: any): Promise<MidnightProviderSet> {
  // Get network config from the wallet (indexer URLs, prover server, network ID)
  const config = await enabledApi.getConfiguration();

  // Get the proving provider directly from the wallet
  const proofProvider = await enabledApi.getProvingProvider();

  // Store indexer connection config — real SDK provider created lazily.
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

/**
 * Assembles the full MidnightProviders object required by the SDK's
 * deployContract / findDeployedContract / callTx functions.
 *
 * This converts the app's MidnightProviderSet (stored during wallet connection)
 * into the 6-field provider object the SDK expects:
 *   1. publicDataProvider — real IndexerPublicDataProvider from SDK
 *   2. zkConfigProvider — circuit key URI resolver
 *   3. proofProvider — ZK proof generation via wallet's proving server
 *   4. walletProvider — transaction balancing and coin key retrieval
 *   5. midnightProvider — transaction submission to the network
 *   6. privateStateProvider — in-memory private state (sufficient for testnet)
 *
 * ALL @midnight-ntwrk imports are dynamic (Turbopack constraint).
 *
 * @param providerSet - The MidnightProviderSet from useWallet()
 */
export async function assembleMidnightProviders(providerSet: MidnightProviderSet) {
  // 1. Create real SDK PublicDataProvider via the indexer factory
  const { createIndexerProvider } = await import("./indexer");
  const publicDataProvider = await createIndexerProvider(
    providerSet.indexerConfig.indexerUri,
    providerSet.indexerConfig.indexerWsUri,
  );

  // 2. Return the full provider object the SDK expects.
  //    The wallet API serves as both walletProvider and midnightProvider
  //    because the 1am wallet handles balancing, signing, and submission.
  //    Private state is in-memory since all ledger fields are public
  //    (assumption A5: sufficient for testnet).
  return {
    publicDataProvider,
    zkConfigProvider: providerSet.zkConfigProvider,
    proofProvider: providerSet.proofProvider,
    walletProvider: providerSet.walletProvider,
    midnightProvider: providerSet.walletProvider,
    privateStateProvider: createInMemoryPrivateStateProvider(),
  };
}

/**
 * Creates a minimal in-memory PrivateStateProvider.
 *
 * The Poll Manager contract has no private ledger fields — all state is public.
 * This provider satisfies the SDK interface with a simple Map-based store.
 * Suitable for v1/testnet where data loss on refresh is acceptable.
 */
function createInMemoryPrivateStateProvider() {
  const states = new Map<string, unknown>();
  const signingKeys = new Map<string, unknown>();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let currentAddress: string | undefined;

  return {
    setContractAddress(address: string): void {
      currentAddress = address;
    },
    async set(id: string, state: unknown): Promise<void> {
      states.set(id, state);
    },
    async get(id: string): Promise<unknown | null> {
      return states.get(id) ?? null;
    },
    async remove(id: string): Promise<void> {
      states.delete(id);
    },
    async clear(): Promise<void> {
      states.clear();
    },
    async setSigningKey(address: string, signingKey: unknown): Promise<void> {
      signingKeys.set(address, signingKey);
    },
    async getSigningKey(address: string): Promise<unknown | null> {
      return signingKeys.get(address) ?? null;
    },
    async removeSigningKey(address: string): Promise<void> {
      signingKeys.delete(address);
    },
    async clearSigningKeys(): Promise<void> {
      signingKeys.clear();
    },
    async exportPrivateStates(): Promise<never> {
      throw new Error("Export not supported in in-memory provider");
    },
    async importPrivateStates(): Promise<never> {
      throw new Error("Import not supported in in-memory provider");
    },
    async exportSigningKeys(): Promise<never> {
      throw new Error("Export not supported in in-memory provider");
    },
    async importSigningKeys(): Promise<never> {
      throw new Error("Import not supported in in-memory provider");
    },
  };
}
