import type { PollTallies } from "@/lib/midnight/ledger-utils";
import { ExpirationBadge } from "./expiration-badge";

interface ResultsPanelProps {
  options: string[];
  tallies: PollTallies | null;
  expirationBlock: bigint;
  currentBlock?: bigint;
}

/**
 * Progress bars with live tallies for poll results.
 * Reference: .design/view_poll/code.html — "Live Results" glass panel.
 */
export function ResultsPanel({ options, tallies, expirationBlock, currentBlock }: ResultsPanelProps) {
  const total = tallies?.total ?? BigInt(0);
  const isExpired = currentBlock !== undefined && currentBlock > BigInt(0) && expirationBlock <= currentBlock;

  /**
   * Calculate percentage for an option. Returns a number with one decimal place.
   * Avoids division by zero when total is 0.
   */
  function getPercentage(index: number): number {
    if (!tallies || total === BigInt(0)) return 0;
    const count = tallies.counts[index] ?? BigInt(0);
    // Multiply by 1000, divide, then divide by 10 for one decimal place
    return Number((count * BigInt(1000)) / total) / 10;
  }

  function getVoteCount(index: number): string {
    if (!tallies) return "0";
    return (tallies.counts[index] ?? BigInt(0)).toString();
  }

  return (
    <div className="bg-[rgba(35,36,58,0.6)] backdrop-blur-[30px] p-5 sm:p-8 rounded-xl border border-outline-variant/10 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-end">
        <h3 className="font-headline text-2xl font-bold">{isExpired ? "Final Results" : "Live Results"}</h3>
        {!isExpired && (
          <div className="flex items-center gap-2 text-tertiary">
            <div className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest">Live Updates</span>
          </div>
        )}
      </div>

      {/* Progress bars for each option */}
      {options.map((option, index) => {
        const percentage = getPercentage(index);
        const voteCount = getVoteCount(index);

        return (
          <div key={index} className="space-y-3">
            <div className="flex justify-between items-center gap-4 font-semibold">
              <span className="text-on-surface break-words">{option}</span>
              <span className="text-xl tracking-tight text-primary">
                {percentage.toFixed(1)}%
              </span>
            </div>
            <div className="h-3 w-full bg-surface-container-lowest rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-primary to-primary-container"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="text-xs text-on-surface-variant">
              {voteCount} Anonymous Votes
            </div>
          </div>
        );
      })}

      {/* Footer */}
      <div className="pt-4 border-t border-outline-variant/10 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm text-on-surface-variant">
        <span>{total.toString()} total votes</span>
        <ExpirationBadge expirationBlock={expirationBlock} currentBlock={currentBlock} />
      </div>
    </div>
  );
}
