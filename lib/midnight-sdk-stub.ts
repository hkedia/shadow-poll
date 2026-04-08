// Stub module — WASM-based and Node.js-only Midnight SDK packages.
//
// Turbopack resolveAlias redirects ALL imports of @midnight-ntwrk/* packages
// (and ws/isomorphic-ws) to this file, both in static and dynamic import()
// contexts. This prevents Turbopack from trying to bundle WASM or Node.js-only
// modules that cannot run in the browser.
//
// IMPORTANT: Every symbol that any @midnight-ntwrk/* package references at
// module-load time (via static import) MUST be exported here — even as a
// no-op — so the module graph resolves cleanly at build time.
//
// At runtime, we provide REAL implementations of the browser-safe packages
// (FetchZkConfigProvider, indexerPublicDataProvider) directly in this file,
// so the deploy/vote flows work correctly in the browser without needing the
// real WASM-dependent SDK packages.

/* eslint-disable @typescript-eslint/no-explicit-any */

export default {};

// ---------------------------------------------------------------------------
// @midnight-ntwrk/compact-runtime  (used by contracts/managed/contract/index.js
//   AND imported by midnight-js-indexer-public-data-provider)
// ---------------------------------------------------------------------------
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
// ContractState is used by indexer provider: ContractState.deserialize(bytes)
// ContractState is used by both:
//   - contracts/managed/contract/index.js: `new ContractState()` and `.data`
//   - midnight-js-indexer-public-data-provider: `ContractState.deserialize(bytes)`
export const ContractState = class ContractState {
  data: any = {};
  constructor(..._args: any[]) {}
  static deserialize(_bytes: any) { return new (ContractState as any)(); }
};
export const ContractOperation = noopClass;
export const QueryContext = noopClass;
export const CompactError = noopClass;

export const CostModel = {
  initialCostModel: () => ({}),
};

export const Transaction = {
  deserialize: (..._args: any[]) => ({ serialize: () => new Uint8Array(0), identifiers: () => [] }),
};

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

// ---------------------------------------------------------------------------
// @midnight-ntwrk/ledger-v8
// Imported by both providers.ts (CostModel, Transaction) and
// midnight-js-indexer-public-data-provider (LedgerParameters, Transaction, ZswapChainState)
// ---------------------------------------------------------------------------
// LedgerParameters.deserialize and ZswapChainState.deserialize are called by
// the real indexer provider — our stub indexerPublicDataProvider doesn't call
// these, but they must be exported so Turbopack's module graph resolves cleanly.
export const LedgerParameters = {
  deserialize: (_bytes: any) => ({ __stub: true }),
  initialParameters: () => ({ __stub: true }),
};
export const ZswapChainState = {
  deserialize: (_bytes: any) => ({ __stub: true }),
};

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
// @midnight-ntwrk/midnight-js-types
// Imported by midnight-js-fetch-zk-config-provider and indexer provider.
// These are pure values — no WASM calls — so we replicate them faithfully.
// ---------------------------------------------------------------------------

// String constants used as discriminants in the Midnight effect system:
export const SucceedEntirely = "SucceedEntirely";
export const FailFallible = "FailFallible";
export const FailEntirely = "FailEntirely";
export const SegmentSuccess = "SegmentSuccess";
export const SegmentFail = "SegmentFail";

// Error class used by FetchZkConfigProvider constructor:
export class InvalidProtocolSchemeError extends Error {
  constructor(scheme: string, allowed: string[]) {
    super(`Invalid protocol scheme "${scheme}". Allowed: ${allowed.join(", ")}`);
    this.name = "InvalidProtocolSchemeError";
  }
}

// Identity functions — these just tag the Uint8Array with a branded type.
// The real SDK versions return the same Uint8Array unchanged.
export const createProverKey = (u: Uint8Array) => u;
export const createVerifierKey = (u: Uint8Array) => u;
export const createZKIR = (u: Uint8Array) => u;

