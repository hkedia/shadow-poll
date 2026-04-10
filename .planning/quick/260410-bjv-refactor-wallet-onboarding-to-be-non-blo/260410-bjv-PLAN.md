---
phase: quick/260410-bjv
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/wallet-onboarding.tsx
  - src/app.tsx
  - src/routes/create.tsx
  - src/routes/home.tsx
  - components/install-prompt.tsx
autonomous: true
requirements:
  - QT-260410-bjv-01
must_haves:
  truths:
    - "User can dismiss the wallet onboarding banner and continue browsing the app"
    - "Wallet onboarding shows for all wallet states (not_detected, disconnected, error) across every page"
    - "Homepage no longer replaces content with InstallPrompt — shows landing content with banner"
    - "Create poll page content is visible even without wallet connected"
  artifacts:
    - path: "components/wallet-onboarding.tsx"
      provides: "Dismissible WalletOnboarding banner component with all wallet states"
      min_lines: 40
    - path: "src/app.tsx"
      provides: "App-level WalletOnboarding mount inside WalletProvider"
      contains: "WalletOnboarding"
    - path: "components/install-prompt.tsx"
      provides: "Deleted file (folded into WalletOnboarding)"
  key_links:
    - from: "src/app.tsx"
      to: "components/wallet-onboarding.tsx"
      via: "import + JSX"
      pattern: "import.*WalletOnboarding"
    - from: "components/wallet-onboarding.tsx"
      to: "lib/midnight/wallet-context.tsx"
      via: "useWalletContext hook"
      pattern: "useWalletContext"
---

<objective>
Refactor WalletOnboarding from a page-level blocking overlay into an app-wide dismissible banner that handles all wallet states gracefully.

Purpose: Current wallet onboarding blocks the create page entirely and cannot be dismissed. The homepage has a separate InstallPrompt that replaces all content. Other pages show nothing. This refactoring unifies all wallet state handling into a single, non-blocking, dismissible component at the app level.

Output: Single dismissible WalletOnboarding banner mounted at app level; InstallPrompt removed; create.tsx simplified; home.tsx shows landing content always.
</objective>

<execution_context>
@$HOME/.config/opencode/get-shit-done/workflows/execute-plan.md
@$HOME/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md

<interfaces>
From lib/midnight/types.ts:
```typescript
export type ConnectionStatus =
  | "idle"           // initial state before detection
  | "not_detected"   // 1am.xyz extension not found
  | "disconnected"   // extension found, not connected
  | "connecting"     // connection in progress
  | "connected"      // connected, address available
  | "error";         // connection failed

export interface WalletContextValue extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  isDetected: boolean;
}
```

From lib/midnight/wallet-context.tsx:
```typescript
export function WalletProvider({ children }: { children: ReactNode })
export function useWalletContext(): WalletContextValue
```

From components/wallet-button.tsx:
```typescript
export function WalletButton() // already handles connecting/disconnected states inline
```

