# GSD Debug Knowledge Base

Resolved debug sessions. Used by `gsd-debugger` to surface known-pattern hypotheses at the start of new investigations.

---

## wallet-autoconnect-prompt-on-reload — Autoconnect overlay appears on every page reload despite silent extension reconnect
- **Date:** 2026-04-08
- **Error patterns:** autoconnect, approval dialog, connect, reload, wallet overlay, connecting, 1am, approve, extension
- **Root cause:** `connectInternal()` always set `status: "connecting"` regardless of whether triggered by user click or autoconnect-on-reload. `WalletOnboarding` showed a fullscreen "Check your 1am.xyz extension to approve" overlay any time `status === "connecting"` — even during silent autoconnects where the 1am extension reconnects already-authorized sites without any popup. The 1am wallet API exposes only a single `connect()` method with no separate silent/passive API, but the extension itself handles permission caching internally.
- **Fix:** Added `isAutoConnecting: boolean` field to `WalletState`. `connectInternal()` accepts `isAutoConnect` parameter (default false), set to `true` by the autoconnect-on-reload path. `WalletOnboarding` skips the overlay when `isAutoConnecting` is true (`status === "connecting" && !isAutoConnecting`).
- **Files changed:** lib/midnight/types.ts, lib/midnight/use-wallet.ts, components/wallet-onboarding.tsx
---