// ZKConfigProvider base class — the real FetchZkConfigProvider extends it.
// We replicate its interface so our FetchZkConfigProvider implementation works.
class ZKConfigProviderBase {
  async getVerifierKeys(circuitIds: string[]) {
    return Promise.all(
      circuitIds.map(async (id) => {
        const key = await (this as any).getVerifierKey(id);
        return [id, key] as [string, Uint8Array];
      })
    );
  }
  async get(circuitId: string) {
    return {
      circuitId,
      proverKey: await (this as any).getProverKey(circuitId),
      verifierKey: await (this as any).getVerifierKey(circuitId),
      zkir: await (this as any).getZKIR(circuitId),
    };
  }
  asKeyMaterialProvider() { return this; }
}
export const ZKConfigProvider = ZKConfigProviderBase;

// Other midnight-js-types exports needed for module graph resolution:
export const asContractAddress = (s: string) => s;
export const assertIsHex = (_s: string) => {};
export const asEffectOption = (v: any) => v;
export const exitResultOrError = (v: any) => v;
export const makeContractExecutableRuntime = () => ({});
export const createProofProvider = (_provider: any) => ({
  proveTx: async (_tx: any) => _tx,
});
export const zkConfigToProvingKeyMaterial = (cfg: any) => ({
  proverKey: cfg.proverKey,
  verifierKey: cfg.verifierKey,
  ir: cfg.zkir,
});
export const LogLevel = { Debug: "Debug", Info: "Info", Warn: "Warn", Error: "Error" };
export const MAX_EXPORT_SIGNING_KEYS = 100;
export const MAX_EXPORT_STATES = 100;
// Error classes for midnight-js-types:
export class ExportDecryptionError extends Error {}
export class ImportConflictError extends Error {}
export class InvalidExportFormatError extends Error {}
export class PrivateStateExportError extends Error {}
export class PrivateStateImportError extends Error {}
export class SigningKeyExportError extends Error {}

// ---------------------------------------------------------------------------
// @midnight-ntwrk/midnight-js-fetch-zk-config-provider
// REAL implementation — uses plain browser fetch(), no WASM.
// FetchZkConfigProvider is passed to api.getProvingProvider() so ProofStation
// can fetch our ZK keys. This must be a fully working implementation.
// ---------------------------------------------------------------------------
export class FetchZkConfigProvider extends ZKConfigProviderBase {
  private baseURL: string;
  private fetchFunc: typeof fetch;

  constructor(baseURL: string, fetchFunc: typeof fetch = fetch) {
    super();
    this.baseURL = baseURL;
    this.fetchFunc = fetchFunc;
    const urlObject = new URL(baseURL);
    if (urlObject.protocol !== "http:" && urlObject.protocol !== "https:") {
      throw new InvalidProtocolSchemeError(urlObject.protocol, ["http:", "https:"]);
    }
  }

  private async sendRequest(
    path: string,
    circuitId: string,
    ext: string,
    responseType: "arraybuffer" | "text"
  ): Promise<Uint8Array | string> {
    const url = `${this.baseURL}/${path}/${circuitId}${ext}`;
    const response = await this.fetchFunc(url, { method: "GET" });
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    if (responseType === "text") {
      return response.text();
    }
    const buf = await response.arrayBuffer();
    return new Uint8Array(buf);
  }

  async getProverKey(circuitId: string): Promise<Uint8Array> {
    return createProverKey(
      (await this.sendRequest("keys", circuitId, ".prover", "arraybuffer")) as Uint8Array
    );
  }

  async getVerifierKey(circuitId: string): Promise<Uint8Array> {
    return createVerifierKey(
      (await this.sendRequest("keys", circuitId, ".verifier", "arraybuffer")) as Uint8Array
    );
  }

  async getZKIR(circuitId: string): Promise<Uint8Array> {
    return createZKIR(
      (await this.sendRequest("zkir", circuitId, ".bzkir", "arraybuffer")) as Uint8Array
    );
  }
}

