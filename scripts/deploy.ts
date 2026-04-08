/**
 * Shadow Poll — one-shot contract deploy script.
 *
 * Deploys the Poll Manager smart contract to Midnight Preview network
 * using ProofStation for ZK proving and dust sponsorship. Runs entirely
 * in Node.js where all WASM SDK packages are available natively.
 *
 * Usage:
 *   bun run deploy
 *
 * Required env vars (in .env.local or exported):
 *   PROOFSTATION_API_KEY   — pk_preview_xxx from 1am.xyz (contact team@1am.xyz)
 *
 * Optional env vars:
 *   ZK_KEYS_BASE_URL       — where FetchZkConfigProvider fetches circuit keys
 *                            Default: http://localhost:3000/zk-keys
 *                            Set to your deployed URL for non-local deploys.
 *
 * Output:
 *   Prints the deployed contract address to stdout.
 *   Copy it into .env.local as NEXT_PUBLIC_POLL_CONTRACT_ADDRESS=<address>
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// ---------------------------------------------------------------------------
// Load .env.local manually (Bun doesn't auto-load it for scripts)
// ---------------------------------------------------------------------------
const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  const lines = readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const PROOFSTATION_API_KEY = process.env.PROOFSTATION_API_KEY;
if (!PROOFSTATION_API_KEY) {
  console.error(
    "Error: PROOFSTATION_API_KEY is not set.\n" +
    "Add it to .env.local as PROOFSTATION_API_KEY=pk_preview_xxx\n" +
    "Contact team@1am.xyz to request API access."
  );
  process.exit(1);
}

const ZK_KEYS_BASE_URL =
  process.env.ZK_KEYS_BASE_URL ?? "http://localhost:3000/zk-keys";

const PROOF_SERVER_URL = "https://api-preview.1am.xyz";
const INDEXER_URI = "https://indexer.preview.midnight.network/api/v4/graphql";
const INDEXER_WS_URI = "wss://indexer.preview.midnight.network/api/v4/graphql/ws";
const SUBSTRATE_NODE_URI = "wss://rpc.preview.midnight.network";
const NETWORK_ID = "preview";

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log("Shadow Poll — Deploy Script");
  console.log("Network: Midnight Preview");
  console.log(`ZK keys URL: ${ZK_KEYS_BASE_URL}`);
  console.log("");

  // 1. Set network ID
  console.log("Step 1/5  Setting network ID...");
  const { setNetworkId } = await import("@midnight-ntwrk/midnight-js-network-id");
  setNetworkId(NETWORK_ID as Parameters<typeof setNetworkId>[0]);

  // 2. Build ZK config provider
  console.log("Step 2/5  Building ZK config provider...");
  const { FetchZkConfigProvider } = await import(
    "@midnight-ntwrk/midnight-js-fetch-zk-config-provider"
  );
  const zkConfigProvider = new FetchZkConfigProvider(ZK_KEYS_BASE_URL, fetch);

  // 3. Build public data provider
  console.log("Step 3/5  Building public data provider...");
  const { indexerPublicDataProvider } = await import(
    "@midnight-ntwrk/midnight-js-indexer-public-data-provider"
  );
  const publicDataProvider = indexerPublicDataProvider(INDEXER_URI, INDEXER_WS_URI);

  // 4. Query current block number for witness
  console.log("Step 4/5  Querying current block number...");
  let blockNumber = BigInt(0);
  try {
    const resp = await fetch(INDEXER_URI, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "{ blockHeight { latest } }" }),
    });
    if (resp.ok) {
      const json = await resp.json() as { data?: { blockHeight?: { latest?: number } } };
      const latest = json?.data?.blockHeight?.latest;
      if (latest !== undefined) blockNumber = BigInt(latest);
    }
  } catch {
    console.warn("  Could not query block height, using 0");
  }
  console.log(`  Current block: ${blockNumber}`);

  // 5. Build providers using ProofStation directly (no browser wallet needed)
  console.log("Step 5/5  Building providers...");

  const { Transaction } = await import("@midnight-ntwrk/ledger-v8");

  // ProofProvider: POSTs unproven TX to ProofStation /prove-and-balance,
  // which generates the ZK proof and adds dust in a single API call.
  // Returns the balanced TX bytes for submission.
  const proofProvider = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async proveTx(unprovenTx: any): Promise<unknown> {
      console.log("  Proving transaction via ProofStation...");
      console.log("  (This calls /prove-and-balance — expect 30-120s per circuit)");

      // Serialize the unproven TX to bytes
      const unprovenBytes = (unprovenTx as { serialize(): Uint8Array }).serialize();

      // POST to ProofStation /prove-and-balance
      const resp = await fetch(`${PROOF_SERVER_URL}/prove-and-balance`, {
        method: "POST",
        headers: {
          "X-API-Key": PROOFSTATION_API_KEY!,
          "Content-Type": "application/octet-stream",
        },
        body: unprovenBytes.buffer as ArrayBuffer,
      });

      if (!resp.ok) {
        const errBody = await resp.text().catch(() => "(no body)");
        throw new Error(
          `ProofStation /prove-and-balance failed: ${resp.status} ${resp.statusText}\n${errBody}`
        );
      }

      const result = await resp.json() as { tx: string; txHash: string };
      console.log(`  Proved! TX hash: ${result.txHash}`);

      // Deserialize the balanced TX for submission
      const balancedBytes = new Uint8Array(
        (result.tx.match(/.{2}/g) ?? []).map((b: string) => parseInt(b, 16))
      );
      return Transaction.deserialize("signature", "proof", "binding", balancedBytes);
    },
    // Also expose prove() for SDK internals that call it directly
    async prove(unprovenTx: unknown, _costModel: unknown): Promise<unknown> {
      return this.proveTx(unprovenTx as Parameters<typeof this.proveTx>[0]);
    },
  };

  // WalletProvider: uses a generated ephemeral key for the deploy.
  // Since the Poll Manager contract has no owner/auth restrictions on deploy,
  // any valid coin public key works. We use a deterministic zero-filled one.
  // The balanceTx below is a no-op because ProofStation already balanced the tx.
  const deploySigningKey = new Uint8Array(32); // ephemeral — discard after deploy
  const walletProvider = {
    getCoinPublicKey(): string {
      // Return a valid-format but ephemeral coin public key for the deploy witness.
      // The contract doesn't restrict who deploys it.
      return "00".repeat(32); // 32-byte hex zero key
    },
    getEncryptionPublicKey(): string {
      return "00".repeat(32);
    },
    async balanceTx(tx: unknown): Promise<unknown> {
      // The transaction is already balanced by ProofStation in proveTx above.
      // This is a pass-through.
      return tx;
    },
  };

  // MidnightProvider: submits the final TX to the chain via the public RPC.
  const midnightProvider = {
    async submitTx(tx: {
      serialize(): Uint8Array;
      identifiers?(): string[];
    }): Promise<string> {
      console.log("  Submitting transaction to chain...");
      const txBytes = tx.serialize();
      const hex = Array.from(txBytes).map((b) => b.toString(16).padStart(2, "0")).join("");

      // Submit via Substrate RPC (JSON-RPC)
      const resp = await fetch(SUBSTRATE_NODE_URI.replace("wss://", "https://"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "author_submitExtrinsic",
          params: [hex],
        }),
      });

      if (!resp.ok) {
        throw new Error(`RPC submission failed: ${resp.status} ${resp.statusText}`);
      }

      const json = await resp.json() as { result?: string; error?: { message: string } };
      if (json.error) {
        throw new Error(`RPC error: ${json.error.message}`);
      }

      const txId = tx.identifiers?.()[0] ?? json.result ?? hex.slice(0, 64);
      console.log(`  Submitted! TX ID: ${txId}`);
      return txId;
    },
  };

  // PrivateStateProvider: in-memory (Poll Manager has no private ledger state)
  const privateStateProvider = {
    setContractAddress(_address: string) {},
    async set(_id: string, _state: unknown) {},
    async get(_id: string): Promise<unknown> { return null; },
    async remove(_id: string) {},
    async clear() {},
    async setSigningKey(_address: string, _key: unknown) {},
    async getSigningKey(_address: string): Promise<unknown> { return deploySigningKey; },
    async removeSigningKey(_address: string) {},
    async clearSigningKeys() {},
  };

  const providers = {
    publicDataProvider,
    zkConfigProvider,
    proofProvider,
    walletProvider,
    midnightProvider,
    privateStateProvider,
  };

  // 6. Build compiled contract
  console.log("");
  console.log("Building compiled contract...");
  const { CompiledContract } = await import("@midnight-ntwrk/compact-js");
  const { Contract } = await import("../contracts/managed/contract/index.js");
  const { createWitnesses } = await import("../lib/midnight/witness-impl.js");

  const witnesses = createWitnesses(deploySigningKey, blockNumber);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const compiled = (CompiledContract.make as any)("poll-manager", Contract);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const withWit = (CompiledContract.withWitnesses as any)(compiled, witnesses);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const withAssets = (CompiledContract.withCompiledFileAssets as any)(withWit, "contracts/managed");

  // 7. Deploy!
  console.log("Deploying Poll Manager contract...");
  console.log("(ZK proving via ProofStation — this will take 2-10 minutes)");
  console.log("");

  const { deployContract } = await import("@midnight-ntwrk/midnight-js-contracts");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deployed = await (deployContract as any)(providers, {
    compiledContract: withAssets,
  });

  const contractAddress = deployed.deployTxData.public.contractAddress;

  console.log("");
  console.log("=".repeat(60));
  console.log("CONTRACT DEPLOYED SUCCESSFULLY");
  console.log("=".repeat(60));
  console.log("");
  console.log(`Contract address: ${contractAddress}`);
  console.log("");
  console.log("Next steps:");
  console.log("  1. Add to .env.local:");
  console.log(`     NEXT_PUBLIC_POLL_CONTRACT_ADDRESS=${contractAddress}`);
  console.log("  2. Restart the dev server: bun run dev");
  console.log("  3. For production: add to Vercel env vars");
  console.log("");
}

main().catch((err) => {
  console.error("");
  console.error("Deploy failed:", err instanceof Error ? err.message : String(err));
  if (err instanceof Error && err.stack) {
    console.error(err.stack);
  }
  process.exit(1);
});
