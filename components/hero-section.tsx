import { useWalletContext } from "@/lib/midnight/wallet-context";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function HeroSection() {
  const { status, connect } = useWalletContext();

  const isConnected = status === "connected";
  const isConnecting = status === "connecting";

  return (
    <section className="flex flex-col items-start md:items-center justify-center flex-1 py-8 md:py-12 relative">
      {/* Decorative glow orb */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[var(--primary)]/20 blur-[60px] rounded-full pointer-events-none"
      />

      <div className="relative z-10 flex flex-col items-start md:items-center gap-6 text-left md:text-center md:max-w-2xl">
        {/* Headline — bold with gradient accent word */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[var(--on-surface)]">
          Forge Your{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-[var(--tertiary)]">
            Voice
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base text-[var(--on-surface-variant)] max-w-xl">
          Create secure, anonymous polls that prioritize privacy without
          sacrificing engagement. Simple enough for anyone, secure enough for
          everyone.
        </p>

        {/* CTA — adapts to wallet state */}
        {!isConnected ? (
          <Button
            onClick={connect}
            disabled={isConnecting}
            className="w-full md:w-auto bg-gradient-to-br from-[var(--primary)] to-[var(--primary-container)] text-[var(--on-primary)] font-bold px-8 py-4 rounded-full active:scale-95 duration-200 shadow-[0px_8px_32px_rgba(176,170,255,0.3)] hover:shadow-[0px_12px_48px_rgba(176,170,255,0.4)] text-base min-h-[44px]"
          >
            {isConnecting ? (
              <>
                <Spinner
                  size="sm"
                  className="mr-2 border-[var(--on-primary)]/30 border-t-[var(--on-primary)]"
                />
                Connecting...
              </>
            ) : (
              "Connect Midnight Wallet"
            )}
          </Button>
        ) : (
          /* Connected state — welcome badge */
          <div className="flex flex-col items-start md:items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--tertiary)]/10 border border-[var(--tertiary)]/20">
              <span
                className="h-2 w-2 rounded-full bg-emerald-500"
                aria-hidden="true"
              />
              <span className="text-sm text-[var(--tertiary)] uppercase tracking-wide font-semibold">
                Secure Anonymous Voting Active
              </span>
            </div>
            <p className="text-sm text-[var(--on-surface-variant)]">
              Welcome to Shadow Poll. Create a poll or browse existing ones.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
