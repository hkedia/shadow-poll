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

## nav-highlight-and-stats-error — Nav active state wrong on home page; stats page throws "expected instance of ChargedState"
- **Date:** 2026-04-09
- **Error patterns:** active, nav, highlight, home, trending, ChargedState, expected instance of ChargedState, parseLedger, queryContractState, stats, ledger
- **Root cause:** (1) Nav: Home (`/`) was not in the links array; the `isActive` logic incorrectly special-cased `pathname === "/"` as active for `/trending`. (2) Stats/ledger: `queryContractState()` returns a `ContractState` object, but `parseLedger()` expects `StateValue | ChargedState`. The code passed the raw `ContractState` directly — `ContractState.data` is the `ChargedState`, not `ContractState` itself. `QueryContext` constructor throws "expected instance of ChargedState" when given `ContractState`.
- **Fix:** (1) Added Home `{ href: "/", label: "Home" }` entry to both `header-nav.tsx` and `mobile-drawer.tsx`; changed `isActive` for `"/"` to `pathname === "/"` only. (2) Changed all `parseLedger(state as any)` → `parseLedger(state.data)` across 4 call sites. Updated `IndexerPublicDataProvider.queryContractState` return type to `Promise<ContractState | null>`.
- **Files changed:** components/header-nav.tsx, components/mobile-drawer.tsx, lib/midnight/contract-service.ts, lib/midnight/types.ts, lib/queries/use-stats.ts, lib/queries/use-participation-proof.ts, lib/queries/use-verify-proof.ts
---

## wallet-modal-session-persistence — Wallet error modal dismissed permanently due to sessionStorage, never reappears after navigation or refresh
- **Date:** 2026-04-10
- **Error patterns:** wallet, modal, sessionStorage, dismissed, navigation, route, error, not_detected, connect
- **Root cause:** The wallet error modal used `sessionStorage` to persist dismissal state with keys like `wallet-modal-dismissed-${status}`. Session storage persists across page reloads in the same tab, so once dismissed, the modal never reappeared even after navigation to new routes or page refresh. This was problematic because users who dismissed the modal on one page would never see it again when navigating to another page that also requires wallet connection.
- **Fix:** Removed all sessionStorage usage from `wallet-onboarding.tsx`. Changed to use local React state only (`useState(false)`). Added `useEffect` to reset dismissed state when the error status changes. Modal now appears whenever there's an error state (`not_detected`, `error`) and can be dismissed temporarily, but will reappear on new navigation or if user tries to connect again.
- **Files changed:** components/wallet-onboarding.tsx
---

