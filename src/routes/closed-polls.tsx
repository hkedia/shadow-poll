import { Link } from "react-router";
import { PollCard } from "@/components/poll-card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePolls } from "@/lib/queries/use-polls";

/** /closed page — polls that have passed their expiration block. */
export default function ClosedPollsPage() {
  const { data, isLoading, isError } = usePolls();

  const polls = data
    ? data.polls.filter((p) => p.data.expiration_block <= BigInt(data.currentBlockHeight))
    : undefined;

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero & heading */}
      <section className="pt-8 md:pt-12 mb-12 md:mb-16">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-on-surface-variant text-sm font-semibold tracking-wider uppercase mb-4">
            <span className="material-symbols-outlined text-lg">lock_clock</span>
            Final Results on Chain
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-headline font-extrabold tracking-tight mb-6 text-on-surface text-balance">
            Closed{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-on-surface-variant to-tertiary">
              Polls
            </span>
          </h1>
          <p className="text-base sm:text-lg text-on-surface-variant max-w-xl leading-relaxed">
            These polls have passed their expiration block. Results are final and
            permanently recorded on the Midnight blockchain.
          </p>
        </div>
      </section>

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-3xl bg-surface-container-low" />
          ))}
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
            lock_clock
          </span>
          <h2 className="text-2xl font-headline font-bold text-on-surface mb-3">
            No closed polls yet
          </h2>
          <p className="text-on-surface-variant text-lg mb-8">
            Polls will appear here once they pass their expiration block.
          </p>
          <Link
            to="/active"
            className="inline-flex items-center gap-2 bg-surface-container-high text-on-surface font-bold px-8 py-4 rounded-full active:scale-95 duration-200 hover:bg-surface-container-highest transition-colors"
          >
            <span className="material-symbols-outlined">radio_button_checked</span>
            View Active Polls
          </Link>
        </div>
      )}

      {/* Grid of closed polls */}
      {!isLoading && !isError && polls && polls.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {polls.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              tallies={data!.tallies.get(poll.id) ?? null}
              currentBlock={BigInt(data!.currentBlockHeight)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
