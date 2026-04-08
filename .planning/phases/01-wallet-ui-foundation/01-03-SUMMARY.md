---
phase: 01-wallet-ui-foundation
plan: 03
subsystem: ui
tags: [next-config, wasm, layout, hero, landing-page, turbopack]

requires:
  - phase: 01-01
    provides: Header component with walletSlot prop, Footer, design tokens
  - phase: 01-02
    provides: WalletProvider, WalletButton, WalletOnboarding, InstallPrompt
provides:
  - app/layout.tsx with WalletProvider wrapping all page content
  - HeroSection component with gradient headline and Connect CTA
  - app/page.tsx landing page (wallet-state-aware)
  - next.config.ts with Midnight SDK externalization + Turbopack alias stubs
  - lib/midnight-sdk-stub.ts for Turbopack client-bundle aliasing
affects:
  - All future phases (layout is the root shell for every page)
  - Phase 2+ (WalletProvider available everywhere)

tech-stack:
  added:
    - "Turbopack resolveAlias for WASM package client stubs"
  patterns:
    - "serverExternalPackages (not experimental) for Next.js 16 SDK externalization"
    - "Turbopack resolveAlias pointing heavy WASM packages to stub module"
    - "WalletProvider at root layout level, not page level"

key-files:
  created:
    - components/hero-section.tsx (gradient headline, CTA, connected state badge)
    - lib/midnight-sdk-stub.ts (Turbopack stub for Midnight SDK client bundle)
  modified:
    - app/layout.tsx (added WalletProvider, WalletButton, WalletOnboarding)
    - app/page.tsx (replaced scaffold with wallet-state-aware landing page)
    - next.config.ts (serverExternalPackages + turbopack resolveAlias)

key-decisions:
  - "Use serverExternalPackages (top-level, not experimental) for Next.js 16 — experimental.serverComponentsExternalPackages is deprecated"
  - "Turbopack resolveAlias stubs Midnight SDK packages to prevent client bundle errors — SDK only loaded at runtime via dynamic import"
  - "WalletOnboarding rendered in layout (not page) so it overlays all pages universally"
  - "app/page.tsx is a Client Component — needs useWalletContext() for wallet-state-aware rendering"

patterns-established:
  - "Pattern: Root layout wraps children in WalletProvider so all pages have wallet state"
  - "Pattern: Turbopack resolveAlias to stub.ts for packages incompatible with browser bundling"
  - "Pattern: Landing page branches on status === 'not_detected' to show InstallPrompt vs HeroSection"

requirements-completed: [WALL-01, WALL-02, WALL-04, WALL-06, PAGE-04, PAGE-06]

duration: 35min
completed: 2026-04-08
---

# Phase 1 Plan 03: App Wiring + Hero Landing Page Summary

**Root layout wired with WalletProvider and WalletButton, hero landing page with gradient 'Forge Your Voice' headline deployed, and Next.js 16 configured to externalize Midnight SDK WASM packages via Turbopack alias stubs.**

## Performance

- **Duration:** ~35 min
- **Completed:** 2026-04-08
- **Tasks:** 2 (layout wiring + hero page)
- **Files modified:** 5

## Accomplishments

- Wired WalletProvider into root layout — all pages now have access to wallet state without any additional setup
- Built HeroSection with exact copywriting ("Forge Your Voice" with primary-to-tertiary gradient on "Voice"), subtitle, and wallet-state-adaptive CTA
- Solved Next.js 16 + Turbopack + Midnight SDK incompatibility by using `serverExternalPackages` and `turbopack.resolveAlias` with a stub module

## Task Commits

1. **Task 1+2: WalletProvider wiring + hero landing page + Next.js config** - `90017b1` (feat)

## Files Created/Modified

- `app/layout.tsx` — WalletProvider wraps children, WalletButton passed as walletSlot, WalletOnboarding overlay added
- `app/page.tsx` — Replaced scaffold boilerplate with wallet-aware landing (InstallPrompt or HeroSection)
- `components/hero-section.tsx` — "Forge Your Voice" headline, subtitle, Connect CTA, connected state badge
- `next.config.ts` — serverExternalPackages for Midnight SDK + Turbopack resolveAlias stubs
- `lib/midnight-sdk-stub.ts` — Stub module aliased for Midnight SDK in client bundle

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] experimental.serverComponentsExternalPackages deprecated in Next.js 16**
- **Found during:** Task 1 build
- **Issue:** Plan used `experimental.serverComponentsExternalPackages` — Next.js 16 reports it as invalid and requires top-level `serverExternalPackages`
- **Fix:** Moved to top-level `serverExternalPackages` array
- **Files modified:** `next.config.ts`
- **Commit:** 90017b1

**2. [Rule 3 - Blocking] webpack config fails with Turbopack (Next.js 16 default)**
- **Found during:** Task 1 build
- **Issue:** Next.js 16 uses Turbopack by default; a `webpack` config block causes fatal build error unless `--webpack` flag is passed. `--webpack` mode hung indefinitely due to WASM package complexity.
- **Fix:** Replaced `webpack` config with `turbopack: { resolveAlias: {...} }` pointing all Midnight SDK packages to `lib/midnight-sdk-stub.ts` for client builds
- **Files modified:** `next.config.ts`, created `lib/midnight-sdk-stub.ts`
- **Commit:** 90017b1

**3. [Rule 2 - Missing] Added @midnight-ntwrk/midnight-js-utils and isomorphic-ws to stub aliases**
- **Found during:** Task 1 build (Turbopack traced transitive dependencies)
- **Issue:** Turbopack statically analyzed dynamic imports and resolved `midnight-js-utils` and `isomorphic-ws` as transitive deps that fail browser bundling
- **Fix:** Added both to `serverExternalPackages` and `resolveAlias` stub map
- **Files modified:** `next.config.ts`
- **Commit:** 90017b1

## Known Stubs

None — HeroSection renders real wallet-state-driven content.

## Self-Check: PASSED

- `components/hero-section.tsx` — FOUND
- `lib/midnight-sdk-stub.ts` — FOUND
- `app/page.tsx` — FOUND (updated)
- `app/layout.tsx` — FOUND (updated)
- `90017b1` commit — FOUND
