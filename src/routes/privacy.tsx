export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <p className="text-xs font-semibold tracking-widest uppercase text-primary">Legal</p>
        <h1 className="text-4xl sm:text-5xl font-headline font-extrabold tracking-tight text-on-surface">
          Privacy Policy
        </h1>
        <p className="text-on-surface-variant text-sm">Effective date: April 2025</p>
      </div>

      <p className="text-on-surface-variant leading-relaxed">
        Shadow Poll is built on a single principle: <strong className="text-on-surface">your vote is yours alone.</strong> This
        policy explains exactly what information we collect, what we do not collect, and how the
        Midnight blockchain enforces those guarantees at the cryptographic level.
      </p>

      {/* Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-headline font-bold text-on-surface">1. What We Collect</h2>
        <div className="bg-surface-container-low rounded-2xl p-6 space-y-4 ring-1 ring-outline-variant/10">
          <div className="flex gap-4">
            <span className="material-symbols-outlined text-primary text-xl shrink-0 mt-0.5">storage</span>
            <div>
              <p className="font-semibold text-on-surface mb-1">Poll metadata (off-chain)</p>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                When you create a poll, the poll&apos;s title and options are stored in our database so the
                UI can display them. This metadata contains no personally identifiable information —
                it is equivalent to the text of the question itself.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <span className="material-symbols-outlined text-primary text-xl shrink-0 mt-0.5">link</span>
            <div>
              <p className="font-semibold text-on-surface mb-1">On-chain state (public)</p>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                Vote tallies and poll configuration (option count, expiration block, poll type) are
                stored on the Midnight blockchain as public ledger state. Anyone can read these
                aggregates. They contain no voter identities.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <span className="material-symbols-outlined text-primary text-xl shrink-0 mt-0.5">analytics</span>
            <div>
              <p className="font-semibold text-on-surface mb-1">Standard server logs</p>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                Our hosting provider may retain standard HTTP access logs (IP address, timestamp,
                request path) for up to 30 days for security and abuse prevention. We do not use
                these for analytics or advertising.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-headline font-bold text-on-surface">2. What We Do Not Collect</h2>
        <ul className="space-y-3">
          {[
            "Your wallet address or any wallet identifier — the 1am.xyz wallet never sends your address to our servers.",
            "Which poll you voted on or which option you chose — this is enforced at the zero-knowledge proof level.",
            "Your name, email address, or any account credentials — Shadow Poll has no accounts.",
            "Browser fingerprints, advertising IDs, or cross-site tracking cookies.",
            "Any biometric data or device identifiers.",
          ].map((item, i) => (
            <li key={i} className="flex gap-3 text-on-surface-variant text-sm leading-relaxed">
              <span className="material-symbols-outlined text-tertiary text-base shrink-0 mt-0.5">check_circle</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-headline font-bold text-on-surface">3. How Zero-Knowledge Proofs Protect You</h2>
        <p className="text-on-surface-variant leading-relaxed text-sm">
          Every vote is accompanied by a zero-knowledge proof generated entirely inside your browser.
          This proof mathematically demonstrates that your vote is valid without revealing your identity
          or your chosen option to anyone — including us. The Midnight network verifies the proof
          on-chain; only the aggregate tally changes. No server ever sees your raw vote.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-headline font-bold text-on-surface">4. Cookies &amp; Local Storage</h2>
        <p className="text-on-surface-variant leading-relaxed text-sm">
          We use browser local storage only to cache poll metadata for performance (e.g., poll titles
          you have already loaded). No tracking or session cookies are set. You can clear local
          storage at any time through your browser settings without affecting your ability to vote.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-headline font-bold text-on-surface">5. Third-Party Services</h2>
        <div className="space-y-3 text-on-surface-variant text-sm leading-relaxed">
          <p>
            <strong className="text-on-surface">Midnight Preview Network &amp; Indexer</strong> — on-chain
            interactions go through the Midnight public indexer. No personal data is transmitted; only
            signed transactions and ZK proofs.
          </p>
          <p>
            <strong className="text-on-surface">1am.xyz Wallet</strong> — all wallet operations happen
            locally in your browser extension. We have no access to your private keys or wallet state.
          </p>
          <p>
            <strong className="text-on-surface">Database (Neon)</strong> — poll metadata is stored in a
            managed PostgreSQL database. Only poll question text and options are stored; no user data.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-headline font-bold text-on-surface">6. Data Retention</h2>
        <p className="text-on-surface-variant leading-relaxed text-sm">
          Poll metadata is retained indefinitely so that historical polls remain readable. On-chain
          state is permanent by the nature of the blockchain. Because no personal data is stored,
          there is nothing to delete on your behalf. If you believe any data linked to you exists,
          contact us at the address below.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-headline font-bold text-on-surface">7. Changes to This Policy</h2>
        <p className="text-on-surface-variant leading-relaxed text-sm">
          We may update this policy as the application evolves. Material changes will be noted on this
          page with a new effective date. Continued use of Shadow Poll after a change constitutes
          acceptance of the updated policy.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-headline font-bold text-on-surface">8. Contact</h2>
        <p className="text-on-surface-variant leading-relaxed text-sm">
          Questions about this policy? Reach us at{" "}
          <a
            href="mailto:privacy@shadowpoll.xyz"
            className="text-primary hover:underline"
          >
            privacy@shadowpoll.xyz
          </a>
          .
        </p>
      </section>
    </div>
  );
}
