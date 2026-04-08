import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-surface-container-low py-12">
      <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-6">
        {/* Logo */}
        <span className="font-headline text-base font-bold text-primary">
          Shadow Poll
        </span>

        {/* Links */}
        <nav aria-label="Footer navigation" className="flex items-center gap-6">
          <Link
            href="/privacy"
            className="font-body text-sm text-on-surface-variant hover:text-primary transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            href="/about"
            className="font-body text-sm text-on-surface-variant hover:text-primary transition-colors"
          >
            About
          </Link>
          <Link
            href="/community"
            className="font-body text-sm text-on-surface-variant hover:text-primary transition-colors"
          >
            Community
          </Link>
        </nav>

        {/* Copyright */}
        <p className="font-body text-sm text-on-surface-variant">
          © 2024 Shadow Poll. Securely Anonymous.
        </p>
      </div>
    </footer>
  );
}
