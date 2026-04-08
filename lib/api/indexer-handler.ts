/**
 * Indexer API handler for Shadow Poll.
 *
 * Exposes the Midnight indexer GraphQL client to the server API layer.
 * All routes are read-only (GET only) — no mutations are performed here.
 *
 * Routes handled by this module (registered in server.ts):
 *
 *   GET /api/indexer/status
 *     Returns current block height, contract existence, and state preview.
 *     Query param: contractAddress (optional, defaults to env VITE_POLL_CONTRACT_ADDRESS)
 *
 *   GET /api/indexer/block
 *     Returns the latest confirmed block info (height, hash, timestamp, author).
 *
 *   GET /api/indexer/contract?address=<hex>
 *     Returns the deploy/update action for a given contract address.
 *     Includes block info for when the contract was last touched.
 *
 * These endpoints are additive — the existing Midnight SDK usage for
 * wallet-connected operations (create poll, cast vote) is unchanged.
 */

import {
  fetchLatestBlock,
  fetchContractAction,
  fetchPollContractStatus,
  IndexerQueryError,
} from "@/lib/midnight/indexer-client";

/** Default contract address from Vite env (also available server-side via process.env). */
const DEFAULT_CONTRACT_ADDRESS =
  process.env.VITE_POLL_CONTRACT_ADDRESS ?? "";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

/**
 * Routes GET /api/indexer/* requests to the appropriate handler.
 */
export async function handleIndexerRequest(req: Request): Promise<Response> {
  if (req.method !== "GET") {
    return json({ error: "Method not allowed — indexer endpoints are GET only" }, 405);
  }

  const url = new URL(req.url);
  const subpath = url.pathname.replace(/^\/api\/indexer/, "");

  if (subpath === "/status" || subpath === "/status/") {
    return handleStatus(url);
  }

  if (subpath === "/block" || subpath === "/block/") {
    return handleBlock();
  }

  if (subpath === "/contract" || subpath === "/contract/") {
    return handleContract(url);
  }

  return json({ error: `Unknown indexer route: ${subpath}` }, 404);
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

/**
 * GET /api/indexer/status?contractAddress=<hex>
 *
 * Returns:
 * {
 *   currentBlockHeight: number,
 *   currentBlockHash: string,
 *   contractLastBlockHeight: number | null,
 *   contractExists: boolean,
 *   contractStatePreview: string | null,
 * }
 */
async function handleStatus(url: URL): Promise<Response> {
  const contractAddress =
    url.searchParams.get("contractAddress") || DEFAULT_CONTRACT_ADDRESS;

  if (!contractAddress) {
    return json(
      { error: "contractAddress query param required (or set VITE_POLL_CONTRACT_ADDRESS)" },
      400,
    );
  }

  if (!/^[0-9a-f]{64}$/i.test(contractAddress)) {
    return json({ error: "contractAddress must be 64 hex characters" }, 400);
  }

  try {
    const status = await fetchPollContractStatus(contractAddress.toLowerCase());
    return json(status);
  } catch (err) {
    return handleIndexerError(err, "status query");
  }
}

/**
 * GET /api/indexer/block
 *
 * Returns:
 * {
 *   height: number,
 *   hash: string,
 *   timestamp: number,
 *   author: string,
 * }
 */
async function handleBlock(): Promise<Response> {
  try {
    const block = await fetchLatestBlock();
    return json(block);
  } catch (err) {
    return handleIndexerError(err, "block query");
  }
}

/**
 * GET /api/indexer/contract?address=<hex>
 *
 * Returns the polymorphic ContractAction union for the given address:
 * {
 *   __typename: "ContractDeploy" | "ContractUpdate" | "ContractCall",
 *   state?: string,
 *   transaction?: { id, hash, block: { height, hash, author, timestamp } },
 *   ...
 * }
 */
async function handleContract(url: URL): Promise<Response> {
  const address = url.searchParams.get("address");

  if (!address) {
    return json({ error: "address query param is required" }, 400);
  }

  if (!/^[0-9a-f]{64}$/i.test(address)) {
    return json({ error: "address must be 64 hex characters" }, 400);
  }

  try {
    const action = await fetchContractAction(address.toLowerCase());
    if (!action) {
      return json({ error: "Contract not found in indexer" }, 404);
    }
    return json(action);
  } catch (err) {
    return handleIndexerError(err, "contract action query");
  }
}

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

function handleIndexerError(err: unknown, context: string): Response {
  if (err instanceof IndexerQueryError) {
    console.error(`[indexer-api] ${context} failed:`, err.message);
    return json(
      { error: `Indexer unavailable: ${err.message}` },
      503,
    );
  }
  console.error(`[indexer-api] Unexpected error in ${context}:`, err);
  return json({ error: "Internal server error" }, 500);
}
