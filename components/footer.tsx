import { useState } from "react";
import { Link } from "react-router";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

const TIP_URL = "https://hkedia.fkey.id/";

export function Footer() {
  return (
    <footer className="bg-surface-container-low py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 flex flex-col md:flex-row items-center gap-4 md:gap-6">
        {/* Left: Logo mark + tagline */}
        <div className="flex items-center gap-3">
          <Link to="/" aria-label="Shadow Poll home">
            <img
              src="/logo.svg"
              alt="Shadow Poll"
              width={32}
              height={32}
              className="h-8 w-8 opacity-90 hover:opacity-100 transition-opacity"
            />
          </Link>
          <span className="font-body text-sm text-on-surface-variant">
            Securely Anonymous
          </span>
        </div>

        {/* Center: Links */}
        <nav aria-label="Footer navigation" className="flex-1 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <Link
            to="/privacy"
            className="font-body text-sm text-on-surface-variant hover:text-primary transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            to="/about"
            className="font-body text-sm text-on-surface-variant hover:text-primary transition-colors"
          >
            About
          </Link>
          <Link
            to="/community"
            className="font-body text-sm text-on-surface-variant hover:text-primary transition-colors"
          >
            Community
          </Link>
          <TipModal />
        </nav>

        {/* Right: Copyright */}
        <p className="font-body text-sm text-on-surface-variant whitespace-nowrap">
          © 2026 Shadow Poll
        </p>
      </div>
    </footer>
  );
}

function TipModal() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="font-body text-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
        >
          Tip the Developer
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-[15%] z-50 -translate-x-1/2 w-[90vw] max-w-xl h-[70vh] bg-surface-container-low rounded-xl p-6 shadow-xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 flex flex-col">
          <Dialog.Title className="font-headline font-bold text-lg text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">volunteer_activism</span>
            Support Shadow Poll
          </Dialog.Title>
          <Dialog.Description className="text-sm text-on-surface-variant mt-2">
            If you find Shadow Poll useful, consider tipping the developer. Every contribution helps keep the project going and improving.
          </Dialog.Description>

          <div className="mt-4 flex-1 rounded-lg overflow-hidden bg-surface-container-high border border-outline-variant/30 min-h-0">
            <iframe
              src={TIP_URL}
              title="Tip the Developer"
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              onError={() => {}}
            />
          </div>

          <div className="mt-3 flex flex-col items-center gap-2 shrink-0">
            <a
              href={TIP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
            >
              <span className="material-symbols-outlined text-base">open_in_new</span>
              Open tip page in a new tab
            </a>
          </div>

          <Dialog.Close asChild>
            <button
              type="button"
              className={cn(
                "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity",
                "hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              )}
              aria-label="Close"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}