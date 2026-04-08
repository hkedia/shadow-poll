// Types for Shadow Poll wallet and provider integration.
// Provider types for indexer and ZK config are structurally typed to match the SDK interfaces
// without requiring a direct import of @midnight-ntwrk/midnight-js-types (which is Turbopack-stubbed).
// Wallet and proof provider types remain loose until Phase 4 when circuits are called.

export type ConnectionStatus =
  | "idle"           // initial state before detection
  | "not_detected"   // 1am.xyz extension not found
  | "disconnected"   // extension found, not connected
  | "connecting"     // connection in progress
  | "connected"      // connected, address available
  | "error";         // connection failed

/**
 * Structural type matching the Midnight SDK's PublicDataProvider interface.
 * The real type is imported from @midnight-ntwrk/midnight-js-types at runtime,
 * but cannot be used at the module level due to Turbopack stubbing.
 *
 * This interface captures only the methods we use in Shadow Poll.
 * The actual SDK provider satisfies this and more.
 *
 * NOTE: Not used directly in MidnightProviderSet yet — the real provider is
 * created lazily in Phase 4 via createIndexerProvider() because Turbopack's
 * resolveAlias stubs dynamic imports of @midnight-ntwrk/* in the client bundle.
 */
export interface IndexerPublicDataProvider {
  queryContractState(contractAddress: string, config?: unknown): Promise<unknown>;
  watchForContractState(contractAddress: string): Promise<unknown>;
  watchForDeployTxData(contractAddress: string): Promise<unknown>;
}

/**
 * Indexer connection configuration stored during wallet connection.
 * The real SDK IndexerPublicDataProvider is created lazily from these URIs
 * in Phase 4 when contract interactions need it, because Turbopack's
 * resolveAlias intercepts dynamic imports and stubs @midnight-ntwrk/* packages
 * in the client bundle.
 */
export interface IndexerConfig {
  indexerUri: string;
  indexerWsUri: string;
}

/**
 * Configuration for the ZK proving/verifying key fetch provider.
 * Used to download circuit keys at proving time.
 */
export interface ZkConfigProvider {
  getProvingKeyURI(circuitName: string): string;
  getVerifyingKeyURI(circuitName: string): string;
}

export interface MidnightProviderSet {
  zkConfigProvider: ZkConfigProvider;
  /** Indexer connection config — real SDK provider created lazily in Phase 4 via createIndexerProvider() */
  indexerConfig: IndexerConfig;
  /** Wallet enabled API — type tightened in Phase 4 */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  walletProvider: any;
  /** Proof provider from wallet — type tightened in Phase 4 */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  proofProvider: any;
}

export interface WalletState {
  status: ConnectionStatus;
  address: string | null;
  truncatedAddress: string | null;
  providers: MidnightProviderSet | null;
  error: string | null;
}

export interface WalletContextValue extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  isDetected: boolean;
}
