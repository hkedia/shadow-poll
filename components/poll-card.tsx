"use client";

import Link from "next/link";
import type { PollWithId, PollTallies } from "@/lib/midnight/ledger-utils";
import type { PollMetadata } from "@/lib/midnight/metadata-store";
import { useMetadata } from "@/lib/queries/use-metadata";
import { ExpirationBadge } from "./expiration-badge";
import { Skeleton } from "./ui/skeleton";

interface PollCardProps {
  poll: PollWithId;
  tallies?: PollTallies | null;
}

/**
 * Card for the trending polls list. Self-fetches metadata via useMetadata hook.
 * Reference: .design/trending_polls/code.html — md:col-span-4 poll cards.
 */
export function PollCard({ poll, tallies }: PollCardProps) {
  const metadataQuery = useMetadata(poll.id);
  const metadata: PollMetadata | null = metadataQuery.data?.metadata ?? null;
  const isMetadataLoading = metadataQuery.isLoading;

  const totalVotes = tallies?.total?.toString() ?? "0";
  const optionPreviews = metadata?.options?.slice(0, 2) ?? [];
  const isInviteOnly = Number(poll.data.poll_type) === 1;

  return (
    <Link href={`/poll/${poll.id}`} className="block">
      <div className="bg-surface-container-low rounded-3xl p-8 flex flex-col justify-between transition-all hover:bg-surface-container-high h-full min-h-[280px]">
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
            <h3 className="text-xl font-headline font-bold mb-4 text-on-surface leading-tight">
              {metadata?.title ?? "Untitled Poll"}
            </h3>
          )}

          {optionPreviews.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {optionPreviews.map((option, i) => (
                <span
                  key={i}
                  className="bg-surface-container-highest text-xs px-3 py-1 rounded-full text-on-surface-variant"
                >
                  {option}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between items-end">
          <div className="text-sm">
            <div className="font-bold text-on-surface">{totalVotes} votes</div>
            <ExpirationBadge expirationBlock={poll.data.expiration_block} />
          </div>
          <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-primary hover:bg-primary hover:text-on-primary transition-all">
            <span className="material-symbols-outlined">arrow_forward</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
