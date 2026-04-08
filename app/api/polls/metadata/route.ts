import { NextRequest, NextResponse } from "next/server";
import {
  validatePollMetadata,
  validateMetadataHash,
  type PollMetadata,
  type StoreMetadataRequest,
  type MetadataResponse,
} from "@/lib/midnight/metadata-store";
import { sql } from "@/lib/db/client";
import { runMigrations } from "@/lib/db/migrations";

/**
 * Row shape returned by Postgres queries on polls_metadata.
 * options is stored as JSONB and arrives as a parsed JS value (string[]).
 */
interface PollMetadataRow {
  poll_id: string;
  title: string;
  description: string;
  options: string[];
  metadata_hash: string;
  created_at: string; // ISO string from TIMESTAMPTZ
}

/** Maps a DB row to the MetadataResponse API shape. */
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

/**
 * GET /api/polls/metadata?pollId=<hex>
 *   Returns metadata for a single poll.
 *
 * GET /api/polls/metadata
 *   Returns all polls metadata ordered by created_at DESC.
 *   Used by the home page to batch-fetch titles without N+1 calls.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await runMigrations();
  } catch (err) {
    console.error("[metadata] Migration failed:", err);
    return NextResponse.json(
      { error: "Database unavailable — please try again later" },
      { status: 503 },
    );
  }

  const pollId = request.nextUrl.searchParams.get("pollId");

  // --- List-all branch (no pollId param) ---
  if (!pollId) {
    try {
      const rows = (await sql`
        SELECT poll_id, title, description, options, metadata_hash, created_at
        FROM polls_metadata
        ORDER BY created_at DESC
      `) as PollMetadataRow[];

      return NextResponse.json(rows.map(rowToResponse));
    } catch (err) {
      console.error("[metadata] List query failed:", err);
      return NextResponse.json(
        { error: "Failed to fetch poll metadata list" },
        { status: 503 },
      );
    }
  }

  // --- Single-poll branch ---

  // Validate poll ID format (64 hex chars = 32 bytes)
  if (!/^[0-9a-f]{64}$/i.test(pollId)) {
    return NextResponse.json(
      { error: "Invalid pollId format — expected 64 hex characters" },
      { status: 400 },
    );
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
      return NextResponse.json(
        { error: "Metadata not found for this poll" },
        { status: 404 },
      );
    }

    return NextResponse.json(rowToResponse(rows[0]));
  } catch (err) {
    console.error("[metadata] Single-poll query failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch poll metadata" },
      { status: 503 },
    );
  }
}

/**
 * POST /api/polls/metadata
 *
 * Stores off-chain metadata for a poll. Upserts on conflict (idempotent).
 * The client must provide:
 * - pollId: hex-encoded poll ID (from create_poll transaction result)
 * - metadata: { title, description, options, createdAt }
 * - metadataHash: hex-encoded hash for integrity verification
 *
 * The hash is validated against the provided metadata to prevent tampering.
 * No authentication required — the metadata hash provides tamper-proofing.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await runMigrations();
  } catch (err) {
    console.error("[metadata] Migration failed:", err);
    return NextResponse.json(
      { error: "Database unavailable — please try again later" },
      { status: 503 },
    );
  }

  let body: StoreMetadataRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  // Validate required fields
  if (!body.pollId || !body.metadata || !body.metadataHash) {
    return NextResponse.json(
      { error: "Missing required fields: pollId, metadata, metadataHash" },
      { status: 400 },
    );
  }

  // Validate poll ID format
  if (!/^[0-9a-f]{64}$/i.test(body.pollId)) {
    return NextResponse.json(
      { error: "Invalid pollId format — expected 64 hex characters" },
      { status: 400 },
    );
  }

  // Validate metadata structure
  const validationError = validatePollMetadata(body.metadata);
  if (validationError) {
    return NextResponse.json(
      { error: validationError },
      { status: 400 },
    );
  }

  // Validate metadata hash integrity
  const hashValid = await validateMetadataHash(
    {
      title: body.metadata.title,
      description: body.metadata.description,
      options: body.metadata.options,
    },
    body.metadataHash,
  );
  if (!hashValid) {
    return NextResponse.json(
      { error: "Metadata hash does not match the provided metadata" },
      { status: 400 },
    );
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
    return NextResponse.json(
      { error: "Failed to store poll metadata" },
      { status: 503 },
    );
  }

  return NextResponse.json(
    { success: true, pollId: normalizedId },
    { status: 201 },
  );
}
