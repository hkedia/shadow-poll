"use client";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import type { ReactNode } from "react";

interface MobileDrawerProps {
  walletSlot?: ReactNode;
}

export function MobileDrawer({ walletSlot }: MobileDrawerProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          aria-label="Open menu"
          className="flex items-center justify-center h-11 w-11 rounded-xl text-on-surface-variant hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:hidden"
        >
          <span className="material-symbols-outlined" aria-hidden="true">menu</span>
          <span className="sr-only">Menu</span>
        </button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="bg-surface-container-low border-outline-variant w-72"
      >
        <div className="flex flex-col gap-6 pt-6">
          {/* Wallet area */}
          {walletSlot && (
            <>
              <div className="px-2">{walletSlot}</div>
              <Separator className="bg-outline-variant" />
            </>
          )}
          {/* Nav links placeholder — Phase 4 will add Home, Create Poll, etc. */}
          {/* nav-links-placeholder */}
        </div>
      </SheetContent>
    </Sheet>
  );
}
