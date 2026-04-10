---
phase: quick
plan: 01
subsystem: wallet
tags: [wallet, autoconnect, ux, cleanup]
dependency_graph:
  requires: []
  provides: [clean-wallet-disconnect-state]
  affects: [use-wallet, wallet-context, wallet-onboarding, create-route, poll-detail-route]
tech_stack:
  added: []
  patterns: [explicit-connect-only]
key_files:
  created: []
  modified:
    - lib/midnight/use-wallet.ts
    - lib/midnight/wallet-context.tsx
    - lib/midnight/types.ts
    - components/wallet-onboarding.tsx
    - src/routes/create.tsx
    - src/routes/poll-detail.tsx
decisions:
  - Removed entire autoconnect feature — every page reload now starts disconnected, requiring explicit user Connect click
  - WalletOnboarding overlay now shows for all connecting/error/not_detected states without suppression
metrics:
  duration: 5min
  completed: 2026-04-10
---

# Quick Task 260410-9xs: Remove Wallet Autoconnect Feature Summary

Removed the wallet autoconnect feature so every page reload requires explicit user Connect action — no silent reconnection on refresh.

## Changes Made

### Task 1: Remove autoconnect logic from wallet hook and context
- **lib/midnight/use-wallet.ts**: Removed `AUTO_CONNECT_KEY` constant, `isAutoConnecting` state, `isAutoConnect` parameter from `connectInternal`, `triggerAutoConnect` function, localStorage reads/writes in `disconnect`, `isAutoConnecting` from return object
- **lib/midnight/wallet-context.tsx**: Removed `WalletAutoConnect` component entirely, removed `useEffect` import (no longer used)
- **lib/midnight/types.ts**: Removed `isAutoConnecting: boolean` from `WalletState`, removed `triggerAutoConnect: () => Promise<void>` from `WalletContextValue`

### Task 2: Remove WalletAutoConnect usages from routes and update WalletOnboarding
- **src/routes/create.tsx**: Removed `WalletAutoConnect` import and JSX
- **src/routes/poll-detail.tsx**: Removed `WalletAutoConnect` from import, removed all 4 JSX usages
- **components/wallet-onboarding.tsx**: Removed `isAutoConnecting` from destructuring, simplified `showOverlay` logic to always show for connecting state

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- `bun run build` succeeds with no TypeScript errors
- `grep -r "WalletAutoConnect\|isAutoConnecting\|triggerAutoConnect\|AUTO_CONNECT_KEY"` returns zero matches across all source files
- Every page reload now starts in disconnected state; wallet never auto-reconnects

## Self-Check: PASSED

- All 6 modified files exist and contain expected changes
- Both commits exist: `8ba5b81` and `226ca5f`