"use client";

import Link from "next/link";
import { useWalletContext } from "@/lib/midnight/wallet-context";
import { HeroSection } from "@/components/hero-section";
import { InstallPrompt } from "@/components/install-prompt";
import { PollCard } from "@/components/poll-card";
import { ExpirationBadge } from "@/components/expiration-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { usePolls } from "@/lib/queries/use-polls";
import { useMetadata } from "@/lib/queries/use-metadata";
import type { PollWithId } from "@/lib/midnight/ledger-utils";
import type { PollMetadata } from "@/lib/midnight/metadata-store";

/**
 * Featured poll card — the large md:col-span-8 card in the bento grid.
 * Self-fetches metadata and shows option previews with percentages.
 */
function FeaturedPollCard({ poll }: { poll: PollWithId }) {
  const metadataQuery = useMetadata(poll.id);
  const metadata: PollMetadata | null = metadataQuery.data?.metadata ?? null;
  const isMetadataLoading = metadataQuery.isLoading;

  return (
    <Link href={`/poll/${poll.id}`} className="block md:col-span-8">
      <div className="group relative overflow-hidden bg-surface-container-low rounded-3xl p-8 transition-all hover:bg-surface-container-high h-full">
        {/* LIVE badge */}
        <div className="absolute top-0 right-0 p-8">
          <span className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-bold border border-primary/20">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            LIVE
          </span>
        </div>

        <div className="max-w-lg">
          <span className="text-tertiary font-bold tracking-widest text-xs uppercase mb-4 block">
            Public
          </span>

          {isMetadataLoading ? (
            <div className="space-y-3 mb-6">
              <Skeleton className="h-8 w-full bg-surface-container-highest" />
              <Skeleton className="h-8 w-3/4 bg-surface-container-highest" />
            </div>
          ) : (
            <h2 className="text-3xl font-headline font-bold mb-6 text-on-surface leading-snug">
              {metadata?.title ?? "Untitled Poll"}
            </h2>
          )}

          {/* Option previews */}
          {metadata?.options && metadata.options.length > 0 && (
            <div className="space-y-4 mb-8">
              {metadata.options.slice(0, 2).map((option, i) => (
                <div
                  key={i}
                  className="w-full bg-surface-container-highest rounded-xl p-4 flex justify-between items-center cursor-pointer hover:bg-primary/5 transition-colors"
                >
                  <span className="font-medium">{option}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-6 text-on-surface-variant text-sm">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">how_to_vote</span>
              <span className="font-bold text-on-surface">
                {Number(poll.data.option_count).toString()} options
              </span>
            </div>
            <ExpirationBadge expirationBlock={poll.data.expiration_block} />
          </div>
        </div>
      </div>
    </Link>
  );
}

/**
 * Trending Polls page — shown when wallet is connected.
 */
function TrendingPolls() {
  const { data: polls, isLoading, isError } = usePolls();

  return (
    <>
      {/* Hero & heading */}
      <section className="mb-16 relative">
        <div className="max-w-3xl">
          <h1 className="text-6xl font-headline font-extrabold tracking-tight mb-6 text-on-surface">
            Decide the{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-tertiary">
              Future
            </span>{" "}
            Anonymously.
          </h1>
          <p className="text-lg text-on-surface-variant max-w-xl leading-relaxed mb-10">
            Explore active polls secured by Midnight&apos;s zero-knowledge technology.
            Your vote is your voice — completely private, forever immutable.
          </p>
        </div>
      </section>

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8">
            <Skeleton className="h-80 rounded-3xl bg-surface-container-low" />
          </div>
          <div className="md:col-span-4">
            <Skeleton className="h-80 rounded-3xl bg-surface-container-low" />
          </div>
          <div className="md:col-span-4">
            <Skeleton className="h-64 rounded-3xl bg-surface-container-low" />
          </div>
          <div className="md:col-span-8">
            <Skeleton className="h-64 rounded-3xl bg-surface-container-low" />
          </div>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-error text-4xl mb-4 block">error</span>
          <p className="text-on-surface-variant text-lg">
            Failed to load polls. Please try again.
          </p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && polls && polls.length === 0 && (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-on-surface-variant text-6xl mb-6 block">
            how_to_vote
          </span>
          <h2 className="text-2xl font-headline font-bold text-on-surface mb-3">
            No polls yet
          </h2>
          <p className="text-on-surface-variant text-lg mb-8">
            Be the first to create one!
          </p>
          <Link
            href="/create"
            className="inline-flex items-center gap-2 bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold px-8 py-4 rounded-full active:scale-95 duration-200 shadow-[0px_8px_32px_rgba(176,170,255,0.3)]"
          >
            <span className="material-symbols-outlined">add</span>
            Create a Poll
          </Link>
        </div>
      )}

      {/* Bento grid of polls */}
      {!isLoading && !isError && polls && polls.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {polls.map((poll, index) => {
            if (index === 0) {
              return <FeaturedPollCard key={poll.id} poll={poll} />;
            }

            // Alternate between col-span-4 and col-span-8 for visual variety
            const colSpan = index % 3 === 0 ? "md:col-span-8" : "md:col-span-4";

            return (
              <div key={poll.id} className={colSpan}>
                <PollCard poll={poll} />
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

export default function HomePage() {
  const { status } = useWalletContext();

  // When 1am.xyz is not installed, show the full-page install prompt (WALL-06)
  if (status === "not_detected") {
    return <InstallPrompt />;
  }

  // When connected, show trending polls
  if (status === "connected") {
    return (
      <>
        <TrendingPolls />

        {/* Floating Action Button — Create Poll */}
        <Link
          href="/create"
          className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary-container text-on-primary shadow-[0px_24px_48px_rgba(0,0,0,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40"
          aria-label="Create Poll"
        >
          <span className="material-symbols-outlined scale-125">add</span>
        </Link>
      </>
    );
  }

  // All other states (disconnected, connecting, idle, error) — show hero
  return <HeroSection />;
}
