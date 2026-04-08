import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function InstallPrompt() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-8">
      <Card className="w-full max-w-sm bg-[var(--surface-container-low)] border-[var(--outline-variant)] rounded-xl">
        <CardContent className="p-8 flex flex-col items-center text-center gap-6">
          {/* Wallet icon placeholder */}
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

          {/* Heading */}
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-[var(--on-surface)]">
              1am.xyz Wallet Required
            </h2>
            <p className="text-base text-[var(--on-surface-variant)]">
              Shadow Poll uses the 1am.xyz wallet to interact with the Midnight
              blockchain. Install the browser extension to get started.
            </p>
          </div>

          {/* Primary CTA — install */}
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

            {/* Secondary CTA — already installed, retry */}
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
        </CardContent>
      </Card>
    </div>
  );
}
