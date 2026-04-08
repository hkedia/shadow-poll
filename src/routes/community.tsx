function LinkCard({
  icon,
  label,
  title,
  description,
  href,
  accent = "primary",
}: {
  icon: string;
  label: string;
  title: string;
  description: string;
  href: string;
  accent?: "primary" | "tertiary";
}) {
  const accentClass = accent === "tertiary" ? "text-tertiary" : "text-primary";
  const bgClass = accent === "tertiary" ? "bg-tertiary/10" : "bg-primary/10";
  const ringClass = accent === "tertiary" ? "ring-tertiary/20 hover:ring-tertiary/40" : "ring-primary/20 hover:ring-primary/40";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex gap-4 bg-surface-container-low rounded-2xl p-5 ring-1 ${ringClass} transition-all hover:bg-surface-container`}
    >
      <div className={`w-10 h-10 rounded-xl ${bgClass} flex items-center justify-center shrink-0`}>
        <span className={`material-symbols-outlined ${accentClass} text-xl`}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold tracking-widest uppercase ${accentClass} mb-1`}>{label}</p>
        <p className="font-headline font-bold text-on-surface group-hover:text-primary transition-colors mb-1">
          {title}
        </p>
        <p className="text-on-surface-variant text-sm leading-relaxed">{description}</p>
      </div>
      <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors self-center text-lg shrink-0">
        open_in_new
      </span>
    </a>
  );
}

export default function CommunityPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 space-y-14">
      {/* Header */}
      <div className="space-y-3">
        <p className="text-xs font-semibold tracking-widest uppercase text-primary">Community</p>
        <h1 className="text-4xl sm:text-5xl font-headline font-extrabold tracking-tight text-on-surface">
          Join the Conversation
        </h1>
        <p className="text-on-surface-variant leading-relaxed">
          Shadow Poll is part of a broader movement toward privacy-preserving decentralised
          applications. Below are the official communities, resources, and channels where the
          Midnight and Cardano ecosystems live.
        </p>
      </div>

      {/* Midnight */}
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-base">nights_stay</span>
          </div>
          <h2 className="text-2xl font-headline font-bold text-on-surface">Midnight Network</h2>
        </div>
        <p className="text-on-surface-variant text-sm leading-relaxed">
          Midnight is a privacy-first blockchain built by IOG. It brings zero-knowledge proofs and
          selective disclosure to smart contracts, making it possible to build apps that are both
          verifiable and private.
        </p>

        <div className="space-y-3">
          <LinkCard
            icon="menu_book"
            label="Docs"
            title="Midnight Developer Documentation"
            description="The official reference for building on Midnight — language guides, SDK references, tutorials and architecture overviews."
            href="https://docs.midnight.network"
          />
          <LinkCard
            icon="chat"
            label="Discord"
            title="Midnight Discord"
            description="The primary real-time community hub. Ask questions, share projects, and connect with the Midnight core team and other builders."
            href="https://discord.com/invite/midnightnetwork"
          />
          <LinkCard
            icon="forum"
            label="Forum"
            title="Midnight Developer Forum"
            description="Long-form technical discussions, governance proposals, and ecosystem announcements from the Midnight team."
            href="https://forum.midnight.network"
          />
          <LinkCard
            icon="alternate_email"
            label="X / Twitter"
            title="@MidnightNtwrk"
            description="Official announcements, ecosystem updates, and news from the Midnight Network team."
            href="https://x.com/MidnightNtwrk"
          />
          <LinkCard
            icon="code"
            label="GitHub"
            title="Midnight GitHub Organisation"
            description="Open-source SDKs, example contracts, infrastructure tooling, and the Compact language compiler."
            href="https://github.com/midnightntwrk"
          />
          <LinkCard
            icon="science"
            label="Faucet"
            title="Midnight Preview Faucet"
            description="Get test tDUST tokens to deploy contracts and experiment on the Midnight Preview network."
            href="https://faucet.preview.midnight.network"
          />
        </div>
      </section>

      {/* Cardano */}
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-tertiary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-tertiary text-base">hub</span>
          </div>
          <h2 className="text-2xl font-headline font-bold text-on-surface">Cardano Ecosystem</h2>
        </div>
        <p className="text-on-surface-variant text-sm leading-relaxed">
          Midnight is a partner chain of Cardano, developed by IOG — the research and engineering
          organisation behind Cardano. The Cardano community is one of the largest and most active
          in the blockchain space, with a strong focus on peer-reviewed research and real-world utility.
        </p>

        <div className="space-y-3">
          <LinkCard
            icon="language"
            label="Official"
            title="Cardano.org"
            description="The official home of Cardano — mission, roadmap, ecosystem projects, and getting-started resources."
            href="https://cardano.org"
            accent="tertiary"
          />
          <LinkCard
            icon="forum"
            label="Forum"
            title="Cardano Forum"
            description="The main long-form discussion platform for the Cardano community — governance, development, staking, and more."
            href="https://forum.cardano.org"
            accent="tertiary"
          />
          <LinkCard
            icon="help"
            label="Q&A"
            title="Cardano Stack Exchange"
            description="The official Q&A platform for Cardano developers — ask questions, find answers, and help others build on Cardano."
            href="https://cardano.stackexchange.com"
            accent="tertiary"
          />
          <LinkCard
            icon="alternate_email"
            label="X / Twitter"
            title="@Cardano"
            description="Official Cardano announcements, milestones, and ecosystem highlights."
            href="https://x.com/Cardano"
            accent="tertiary"
          />
          <LinkCard
            icon="school"
            label="Research"
            title="IOHK Research Library"
            description="The academic papers behind Cardano and Midnight — peer-reviewed cryptography and distributed systems research."
            href="https://iohk.io/en/research/library"
            accent="tertiary"
          />
          <LinkCard
            icon="groups"
            label="Reddit"
            title="r/cardano"
            description="One of the largest blockchain subreddits — community news, project showcases, and open discussion."
            href="https://www.reddit.com/r/cardano"
            accent="tertiary"
          />
        </div>
      </section>

      {/* Wallet */}
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-base">wallet</span>
          </div>
          <h2 className="text-2xl font-headline font-bold text-on-surface">Wallet</h2>
        </div>
        <div className="space-y-3">
          <LinkCard
            icon="extension"
            label="Wallet"
            title="1am.xyz — Midnight Wallet"
            description="The browser extension wallet required to interact with Shadow Poll and other Midnight dApps. Install it to connect and start voting."
            href="https://www.1am.xyz"
          />
        </div>
      </section>

      {/* CTA */}
      <div className="bg-surface-container-low rounded-2xl p-6 ring-1 ring-outline-variant/10 text-center space-y-3">
        <span className="material-symbols-outlined text-primary text-3xl">favorite</span>
        <p className="font-headline font-bold text-on-surface text-lg">
          Building something on Midnight?
        </p>
        <p className="text-on-surface-variant text-sm">
          Shadow Poll is open source. If you are experimenting with privacy-preserving dApps on
          Midnight, we would love to hear from you. Jump into the Midnight Discord and say hello.
        </p>
        <a
          href="https://discord.com/invite/midnightnetwork"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold px-6 py-3 rounded-full active:scale-95 transition-all shadow-lg mt-2"
        >
          <span className="material-symbols-outlined text-base">chat</span>
          Join Midnight Discord
        </a>
      </div>
    </div>
  );
}
