"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Navigation links for the header. Uses pathname for active state highlighting. */
export function HeaderNav() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Trending Polls" },
    { href: "/create", label: "Create Poll" },
    { href: "/stats", label: "Analytics" },
  ];

  return (
    <>
      {links.map((link) => {
        const isActive = link.href === "/"
          ? pathname === "/"
          : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={
              isActive
                ? "font-headline font-bold tracking-tight text-lg text-primary border-b-2 border-primary pb-1"
                : "font-headline font-bold tracking-tight text-lg text-on-surface-variant hover:text-primary transition-colors"
            }
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );
}
