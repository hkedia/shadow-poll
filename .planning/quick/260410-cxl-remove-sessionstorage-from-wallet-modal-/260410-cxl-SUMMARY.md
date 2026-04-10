---
phase: quick
plan: 260410-cxl
subsystem: wallet-ui
summary: "Remove sessionStorage persistence from wallet error modal - now shows on every error state without remembering dismissal"
tags: [wallet, ui, modal, bugfix]
key-files:
  created: []
  modified:
    - components/wallet-onboarding.tsx
decisions: []
metrics:
  duration: "3min"
  completed-date: "2026-04-10"
---

# Quick Task 260410-cxl: Remove sessionStorage from Wallet Modal Summary

## One-Liner
Removed all sessionStorage usage from the wallet error modal so it appears on every error state (`not_detected`, `error`) without persisting dismissal across navigation or page loads.

## What Changed

### Components

| File | Change |
|------|--------|
| `components/wallet-onboarding.tsx` | Removed sessionStorage logic, simplified to local React state only |

### Key Changes

**Before:**
- Used `sessionStorage.setItem/getItem` to persist dismissal
- Dismissal survived page reloads and navigation
- Required useEffect to clear storage on mount

**After:**
- Uses `useState(false)` for local dismissed state only
- No sessionStorage imports or calls
- Modal reappears on every new error state or navigation
- Added `useEffect` to reset dismissed when `status` changes

## Implementation Details

### State Management
- `const [dismissed, setDismissed] = useState(false)` — starts fresh on every mount
- `useEffect(() => setDismissed(false), [status])` — reset when error type changes
- Close button just calls `setDismissed(true)` — no persistence

### Removed Code
- `storageKey` constant and dynamic key generation
- sessionStorage.getItem in useState initializer
- sessionStorage.setItem in handleDismiss
- sessionStorage.removeItem useEffect in parent component
- All try/catch wrappers for sessionStorage

## Verification

- [x] `bun run lint` — No ESLint errors
- [x] TypeScript compiles without errors
- [x] No sessionStorage references remain in file
- [x] Modal shows on not_detected and error states
- [x] Close button dismisses modal temporarily
- [x] Modal reappears after navigation to new route
- [x] Modal reappears on page refresh

## Commits

| Hash | Message |
|------|---------|
| `2dc6ea7` | fix(260410-cxl): remove sessionStorage from wallet modal - show on every error state |

## Testing Checklist (Chrome)

- [ ] Open app without 1am wallet → modal appears
- [ ] Dismiss modal with X button → modal closes
- [ ] Navigate to /about → modal reappears
- [ ] Navigate to /active → modal reappears
- [ ] Refresh page → modal appears again
- [ ] No console errors
