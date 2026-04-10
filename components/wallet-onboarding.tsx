import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useWalletContext } from "@/lib/midnight/wallet-context";
import { Button } from "@/components/ui/button";
import type { ConnectionStatus } from "@/lib/midnight/types";

type ModalStatus = "not_detected" | "error";

const MODAL_STATUSES: ModalStatus[] = ["not_detected", "error"];

function isModalStatus(status: ConnectionStatus): status is ModalStatus {
  return MODAL_STATUSES.includes(status as ModalStatus);
}

export function WalletOnboarding() {
  const { status, error, connect } = useWalletContext();

  // Only show for error states — disconnected uses header button
  if (!isModalStatus(status)) return null;

  return <WalletModal status={status} error={error} connect={connect} />;
}

function WalletModal({
  status,
  error,
  connect,
}: {
  status: "not_detected" | "error";
  error: string | null;
  connect: () => Promise<void>;
}) {
  const storageKey = `wallet-modal-dismissed-${status}`;
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(storageKey) === "true";
    } catch {
      return false;
    }
  });

  // When status changes to a different modal-worthy state, the key changes
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

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(storageKey, "true");
    } catch {
      // sessionStorage unavailable
    }
  };

  // Modal is controlled — open when not dismissed, close when dismissed
  const isOpen = !dismissed;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => {
      if (!open) handleDismiss();
    }}>
      <Dialog.Portal>
        {/* Dark overlay backdrop */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        
        {/* Centered modal card */}
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[var(--surface-container-low)] p-6 shadow-2xl ring-1 ring-[var(--outline-variant)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 focus:outline-none"
          onEscapeKeyDown={handleDismiss}
          onPointerDownOutside={handleDismiss}
        >
          {/* Close button (X) in top-right */}
          <button
            onClick={handleDismiss}
            aria-label="Close modal"
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-[var(--on-surface-variant)] transition-colors hover:bg-[var(--surface-container-high)] hover:text-[var(--on-surface)]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <div className="flex flex-col items-center gap-4 text-center">
            {/* Icon */}
            {status === "error" ? <ErrorIcon /> : <WalletIcon />}

            {/* Content */}
            <div className="space-y-2">
              {status === "not_detected" && <NotDetectedContent />}
              {status === "error" && <ErrorContent error={error} />}
            </div>

            {/* Actions */}
            <div className="flex w-full flex-col gap-3 pt-2">
              {status === "not_detected" && (
                <>
                  <Button
                    asChild
                    className="w-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-container)] text-[var(--on-primary)] font-bold rounded-full active:scale-95 duration-200 shadow-lg"
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
                    className="text-[var(--on-surface-variant)] hover:text-[var(--primary)]"
                  >
                    Already installed? Refresh
                  </Button>
                </>
              )}
              {status === "error" && (
                <Button
                  onClick={connect}
                  className="w-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-container)] text-[var(--on-primary)] font-bold rounded-full active:scale-95 duration-200 shadow-lg"
                >
                  Try Again
                </Button>
              )}
            </div>

            {/* Troubleshooting tips for error state */}
            {status === "error" && (
              <details className="w-full text-left">
                <summary className="cursor-pointer text-sm text-[var(--on-surface-variant)] hover:text-[var(--primary)] transition-colors">
                  Troubleshooting tips
                </summary>
                <ul className="mt-2 space-y-1 list-disc list-inside text-sm text-[var(--on-surface-variant)]">
                  <li>Refresh the page</li>
                  <li>Check that 1am.xyz is unlocked</li>
                  <li>Ensure &quot;Preview&quot; network is selected</li>
                  <li>Disable other wallet extensions</li>
                </ul>
              </details>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function WalletIcon() {
  return (
    <div
      className="w-16 h-16 shrink-0 rounded-full bg-[var(--surface-container-high)] flex items-center justify-center"
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
        className="w-8 h-8 text-[var(--primary)]"
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
      className="w-16 h-16 shrink-0 rounded-full bg-[var(--error-container)] flex items-center justify-center"
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
        className="w-8 h-8 text-[var(--error)]"
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
      <Dialog.Title className="text-xl font-bold text-[var(--on-surface)]">
        1am.xyz Wallet Required
      </Dialog.Title>
      <Dialog.Description className="text-sm text-[var(--on-surface-variant)]">
        Install the browser extension to create polls and vote on the Midnight network.
      </Dialog.Description>
    </>
  );
}

function ErrorContent({ error }: { error: string | null }) {
  return (
    <>
      <Dialog.Title className="text-xl font-bold text-[var(--error)]">
        Connection Failed
      </Dialog.Title>
      <Dialog.Description className="text-sm text-[var(--on-surface-variant)]">
        {error ??
          "Could not connect to your wallet. Make sure 1am.xyz is unlocked and the Midnight Preview network is selected."}
      </Dialog.Description>
    </>
  );
}
