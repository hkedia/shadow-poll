/**
 * Indexer API handler for Shadow Poll.
 *
 * Hono sub-router for /api/indexer/* endpoints.
 * Business logic (handleStatus, handleBlock, handleContract) unchanged from original Bun.serve() version.
 *
 * Routes:
 *   GET /api/indexer/status                    → block height, contract existence, state preview
 *   GET /api/indexer/block                     → latest confirmed block info
 *   GET /api/indexer/contract?address=<hex>    → contract deploy/update action
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  fetchLatestBlock,
  fetchContractAction,
  fetchPollContractStatus,
  IndexerQueryError,
} from "@/lib/midnight/indexer-client";

export const indexerRoutes = new Hono();
indexerRoutes.use("/api/indexer*", cors());

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

indexerRoutes.get("/api/indexer/status", async (c) => {
  return handleStatus(new URL(c.req.url));
});

indexerRoutes.get("/api/indexer/block", async (c) => {
  return handleBlock();
});

indexerRoutes.get("/api/indexer/contract", async (c) => {
  return handleContract(new URL(c.req.url));
});

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
