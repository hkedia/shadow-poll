/**
 * Polls API handler for Shadow Poll.
 *
 * Hono sub-router for /api/polls endpoint.
 * Business logic (handlePollsRequest) unchanged from original Bun.serve() version.
 *
 * Routes:
 *   GET /api/polls            → all polls from on-chain contract state
 *   GET /api/polls?id=<hex>   → single poll by ID
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { ledger as parseLedger } from "@/contracts/managed/contract";
import { fetchLatestBlock, IndexerQueryError } from "@/lib/midnight/indexer-client";
import { readTallies, hexToBytes } from "@/lib/midnight/ledger-utils";

export const pollsRoutes = new Hono();
pollsRoutes.use("/api/polls*", cors());

const INDEXER_URI =
  process.env.INDEXER_URI ?? "https://indexer.preview.midnight.network/api/v3/graphql";
const INDEXER_WS_URI =
  process.env.INDEXER_WS_URI ?? "wss://indexer.preview.midnight.network/api/v3/graphql/ws";
const CONTRACT_ADDRESS =
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

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

pollsRoutes.get("/api/polls", async (c) => {
  return handlePollsRequest(c.req.raw);
});

/**
 * Handles GET /api/polls
 */
async function handlePollsRequest(req: Request): Promise<Response> {
  if (!CONTRACT_ADDRESS) {
    return json({ error: "VITE_POLL_CONTRACT_ADDRESS not configured" }, 503);
  }

  try {
    const provider = indexerPublicDataProvider(INDEXER_URI, INDEXER_WS_URI);

    const [contractState, latestBlock] = await Promise.all([
      provider.queryContractState(CONTRACT_ADDRESS),
      fetchLatestBlock(),
    ]);

    if (!contractState) {
      return json({ currentBlockHeight: latestBlock.height, polls: [] });
    }

    const ledgerState = parseLedger(contractState.data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const polls: any[] = [];

    for (const [idBytes, data] of ledgerState.polls) {
      const tallyResult = await readTallies(ledgerState, idBytes, Number(data.option_count));
      polls.push({
        id: bytesToHex(idBytes),
        metadataHash: bytesToHex(data.metadata_hash),
        optionCount: Number(data.option_count),
        pollType: Number(data.poll_type),
        expirationBlock: data.expiration_block.toString(),
        creator: bytesToHex(data.creator),
        tallies: {
          counts: tallyResult.counts.map((c) => c.toString()),
          total: tallyResult.total.toString(),
        },
      });
    }

    // Single-poll filter: GET /api/polls?id={pollId} (per D-09-07)
    const url = new URL(req.url);
    const idFilter = url.searchParams.get("id");
    if (idFilter) {
      const poll = polls.find((p) => p.id === idFilter);
      if (!poll) {
        return json({ error: "Poll not found" }, 404);
      }
      return json({ currentBlockHeight: latestBlock.height, poll });
    }

    return json({ currentBlockHeight: latestBlock.height, polls });
  } catch (err) {
    if (err instanceof IndexerQueryError) {
      console.error("[polls-api] Indexer error:", err.message);
      return json({ error: `Indexer unavailable: ${err.message}` }, 503);
    }
    console.error("[polls-api] Unexpected error:", err);
    return json({ error: "Internal server error" }, 500);
  }
}
