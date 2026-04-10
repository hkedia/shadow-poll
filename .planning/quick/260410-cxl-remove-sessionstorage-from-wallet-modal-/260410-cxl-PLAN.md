---
must_haves:
  truths:
    - Remove all sessionStorage usage from wallet modal
    - Modal shows whenever status is not_detected or error
    - Dismissal is temporary only - modal reappears on navigation or re-render
    - Close button still works but doesn't persist state
    - No state persistence across page loads or navigation
  artifacts:
    - path: "components/wallet-onboarding.tsx"
      provides: "Wallet modal without sessionStorage persistence"
  key_links:
    - from: "wallet-onboarding.tsx"
      to: "useWalletContext()"
      via: "status determines modal visibility"
---

# Plan: Remove sessionStorage from Wallet Modal

## Goal
Remove sessionStorage persistence from the wallet error modal so it appears on every error state without remembering dismissal across navigation or page loads.

## Task 1: Remove sessionStorage Logic from WalletOnboarding
**Files:** `components/wallet-onboarding.tsx`

**Action:**
1. Remove the `useState` for `dismissed` that reads from sessionStorage
2. Remove the `useEffect` that syncs with sessionStorage
3. Remove the `handleDismiss` function's sessionStorage calls
4. Keep `dismissed` as local React state only (useState without initializer)
5. Simplify the modal to show whenever status matches, close button just sets local state
6. Remove all sessionStorage key references
7. Clean up unused imports if any

**Key Changes:**
- Remove `storageKey` constant
- Change `const [dismissed, setDismissed] = useState(() => {...})` to `const [dismissed, setDismissed] = useState(false)`
- Remove the `useEffect` that resets on storageKey change
- Simplify `handleDismiss` to just `setDismissed(true)` without sessionStorage
- Modal visibility: `isOpen = !dismissed && isModalStatus(status)` (but since component returns null early, just `!dismissed` in the modal component)

**Verify:**
- TypeScript compiles without errors
- No sessionStorage references remain in the file
- Modal still renders for not_detected and error states
- Close button dismisses the modal

**Done:**
- All sessionStorage logic removed
- Modal shows on every error state
- Dismissal is temporary only

## Task 2: Test in Chrome
**Files:** (manual testing)

**Action:**
1. Open Chrome with dev server running
2. Navigate to app without 1am wallet installed
3. Verify modal appears immediately
4. Dismiss modal by clicking X
5. Navigate to another route (e.g., /about, /active)
6. Verify modal reappears on the new route
7. Dismiss again
8. Refresh page
9. Verify modal appears again after refresh

**Verify:**
- Modal shows on initial load with error state
- Modal can be dismissed
- Modal reappears after navigation
- Modal reappears after page refresh
- No console errors

**Done:**
- Tested all scenarios successfully
