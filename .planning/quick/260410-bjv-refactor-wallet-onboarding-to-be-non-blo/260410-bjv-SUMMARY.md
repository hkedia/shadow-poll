---
phase: quick/260410-bjv
plan: 01
subsystem: wallet-ui
tags: [wallet, onboarding, ux, banner, refactoring]
dependency_graph:
  requires: [wallet-context, ConnectionStatus]
  provides: [WalletOnboarding-banner, dismissible-wallet-state]
  affects: [app-layout, home-page, create-page]
tech_stack:
  added: [vitest, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, jsdom]
  patterns: [dismissible-banner, sessionStorage-per-state, app-level-mount]
key_files:
  created:
    - components/__tests__/wallet-onboarding.test.tsx
    - vitest.config.ts
    - test-setup.ts
  modified:
    - components/wallet-onboarding.tsx
    - src/app.tsx
    - src/routes/create.tsx
    - src/routes/home.tsx
    - package.json
  deleted:
    - components/install-prompt.tsx
decisions:
  - D-bjv-01: WalletOnboarding uses sessionStorage keyed by status for per-state dismissal (banner reappears on state transitions)
  - D-bjv-02: App-level mount inside WalletProvider at top of layout — appears on all pages
  - D-bjv-03: Removed requiresWallet prop entirely — component self-selects visibility from context
  - D-bjv-04: Sticky top-20 positioning below fixed Header (h-20) with z-40
metrics:
  duration: 8min
  tasks: 2
  files: 7
---

# Phase quick/260410-bjv Plan 01: Refactor Wallet Onboarding Summary

Dismissible app-wide WalletOnboarding banner replaces blocking overlay and InstallPrompt — all wallet states handled in one component with sessionStorage-based per-state dismissal.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Rewrite WalletOnboarding as dismissible app-wide banner | 5de3d1e | components/wallet-onboarding.tsx, components/__tests__/wallet-onboarding.test.tsx, vitest.config.ts, test-setup.ts, package.json, bun.lock |
| 2 | Wire app-level WalletOnboarding and remove legacy code | 2c2c49d | src/app.tsx, src/routes/create.tsx, src/routes/home.tsx, components/install-prompt.tsx (deleted) |

## Key Changes

- **WalletOnboarding** rewritten as a dismissible sticky banner (not full-screen overlay) that handles `not_detected`, `disconnected`, and `error` wallet states
- **sessionStorage** keyed by `wallet-banner-dismissed-{status}` — dismissing one state doesn't hide others; new state transitions show the banner
- **App-level mount** in `app.tsx` between `<ScrollToTop />` and the layout div — appears on all pages
- **InstallPrompt** deleted — its `not_detected` logic folded into WalletOnboarding
- **create.tsx** simplified — no more blocking overlay, content visible without wallet
- **home.tsx** simplified — always renders `<LandingContent />`, no conditional InstallPrompt
- **Test infrastructure** added: vitest + React Testing Library with 7 passing tests

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

- `bun run build` passes ✓
- `bun run lint` passes ✓
- All 7 tests pass ✓
- No `InstallPrompt` references remain ✓
- No `requiresWallet` references remain ✓
- `WalletOnboarding` in `app.tsx` only ✓
- `components/install-prompt.tsx` deleted ✓