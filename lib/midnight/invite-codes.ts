/**
 * Invite code generation and management for invite-only polls.
 *
 * This module handles:
 * - Generating random invite codes (alphanumeric strings)
 * - Converting codes to Bytes<32> for hashing (via SHA-256)
 * - Computing on-chain code hashes (for add_invite_codes circuit)
 * - Storing/loading codes in localStorage (D-53: browser-only storage)
 * - Formatting codes for clipboard copy and CSV export
 *
 * Exports:
 *   - generateInviteCodes — generates random codes with their on-chain hashes
 *   - inviteCodeToBytes32 — deterministic SHA-256 hash of a code string
 *   - storeInviteCodes — saves codes to localStorage
 *   - loadInviteCodes — retrieves codes from localStorage
 *   - formatCodesForCopy — newline-separated codes for clipboard
 *   - formatCodesForCSV — CSV content with code and hash columns
 */

import { bytesToHex, hexToBytes, deriveInviteKey } from "./ledger-utils";

/** A single invite code with its derived on-chain hash. */
export interface InviteCode {
  code: string;          // Human-readable code (e.g., "A3K9F2X7B1")
  codeBytes: Uint8Array; // Code as Bytes<32> (SHA-256 hash of the string)
  hash: Uint8Array;      // On-chain key = deriveInviteKey(pollId, codeBytes)
  hashHex: string;       // Hex-encoded hash for display
}

/** A set of invite codes generated for a specific poll. */
export interface InviteCodeSet {
  pollId: string;        // Hex-encoded poll ID
  codes: InviteCode[];   // Generated codes
  createdAt: string;     // ISO timestamp
}

/** Serializable shape for localStorage persistence. */
interface StoredInviteCode {
  code: string;
  codeBytesHex: string;
  hashHex: string;
}

/** Characters used for random code generation (A-Z, 0-9). */
const CODE_CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

/** Length of each generated invite code. */
const CODE_LENGTH = 10;

/** localStorage key prefix for invite codes. */
const STORAGE_PREFIX = "shadow-poll:invite-codes:";

/**
 * Generates a set of random invite codes for a poll.
 *
 * For each code:
 * 1. Generates a random 10-character alphanumeric string using crypto.getRandomValues()
 * 2. Hashes the string to Bytes<32> via SHA-256 (inviteCodeToBytes32)
 * 3. Computes the on-chain key via deriveInviteKey(pollId, codeBytes)
 *
 * @param count - Number of invite codes to generate
 * @param pollId - Raw poll ID bytes (Uint8Array)
 * @returns Complete invite code set with hashes
 */
export async function generateInviteCodes(
  count: number,
  pollId: Uint8Array,
): Promise<InviteCodeSet> {
  const codes: InviteCode[] = [];

  for (let i = 0; i < count; i++) {
    // Generate a random alphanumeric code using crypto.getRandomValues()
    const code = generateRandomCode();

    // Hash the code string to Bytes<32> via SHA-256
    const codeBytes = await inviteCodeToBytes32(code);

    // Compute the on-chain key: deriveInviteKey(pollId, codeBytes)
    const hash = await deriveInviteKey(pollId, codeBytes);

    codes.push({
      code,
      codeBytes,
      hash,
      hashHex: bytesToHex(hash),
    });
  }

  return {
    pollId: bytesToHex(pollId),
    codes,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Generates a single random alphanumeric code.
 *
 * Uses crypto.getRandomValues() for cryptographically secure randomness.
 * Each character is selected uniformly from [A-Z, 0-9] (36 characters).
 */
function generateRandomCode(): string {
  const randomBytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(randomBytes);

  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    // Map each random byte to a character index (modulo charset length)
    code += CODE_CHARSET[randomBytes[i] % CODE_CHARSET.length];
  }

  return code;
}

/**
 * Converts a human-readable invite code string to Bytes<32> using SHA-256.
 *
 * Case-insensitive: the code is uppercased and trimmed before hashing,
 * so users can type codes in any case and still get the same hash.
 *
 * This is deterministic: same code string → same Bytes<32> → same on-chain hash.
 *
 * @param code - Human-readable invite code (e.g., "A3K9F2X7B1")
 * @returns 32-byte SHA-256 hash of the normalized code string
 */
export async function inviteCodeToBytes32(code: string): Promise<Uint8Array> {
  const encoded = new TextEncoder().encode(code.toUpperCase().trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  return new Uint8Array(hashBuffer);
}

/**
 * Stores invite codes in localStorage for the poll creator to share later.
 *
 * Serializes Uint8Arrays as hex strings for JSON storage.
 * Key: shadow-poll:invite-codes:{pollIdHex}
 *
 * @param pollIdHex - Hex-encoded poll ID
 * @param codes - Array of invite codes to store
 */
export function storeInviteCodes(pollIdHex: string, codes: InviteCode[]): void {
  const stored: StoredInviteCode[] = codes.map((c) => ({
    code: c.code,
    codeBytesHex: bytesToHex(c.codeBytes),
    hashHex: c.hashHex,
  }));

  try {
    localStorage.setItem(STORAGE_PREFIX + pollIdHex, JSON.stringify(stored));
  } catch (err) {
    console.warn("Failed to store invite codes in localStorage:", err);
  }
}

/**
 * Loads invite codes from localStorage.
 *
 * Deserializes hex strings back to Uint8Arrays.
 * Returns null if no codes are found for the given poll.
 *
 * @param pollIdHex - Hex-encoded poll ID
 * @returns Array of invite codes, or null if not found
 */
export function loadInviteCodes(pollIdHex: string): InviteCode[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + pollIdHex);
    if (!raw) return null;

    const stored: StoredInviteCode[] = JSON.parse(raw);
    return stored.map((s) => ({
      code: s.code,
      codeBytes: hexToBytes(s.codeBytesHex),
      hash: hexToBytes(s.hashHex),
      hashHex: s.hashHex,
    }));
  } catch (err) {
    console.warn("Failed to load invite codes from localStorage:", err);
    return null;
  }
}

/**
 * Formats invite codes as a newline-separated string for clipboard copy.
 *
 * @param codes - Array of invite codes
 * @returns Newline-separated code strings
 */
export function formatCodesForCopy(codes: InviteCode[]): string {
  return codes.map((c) => c.code).join("\n");
}

/**
 * Formats invite codes as CSV content for download.
 *
 * @param codes - Array of invite codes
 * @param pollTitle - Poll title for the CSV header comment
 * @returns CSV string with Code,Hash columns
 */
export function formatCodesForCSV(codes: InviteCode[], pollTitle: string): string {
  const header = `# Invite codes for: ${pollTitle}\nCode,Hash`;
  const rows = codes.map((c) => `${c.code},${c.hashHex}`);
  return [header, ...rows].join("\n");
}
