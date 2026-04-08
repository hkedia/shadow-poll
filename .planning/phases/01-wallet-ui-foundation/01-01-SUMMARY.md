---
phase: 01-wallet-ui-foundation
plan: 01
subsystem: ui
tags: [tailwind, shadcn, design-system, dark-mode, layout, typography]

requires: []
provides:
  - Aether Privacy design tokens (CSS custom properties) in globals.css
  - shadcn/ui component set (button, badge, card, dropdown-menu, sheet, skeleton, separator, spinner)
  - App shell: Header, Footer, MobileDrawer components
  - Manrope + Plus Jakarta Sans + Geist Mono fonts loaded via next/font
  - Dark-only layout with wallet slot in header
affects:
  - 01-02 (WalletButton slots into Header walletSlot prop)
  - 01-03 (layout.tsx extended with WalletProvider)
  - All future phases (design tokens used everywhere)

tech-stack:
  added:
    - shadcn/ui (default style, no icon library)
    - clsx + tailwind-merge (via cn() helper)
  patterns:
    - CSS custom properties for all design tokens (--primary, --background, etc.)
    - "@theme inline" block in globals.css for Tailwind v4 token registration
    - Dark-only mode via html.dark class (no toggle)
    - Server Components for Header/Footer (no "use client" needed)

key-files:
  created:
    - app/globals.css (Aether Privacy color tokens, typography utilities)
    - components/header.tsx (glass-blur fixed header with wallet slot)
    - components/footer.tsx (links + copyright)
    - components/mobile-drawer.tsx (Sheet-based hamburger drawer)
    - components/ui/spinner.tsx (custom ring spinner)
    - components/ui/button.tsx (shadcn reinstalled with default style)
    - components/ui/badge.tsx
    - components/ui/card.tsx
    - components/ui/dropdown-menu.tsx
    - components/ui/sheet.tsx
    - components/ui/skeleton.tsx
    - components/ui/separator.tsx
  modified:
    - app/layout.tsx (fonts, dark class, Header/Footer)
    - components.json (style: default, iconLibrary: none)
    - lib/utils.ts (cn() helper — was already correct)

key-decisions:
  - "Use CSS custom properties (not Tailwind config values) for Aether design tokens — enables runtime theming and consistent access via var(--token)"
  - "dark-only mode via html.dark class added in layout — no media query toggle"
  - "shadcn default style chosen over radix-nova (which was pre-existing) for broader component compatibility"

patterns-established:
  - "Pattern: var(--token) CSS custom properties for all color references in components"
  - "Pattern: Header accepts walletSlot?: ReactNode prop for wallet button injection"
  - "Pattern: Spinner component uses border-t trick for ring animation"

requirements-completed: [PAGE-04, PAGE-06]

duration: 35min
completed: 2026-04-08
---

# Phase 1 Plan 01: Aether Design System + App Shell Summary

**shadcn/ui installed with Aether Privacy dark design tokens, glass-blur app shell (Header/Footer/MobileDrawer) and all 7 UI primitives configured for wallet integration.**

## Performance

- **Duration:** ~35 min
- **Completed:** 2026-04-08
- **Tasks:** 2 (design system + UI components)
- **Files modified:** 14

## Accomplishments

- Established Aether Privacy color palette as CSS custom properties (`--primary`, `--background`, `--surface-container-*`, `--tertiary`, etc.) in globals.css
- Installed all required shadcn/ui components (button, badge, card, dropdown-menu, sheet, skeleton, separator) plus custom spinner
- Built glass-blur fixed Header with `walletSlot` prop, Footer with links, and Sheet-based MobileDrawer for mobile nav

## Task Commits

1. **Task 1+2: Aether design system + app shell** - `517b49b` (feat)

## Files Created/Modified

- `app/globals.css` — Full Aether Privacy color tokens, @theme inline, reduced motion
- `app/layout.tsx` — Manrope + Plus Jakarta Sans + Geist Mono fonts, dark class, Header/Footer
- `components.json` — Updated to default style, no icon library
- `components/header.tsx` — Fixed glass-blur header, logo, wallet slot, hamburger
- `components/footer.tsx` — Footer with Privacy Policy/About/Community links
- `components/mobile-drawer.tsx` — Sheet-based hamburger drawer
- `components/ui/spinner.tsx` — Custom ring spinner with primary color
- `components/ui/button.tsx`, `badge.tsx`, `card.tsx`, `dropdown-menu.tsx`, `sheet.tsx`, `skeleton.tsx`, `separator.tsx` — shadcn primitives

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] components.json pre-existed with radix-nova style**
- **Found during:** Task 1
- **Issue:** `components.json` existed with `"style": "radix-nova"` — plan required `"style": "default"`
- **Fix:** Updated to `"style": "default"` before running shadcn add commands
- **Files modified:** `components.json`
- **Commit:** 517b49b

**2. [Rule 1 - Pre-existing] lib/utils.ts already existed correctly**
- **Found during:** Task 1
- **Issue:** File already had correct `cn()` helper implementation
- **Fix:** No change needed — verified and left as-is
- **Commit:** N/A

## Known Stubs

None — all components render real content.

## Self-Check: PASSED

- `components/header.tsx` — FOUND
- `components/footer.tsx` — FOUND
- `components/mobile-drawer.tsx` — FOUND
- `517b49b` commit — FOUND
