---
phase: 01-wallet-ui-foundation
plan: 02
subsystem: auth
tags: [midnight, wallet, web3, react-context, typescript]

requires:
  - phase: 01-01
    provides: shadcn/ui primitives (Button, Card, Skeleton, Spinner, DropdownMenu) and design tokens
provides:
  - WalletProvider React context wrapping entire app
  - useWalletContext() hook for any client component
  - useWallet() hook with connect/disconnect/auto-reconnect logic
  - assembleProviders() factory for MidnightProviderSet
  - WalletButton component (CTA, skeleton, address pill with dropdown)
  - InstallPrompt component (full-page, shown when 1am.xyz not installed)
  - WalletOnboarding overlay (connecting/error/not_detected states)
affects:
  - 01-03 (WalletProvider and WalletButton used in layout.tsx)
  - Phase 2+ (useWalletContext provides providers for contract calls)

tech-stack:
  added:
    - "@midnight-ntwrk/midnight-js-indexer-public-data-provider (indexerPublicDataProvider)"
    - "@midnight-ntwrk/midnight-js-fetch-zk-config-provider (FetchZkConfigProvider)"
  patterns:
    - "Context + hook pattern: WalletProvider wraps app, useWalletContext() consumes state"
    - "Dynamic imports for WASM SDK packages (avoids SSR issues)"
    - "localStorage flag pattern for auto-reconnect (shadowpoll:autoconnect)"
    - "Truncated address display: first 6 + '...' + last 4 chars"

key-files:
  created:
    - lib/midnight/types.ts (ConnectionStatus, WalletState, WalletContextValue, MidnightProviderSet)
    - lib/midnight/use-wallet.ts (useWallet hook with detect/connect/disconnect/auto-reconnect)
    - lib/midnight/providers.ts (assembleProviders factory)
    - lib/midnight/wallet-context.tsx (WalletProvider + useWalletContext)
    - components/wallet-button.tsx (header wallet control)
    - components/install-prompt.tsx (full-page 1am.xyz install card)
    - components/wallet-onboarding.tsx (overlay dialog for onboarding states)
  modified: []

key-decisions:
  - "Provider types are any in Phase 1, tightened in Phase 3 with full midnight-js-types"
  - "assembleProviders() uses dynamic import() to prevent WASM packages from bundling at build time"
  - "Auto-reconnect uses localStorage key 'shadowpoll:autoconnect' set only on successful connect"
  - "WalletOnboarding is a fixed overlay (z-60) that self-shows/hides based on wallet status"
  - "indexerPublicDataProvider requires queryURL + subscriptionURL; subscriptionURL derived by converting https to wss"

patterns-established:
  - "Pattern: Dynamic import for WASM SDK packages inside async functions called only after user interaction"
  - "Pattern: Wallet state machine with 6 states: idle -> not_detected | disconnected -> connecting -> connected | error"
  - "Pattern: var(--token) CSS custom properties in all wallet UI components"

requirements-completed: [WALL-01, WALL-02, WALL-03, WALL-04, WALL-05, WALL-06, WALL-07]

duration: 40min
completed: 2026-04-08
---

# Phase 1 Plan 02: Wallet Integration Layer Summary

**Complete 1am.xyz wallet integration: detection, connect/disconnect, auto-reconnect, ZK provider assembly, and all wallet UI components satisfying all 7 WALL requirements.**

## Performance

- **Duration:** ~40 min
- **Completed:** 2026-04-08
- **Tasks:** 2 (wallet logic layer + wallet UI components)
- **Files modified:** 7

## Accomplishments

- Implemented full wallet state machine (idle to connected) with auto-reconnect via `shadowpoll:autoconnect` localStorage flag (WALL-01, 02, 03, 07)
- Built `assembleProviders()` factory with dynamic imports for `FetchZkConfigProvider` and `indexerPublicDataProvider` — avoids WASM bundling at build time (WALL-05)
- Created `WalletButton` with skeleton, connecting spinner, address pill (green dot + font-mono + first6...last4), and disconnect dropdown (WALL-04)

## Task Commits

1. **Task 1+2: Wallet integration layer + UI components** - `622cee1` (feat)

## Files Created/Modified

- `lib/midnight/types.ts` — ConnectionStatus union, WalletState, WalletContextValue, MidnightProviderSet
- `lib/midnight/use-wallet.ts` — useWallet hook: detect (WALL-01), connect (WALL-02), disconnect (WALL-03), auto-reconnect (WALL-07)
- `lib/midnight/providers.ts` — assembleProviders() with corrected indexerPublicDataProvider call (WALL-05)
- `lib/midnight/wallet-context.tsx` — WalletProvider + useWalletContext hook
- `components/wallet-button.tsx` — Header control: skeleton/CTA/address pill/dropdown
- `components/install-prompt.tsx` — Full-page install card for missing 1am.xyz (WALL-06)
- `components/wallet-onboarding.tsx` — Modal overlay for connecting/not_detected/error states

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] indexerPublicDataProvider requires 2 arguments, not 1**
- **Found during:** Task 1 (TypeScript type check)
- **Issue:** Plan example called `indexerPublicDataProvider(URL)` with 1 arg, but SDK type requires `(queryURL, subscriptionURL, webSocketImpl?)`
- **Fix:** Derived subscriptionURL by replacing https:// with wss:// on the indexer URL
- **Files modified:** `lib/midnight/providers.ts`
- **Commit:** 622cee1

**2. [Rule 2 - Security] Added typeof window guard in getWalletApi()**
- **Found during:** Task 1 (threat model T-02-01)
- **Issue:** Accessing window.midnight without SSR guard would throw on server
- **Fix:** Added `if (typeof window === "undefined") return null;` guard
- **Files modified:** `lib/midnight/use-wallet.ts`
- **Commit:** 622cee1

## Known Stubs

None — all wallet UI components render real state-driven content.

## Self-Check: PASSED

- `lib/midnight/use-wallet.ts` — FOUND
- `lib/midnight/wallet-context.tsx` — FOUND
- `components/wallet-button.tsx` — FOUND
- `622cee1` commit — FOUND
