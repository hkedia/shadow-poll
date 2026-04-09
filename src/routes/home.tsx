import { Link } from "react-router";
import { useWalletContext } from "@/lib/midnight/wallet-context";
import { InstallPrompt } from "@/components/install-prompt";

/** Feature card for the landing page feature grid */
function FeatureCard({
  icon,
  title,
  description,
  accent = "primary",
}: {
  icon: string;
  title: string;
  description: string;
  accent?: "primary" | "tertiary";
}) {
  const accentClass = accent === "tertiary" ? "text-tertiary bg-tertiary/10" : "text-primary bg-primary/10";
  const borderClass = accent === "tertiary" ? "ring-tertiary/20" : "ring-primary/20";

  return (
    <div className={`bg-surface-container-low rounded-2xl p-6 ring-1 ${borderClass} flex flex-col gap-4 hover:bg-surface-container transition-colors`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${accentClass}`}>
        <span className="material-symbols-outlined text-2xl">{icon}</span>
      </div>
      <div>
        <h3 className="font-headline font-bold text-on-surface text-lg mb-2">{title}</h3>
        <p className="text-on-surface-variant text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

/** Poll type showcase card */
function PollTypeCard({
  type,
  icon,
  title,
  description,
  badge,
  accent,
}: {
  type: string;
  icon: string;
  title: string;
  description: string;
  badge: string;
  accent: "primary" | "tertiary";
}) {
  const colors =
    accent === "tertiary"
      ? {
          bg: "bg-tertiary/10",
          border: "ring-tertiary/30",
          icon: "text-tertiary",
          badge: "bg-tertiary/15 text-tertiary border-tertiary/30",
          dot: "bg-tertiary",
        }
      : {
          bg: "bg-primary/10",
          border: "ring-primary/30",
          icon: "text-primary",
          badge: "bg-primary/15 text-primary border-primary/30",
          dot: "bg-primary",
        };

  return (
    <div className={`bg-surface-container-low rounded-3xl p-6 sm:p-8 ring-1 ${colors.border} flex flex-col gap-5 hover:bg-surface-container transition-colors`}>
      <div className="flex items-start justify-between">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${colors.bg}`}>
          <span className={`material-symbols-outlined text-3xl ${colors.icon}`}>{icon}</span>
        </div>
        <span className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${colors.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
          {badge}
        </span>
      </div>
      <div>
        <p className={`text-xs font-bold tracking-widest uppercase mb-2 ${colors.icon}`}>{type}</p>
        <h3 className="font-headline font-bold text-on-surface text-xl mb-2">{title}</h3>
        <p className="text-on-surface-variant text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

/** Step in the "how it works" section */
function StepCard({
  step,
  icon,
  title,
  description,
}: {
  step: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-primary/15 ring-1 ring-primary/30 flex items-center justify-center shrink-0">
          <span className="text-primary font-headline font-extrabold text-sm">{step}</span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-on-surface-variant text-xl">{icon}</span>
        </div>
      </div>
      <div>
        <h3 className="font-headline font-bold text-on-surface text-base mb-1">{title}</h3>
        <p className="text-on-surface-variant text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

/** The full landing page shown to visitors/disconnected users */
function LandingContent() {
  return (
    <div className="flex flex-col gap-24 py-8 md:py-12">
      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center text-center gap-8 py-8 md:py-16 overflow-hidden">
        {/* Background glow */}
        <div
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div className="w-[600px] h-[400px] bg-primary/15 blur-[100px] rounded-full" />
          <div className="w-[300px] h-[300px] bg-tertiary/10 blur-[80px] rounded-full absolute -right-20 top-0" />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-6 max-w-4xl mx-auto">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold">
            <span className="material-symbols-outlined text-base">lock</span>
            Powered by Midnight Zero-Knowledge Proofs
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-headline font-extrabold tracking-tight text-on-surface text-balance leading-tight">
            Vote Without{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-tertiary">
              Compromise
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-on-surface-variant max-w-2xl leading-relaxed">
            Shadow Poll brings truly anonymous voting to everyone. Create polls, cast votes,
            and verify participation — all with cryptographic guarantees on the Midnight blockchain.
            No accounts. No tracking. No compromise.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link
              to="/active"
              className="inline-flex items-center gap-2 bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold px-8 py-4 rounded-full active:scale-95 duration-200 shadow-[0px_8px_32px_rgba(176,170,255,0.35)] hover:shadow-[0px_12px_48px_rgba(176,170,255,0.5)] text-base"
            >
              Browse Polls
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-on-surface-variant text-sm mt-4">
            {[
              { icon: "verified_user", label: "ZK-verified votes" },
              { icon: "visibility_off", label: "100% anonymous" },
              { icon: "link", label: "On-chain immutable" },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary text-base">{icon}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Poll Types ── */}
      <section className="flex flex-col gap-10">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs font-bold tracking-widest uppercase text-primary mb-3">Poll Types</p>
          <h2 className="text-3xl sm:text-4xl font-headline font-extrabold text-on-surface mb-4">
            Choose How You Vote
          </h2>
          <p className="text-on-surface-variant leading-relaxed">
            Whether you want open community participation or trusted-circle privacy,
            Shadow Poll has the right mode for your needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PollTypeCard
            type="Public Vote"
            icon="public"
            title="Open to Everyone"
            description="Any wallet holder on the Midnight Preview network can participate. Perfect for community decisions, public surveys, and open governance — with every vote cryptographically verified yet fully anonymous."
            badge="No invite needed"
            accent="primary"
          />
          <PollTypeCard
            type="Invite-Only Vote"
            icon="group"
            title="Trusted Circle Only"
            description="Share a unique invite code to control who can participate. Ideal for team decisions, private groups, or DAO governance where membership matters — zero-knowledge proofs still hide individual choices."
            badge="Code required"
            accent="tertiary"
          />
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="flex flex-col gap-10">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs font-bold tracking-widest uppercase text-tertiary mb-3">Features</p>
          <h2 className="text-3xl sm:text-4xl font-headline font-extrabold text-on-surface mb-4">
            Privacy Is the Default
          </h2>
          <p className="text-on-surface-variant leading-relaxed">
            Every feature is designed around one principle: your vote is yours alone.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <FeatureCard
            icon="lock"
            title="Zero-Knowledge Proofs"
            description="Every vote comes with a ZK proof generated entirely in your browser. It proves your vote is valid without revealing what you chose or who you are."
            accent="primary"
          />
          <FeatureCard
            icon="visibility_off"
            title="No Identity Required"
            description="Shadow Poll has no accounts, no emails, and no passwords. Your Midnight wallet is all you need — and we never see your wallet address."
            accent="primary"
          />
          <FeatureCard
            icon="link"
            title="On-Chain & Immutable"
            description="Polls and vote tallies live on the Midnight blockchain. Once cast, votes cannot be altered or deleted by anyone — including us."
            accent="primary"
          />
          <FeatureCard
            icon="speed"
            title="Browser-Side Proving"
            description="ZK proofs are generated client-side using WebAssembly. No server ever handles your raw vote data — proving happens entirely in your browser."
            accent="tertiary"
          />
          <FeatureCard
            icon="schedule"
            title="Time-Bounded Polls"
            description="Set an expiration block for your poll. Voting closes automatically when the block height is reached — no manual intervention required."
            accent="tertiary"
          />
          <FeatureCard
            icon="analytics"
            title="Transparent Tallies"
            description="Aggregate results are always public and verifiable on-chain. Anyone can audit vote counts without knowing how individuals voted."
            accent="tertiary"
          />
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="flex flex-col gap-10">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs font-bold tracking-widest uppercase text-primary mb-3">How It Works</p>
          <h2 className="text-3xl sm:text-4xl font-headline font-extrabold text-on-surface mb-4">
            Three Steps to Anonymous Voting
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-surface-container-low rounded-3xl p-8 ring-1 ring-outline-variant/10">
          <StepCard
            step="01"
            icon="wallet"
            title="Connect Your Wallet"
            description="Install the 1am.xyz wallet extension and connect to the Midnight Preview network. No account creation needed."
          />
          <StepCard
            step="02"
            icon="how_to_vote"
            title="Cast Your Vote"
            description="Browse open polls and make your choice. Your browser generates a zero-knowledge proof that validates your vote without revealing your identity."
          />
          <StepCard
            step="03"
            icon="verified"
            title="Proof Submitted"
            description="Your ZK proof is submitted to the Midnight blockchain. The tally updates, and your participation is verifiable — but your choice stays private forever."
          />
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="relative overflow-hidden bg-surface-container-low rounded-3xl p-8 sm:p-12 ring-1 ring-primary/20 flex flex-col items-center text-center gap-6">
        <div
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden rounded-3xl"
        >
          <div className="w-[500px] h-[300px] bg-primary/10 blur-[80px] rounded-full" />
        </div>
        <div className="relative z-10 flex flex-col items-center gap-6">
          <h2 className="text-3xl sm:text-4xl font-headline font-extrabold text-on-surface">
            Ready to Vote in the Shadows?
          </h2>
          <p className="text-on-surface-variant max-w-xl leading-relaxed">
            Join the Midnight Preview network and experience truly private polling.
            Your voice, cryptographically protected.
          </p>
          <Link
            to="/about"
            className="text-on-surface-variant hover:text-primary font-semibold transition-colors"
          >
            Learn more about Shadow Poll →
          </Link>
        </div>
      </section>
    </div>
  );
}

/** Home page — landing for visitors, redirects connected users to trending */
export default function HomePage() {
  const { status } = useWalletContext();

  if (status === "not_detected") {
    return <InstallPrompt />;
  }

  // Landing page for all states (connected, disconnected, connecting, etc.)
  return <LandingContent />;
}
