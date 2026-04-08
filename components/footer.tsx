import { Link } from "react-router";

export function Footer() {
  return (
    <footer className="bg-surface-container-low py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-4 md:gap-6">
        {/* Logo mark */}
        <Link to="/" aria-label="Shadow Poll home">
          <img
            src="/logo.svg"
            alt="Shadow Poll"
            width={260}
            height={40}
            className="h-8 w-auto opacity-90 hover:opacity-100 transition-opacity"
          />
        </Link>

        {/* Links */}
        <nav aria-label="Footer navigation" className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
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
        </nav>

        {/* Copyright */}
        <p className="font-body text-sm text-on-surface-variant">
          © 2024 Shadow Poll. Securely Anonymous.
        </p>
      </div>
    </footer>
  );
}
