interface ExpirationBadgeProps {
  expirationBlock: bigint;
  currentBlock?: bigint;
}

/**
 * Shows time remaining until a poll expires based on block numbers.
 * Assumes ~10 seconds per block on Midnight Preview network.
 */
export function ExpirationBadge({ expirationBlock, currentBlock }: ExpirationBadgeProps) {
  // Fallback: show raw block number when current block is unknown
  if (currentBlock === undefined) {
    return (
      <div className="flex items-center gap-2 text-on-surface-variant text-sm">
        <span className="material-symbols-outlined text-lg">schedule</span>
        <span>Expires at block {expirationBlock.toString()}</span>
      </div>
    );
  }

  const isExpired = expirationBlock <= currentBlock;

  if (isExpired) {
    return (
      <div className="flex items-center gap-2 text-error font-bold text-sm">
        <span className="material-symbols-outlined text-lg">error</span>
        <span>Expired</span>
      </div>
    );
  }

  // Calculate remaining blocks and approximate time
  const remainingBlocks = Number(expirationBlock - currentBlock);
  const remainingSeconds = remainingBlocks * 10; // ~10 seconds per block on Midnight Preview
  const remainingMinutes = Math.floor(remainingSeconds / 60);
  const remainingHours = Math.floor(remainingMinutes / 60);
  const remainingDays = Math.floor(remainingHours / 24);

  let label: string;
  if (remainingDays > 0) {
    label = `~${remainingDays} day${remainingDays !== 1 ? "s" : ""} left`;
  } else if (remainingHours > 0) {
    label = `~${remainingHours} hour${remainingHours !== 1 ? "s" : ""} left`;
  } else {
    label = `~${Math.max(1, remainingMinutes)} min left`;
  }

  return (
    <div className="flex items-center gap-2 text-on-surface-variant text-sm">
      <span className="material-symbols-outlined text-lg">schedule</span>
      <span>{label}</span>
    </div>
  );
}
