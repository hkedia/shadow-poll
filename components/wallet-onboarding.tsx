import { useState, useEffect } from "react";
import { useWalletContext } from "@/lib/midnight/wallet-context";
import { Button } from "@/components/ui/button";
import type { ConnectionStatus } from "@/lib/midnight/types";

type BannerStatus = "not_detected" | "disconnected" | "error";

const BANNER_STATUSES: BannerStatus[] = ["not_detected", "disconnected", "error"];

function isBannerStatus(status: ConnectionStatus): status is BannerStatus {
  return BANNER_STATUSES.includes(status as BannerStatus);
}

export function WalletOnboarding() {
  const { status, error, connect } = useWalletContext();

  // Only show for non-connected, non-transient states
  if (!isBannerStatus(status)) return null;

  return <WalletBanner status={status} error={error} connect={connect} />;
}

function WalletBanner({
  status,
  error,
  connect,
}: {
  status: "not_detected" | "disconnected" | "error";
  error: string | null;
  connect: () => Promise<void>;
}) {
  const storageKey = `wallet-banner-dismissed-${status}`;
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(storageKey) === "true";
    } catch {
      return false;
    }
  });

  // When status changes to a different banner-worthy state, the key changes
  // so this effect resets dismissed state for the new key
  useEffect(() => {
    setDismissed(() => {
      try {
        return sessionStorage.getItem(storageKey) === "true";
      } catch {
        return false;
      }
    });
  }, [storageKey]);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(storageKey, "true");
    } catch {
      // sessionStorage unavailable
    }
  };

  return (
    <div
      role="alert"
      className="sticky top-20 z-40 bg-surface-container-low ring-1 ring-outline-variant rounded-b-xl px-4 transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto flex items-center gap-4 py-3">
        <div className="flex-1 flex items-center gap-3">
          {status === "error" ? (
            <ErrorIcon />
          ) : (
            <WalletIcon />
          )}

          <div className="flex-1 min-w-0">
            {status === "not_detected" && (
              <NotDetectedContent />
            )}
            {status === "disconnected" && (
              <DisconnectedContent />
            )}
            {status === "error" && (
              <ErrorContent error={error} />
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {status === "not_detected" && (
              <>
                <Button
                  asChild
                  className="bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold rounded-full active:scale-95 duration-200 shadow-lg"
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
                  className="text-on-surface-variant hover:text-primary"
                >
                  Already installed? Refresh
                </Button>
              </>
            )}
            {status === "disconnected" && (
              <Button
                onClick={connect}
                className="bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold rounded-full active:scale-95 duration-200 shadow-lg"
              >
                Connect Wallet
              </Button>
            )}
            {status === "error" && (
              <>
                <Button
                  onClick={connect}
                  className="bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold rounded-full active:scale-95 duration-200 shadow-lg"
                >
                  Try Again
                </Button>
              </>
            )}
          </div>
        </div>

        <button
          onClick={handleDismiss}
          aria-label="Dismiss wallet banner"
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Troubleshooting tips for error state */}
      {status === "error" && (
        <div className="max-w-7xl mx-auto pb-3">
          <details className="text-left">
            <summary className="text-sm text-on-surface-variant hover:text-primary cursor-pointer transition-colors">
              Troubleshooting tips
            </summary>
            <ul className="mt-2 space-y-1 list-disc list-inside text-sm text-on-surface-variant">
              <li>Refresh the page</li>
              <li>Check that 1am.xyz is unlocked</li>
              <li>Ensure &quot;Preview&quot; network is selected</li>
              <li>Disable other wallet extensions</li>
            </ul>
          </details>
        </div>
      )}
    </div>
  );
}

function WalletIcon() {
  return (
    <div
      className="w-10 h-10 shrink-0 rounded-full bg-surface-container-high flex items-center justify-center"
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
        className="w-5 h-5 text-outline"
      >
        <rect x="1" y="5" width="22" height="14" rx="2" />
        <path d="M16 12h.01" />
      </svg>
    </div>
  );
}

function ErrorIcon() {
  return (
    <div
      className="w-10 h-10 shrink-0 rounded-full bg-error-container flex items-center justify-center"
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
        className="w-5 h-5 text-error"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    </div>
  );
}

function NotDetectedContent() {
  return (
    <>
      <h2 className="text-sm font-bold text-on-surface">
        1am.xyz Wallet Required
      </h2>
      <p className="text-xs text-on-surface-variant">
        Install the browser extension to get started.
      </p>
    </>
  );
}

function DisconnectedContent() {
  return (
    <>
      <h2 className="text-sm font-bold text-on-surface">
        Connect Your Wallet
      </h2>
      <p className="text-xs text-on-surface-variant">
        Connect your 1am.xyz wallet to create polls and vote.
      </p>
    </>
  );
}

function ErrorContent({ error }: { error: string | null }) {
  return (
    <>
      <h2 className="text-sm font-bold text-error">
        Connection Failed
      </h2>
      <p className="text-xs text-on-surface-variant">
        {error ??
          "Could not connect to your wallet. Make sure 1am.xyz is unlocked and the Midnight Preview network is selected."}
      </p>
    </>
  );
}