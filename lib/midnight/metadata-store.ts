/**
 * Off-chain poll metadata types and validation.
 *
 * The Compact contract stores only metadata_hash (Bytes<32>) on-chain.
 * Full metadata (title, description, option labels) is stored off-chain
 * via the /api/polls/metadata API route (D-30).
 *
 * Clients verify integrity by hashing the off-chain metadata and comparing
 * against the on-chain metadata_hash.
 */

/** The shape of poll metadata stored off-chain. */
export interface PollMetadata {
  title: string;
  description: string;
  options: string[];    // option labels, length must match on-chain option_count
  createdAt: string;    // ISO 8601 timestamp
}

/** Request body for POST /api/polls/metadata */
export interface StoreMetadataRequest {
  pollId: string;       // hex-encoded poll ID
  metadata: PollMetadata;
  metadataHash: string; // hex-encoded hash for integrity verification
}

/** Response from GET /api/polls/metadata?pollId=xxx */
export interface MetadataResponse {
  pollId: string;
  metadata: PollMetadata;
  metadataHash: string;
}

/**
 * Computes a metadata hash for integrity verification.
 * Uses SHA-256 on a deterministic JSON encoding of the metadata fields
 * (sorted keys, excluding createdAt which is not part of the on-chain commitment).
 *
 * IMPORTANT: This MUST match the hashing used client-side when creating the
 * metadata_hash parameter for create_poll.
 */
export async function computeMetadataHash(
  metadata: Omit<PollMetadata, "createdAt">,
): Promise<Uint8Array> {
  const canonical = JSON.stringify({
    description: metadata.description,
    options: metadata.options,
    title: metadata.title,
  });
  const encoded = new TextEncoder().encode(canonical);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  return new Uint8Array(hashBuffer);
}

/**
 * Validates a metadata hash against the computed hash of the provided metadata.
 * Returns true if the provided hash matches the computed hash.
 */
export async function validateMetadataHash(
  metadata: Omit<PollMetadata, "createdAt">,
  providedHash: string,
): Promise<boolean> {
  const computed = await computeMetadataHash(metadata);
  const computedHex = Array.from(computed)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return computedHex === providedHash.toLowerCase();
}

/**
 * Validates the structure of PollMetadata.
 * Returns an error message string if invalid, or null if valid.
 */
export function validatePollMetadata(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") {
    return "Metadata must be an object";
  }
  const m = metadata as Record<string, unknown>;
  if (typeof m.title !== "string" || m.title.trim().length === 0) {
    return "Title is required";
  }
  if (m.title.length > 200) {
    return "Title must be 200 characters or fewer";
  }
  if (typeof m.description !== "string") {
    return "Description must be a string";
  }
  if (m.description.length > 2000) {
    return "Description must be 2000 characters or fewer";
  }
  if (!Array.isArray(m.options) || m.options.length === 0) {
    return "At least one option is required";
  }
  if (m.options.length > 10) {
    return "Maximum 10 options allowed";
  }
  for (let i = 0; i < m.options.length; i++) {
    if (typeof m.options[i] !== "string" || (m.options[i] as string).trim().length === 0) {
      return `Option ${i + 1} must be a non-empty string`;
    }
    if ((m.options[i] as string).length > 200) {
      return `Option ${i + 1} must be 200 characters or fewer`;
    }
  }
  return null;
}
