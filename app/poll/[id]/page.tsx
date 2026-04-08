"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { usePoll } from "@/lib/queries/use-poll";
import { useWalletContext } from "@/lib/midnight/wallet-context";
import { getCurrentBlockNumber } from "@/lib/midnight/witness-impl";
import { VotePanel } from "@/components/vote-panel";
import { ResultsPanel } from "@/components/results-panel";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Poll Detail page — displays a single poll with voting and live results.
 * Reference: .design/view_poll/code.html — asymmetric layout.
 */
export default function PollDetailPage() {
  const params = useParams<{ id: string }>();
  const pollId = params.id;
  const { status, providers } = useWalletContext();
  const isConnected = status === "connected";

  const { poll, tallies, metadata, isLoading, isError, error, refetch } = usePoll(pollId);

  // Track current block number for expiration check
  const [currentBlock, setCurrentBlock] = useState<bigint>(BigInt(0));

  useEffect(() => {
    if (!providers?.indexerConfig?.indexerUri) return;

    let cancelled = false;
    getCurrentBlockNumber(providers.indexerConfig.indexerUri).then((block) => {
      if (!cancelled) setCurrentBlock(block);
    });

    // Refresh block number periodically
    const interval = setInterval(() => {
      getCurrentBlockNumber(providers.indexerConfig.indexerUri).then((block) => {
        if (!cancelled) setCurrentBlock(block);
      });
    }, 30_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [providers?.indexerConfig?.indexerUri]);

  const isExpired =
    poll !== null &&
    currentBlock > BigInt(0) &&
    poll.data.expiration_block <= currentBlock;

  const options = metadata?.options ?? [];
  const isInviteOnly = poll !== null && Number(poll.data.poll_type) === 1;

  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        <div className="lg:col-span-7 space-y-6">
          <Skeleton className="h-6 w-48 bg-surface-container-highest" />
          <Skeleton className="h-16 w-full bg-surface-container-highest" />
          <Skeleton className="h-16 w-3/4 bg-surface-container-highest" />
          <Skeleton className="h-6 w-2/3 bg-surface-container-highest" />
          <div className="space-y-4 mt-8">
            <Skeleton className="h-20 w-full bg-surface-container-high rounded-xl" />
            <Skeleton className="h-20 w-full bg-surface-container-high rounded-xl" />
            <Skeleton className="h-20 w-full bg-surface-container-high rounded-xl" />
          </div>
        </div>
        <div className="lg:col-span-5 space-y-6">
          <Skeleton className="h-96 w-full bg-surface-container-high rounded-xl" />
          <Skeleton className="h-32 w-full bg-surface-container-low rounded-xl" />
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="text-center py-20">
        <span className="material-symbols-outlined text-error text-4xl mb-4 block">error</span>
        <p className="text-on-surface-variant text-lg mb-4">
          {error?.message ?? "Failed to load poll"}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="bg-surface-container-high text-on-surface px-6 py-3 rounded-full font-semibold hover:bg-surface-container-highest transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Not found state
  if (!poll) {
    return (
      <div className="text-center py-20">
        <span className="material-symbols-outlined text-on-surface-variant text-6xl mb-6 block">
          search_off
        </span>
        <h2 className="text-2xl font-headline font-bold text-on-surface mb-3">
          Poll not found
        </h2>
        <p className="text-on-surface-variant text-lg mb-8">
          This poll may have been removed or the ID is invalid.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-surface-container-high text-on-surface px-6 py-3 rounded-full font-semibold hover:bg-surface-container-highest transition-all"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Back to Polls
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
      {/* Left Column: Poll Identity & Voting */}
      <div className="lg:col-span-7 space-y-10">
        <div className="space-y-4">
          {/* Trust badge */}
          <div className="flex items-center gap-3 text-tertiary text-sm font-semibold tracking-wider uppercase">
            <span className="material-symbols-outlined text-lg">verified_user</span>
            Secure Anonymous Voting Active
          </div>

          {/* Invite-only indicator */}
          {isInviteOnly && (
            <div className="flex items-center gap-2 text-tertiary text-xs font-semibold tracking-wider uppercase">
              <span className="material-symbols-outlined text-sm">lock</span>
              Invite-Only Poll
            </div>
          )}

          {/* Poll title */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-headline font-extrabold tracking-tight leading-tight text-on-surface text-balance">
            {metadata?.title ?? "Untitled Poll"}
          </h1>

          {/* Description */}
          {metadata?.description && (
            <p className="text-on-surface-variant text-base sm:text-lg max-w-2xl leading-relaxed">
              {metadata.description}
            </p>
          )}

          {/* Privacy description */}
          <p className="text-on-surface-variant text-base sm:text-lg max-w-2xl leading-relaxed">
            This poll is protected by zero-knowledge proofs on the Midnight network.
            Your identity remains shielded while your vote is cryptographically verified.
          </p>
        </div>

        {/* Vote Panel */}
        {options.length > 0 ? (
          <VotePanel
            options={options}
            pollId={pollId}
            isExpired={isExpired}
            isConnected={isConnected}
            pollType={isInviteOnly ? "invite_only" : "public"}
          />
        ) : (
          <div className="text-on-surface-variant">
            <Skeleton className="h-20 w-full bg-surface-container-high rounded-xl mb-4" />
            <Skeleton className="h-20 w-full bg-surface-container-high rounded-xl" />
            <p className="mt-4 text-sm">Loading poll options...</p>
          </div>
        )}
      </div>

      {/* Right Column: Results & Info */}
      <div className="lg:col-span-5 space-y-6">
        {/* Results Panel */}
        {options.length > 0 ? (
          <ResultsPanel
            options={options}
            tallies={tallies}
            expirationBlock={poll.data.expiration_block}
          />
        ) : (
          <Skeleton className="h-96 w-full bg-surface-container-high rounded-xl" />
        )}

        {/* Midnight Privacy Protocol info box */}
        <div className="bg-surface-container-low p-6 rounded-xl ring-1 ring-tertiary/20 flex gap-4 items-start">
          <div className="w-12 h-12 rounded-full bg-tertiary/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-tertiary">enhanced_encryption</span>
          </div>
          <div>
            <h4 className="font-headline font-bold text-tertiary">
              Midnight Privacy Protocol
            </h4>
            <p className="text-sm text-on-surface-variant mt-1">
              Your vote is processed using Zero-Knowledge proofs. We never see who you are,
              only that you are a valid voter.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
