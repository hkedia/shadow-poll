"use client";

import { useWalletContext } from "@/lib/midnight/wallet-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

function StepDots({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn(
            "h-2 w-2 rounded-full transition-colors duration-200",
            i === current
              ? "bg-[var(--primary)]"
              : "bg-[var(--outline)]"
          )}
        />
      ))}
    </div>
  );
}

export function WalletOnboarding() {
  const { status, isAutoConnecting, error, connect } = useWalletContext();

  // Only show overlay when actively onboarding.
  // During autoconnect (page reload), the 1am wallet silently reconnects
  // already-authorized sites without a popup — suppress the overlay so users
  // aren't alarmed by an "approve the connection" message that never requires action.
  const showOverlay =
    (status === "connecting" && !isAutoConnecting) ||
    status === "not_detected" ||
    status === "error";

  if (!showOverlay) return null;

  const currentStep: number =
    status === "not_detected" ? 1 :
    /* connecting or error */   2;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Wallet connection"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--background)]/80 backdrop-blur-sm"
    >
      <Card className="w-full mx-4 max-w-[480px] bg-[var(--surface-container-low)] border-[var(--outline-variant)] rounded-xl">
        <CardContent className="p-8 flex flex-col items-center text-center gap-6">
          <StepDots current={currentStep} />

          {/* Connecting state */}
          {status === "connecting" && (
            <div className="flex flex-col items-center gap-4">
              <Spinner size="md" />
              <div>
                <h2 className="text-2xl font-bold text-[var(--on-surface)]">
                  Connecting...
                </h2>
                <p className="text-base text-[var(--on-surface-variant)] mt-2">
                  Check your 1am.xyz extension to approve the connection.
                </p>
              </div>
            </div>
          )}

          {/* Not detected — install step (WALL-06) */}
          {status === "not_detected" && (
            <div className="w-full flex flex-col items-center gap-4">
              <div
                className="w-12 h-12 rounded-full bg-[var(--surface-container-high)] flex items-center justify-center"
                aria-hidden="true"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-6 h-6 text-[var(--outline)]"
                  aria-hidden="true"
                >
                  <rect x="1" y="5" width="22" height="14" rx="2" />
                  <path d="M16 12h.01" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[var(--on-surface)]">
                  1am.xyz Wallet Required
                </h2>
                <p className="text-base text-[var(--on-surface-variant)] mt-2">
                  Shadow Poll uses the 1am.xyz wallet to interact with the
                  Midnight blockchain. Install the browser extension to get
                  started.
                </p>
              </div>
              <div className="w-full flex flex-col gap-3">
                <Button
                  asChild
                  className="w-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-container)] text-[var(--on-primary)] font-bold py-3 rounded-full active:scale-95 duration-200 shadow-lg"
                >
                  <a
                    href="https://www.1am.xyz"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Install 1am.xyz
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    if (typeof window !== "undefined") window.location.reload();
                  }}
                  className="w-full text-[var(--on-surface-variant)] hover:text-[var(--primary)]"
                >
                  I already installed it — refresh
                </Button>
              </div>
            </div>
          )}

          {/* Error state — inline with retry (D-03) */}
          {status === "error" && (
            <div className="w-full flex flex-col items-center gap-4">
              <div
                className="w-12 h-12 rounded-full bg-[var(--error-container)] flex items-center justify-center"
                aria-hidden="true"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-6 h-6 text-[var(--error)]"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[var(--error)]">
                  Connection Failed
                </h2>
                <p className="text-base text-[var(--on-surface-variant)] mt-2">
                  {error ??
                    "Could not connect to your wallet. Make sure 1am.xyz is unlocked and the Midnight Preview network is selected."}
                </p>
              </div>

              {/* Troubleshooting tips */}
              <details className="w-full text-left">
                <summary className="text-sm text-[var(--on-surface-variant)] hover:text-[var(--primary)] cursor-pointer transition-colors">
                  Troubleshooting tips
                </summary>
                <ul className="mt-3 space-y-1 list-disc list-inside text-sm text-[var(--on-surface-variant)]">
                  <li>Refresh the page</li>
                  <li>Check that 1am.xyz is unlocked</li>
                  <li>Ensure &quot;Preview&quot; network is selected</li>
                  <li>Disable other wallet extensions</li>
                </ul>
              </details>

              <Button
                onClick={connect}
                className="w-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-container)] text-[var(--on-primary)] font-bold py-3 rounded-full active:scale-95 duration-200 shadow-lg"
              >
                Try Connecting Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
