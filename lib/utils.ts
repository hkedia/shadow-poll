import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Approximate block time on Midnight Preview (10 seconds per block). */
const SECONDS_PER_BLOCK = 10;

/**
 * Convert an expiration block number to an approximate Date.
 * Uses current block height to calculate the real wall-clock time.
 * Falls back to NaN date if current block is unavailable (less precise).
 */
export function blockToApproximateDate(expirationBlock: bigint, currentBlock?: bigint): Date {
  if (currentBlock !== undefined && currentBlock > BigInt(0)) {
    const remainingBlocks = Number(expirationBlock - currentBlock);
    const remainingSeconds = remainingBlocks * SECONDS_PER_BLOCK;
    return new Date(Date.now() + remainingSeconds * 1000);
  }
  // Without current block, we cannot calculate a date — signal unavailable
  return new Date(NaN);
}

/**
 * Format a date as a human-readable string. Returns "Dec 15, 2026" style.
 * Returns empty string for invalid dates.
 */
export function formatExpirationDate(date: Date): string {
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}

/**
 * Format remaining time as a human-readable relative string.
 * E.g., "~2 days left", "~3 hours left", "~5 min left"
 */
export function formatRelativeTime(remainingSeconds: number): string {
  const minutes = Math.floor(remainingSeconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `~${days} day${days !== 1 ? "s" : ""} left`;
  if (hours > 0) return `~${hours} hour${hours !== 1 ? "s" : ""} left`;
  return `~${Math.max(1, minutes)} min left`;
}
