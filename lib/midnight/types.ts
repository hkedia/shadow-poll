// Types for Shadow Poll wallet and provider integration.
// Provider types are structurally typed to match the SDK interfaces without requiring a
// direct import of @midnight-ntwrk/midnight-js-types.
// Wallet, proof, and midnight provider types are structural subsets of the real SDK types.

import type { ContractState } from "@midnight-ntwrk/compact-runtime";

export type { ContractState };

export type ConnectionStatus =
  | "idle"           // initial state before detection
  | "not_detected"   // 1am.xyz extension not found
  | "disconnected"   // extension found, not connected
  | "connecting"     // connection in progress
  | "connected"      // connected, address available
  | "error";         // connection failed

/**
 * Structural type matching the Midnight SDK's PublicDataProvider interface.
 *
 * This interface captures only the methods we use in Shadow Poll.
 * The actual SDK provider satisfies this and more.
 */
export interface IndexerPublicDataProvider {
  queryContractState(contractAddress: string, config?: unknown): Promise<ContractState | null>;
  watchForContractState(contractAddress: string): Promise<unknown>;
  watchForDeployTxData(contractAddress: string): Promise<unknown>;
}

/**
 * Indexer connection configuration stored during wallet connection.
 * The real SDK IndexerPublicDataProvider is created lazily from these URIs
 * when contract interactions need it.
 */
export interface IndexerConfig {
  indexerUri: string;
  indexerWsUri: string;
}

/**
 * Network configuration returned by api.getConfiguration().
 * Used to set the network ID and configure all SDK providers.
 */
export interface NetworkConfig {
  networkId: string;
  indexerUri: string;
  indexerWsUri: string;
  proverServerUri: string;
  substrateNodeUri: string;
}

/**
 * Shielded address info returned by api.getShieldedAddresses().
 */
export interface ShieldedAddresses {
  shieldedAddress: string;
  shieldedCoinPublicKey: string;
  shieldedEncryptionPublicKey: string;
}

/**
 * Configuration for the ZK proving/verifying key fetch provider.
 * Used to download circuit keys at proving time.
 * Matches the interface of FetchZkConfigProvider from the SDK.
 */
export interface ZkConfigProvider {
  getProvingKeyURI(circuitName: string): string;
  getVerifyingKeyURI(circuitName: string): string;
}

/**
 * Structural type matching the Midnight SDK's WalletProvider interface.
 * Built from the connected 1am API:
 *   - getCoinPublicKey: returns shieldedCoinPublicKey from getShieldedAddresses()
 *   - getEncryptionPublicKey: returns shieldedEncryptionPublicKey
 *   - balanceTx: hex-serializes the tx, calls api.balanceUnsealedTransaction(hex),
 *                then deserializes the result via Transaction.deserialize
 */
export interface WalletProviderApi {
  balanceTx(tx: unknown): Promise<unknown>;
  getCoinPublicKey(): string;
  getEncryptionPublicKey(): string;
}

/**
 * Structural type matching the Midnight SDK's ProofProvider interface.
 * Wraps unprovenTx.prove(provingProvider, CostModel.initialCostModel()).
 */
export interface ProofProviderApi {
  proveTx(unprovenTx: unknown, config?: unknown): Promise<unknown>;
}

/**
 * Structural type matching the Midnight SDK's MidnightProvider interface.
 * Handles submitting finalized transactions to the Midnight network via
 * api.submitTransaction(hex). Returns the first transaction identifier.
 */
export interface MidnightProviderApi {
  submitTx(tx: unknown): Promise<string>;
}

export interface MidnightProviderSet {
  zkConfigProvider: ZkConfigProvider;
  /** Indexer connection config — real SDK provider created lazily via createIndexerProvider() */
  indexerConfig: IndexerConfig;
  /** Wallet provider — properly structured per 1am API spec */
  walletProvider: WalletProviderApi;
  /** Proof provider — wraps provingProvider.prove with CostModel */
  proofProvider: ProofProviderApi;
  /** Midnight provider — submits transactions via api.submitTransaction */
  midnightProvider: MidnightProviderApi;
}

export interface WalletState {
  status: ConnectionStatus;
  /** Full shielded address string — used as the display address */
  address: string | null;
  truncatedAddress: string | null;
  /** Full shielded address details from api.getShieldedAddresses() */
  shieldedAddresses: ShieldedAddresses | null;
  providers: MidnightProviderSet | null;
  error: string | null;
}

export interface WalletContextValue extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  isDetected: boolean;
}
