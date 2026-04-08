export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 space-y-14">
      {/* Header */}
      <div className="space-y-3">
        <p className="text-xs font-semibold tracking-widest uppercase text-primary">About</p>
        <h1 className="text-4xl sm:text-5xl font-headline font-extrabold tracking-tight text-on-surface">
          What is Shadow Poll?
        </h1>
        <p className="text-on-surface-variant leading-relaxed">
          Shadow Poll is an anonymous polling application built on the{" "}
          <strong className="text-on-surface">Midnight Network</strong> — a privacy-preserving
          blockchain that uses zero-knowledge proofs to separate what you prove from what you reveal.
        </p>
      </div>

      {/* Mission */}
      <section className="space-y-4">
        <h2 className="text-2xl font-headline font-bold text-on-surface">The Problem We Solve</h2>
        <p className="text-on-surface-variant leading-relaxed text-sm">
          Every existing polling platform — from Twitter polls to enterprise survey tools — requires
          you to identify yourself in some way. Even when a poll claims to be &quot;anonymous,&quot; the platform
          operator can correlate your vote with your account, IP address, or device. This chilling
          effect distorts results: people vote for what is safe, not what they believe.
        </p>
        <p className="text-on-surface-variant leading-relaxed text-sm">
          Shadow Poll eliminates this entirely. Your vote is a zero-knowledge proof — it proves you
          are an eligible participant without revealing who you are or what you chose. The only thing
          anyone can see is the final tally.
        </p>
      </section>

      {/* How it works */}
      <section className="space-y-6">
        <h2 className="text-2xl font-headline font-bold text-on-surface">How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: "how_to_vote",
              step: "01",
              title: "Create or Browse",
              body: "Anyone with a 1am.xyz wallet can create a poll or browse active ones. Poll questions and options are public; voter identity is not.",
            },
            {
              icon: "security",
              step: "02",
              title: "Vote Privately",
              body: "When you vote, your browser generates a ZK proof locally. The proof is submitted to the Midnight contract — your choice never leaves your device in plain form.",
            },
            {
              icon: "bar_chart",
              step: "03",
              title: "Verify the Tally",
              body: "Vote counts are stored on-chain and readable by anyone. Every tally is verifiable without knowing who cast which vote.",
            },
          ].map(({ icon, step, title, body }) => (
            <div
              key={step}
              className="bg-surface-container-low rounded-2xl p-6 ring-1 ring-outline-variant/10 space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-lg">{icon}</span>
                </div>
                <span className="text-xs font-mono text-on-surface-variant">{step}</span>
              </div>
              <h3 className="font-headline font-bold text-on-surface">{title}</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Midnight */}
      <section className="space-y-6">
        <h2 className="text-2xl font-headline font-bold text-on-surface">Why Midnight?</h2>
        <p className="text-on-surface-variant leading-relaxed text-sm">
          Most blockchains are fully transparent by default — every transaction, every vote, every
          interaction is readable by anyone. That is great for auditability but terrible for privacy.
          Midnight is designed from the ground up to give developers a third option: selective
          disclosure.
        </p>
        <div className="space-y-3">
          {[
            {
              icon: "lock",
              title: "Confidential smart contracts",
              body: "Midnight contracts hold private ledger state encrypted on-chain. Only the contract logic — running inside a ZK circuit — can read or mutate it.",
            },
            {
              icon: "verified_user",
              title: "Client-side ZK proving",
              body: "Proofs are generated in the user's browser using WASM-compiled circuits. No trusted third party ever sees your inputs.",
            },
            {
              icon: "layers",
              title: "Built on Cardano infrastructure",
              body: "Midnight is a partner chain of Cardano, inheriting its battle-tested consensus and security model while adding a separate privacy layer.",
            },
            {
              icon: "code",
              title: "Compact — a purpose-built language",
              body: "Smart contracts are written in Compact, Midnight's domain-specific language designed for safe, auditable ZK circuit authorship.",
            },
          ].map(({ icon, title, body }) => (
            <div key={title} className="flex gap-4">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-lg">{icon}</span>
              </div>
              <div>
                <p className="font-semibold text-on-surface mb-1 text-sm">{title}</p>
                <p className="text-on-surface-variant text-sm leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Open source */}
      <section className="bg-surface-container-low rounded-2xl p-6 ring-1 ring-outline-variant/10 space-y-3">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-tertiary text-2xl">public</span>
          <h2 className="text-xl font-headline font-bold text-on-surface">Open &amp; Verifiable</h2>
        </div>
        <p className="text-on-surface-variant text-sm leading-relaxed">
          Shadow Poll&apos;s smart contracts are open source. The ZK circuits that govern voting logic can
          be independently audited. The on-chain state is publicly readable. We believe privacy and
          transparency are not opposites — you can verify the system without being able to surveil
          its users.
        </p>
      </section>

      {/* Built by */}
      <section className="space-y-3 text-center">
        <p className="text-on-surface-variant text-sm">
          Built with curiosity and conviction by developers who believe the future of the web
          requires privacy as a default — not a feature.
        </p>
        <p className="text-on-surface-variant text-xs">
          Shadow Poll runs on the{" "}
          <strong className="text-on-surface">Midnight Preview Network</strong> (testnet). It is
          experimental software — use it to explore, not for production-critical decisions.
        </p>
      </section>
    </div>
  );
}
