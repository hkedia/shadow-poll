// Stub module — Midnight SDK packages are Node.js/WASM-only.
// They are loaded via dynamic import() at runtime after user interaction.
// This stub prevents Turbopack from bundling them at build time.
//
// Every symbol referenced by Turbopack-analyzed imports (including dynamic ones)
// must be exported here, even as a no-op, so the module graph resolves cleanly.
// At runtime these stubs are NEVER executed — real SDK code runs via dynamic
// import() in event handlers / callbacks which bypass the stub at runtime.

export default {};

// ---------------------------------------------------------------------------
// @midnight-ntwrk/midnight-js-indexer-public-data-provider
// ---------------------------------------------------------------------------
export const indexerPublicDataProvider = undefined;

// ---------------------------------------------------------------------------
// @midnight-ntwrk/midnight-js-fetch-zk-config-provider
// ---------------------------------------------------------------------------
export const FetchZkConfigProvider = undefined;

// ---------------------------------------------------------------------------
// @midnight-ntwrk/compact-runtime  (used by contracts/managed/contract/index.js)
// ---------------------------------------------------------------------------
// Classes — must be constructable (the compiled contract calls `new`)
/* eslint-disable @typescript-eslint/no-explicit-any */
const noopClass = class {
  constructor(..._args: any[]) {}
  alignment() { return []; }
  fromValue(_v: any) { return undefined; }
  toValue(_v: any) { return undefined; }
  read() { return undefined; }
  member() { return false; }
  lookup() { return undefined; }
  [Symbol.iterator]() { return { next: () => ({ done: true as const, value: undefined }) }; }
};

export const CompactTypeBytes = noopClass;
export const CompactTypeUnsignedInteger = noopClass;
export const CompactTypeEnum = noopClass;
export const CompactTypeBoolean = noopClass;
export const CompactTypeVector = noopClass;
export const StateMap = noopClass;
export const StateValue = noopClass;
export const ChargedState = noopClass;
export const ContractState = noopClass;
export const ContractOperation = noopClass;
export const CostModel = noopClass;
export const QueryContext = noopClass;
export const CompactError = noopClass;

// Functions
export const checkRuntimeVersion = () => {};
export const assert = () => {};
export const persistentHash = () => new Uint8Array(32);
export const convertFieldToBytes = () => new Uint8Array(32);
export const createCircuitContext = () => ({});
export const createWitnessContext = () => ({});
export const dummyContractAddress = () => "";
export const emptyRunningCost = () => ({});
export const queryLedgerState = () => undefined;
export const typeError = () => { throw new Error("stub"); };
export const valueToBigInt = () => BigInt(0);
/* eslint-enable @typescript-eslint/no-explicit-any */

// ---------------------------------------------------------------------------
// @midnight-ntwrk/compact-js
// ---------------------------------------------------------------------------
export const CompiledContract = {
  make: () => ({}),
  withWitnesses: () => ({}),
  withCompiledFileAssets: () => ({}),
};

// ---------------------------------------------------------------------------
// @midnight-ntwrk/midnight-js-contracts
// ---------------------------------------------------------------------------
export const deployContract = undefined;
export const findDeployedContract = undefined;

// ---------------------------------------------------------------------------
// @midnight-ntwrk/midnight-js-types (only types — no runtime values needed)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// @midnight-ntwrk/midnight-js-network-id
// ---------------------------------------------------------------------------
export const NetworkId = undefined;

// ---------------------------------------------------------------------------
// Other stubbed packages (ws, isomorphic-ws, etc.) only need default export
// ---------------------------------------------------------------------------
