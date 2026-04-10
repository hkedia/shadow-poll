---
phase: quick
plan: 260410-d7c
subsystem: wallet-ui
summary: "Fix wallet detection to show modal instantly when no wallet detected by checking window.midnight synchronously"
tags: [wallet, detection, modal, performance]
key-files:
  created: []
  modified:
    - lib/midnight/use-wallet.ts
decisions: []
metrics:
  duration: "3min"
  completed-date: "2026-04-10"
---

# Quick Task 260410-d7c: Fix Wallet Detection Summary

## One-Liner
Fixed wallet detection to check `window.midnight['1am']` synchronously instead of polling for 5 seconds, making the "1am wallet required" modal appear instantly when no wallet is detected.

## What Changed

### Core Logic

| Before | After |
|--------|-------|
| Polling: 50 attempts × 100ms = 5 second delay | Instant: synchronous window check |
| Status changed to "connecting" only after detection | Status changes to "connecting" immediately on click |

### Files

| File | Change |
|------|--------|
| `lib/midnight/use-wallet.ts` | Simplified `detectWallet()` to check synchronously, added immediate "connecting" state in `connect()` |

## Implementation Details

### detectWallet() Function
**Before:**
```typescript
function detectWallet(): Promise<unknown | null> {
  return new Promise((resolve) => {
    const wallet = (window as any)?.midnight?.["1am"];
    if (wallet) { resolve(wallet); return; }
    let attempts = 0;
    const interval = setInterval(() => {
      const w = (window as any)?.midnight?.["1am"];
      if (w) { clearInterval(interval); resolve(w); }
      else if (++attempts > 50) { clearInterval(interval); resolve(null); }
    }, 100);
  });
}
```

**After:**
```typescript
function detectWallet(): Promise<unknown | null> {
  return new Promise((resolve) => {
    const wallet = (window as any)?.midnight?.["1am"];
    resolve(wallet || null);
  });
}
```

### connect() Function
Added immediate state change:
```typescript
const connect = useCallback(async () => {
  if (typeof window === "undefined") return;
  // Set connecting state immediately for better UX
  setState((s) => ({ ...s, status: "connecting", error: null }));
  const walletApi = await detectWallet();
  if (!walletApi) {
    setState((s) => ({ ...s, status: "not_detected" }));
    return;
  }
  await connectInternal(walletApi);
}, [connectInternal]);
```

## Verification

- [x] `bun run lint` — No ESLint errors
- [x] TypeScript compiles without errors
- [x] Chrome test: Modal appears instantly (< 100ms) when clicking Connect
- [x] Chrome test: Modal reappears instantly when clicking Connect again after dismissal
- [x] No 5-second polling delay

## Chrome Test Results

**Scenario:** 1am extension disabled, clicked "Connect Midnight Wallet"

**Result:** ✅ Modal "1am.xyz Wallet Required" appeared instantly

**Video evidence:**
1. Click Connect → Modal appears immediately (no delay)
2. Dismiss modal → Modal closes
3. Click Connect again → Modal reappears immediately

## Commits

| Hash | Message |
|------|---------|
| `252d117` | fix(260410-d7c): detect wallet synchronously for instant modal display |

## References

- 1am.xyz detection pattern: https://1am.xyz/ai.txt
- The wallet extension injects synchronously on page load, so immediate check is sufficient
