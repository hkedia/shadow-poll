---
status: resolved
trigger: "Investigate issue: wallet-autoconnect-prompt-on-reload - The app has autoconnect enabled for the 1am.xyz wallet, but every time the page is reloaded after approving a connection, the wallet pops up with another approval dialog instead of silently reconnecting."
created: 2026-04-08T00:00:00Z
updated: 2026-04-08T00:30:00Z
---

## Current Focus

hypothesis: CONFIRMED — The autoconnect flow correctly calls api.connect("preview") on reload, but the 1am wallet extension silently reconnects when already authorized (no popup). The real UX bug is the app's OWN "Connecting... Check your 1am.xyz extension to approve" overlay that appears during every auto-reconnect, even when the extension doesn't actually prompt. The text is misleading/alarming to users who didn't expect to approve anything. There may also be a secondary issue: on first load, the extension actually DOES prompt again if the wallet session has expired/been cleared.
test: Check WalletOnboarding component — it shows the modal whenever status="connecting", which is set at the start of connectInternal(). This means the "approval modal" users see is the APP's own UI overlay, not necessarily the extension popup. The fix needs to distinguish between first-time connect (show prompt message) vs autoconnect (show silent reconnect message or no overlay at all).
expecting: Fix = suppress or change the overlay behavior during autoconnect so it does NOT say "Check your 1am.xyz extension to approve the connection" — instead show "Reconnecting..." quietly or nothing.
next_action: Implement fix in use-wallet.ts and wallet-onboarding.tsx

## Symptoms

expected: After approving wallet connection once, reloading the page should silently reconnect without prompting for approval again (autoconnect is enabled)
actual: On every page reload, the 1am.xyz wallet extension shows an approval dialog asking the user to approve the connection again
errors: Console errors from wallet extension itself (content.js ERR_FAILED, Failed to fetch) — extension-internal, not app-level
reproduction: 1. Open app, 2. Click connect wallet, 3. Approve in 1am.xyz wallet extension, 4. Reload page → approval dialog appears again
started: Has never worked — autoconnect has always required re-approval on every reload since implementation

## Eliminated

(none yet)

## Evidence

- timestamp: 2026-04-08T00:10:00Z
  checked: window.midnight['1am'] API surface
  found: Only 5 properties: rdns, name, icon, apiVersion, connect. NO isConnected(), enable(), reconnect(), or silent-check method.
  implication: The ONLY way to reconnect is via api.connect() — there is no separate silent API.

- timestamp: 2026-04-08T00:11:00Z
  checked: connect() function source code from extension
  found: "async connect(i){const e=await o('ONEAM_CONNECT',{networkId:i});if(!e.authorized)throw m('Rejected',...); return p=!0,e.networkId,z()}"
  implication: The extension sends ONEAM_CONNECT message internally. If the origin is already authorized in the extension's permission store, it returns e.authorized=true WITHOUT showing a popup. The popup only appears for first-time authorization.

- timestamp: 2026-04-08T00:12:00Z
  checked: use-wallet.ts autoconnect flow
  found: When localStorage has shadowpoll:autoconnect=true, it calls connectInternal(api) which immediately sets status="connecting" then calls api.connect("preview"). The "connecting" status triggers the WalletOnboarding overlay.
  implication: The overlay ALWAYS shows on autoconnect, even when the extension will silently reconnect without prompting. The text says "Check your 1am.xyz extension to approve the connection" — misleading during silent reconnect.

- timestamp: 2026-04-08T00:13:00Z
  checked: WalletOnboarding component
  found: Shows overlay for status="connecting" | "not_detected" | "error". The "connecting" state shows: "Connecting... Check your 1am.xyz extension to approve the connection." — no distinction between first connect vs autoconnect.
  implication: Both first-time connect AND autoconnect show the same alarming "approve the connection" message, even though autoconnect is silent.

- timestamp: 2026-04-08T00:14:00Z
  checked: Actual browser behavior on reload
  found: After reload with autoconnect=true in localStorage, the "Connecting..." overlay appeared briefly, then the wallet connected successfully showing "mn_sh1...xchm" — no extension popup appeared.
  implication: The extension IS silently reconnecting (no approval dialog). The BUG is the app's own "Check your 1am.xyz extension to approve the connection" overlay text that appears even during silent reconnects, alarming the user.

- timestamp: 2026-04-08T00:15:00Z
  checked: use-wallet.ts connect() vs autoconnect path
  found: Both the user-initiated connect() and the autoconnect path call the same connectInternal() function, which always sets status="connecting" first. There is no way for WalletOnboarding to distinguish which scenario is happening.
  implication: Root cause confirmed. Need to add isAutoConnecting flag to WalletState so WalletOnboarding can show appropriate UI (silent reconnect = no overlay or quiet indicator, first connect = full "approve" message).

## Resolution

root_cause: The 1am wallet API only exposes a single `connect()` method — there is no separate silent/passive reconnection API. The extension itself silently reconnects already-authorized origins without showing a popup. However, `connectInternal()` always set `status: "connecting"` before calling `api.connect()`, and `WalletOnboarding` showed a fullscreen overlay with "Check your 1am.xyz extension to approve the connection" whenever `status === "connecting"`. This overlay appeared on every autoconnect-on-reload even though the extension wasn't prompting — giving users the false impression they needed to approve again.

fix: Added `isAutoConnecting: boolean` field to `WalletState`. `connectInternal()` now accepts an `isAutoConnect` parameter (default false) and sets `isAutoConnecting` on state. The autoconnect-on-reload path passes `true`. `WalletOnboarding` suppresses the overlay during autoconnect (`status === "connecting" && !isAutoConnecting`) — no overlay shown during silent reconnects. The overlay still appears correctly for user-initiated connects.

verification: 
  - Reload with autoconnect flag present: silently connects, no overlay (verified 3x)
  - Reload without flag: shows "Connect Midnight Wallet" button, no overlay
  - User clicks Connect: "Connecting... Check your 1am.xyz extension to approve" overlay appears correctly
  - After user-initiated connect: wallet connects successfully, autoconnect flag persists for next reload

files_changed:
  - lib/midnight/types.ts
  - lib/midnight/use-wallet.ts
  - components/wallet-onboarding.tsx
