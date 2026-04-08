import { NextRequest, NextResponse } from "next/server";
import {
  validatePollMetadata,
  validateMetadataHash,
  type PollMetadata,
  type StoreMetadataRequest,
  type MetadataResponse,
} from "@/lib/midnight/metadata-store";

/**
 * In-memory metadata store. Keyed by poll ID (hex string).
 *
 * For v1/testnet this is sufficient. Data is lost on server restart.
 * A production version would use a database or persistent KV store.
 */
const metadataStore = new Map<string, { metadata: PollMetadata; metadataHash: string }>();

/**
 * GET /api/polls/metadata?pollId=<hex>
 *
 * Retrieves off-chain metadata for a poll by its ID.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const pollId = request.nextUrl.searchParams.get("pollId");

  if (!pollId) {
    return NextResponse.json(
      { error: "Missing pollId query parameter" },
      { status: 400 },
    );
  }

  // Validate poll ID format (should be 64 hex chars = 32 bytes)
  if (!/^[0-9a-f]{64}$/i.test(pollId)) {
    return NextResponse.json(
      { error: "Invalid pollId format — expected 64 hex characters" },
      { status: 400 },
    );
  }

  const normalizedId = pollId.toLowerCase();
  const entry = metadataStore.get(normalizedId);

  if (!entry) {
    return NextResponse.json(
      { error: "Metadata not found for this poll" },
      { status: 404 },
    );
  }

  const response: MetadataResponse = {
    pollId: normalizedId,
    metadata: entry.metadata,
    metadataHash: entry.metadataHash,
  };

  return NextResponse.json(response);
}

/**
 * POST /api/polls/metadata
 *
 * Stores off-chain metadata for a poll. The client must provide:
 * - pollId: hex-encoded poll ID (from create_poll transaction result)
 * - metadata: { title, description, options, createdAt }
 * - metadataHash: hex-encoded hash for integrity verification
 *
 * The hash is validated against the provided metadata to prevent tampering.
 * No authentication required — the metadata hash provides tamper-proofing.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
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
    { title: body.metadata.title, description: body.metadata.description, options: body.metadata.options },
    body.metadataHash,
  );
  if (!hashValid) {
    return NextResponse.json(
      { error: "Metadata hash does not match the provided metadata" },
      { status: 400 },
    );
  }

  // Store metadata (overwrites if same pollId submitted again — idempotent)
  const normalizedId = body.pollId.toLowerCase();
  metadataStore.set(normalizedId, {
    metadata: body.metadata,
    metadataHash: body.metadataHash,
  });

  return NextResponse.json(
    { success: true, pollId: normalizedId },
    { status: 201 },
  );
}