From src/app.tsx (current structure):
```tsx
<WalletProvider>
  <QueryProvider>
    <ScrollToTop />
    <div className="flex flex-col min-h-screen">
      <Header walletSlot={<WalletButton />} />
      <main>...</main>
      <Footer />
    </div>
  </QueryProvider>
</WalletProvider>
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Rewrite WalletOnboarding as dismissible app-wide banner</name>
  <files>components/wallet-onboarding.tsx</files>
  <behavior>
    - Test 1: Given status "not_detected", renders install prompt with link to 1am.xyz and dismiss button
    - Test 2: Given status "error", renders error message with retry button and dismiss button
    - Test 3: Given status "disconnected", renders "Connect wallet" prompt with connect button and dismiss button
    - Test 4: Given status "connected" or "idle", renders nothing
    - Test 5: After dismissing a state, banner stays hidden for that state (sessionStorage)
    - Test 6: Banner reappears if wallet state changes (e.g., error → disconnected)
  </behavior>
  <action>
Rewrite `components/wallet-onboarding.tsx` to be a dismissible banner (NOT a full-screen overlay):

1. **Remove `requiresWallet` prop** — component now lives at app level and always evaluates wallet state.

2. **Render logic**: Read `status`, `error`, `connect` from `useWalletContext()`. Only show when `status` is `not_detected`, `disconnected`, or `error`. Return `null` for `idle`, `connecting`, `connected`.

3. **Dismissal**: Use `useState` + `sessionStorage` keyed by `wallet-banner-dismissed-{status}` so:
   - Dismissing `not_detected` hides the install prompt until new session
   - Dismissing `error` hides the error until new session
   - Dismissing `disconnected` hides the connect prompt until new session
   - When status changes to a different non-connected state, the banner for the NEW state appears (e.g., dismissed "not_detected" → user installs wallet → "disconnected" shows)

4. **Layout**: Use a sticky top-positioned banner (NOT `fixed inset-0` full overlay):
   ```
   <div role="alert" className="sticky top-20 z-40 ...">
     ...banner content...
   </div>
   ```
   Position it as `sticky top-20` so it sits below the `<Header>` (which is fixed at top-0 h-20). Use `z-40` (below modal z-50 but above content). The banner should have:
   - Dark background matching the Aether design: `bg-surface-container-low ring-1 ring-outline-variant`
   - Rounded bottom corners: `rounded-b-xl`
   - Horizontal padding and centered content maxWidth
   - Close/dismiss button (X icon) on the right

5. **State-specific content**:
   - `not_detected`: Wallet icon + "1am.xyz Wallet Required" heading + "Install extension" description + "Install 1am.xyz" link button (external, opens 1am.xyz) + "Already installed? Refresh" ghost button (same as current, but inline). Dismiss button on right.
   - `disconnected`: Wallet icon + "Connect Your Wallet" heading + "Connect your 1am.xyz wallet to create polls and vote." description + "Connect Wallet" primary button (calls `connect()`). Dismiss button on right.
   - `error`: Error icon + "Connection Failed" heading (error color) + error message (from `error` prop, with fallback) + "Try Again" primary button (calls `connect()`). Dismiss button on right. Include the troubleshooting `<details>` from the current overlay.

6. **Remove the `StepDots` component** — it's not needed in a banner pattern.

7. **Remove all Card/CardContent imports** — the banner is a custom div, not a shadcn Card.

8. **Keep existing icon SVGs** (wallet icon, error circle icon) from the current component — reuse them in the banner.

9. **Transition**: Add `transition-all duration-300` to the outer div. When visible, render. When dismissed, render `null`. No animation library needed — keep it simple.
  </action>
  <verify>
    <automated>cd /home/hkedia/Code/ourobeam/shadow-poll && grep -c "requiresWallet" components/wallet-onboarding.tsx && echo "--- Check no requiresWallet prop ---" && grep -c "fixed inset-0" components/wallet-onboarding.tsx && echo "--- Check no full-screen overlay ---" && grep -c "sticky" components/wallet-onboarding.tsx && echo "--- Check sticky positioning ---" && grep "sessionStorage" components/wallet-onboarding.tsx | head -5 && echo "--- Check sessionStorage usage ---"</automated>
  </verify>
  <done>
    - WalletOnboarding renders as a dismissible sticky banner (not full-screen overlay)
    - No `requiresWallet` prop — always evaluates wallet state from context
    - Uses sessionStorage for per-state dismissal persistence
    - Handles all wallet states: not_detected, disconnected, error, connected (hidden), idle (hidden)
    - Includes connect/retry CTA buttons and dismiss (X) button
  </done>
</task>

<task type="auto">
  <name>Task 2: Wire app-level WalletOnboarding and remove legacy code</name>
  <files>src/app.tsx, src/routes/create.tsx, src/routes/home.tsx, components/install-prompt.tsx</files>
  <action>
**Step 1: Add WalletOnboarding to app.tsx**

In `src/app.tsx`:
- Add `import { WalletOnboarding } from "@/components/wallet-onboarding";`
- Place `<WalletOnboarding />` inside `<WalletProvider>` but above the main content div, specifically between `<ScrollToTop />` and the `<div className="flex flex-col min-h-screen">`:
  ```tsx
  <WalletProvider>
    <QueryProvider>
      <ScrollToTop />
      <WalletOnboarding />
      <div className="flex flex-col min-h-screen">
  ```
  This puts the banner at the app level so it appears on ALL pages.

**Step 2: Remove WalletOnboarding from create.tsx**

In `src/routes/create.tsx`:
- Remove `import { WalletOnboarding } from "@/components/wallet-onboarding";`
- Remove both `<WalletOnboarding requiresWallet />` lines (lines 8 and 9, the duplicate)
- The component now renders its content freely without blocking — wallet onboarding is handled at app level

**Step 3: Remove InstallPrompt from home.tsx**

In `src/routes/home.tsx`:
- Remove `import { InstallPrompt } from "@/components/install-prompt";`
- Remove the `const { status } = useWalletContext();` line (no longer needed — WalletOnboarding handles it)
- Remove the `import { useWalletContext } from "@/lib/midnight/wallet-context";` import (if unused after removing the status check)
- Remove the conditional: `if (status === "not_detected") { return <InstallPrompt />; }`
- Simplify `HomePage` to always render `<LandingContent />`:
  ```tsx
  export default function HomePage() {
    return <LandingContent />;
  }
  ```

**Step 4: Delete components/install-prompt.tsx**

Delete the file `components/install-prompt.tsx` entirely — its content is now handled by WalletOnboarding's `not_detected` state.
  </action>
  <verify>
    <automated>cd /home/hkedia/Code/ourobeam/shadow-poll && echo "--- app.tsx has WalletOnboarding ---" && grep -c "WalletOnboarding" src/app.tsx && echo "--- create.tsx has no WalletOnboarding ---" && grep -c "WalletOnboarding" src/routes/create.tsx || echo "0" && echo "--- home.tsx has no InstallPrompt ---" && grep -c "InstallPrompt" src/routes/home.tsx || echo "0" && echo "--- install-prompt.tsx deleted ---" && test ! -f components/install-prompt.tsx && echo "DELETED" || echo "STILL EXISTS"</automated>
  </verify>
  <done>
    - WalletOnboarding mounted at app level in app.tsx (inside WalletProvider)
    - create.tsx no longer imports or renders WalletOnboarding (content visible without wallet)
    - home.tsx always shows LandingContent (no conditional InstallPrompt)
    - components/install-prompt.tsx deleted
    - All pages get wallet state banners automatically from app level
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Wallet state → UI | Wallet connection status drives UI visibility — must not leak private data |
| sessionStorage → Banner state | Dismissal state stored client-side only — no server transmission |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-bjv-01 | I | WalletOnboarding | accept | No PII in banner — only displays wallet status (not_detected/disconnected/error), never address or keys |
| T-bjv-02 | S | sessionStorage | accept | Dismiss state is non-sensitive UX preference, not security-relevant |
</threat_model>

<verification>
1. `bun run build` passes with no type errors
2. `bun run lint` passes
3. No references to `InstallPrompt` remain in any file
4. No references to `requiresWallet` prop remain in WalletOnboarding
5. `WalletOnboarding` appears in `app.tsx` and nowhere else in routes
6. Manual: visit app without wallet → see dismissible banner, dismiss it → banner gone, refresh → banner returns
7. Manual: visit /create without wallet → see page content (not blocked), see banner
</verification>

<success_criteria>
- Wallet onboarding banner is visible app-wide for not_detected, disconnected, and error wallet states
- Banner is dismissible via X button; dismissal persists per-session per-state via sessionStorage
- Banner is sticky below header, not a full-screen overlay
- Create poll page content is accessible even without wallet (banner is non-blocking)
- Home page always renders landing content (never replaced by InstallPrompt)
- InstallPrompt component deleted
- `bun run build` and `bun run lint` pass
</success_criteria>

<output>
After completion, create `.planning/quick/260410-bjv-refactor-wallet-onboarding-to-be-non-blo/260410-bjv-SUMMARY.md`
</output>