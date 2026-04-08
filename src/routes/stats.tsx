import { Link } from "react-router";
import { useStats } from "@/lib/queries/use-stats";
import { useMetadata } from "@/lib/queries/use-metadata";
import { useWalletContext } from "@/lib/midnight/wallet-context";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import type { PollTallies } from "@/lib/midnight/ledger-utils";
import type { PollWithId } from "@/lib/midnight/ledger-utils";

/** A single stat display card. */
function StatCard({
  icon,
  label,
  value,
  accent = "primary",
  sub,
}: {
  icon: string;
  label: string;
  value: string;
  accent?: "primary" | "tertiary" | "muted";
  sub?: string;
}) {
  const accentClass =
    accent === "primary"
      ? "text-primary"
      : accent === "tertiary"
      ? "text-tertiary"
      : "text-on-surface-variant";

  return (
    <div className="bg-surface-container-low rounded-xl p-6 ring-1 ring-outline-variant/10 space-y-3">
      <div className="flex items-center gap-2 text-on-surface-variant text-sm">
        <span className={`material-symbols-outlined text-xl ${accentClass}`}>{icon}</span>
        <span>{label}</span>
      </div>
      <div className={`text-4xl font-headline font-extrabold tracking-tight ${accentClass}`}>
        {value}
      </div>
      {sub && <p className="text-xs text-on-surface-variant">{sub}</p>}
    </div>
  );
}

/** Most-voted poll featured card — fetches poll title via useMetadata. */
function MostVotedCard({
  poll,
  totalVotes,
}: {
  poll: PollWithId & { tallies: PollTallies };
  totalVotes: bigint;
}) {
  const { data: metadataResponse } = useMetadata(poll.id);
  const title = metadataResponse?.metadata?.title ?? "Loading...";

  return (
    <Link to={`/poll/${poll.id}`} className="block group">
      <div className="bg-surface-container-low rounded-xl p-6 ring-1 ring-primary/20 hover:ring-primary/40 transition-all space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary text-xl">military_tech</span>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant uppercase tracking-widest font-semibold">
              Most Active Poll
            </p>
            <h3 className="font-headline font-bold text-on-surface text-base group-hover:text-primary transition-colors">
              {title}
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-2 text-primary font-semibold">
          <span className="material-symbols-outlined text-base">how_to_vote</span>
          <span>{totalVotes.toString()} votes cast</span>
          <span className="material-symbols-outlined text-sm ml-auto text-on-surface-variant group-hover:text-primary transition-colors">
            arrow_forward
          </span>
        </div>
      </div>
    </Link>
  );
}

/** /stats page — global analytics dashboard. Implements PAGE-05. */
export default function StatsPage() {
  const { status, connect } = useWalletContext();
  const isConnected = status === "connected";
  const { stats, isLoading, isError, error, refetch } = useStats();

  // Not connected — show page header + connect prompt banner (no full-page gate)
  if (!isConnected) {
    return (
      <div className="space-y-10">
        {/* Page header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-tertiary text-sm font-semibold tracking-wider uppercase">
            <span className="material-symbols-outlined text-lg">analytics</span>
            Live from Midnight Blockchain
          </div>
          <h1 className="text-4xl sm:text-5xl font-headline font-extrabold tracking-tight text-on-surface">
            Global Analytics
          </h1>
          <p className="text-on-surface-variant max-w-xl">
            Aggregate statistics derived entirely from on-chain contract state.
            No personal data is tracked — only public vote tallies.
          </p>
        </div>

        {/* Inline connect prompt */}
        <div className="bg-surface-container-low rounded-2xl p-6 ring-1 ring-primary/20 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary text-2xl">wallet</span>
          </div>
          <div className="flex-1">
            <p className="font-headline font-bold text-on-surface mb-1">Connect your wallet to load stats</p>
            <p className="text-on-surface-variant text-sm">
              Statistics are fetched directly from the Midnight blockchain via your wallet&apos;s indexer connection.
            </p>
          </div>
          <button
            type="button"
            onClick={connect}
            className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-3 rounded-full font-bold shrink-0 active:scale-95 transition-all shadow-md hover:shadow-lg"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  // Loading
  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-10 w-48 bg-surface-container-high mb-2" />
          <Skeleton className="h-5 w-80 bg-surface-container-high" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full bg-surface-container-high rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-28 w-full bg-surface-container-high rounded-xl" />
      </div>
    );
  }

  // Error
  if (isError) {
    return (
      <div className="text-center py-20">
        <span className="material-symbols-outlined text-error text-4xl mb-4 block">error</span>
        <p className="text-on-surface-variant text-lg mb-4">
          {error?.message ?? "Failed to load statistics"}
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

  if (!stats) {
    return (
      <div className="text-center py-20">
        <Spinner size="lg" className="border-primary/30 border-t-primary mx-auto" />
      </div>
    );
  }

  const {
    totalPolls,
    totalVotes,
    activePolls,
    publicPolls,
    inviteOnlyPolls,
    avgVotesPerPoll,
    mostVotedPoll,
  } = stats;

  return (
    <div className="space-y-10">
      {/* Page header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3 text-tertiary text-sm font-semibold tracking-wider uppercase">
          <span className="material-symbols-outlined text-lg">analytics</span>
          Live from Midnight Blockchain
        </div>
        <h1 className="text-4xl sm:text-5xl font-headline font-extrabold tracking-tight text-on-surface">
          Global Analytics
        </h1>
        <p className="text-on-surface-variant max-w-xl">
          Aggregate statistics derived entirely from on-chain contract state.
          No personal data is tracked — only public vote tallies.
        </p>
      </div>

      {/* Stat cards grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon="ballot"
          label="Total Polls"
          value={totalPolls.toString()}
          accent="primary"
        />
        <StatCard
          icon="how_to_vote"
          label="Total Votes"
          value={totalVotes.toString()}
          accent="primary"
        />
        <StatCard
          icon="radio_button_checked"
          label="Active Polls"
          value={activePolls.toString()}
          accent="tertiary"
          sub="Currently accepting votes"
        />
        <StatCard
          icon="public"
          label="Public Polls"
          value={publicPolls.toString()}
          accent="muted"
        />
        <StatCard
          icon="lock"
          label="Invite-Only"
          value={inviteOnlyPolls.toString()}
          accent="muted"
        />
        <StatCard
          icon="trending_up"
          label="Avg Votes / Poll"
          value={avgVotesPerPoll.toFixed(1)}
          accent="muted"
        />
      </div>

      {/* Most active poll */}
      {mostVotedPoll && (
        <div className="space-y-4">
          <h2 className="text-lg font-headline font-bold text-on-surface">Highlight</h2>
          <MostVotedCard
            poll={mostVotedPoll}
            totalVotes={mostVotedPoll.tallies.total}
          />
        </div>
      )}

      {/* Footer note */}
      <p className="text-xs text-on-surface-variant italic text-center">
        Statistics refresh every 60 seconds from the Midnight Preview indexer.
        All data is derived from public on-chain state — no personal information is tracked.
      </p>
    </div>
  );
}
