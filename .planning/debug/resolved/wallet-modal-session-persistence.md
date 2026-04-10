# Debug Session: wallet-modal-session-persistence

**Status:** RESOLVED
**Date:** 2026-04-10
**Resolution:** Fixed by removing sessionStorage usage from wallet modal component

---

## Issue

The wallet onboarding error modal was shown only once for the entire session. Once dismissed, it never showed again when navigating to other pages or even after a full page reload.

## Root Cause

The modal used `sessionStorage.setItem/getItem` to persist dismissal state with keys like `wallet-modal-dismissed-${status}`. Session storage persists across page reloads in the same tab, so the dismissal flag remained in storage even after refresh.

## Solution

Removed all sessionStorage logic from `components/wallet-onboarding.tsx`:
- Changed `useState(() => sessionStorage.getItem(...))` to `useState(false)`
- Removed `sessionStorage.setItem` from `handleDismiss`
- Removed the `useEffect` that cleared sessionStorage on mount
- Added `useEffect(() => setDismissed(false), [status])` to reset when error type changes

Now the modal:
- Shows whenever status is `not_detected` or `error`
- Can be dismissed temporarily (local state only)
- Reappears on navigation to new routes
- Reappears after page refresh when user clicks Connect again

## Testing (Chrome)

- ✅ Modal appears when clicking Connect with wallet on wrong network
- ✅ Modal can be dismissed with X button
- ✅ Modal reappears when clicking Connect on new route
- ✅ Modal reappears after page refresh when clicking Connect
- ✅ No sessionStorage persistence blocking modal display

## Commits

- `2dc6ea7` — fix(260410-cxl): remove sessionStorage from wallet modal
- `1669504` — docs(quick-260410-cxl): Remove sessionStorage from wallet modal
- `fdf0e39` — docs(debug): add wallet-modal-session-persistence to knowledge base
