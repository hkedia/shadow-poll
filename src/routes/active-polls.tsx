import { Link } from "react-router";
import { PollCard } from "@/components/poll-card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePolls } from "@/lib/queries/use-polls";

/** /active page — currently open polls accepting votes. */
export default function ActivePollsPage() {
  const { data, isLoading, isError } = usePolls();

  const polls = data
    ? data.polls.filter((p) => p.data.expiration_block > BigInt(data.currentBlockHeight))
    : undefined;

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero & heading */}
      <section className="pt-8 md:pt-12 mb-12 md:mb-16 relative">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-tertiary text-sm font-semibold tracking-wider uppercase mb-4">
            <span className="material-symbols-outlined text-lg">radio_button_checked</span>
            Live from Midnight Blockchain
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-headline font-extrabold tracking-tight mb-6 text-on-surface text-balance">
            Active{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-tertiary">
              Polls
            </span>
          </h1>
          <p className="text-base sm:text-lg text-on-surface-variant max-w-xl leading-relaxed mb-10">
            Polls currently open and accepting votes on the Midnight blockchain.
            Your vote is completely private, forever immutable.
          </p>
          <Link
            to="/create"
            className="inline-flex items-center gap-2 bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold px-6 py-3 rounded-full active:scale-95 duration-200 shadow-[0px_8px_32px_rgba(176,170,255,0.3)] hover:shadow-[0px_12px_48px_rgba(176,170,255,0.4)]"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Create a Poll
          </Link>
        </div>
      </section>

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 rounded-3xl bg-surface-container-low" />
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
            how_to_vote
          </span>
          <h2 className="text-2xl font-headline font-bold text-on-surface mb-3">
            No active polls
          </h2>
          <p className="text-on-surface-variant text-lg">
            Be the first to create one!
          </p>
        </div>
      )}

      {/* Polls grid */}
      {!isLoading && !isError && polls && polls.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {polls.map((poll) => {
            const currentBlock = BigInt(data!.currentBlockHeight);
            const tallies = data!.tallies.get(poll.id) ?? null;
            return (
              <PollCard key={poll.id} poll={poll} tallies={tallies} currentBlock={currentBlock} />
            );
          })}
        </div>
      )}
    </div>
  );
}