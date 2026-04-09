import { Link } from "react-router";
import type { PollWithId, PollTallies } from "@/lib/midnight/ledger-utils";
import type { PollMetadata } from "@/lib/midnight/metadata-store";
import { useMetadata } from "@/lib/queries/use-metadata";
import { ExpirationBadge } from "./expiration-badge";
import { Skeleton } from "./ui/skeleton";

interface PollCardProps {
  poll: PollWithId;
  tallies?: PollTallies | null;
  currentBlock?: bigint;
}

/**
 * Card for a poll on the active/closed/trending pages. Self-fetches metadata.
 * Shows: visibility (public/invite-only), option count, expiration, vote count.
 * Tallies are passed as a prop from the parent listing page.
 */
export function PollCard({ poll, tallies, currentBlock }: PollCardProps) {
  const metadataQuery = useMetadata(poll.id);
  const metadata: PollMetadata | null = metadataQuery.data?.metadata ?? null;
  const isMetadataLoading = metadataQuery.isLoading;

  const totalVotes = tallies?.total?.toString() ?? "0";
  const optionCount = Number(poll.data.option_count);
  const isInviteOnly = Number(poll.data.poll_type) === 1;

  return (
    <Link to={`/poll/${poll.id}`} className="block">
      <div className="bg-surface-container-low rounded-3xl p-5 sm:p-8 flex flex-col justify-between transition-all hover:bg-surface-container-high h-full min-h-[280px]">
        <div>
          <span className={`font-bold tracking-widest text-xs uppercase mb-4 flex items-center gap-1.5 ${
            isInviteOnly ? "text-tertiary" : "text-primary"
          }`}>
            {isInviteOnly && (
              <span className="material-symbols-outlined text-sm">lock</span>
            )}
            {isInviteOnly ? "Invite Only" : "Public"}
          </span>

          {isMetadataLoading ? (
            <div className="space-y-2 mb-4">
              <Skeleton className="h-6 w-3/4 bg-surface-container-highest" />
              <Skeleton className="h-6 w-1/2 bg-surface-container-highest" />
            </div>
          ) : (
            <h3 className="text-xl font-headline font-bold mb-4 text-on-surface leading-tight break-words">
              {metadata?.title ?? "Untitled Poll"}
            </h3>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-on-surface-variant text-sm">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">list</span>
            <span className="font-bold text-on-surface">{optionCount} {optionCount === 1 ? "option" : "options"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">how_to_vote</span>
            <span className="font-bold text-on-surface">{totalVotes} {Number(totalVotes) === 1 ? "vote" : "votes"}</span>
          </div>
          <ExpirationBadge expirationBlock={poll.data.expiration_block} currentBlock={currentBlock} />
        </div>
      </div>
    </Link>
  );
}