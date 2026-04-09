import { Link, useLocation } from "react-router";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import type { ReactNode } from "react";

interface MobileDrawerProps {
  walletSlot?: ReactNode;
}

export function MobileDrawer({ walletSlot }: MobileDrawerProps) {
  const { pathname } = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Close drawer automatically when the route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const links = [
    { href: "/", label: "Home", icon: "home" },
    { href: "/active", label: "Active Polls", icon: "radio_button_checked" },
    { href: "/closed", label: "Closed Polls", icon: "lock_clock" },
    { href: "/create", label: "Create Poll", icon: "add_circle" },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
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
          {/* Navigation links */}
          <nav aria-label="Mobile navigation" className="flex flex-col gap-2 px-2">
            {links.map((link) => {
              const isActive = link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-bold transition-colors ${
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-on-surface-variant hover:text-primary hover:bg-surface-container-high"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                    {link.icon}
                  </span>
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}
