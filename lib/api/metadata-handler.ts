/**
 * Metadata API handler for Shadow Poll.
 *
 * Migrated from app/api/polls/metadata/route.ts (Next.js route handler)
 * to use Web standard Request/Response for Bun.serve() compatibility.
 *
 * Handles GET and POST for /api/polls/metadata:
 *   GET ?pollId=<hex>  → single poll metadata
 *   GET (no params)    → all polls metadata, ordered by created_at DESC
 *   POST { pollId, metadata, metadataHash } → upsert poll metadata
 */

import {
  validatePollMetadata,
  validateMetadataHash,
  type PollMetadata,
  type StoreMetadataRequest,
  type MetadataResponse,
} from "@/lib/midnight/metadata-store";
import { sql } from "@/lib/db/client";
import { runMigrations } from "@/lib/db/migrations";

interface PollMetadataRow {
  poll_id: string;
  title: string;
  description: string;
  options: string[];
  metadata_hash: string;
  created_at: string;
}

function rowToResponse(row: PollMetadataRow): MetadataResponse {
  const metadata: PollMetadata = {
    title: row.title,
    description: row.description,
    options: row.options,
    createdAt: row.created_at,
  };
  return {
    pollId: row.poll_id,
    metadata,
    metadataHash: row.metadata_hash,
  };
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function handleMetadataRequest(req: Request): Promise<Response> {
  try {
    await runMigrations();
  } catch (err) {
    console.error("[metadata] Migration failed:", err);
    return json({ error: "Database unavailable — please try again later" }, 503);
  }

  if (req.method === "GET") {
    return handleGet(req);
  } else if (req.method === "POST") {
    return handlePost(req);
  }
  return json({ error: "Method not allowed" }, 405);
}

async function handleGet(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const pollId = url.searchParams.get("pollId");

  if (!pollId) {
    try {
      const rows = (await sql`
        SELECT poll_id, title, description, options, metadata_hash, created_at
        FROM polls_metadata
        ORDER BY created_at DESC
      `) as PollMetadataRow[];
      return json(rows.map(rowToResponse));
    } catch (err) {
      console.error("[metadata] List query failed:", err);
      return json({ error: "Failed to fetch poll metadata list" }, 503);
    }
  }

  if (!/^[0-9a-f]{64}$/i.test(pollId)) {
    return json({ error: "Invalid pollId format — expected 64 hex characters" }, 400);
  }

  const normalizedId = pollId.toLowerCase();
  try {
    const rows = (await sql`
      SELECT poll_id, title, description, options, metadata_hash, created_at
      FROM polls_metadata
      WHERE poll_id = ${normalizedId}
      LIMIT 1
    `) as PollMetadataRow[];
    if (rows.length === 0) {
      return json({ error: "Metadata not found for this poll" }, 404);
    }
    return json(rowToResponse(rows[0]));
  } catch (err) {
    console.error("[metadata] Single-poll query failed:", err);
    return json({ error: "Failed to fetch poll metadata" }, 503);
  }
}

async function handlePost(req: Request): Promise<Response> {
  let body: StoreMetadataRequest;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  if (!body.pollId || !body.metadata || !body.metadataHash) {
    return json({ error: "Missing required fields: pollId, metadata, metadataHash" }, 400);
  }

  if (!/^[0-9a-f]{64}$/i.test(body.pollId)) {
    return json({ error: "Invalid pollId format — expected 64 hex characters" }, 400);
  }

  const validationError = validatePollMetadata(body.metadata);
  if (validationError) {
    return json({ error: validationError }, 400);
  }

  const hashValid = await validateMetadataHash(
    {
      title: body.metadata.title,
      description: body.metadata.description,
      options: body.metadata.options,
    },
    body.metadataHash,
  );
  if (!hashValid) {
    return json({ error: "Metadata hash does not match the provided metadata" }, 400);
  }

  const normalizedId = body.pollId.toLowerCase();
  const optionsJson = JSON.stringify(body.metadata.options);

  try {
    await sql`
      INSERT INTO polls_metadata (poll_id, title, description, options, metadata_hash)
      VALUES (
        ${normalizedId},
        ${body.metadata.title},
        ${body.metadata.description},
        ${optionsJson}::jsonb,
        ${body.metadataHash}
      )
      ON CONFLICT (poll_id) DO UPDATE SET
        title         = EXCLUDED.title,
        description   = EXCLUDED.description,
        options       = EXCLUDED.options,
        metadata_hash = EXCLUDED.metadata_hash
    `;
  } catch (err) {
    console.error("[metadata] Upsert failed:", err);
    return json({ error: "Failed to store poll metadata" }, 503);
  }

  return json({ success: true, pollId: normalizedId }, 201);
}