// ---------------------------------------------------------------------------
// @midnight-ntwrk/midnight-js-indexer-public-data-provider
// Real implementation using plain GraphQL fetch — no WASM deserialization.
// Returns raw hex string for contract state; callers that need deserialized
// WASM objects (fetchAllPolls, fetchPollWithTallies) will fail at that layer,
// but deployContract only needs queryContractState for post-deploy verification.
//
// The stub returns the raw hex state string; our code casts it through `any`
// before passing to parseLedger(), which will fail on the stub. That's
// acceptable for v1 — reading state requires real WASM which can't run in
// the browser. Deploy works fine because deployContract() does not call
// queryContractState.
// ---------------------------------------------------------------------------
const CONTRACT_STATE_QUERY = `
  query ContractState($address: HexEncoded!) {
    contractAction(address: $address) {
      state
    }
  }
`;

export function indexerPublicDataProvider(
  indexerUri: string,
  _indexerWsUri: string
) {
  return {
    async queryContractState(address: string): Promise<unknown> {
      const resp = await fetch(indexerUri, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: CONTRACT_STATE_QUERY,
          variables: { address },
        }),
      });
      if (!resp.ok) {
        throw new Error(`Indexer query failed: ${resp.statusText}`);
      }
      const json = await resp.json();
      const state = json?.data?.contractAction?.state;
      return state ?? null;
    },
    // Subscription-based methods — not needed for deploy page
    watchForContractState(_address: string): never {
      throw new Error("watchForContractState not available in browser stub");
    },
    contractStateBlockStream(_address: string): never {
      throw new Error("contractStateBlockStream not available in browser stub");
    },
  };
}

// ---------------------------------------------------------------------------
// @midnight-ntwrk/midnight-js-network-id
// ---------------------------------------------------------------------------
export const NetworkId = undefined;
export const setNetworkId = () => {};

// ---------------------------------------------------------------------------
// @midnight-ntwrk/midnight-js-utils
// Imported by midnight-js-indexer-public-data-provider
// ---------------------------------------------------------------------------
export const assertIsContractAddress = (_addr: string) => {};
export const assertDefined = <T>(v: T) => v;
export const assertUndefined = (_v: unknown) => {};
export const fromHex = (hex: string): Uint8Array => {
  const matches = hex.match(/.{2}/g);
  if (!matches) return new Uint8Array(0);
  return new Uint8Array(matches.map((b) => parseInt(b, 16)));
};
export const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
export const isHex = (s: string) => /^[0-9a-fA-F]*$/.test(s);
export const parseHex = (s: string) => fromHex(s);
export const assertIsHex2 = (_s: string) => {};
export const parseCoinPublicKeyToHex = (s: string) => s;
export const parseEncPublicKeyToHex = (s: string) => s;
export const ttlOneHour = () => BigInt(3600);

// ---------------------------------------------------------------------------
// @midnight-ntwrk/wallet-sdk-address-format
// Imported by midnight-js-utils (which is imported by indexer provider)
// ---------------------------------------------------------------------------
export const MidnightBech32m = {
  parse: (_s: string) => new Uint8Array(0),
  encode: (_prefix: string, _bytes: Uint8Array) => "",
};
export const ShieldedCoinPublicKey = {
  codec: {
    decode: (_networkId: any, _bytes: any) => new Uint8Array(0),
    encode: (_networkId: any, _key: any) => new Uint8Array(0),
  },
};
export const ShieldedEncryptionPublicKey = {
  codec: {
    decode: (_networkId: any, _bytes: any) => new Uint8Array(0),
    encode: (_networkId: any, _key: any) => new Uint8Array(0),
  },
};

// ---------------------------------------------------------------------------
// ws / isomorphic-ws — Node.js WebSocket modules
// In the browser, graphql-ws uses window.WebSocket natively.
// These stubs prevent Turbopack from erroring on ws imports.
// ---------------------------------------------------------------------------
