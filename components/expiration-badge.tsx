import { blockToApproximateDate, formatExpirationDate, formatRelativeTime } from "@/lib/utils";

interface ExpirationBadgeProps {
  expirationBlock: bigint;
  currentBlock?: bigint;
}

/**
 * Shows human-readable expiration time for a poll.
 * Displays absolute date + relative time (e.g., "Expires Dec 15 (~2 days left)")
 * instead of raw block numbers. Falls back to loading state while block height resolves.
 */
export function ExpirationBadge({ expirationBlock, currentBlock }: ExpirationBadgeProps) {
  // Loading state: current block not yet fetched
  if (currentBlock === undefined) {
    return (
      <div className="flex items-center gap-2 text-on-surface-variant text-sm">
        <span className="material-symbols-outlined text-lg">schedule</span>
        <span>Loading expiration...</span>
      </div>
    );
  }

  const isExpired = expirationBlock <= currentBlock;

  // Expired: show closed status with expiration date
  if (isExpired) {
    const expiredDate = blockToApproximateDate(expirationBlock, currentBlock);
    const formattedDate = formatExpirationDate(expiredDate);
    const label = formattedDate ? `Closed · Expired ${formattedDate}` : "Closed";

    return (
      <div className="flex items-center gap-2 text-on-surface-variant text-sm">
        <span className="material-symbols-outlined text-lg">lock</span>
        <span>{label}</span>
      </div>
    );
  }

  // Active: show absolute date + relative time
  const expirationDate = blockToApproximateDate(expirationBlock, currentBlock);
  const remainingBlocks = Number(expirationBlock - currentBlock);
  const remainingSeconds = remainingBlocks * 10; // ~10 seconds per block on Midnight Preview
  const dateStr = formatExpirationDate(expirationDate);
  const relativeStr = formatRelativeTime(remainingSeconds);

  return (
    <div className="flex items-center gap-2 text-on-surface-variant text-sm">
      <span className="material-symbols-outlined text-lg">schedule</span>
      <span>{dateStr ? `Expires ${dateStr} (${relativeStr})` : relativeStr}</span>
    </div>
  );
}