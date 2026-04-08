import type {
  MidnightProviderSet,
  WalletProviderApi,
  ProofProviderApi,
  MidnightProviderApi,
  ZkConfigProvider,
} from "./types";

/**
 * Converts a Uint8Array (or array-like) to a lowercase hex string.
 * Used to serialize transactions before passing to the wallet API.
 */
function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Converts a hex string back to a Uint8Array.
 * Used to deserialize balanced transactions from the wallet API.
 */
function fromHex(hex: string): Uint8Array {
  const matches = hex.match(/.{2}/g);
  if (!matches) return new Uint8Array(0);
  return new Uint8Array(matches.map((b) => parseInt(b, 16)));
}

/**
 * Builds the structured WalletProvider expected by the Midnight SDK.
 *
 * Per the 1am.xyz API spec:
 *   - getCoinPublicKey → shieldedCoinPublicKey from getShieldedAddresses()
 *   - getEncryptionPublicKey → shieldedEncryptionPublicKey
 *   - balanceTx → hex-serialize tx, call api.balanceUnsealedTransaction(hex),
 *                 deserialize result via Transaction.deserialize('signature', 'proof', 'binding', bytes)
 *
 * The balanceTx implementation adds dust fees server-side via ProofStation —
 * the user pays zero NIGHT and zero dust.
 *
 * ALL @midnight-ntwrk imports in balanceTx are dynamic (Turbopack constraint).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildWalletProvider(enabledApi: any, shieldedAddresses: any): WalletProviderApi {
  return {
    getCoinPublicKey(): string {
      return shieldedAddresses?.shieldedCoinPublicKey ?? "";
    },
    getEncryptionPublicKey(): string {
      return shieldedAddresses?.shieldedEncryptionPublicKey ?? "";
    },
    async balanceTx(tx: unknown): Promise<unknown> {
      // Serialize the unbalanced (proved) transaction to hex
      const txBytes = (tx as { serialize(): Uint8Array }).serialize();
      const hex = toHex(txBytes);

      // ProofStation adds dust fees — user cost is zero
      const result = await enabledApi.balanceUnsealedTransaction(hex);

      // Deserialize the balanced transaction returned by the wallet
      const { Transaction } = await import("@midnight-ntwrk/ledger-v8");
      const balancedBytes = fromHex(result.tx);
      return Transaction.deserialize("signature", "proof", "binding", balancedBytes);
    },
  };
}

/**
 * Builds the structured ProofProvider expected by the Midnight SDK.
 *
 * Per the 1am.xyz API spec:
 *   proveTx(unprovenTx) → unprovenTx.prove(provingProvider, CostModel.initialCostModel())
 *
 * The provingProvider comes from api.getProvingProvider(zkConfigProvider),
 * where zkConfigProvider tells the prover where to fetch circuit keys.
 *
 * ALL @midnight-ntwrk imports are dynamic (Turbopack constraint).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildProofProvider(provingProvider: any): ProofProviderApi {
  return {
    async proveTx(unprovenTx: unknown): Promise<unknown> {
      const { CostModel } = await import("@midnight-ntwrk/ledger-v8");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (unprovenTx as any).prove(provingProvider, CostModel.initialCostModel());
    },
  };
}

/**
 * Builds the structured MidnightProvider expected by the Midnight SDK.
 *
 * Per the 1am.xyz API spec:
 *   submitTx(tx) → hex-serialize tx, call api.submitTransaction(hex),
 *                  return tx.identifiers()[0]
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildMidnightProvider(enabledApi: any): MidnightProviderApi {
  return {
    async submitTx(tx: unknown): Promise<string> {
      const txBytes = (tx as { serialize(): Uint8Array }).serialize();
      const hex = toHex(txBytes);
      await enabledApi.submitTransaction(hex);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const identifiers: string[] = (tx as any).identifiers?.() ?? [];
      return identifiers[0] ?? hex.slice(0, 64);
    },
  };
}

/**
 * Assembles the Midnight provider set from the connected 1am wallet's ConnectedAPI.
 *
 * Follows the full 1am.xyz API spec flow:
 *   1. api.getConfiguration() → networkId, indexerUri, indexerWsUri, proverServerUri
 *   2. setNetworkId(config.networkId) — configures the ledger WASM module
 *   3. FetchZkConfigProvider — fetches circuit keys from the app's public/zk-keys/ folder
 *   4. api.getProvingProvider(zkConfigProvider) → ZK proving provider
 *   5. api.getShieldedAddresses() → coin + encryption public keys for walletProvider
 *   6. Build structured walletProvider, proofProvider, midnightProvider
 *
 * Stores indexer config for lazy IndexerPublicDataProvider creation (Turbopack constraint).
 *
 * @param enabledApi - The ConnectedAPI returned by window.midnight['1am'].connect('preview')
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function assembleProviders(enabledApi: any): Promise<MidnightProviderSet> {
  // 1. Get network configuration from the wallet
  const config = await enabledApi.getConfiguration();

  // 2. Set the global network ID for the ledger WASM module.
  //    Dynamic import required due to Turbopack stubbing.
  const { setNetworkId } = await import("@midnight-ntwrk/midnight-js-network-id");
  setNetworkId(config.networkId);

  // 3. Build the ZK config provider using the SDK's FetchZkConfigProvider.
  //    It fetches circuit keys from the app's public/zk-keys/ folder at proving time.
  //    Dynamic import required due to Turbopack stubbing.
  const baseUrl = typeof window !== "undefined"
    ? window.location.origin
    : "http://localhost:3000";
  const zkKeysUrl = `${baseUrl}/zk-keys`;

  const { FetchZkConfigProvider } = await import(
    "@midnight-ntwrk/midnight-js-fetch-zk-config-provider"
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const zkConfigProvider: ZkConfigProvider = new (FetchZkConfigProvider as any)(
    zkKeysUrl,
    fetch.bind(window),
  );

  // 4. Get the ZK proving provider from the wallet, passing the ZK config provider
  //    so ProofStation can fetch the circuit keys from our public folder.
  const provingProvider = await enabledApi.getProvingProvider(zkConfigProvider);

  // 5. Get shielded addresses for walletProvider key accessors
  const shieldedAddresses = await enabledApi.getShieldedAddresses();

  // 6. Store indexer connection config for lazy IndexerPublicDataProvider creation.
  //    Cannot create the real SDK provider here because Turbopack stubs the dynamic
  //    import of @midnight-ntwrk/midnight-js-indexer-public-data-provider.
  const indexerConfig = {
    indexerUri: config.indexerUri as string,
    indexerWsUri: config.indexerWsUri as string,
  };

  // 7. Build all structured providers per the 1am.xyz API spec
  const walletProvider = buildWalletProvider(enabledApi, shieldedAddresses);
  const proofProvider = buildProofProvider(provingProvider);
  const midnightProvider = buildMidnightProvider(enabledApi);

  return {
    zkConfigProvider,
    indexerConfig,
    walletProvider,
    proofProvider,
    midnightProvider,
    networkId: config.networkId as string,
  };
}

/**
 * Assembles the full MidnightProviders object required by the SDK's
 * deployContract / findDeployedContract / callTx functions.
 *
 * This converts the app's MidnightProviderSet (stored during wallet connection)
 * into the 6-field provider object the SDK expects:
 *   1. publicDataProvider — real IndexerPublicDataProvider from SDK
 *   2. zkConfigProvider — FetchZkConfigProvider (from wallet connection)
 *   3. proofProvider — wraps provingProvider.prove with CostModel
 *   4. walletProvider — balances txs via ProofStation (user cost = zero)
 *   5. midnightProvider — submits txs via api.submitTransaction
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
  return {
    publicDataProvider,
    zkConfigProvider: providerSet.zkConfigProvider,
    proofProvider: providerSet.proofProvider,
    walletProvider: providerSet.walletProvider,
    midnightProvider: providerSet.midnightProvider,
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
