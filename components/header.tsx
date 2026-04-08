import Link from "next/link";
import { MobileDrawer } from "@/components/mobile-drawer";
import { HeaderNav } from "@/components/header-nav";
import type { ReactNode } from "react";

interface HeaderProps {
  walletSlot?: ReactNode;
}

export function Header({ walletSlot }: HeaderProps) {
  return (
    <header className="fixed top-0 w-full z-50 bg-[#0d0d19]/60 backdrop-blur-xl shadow-[0px_24px_48px_rgba(0,0,0,0.4)]">
      <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="font-headline text-2xl font-bold tracking-tighter text-primary hover:opacity-80 transition-opacity"
        >
          Shadow Poll
        </Link>

        {/* Nav links — client component for active state highlighting */}
        <nav aria-label="Main navigation" className="hidden md:flex items-center gap-8">
          <HeaderNav />
        </nav>

        {/* Desktop wallet slot */}
        <div className="hidden md:flex items-center">
          {walletSlot ?? (
            /* Skeleton placeholder until wallet state resolves */
            <div className="h-10 w-36 rounded-full bg-surface-container-high animate-pulse" />
          )}
        </div>

        {/* Mobile: hamburger drawer */}
        <MobileDrawer walletSlot={walletSlot} />
      </div>
    </header>
  );
}
