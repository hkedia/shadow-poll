import { useWalletContext } from "@/lib/midnight/wallet-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export function WalletButton() {
  const { status, truncatedAddress, connect, disconnect } = useWalletContext();

  // Initial load skeleton
  if (status === "idle") {
    return (
      <Skeleton className="h-10 w-36 rounded-full bg-[var(--surface-container-high)]" />
    );
  }

  // Connecting state
  if (status === "connecting") {
    return (
      <Button
        disabled
        className="bg-gradient-to-br from-[var(--primary)] to-[var(--primary-container)] text-[var(--on-primary)] font-bold px-6 py-3 rounded-full opacity-80"
        aria-label="Connecting wallet"
      >
        <Spinner
          size="sm"
          className="mr-2 border-[var(--on-primary)]/30 border-t-[var(--on-primary)]"
        />
        Connecting...
      </Button>
    );
  }

  // Connected state — address pill + dropdown (WALL-04)
  if (status === "connected" && truncatedAddress) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label={`Wallet menu, connected as ${truncatedAddress}`}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full",
              "bg-[var(--surface-container-high)]",
              "hover:bg-[var(--surface-container-highest)] transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
            )}
          >
            {/* Green connected dot */}
            <span
              aria-label="Connected"
              className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"
            />
            {/* Address in monospace (Geist Mono via font-mono) */}
            <span className="font-mono text-sm text-[var(--on-surface)]">
              {truncatedAddress}
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="bg-[var(--surface-container-low)] border-[var(--outline-variant)] text-[var(--on-surface)]"
        >
          <div className="px-3 py-2">
            <p className="text-xs text-[var(--on-surface-variant)] uppercase tracking-wide">
              Network
            </p>
            <p className="text-sm text-[var(--on-surface)]">Midnight Preview</p>
          </div>
          <DropdownMenuSeparator className="bg-[var(--outline-variant)]" />
          <DropdownMenuItem
            onClick={disconnect}
            className="text-[var(--error)] hover:bg-[var(--error-container)]/20 cursor-pointer"
          >
            Disconnect Wallet
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Disconnected, not_detected, or error — show Connect CTA (WALL-02)
  return (
    <Button
      onClick={connect}
      className="bg-gradient-to-br from-[var(--primary)] to-[var(--primary-container)] text-[var(--on-primary)] font-bold px-6 py-3 rounded-full active:scale-95 duration-200 shadow-[0px_8px_32px_rgba(176,170,255,0.3)] hover:shadow-[0px_12px_48px_rgba(176,170,255,0.4)]"
    >
      Connect Midnight Wallet
    </Button>
  );
}
