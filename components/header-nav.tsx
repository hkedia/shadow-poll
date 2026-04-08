import { Link, useLocation } from "react-router";

/** Navigation links for the header. Uses pathname for active state highlighting. */
export function HeaderNav() {
  const { pathname } = useLocation();

  const links = [
    { href: "/trending", label: "Trending Polls" },
    { href: "/create", label: "Create Poll" },
    { href: "/stats", label: "Stats" },
  ];

  return (
    <>
      {links.map((link) => {
        const isActive = link.href === "/trending"
          ? pathname === "/trending" || pathname === "/"
          : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            to={link.href}
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
