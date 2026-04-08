// Types for Shadow Poll wallet and provider integration.
// Provider types are structurally typed to match the SDK interfaces without requiring a
// direct import of @midnight-ntwrk/midnight-js-types (which is Turbopack-stubbed).
// Wallet, proof, and midnight provider types are structural subsets of the real SDK types.

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

/**
 * Structural type matching the Midnight SDK's WalletProvider interface.
 * The 1am wallet's enabled API exposes these methods for transaction balancing
 * and coin key retrieval.
 */
export interface WalletProviderApi {
  balanceTx(tx: unknown): Promise<unknown>;
  getCoinPublicKey(): unknown;
  getEncryptionPublicKey(): unknown;
}

/**
 * Structural type matching the Midnight SDK's ProofProvider interface.
 * The 1am wallet's proving provider creates ZK proofs for unproven transactions.
 */
export interface ProofProviderApi {
  proveTx(unprovenTx: unknown, config?: unknown): Promise<unknown>;
}

/**
 * Structural type matching the Midnight SDK's MidnightProvider interface.
 * Handles submitting finalized transactions to the Midnight network.
 * In practice, the wallet's enabled API also satisfies this interface.
 */
export interface MidnightProviderApi {
  submitTx(tx: unknown): Promise<unknown>;
}

export interface MidnightProviderSet {
  zkConfigProvider: ZkConfigProvider;
  /** Indexer connection config — real SDK provider created lazily via createIndexerProvider() */
  indexerConfig: IndexerConfig;
  /** Wallet enabled API for transaction balancing and key retrieval */
  walletProvider: WalletProviderApi;
  /** Proof provider from wallet for ZK proof generation */
  proofProvider: ProofProviderApi;
}

export interface WalletState {
  status: ConnectionStatus;
  /** True when the current connection attempt is an automatic reconnect on page load
   *  (not triggered by user interaction). Used to suppress approval-prompt UI during
   *  silent autoconnect — the 1am wallet silently reconnects already-authorized sites
   *  without showing a popup, so the "approve the connection" overlay would be misleading. */
  isAutoConnecting: boolean;
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
