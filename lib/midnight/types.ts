// Types for Shadow Poll wallet integration.
// Provider types are intentionally loose (any) in Phase 1 — to be tightened in Phase 3
// when the full indexer provider is wired with @midnight-ntwrk/midnight-js-types.

export type ConnectionStatus =
  | "idle"           // initial state before detection
  | "not_detected"   // 1am.xyz extension not found
  | "disconnected"   // extension found, not connected
  | "connecting"     // connection in progress
  | "connected"      // connected, address available
  | "error";         // connection failed

export interface MidnightProviderSet {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  zkConfigProvider: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  indexerPublicDataProvider: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  walletProvider: any;
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
