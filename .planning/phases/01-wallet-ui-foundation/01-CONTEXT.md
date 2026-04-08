# Phase 1: Wallet & UI Foundation - Context

**Gathered:** 2026-04-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Connect the 1am.xyz wallet with full provider assembly and establish a dark-themed, responsive app shell using shadcn/ui components. Users can detect, install, connect, and disconnect the wallet, see their truncated address in the nav, and auto-reconnect on page refresh. All pages render in a polished dark theme and are usable on mobile screens.

Requirements: WALL-01, WALL-02, WALL-03, WALL-04, WALL-05, WALL-06, WALL-07, PAGE-04, PAGE-06

</domain>

<decisions>
## Implementation Decisions

### Wallet Connection UX
- **D-01:** Guided onboarding flow — full-page or large modal overlay that walks users through detecting, installing, and connecting the 1am.xyz wallet. Designed for first-time crypto users.
- **D-02:** Prominent install screen when 1am.xyz is not detected — dedicated screen/card explaining what 1am.xyz is, why it's needed, and linking to the extension store. Shown before anything else if wallet not detected.
- **D-03:** Inline error with retry on connection failure — error displayed within the connection flow/modal with retry button and troubleshooting tips (check network, refresh page). Not a toast or separate page.
- **D-04:** Address pill with dropdown when connected — truncated address shown as a pill/badge in the nav bar. Clicking opens dropdown with disconnect option and network info.

### App Shell & Navigation
- **D-05:** Top header bar layout — fixed header with logo, nav links, and wallet controls. Content area below. Standard Web3 dApp pattern.
- **D-06:** Minimal header for Phase 1 — logo/app name on left, wallet pill on right. No other nav links yet; those come in Phase 4 (Home, Create Poll, etc.).
- **D-07:** Hamburger menu on mobile — header collapses to logo + hamburger icon on small screens. Wallet controls accessible via hamburger drawer.
- **D-08:** Hero section landing page — before wallet connection, the main page shows a hero section explaining Shadow Poll's value prop (anonymous voting, ZK proofs) with a prominent "Connect Wallet" CTA that starts the guided onboarding.

### Dark Theme & Color System
- **D-09:** Dark-only theme — no light mode, no toggle. App is always dark. Matches the crypto/privacy app aesthetic and simplifies implementation.
- **D-10:** Zinc/neutral gray palette with violet/purple accent — neutral grays for backgrounds and text, violet/purple for interactive elements (buttons, links, focus rings, active states). Clean, professional, crypto-native feel.

### shadcn/ui Setup
- **D-11:** Install components as needed — only components required for Phase 1 (Button, DropdownMenu, Card, Sheet/Drawer, Badge, etc.). Additional components added in future phases as needed.
- **D-12:** Components directory at project root — `components/ui/` for shadcn/ui components, `components/` for custom app components. Standard shadcn/ui convention.
- **D-13:** Lib directory at project root — `lib/` for utilities, hooks (wallet hook, provider factory), and SDK integration code. Accessible via `@/lib/`.

### Agent's Discretion
- Loading skeleton and spinner design
- Exact spacing, typography scale, and font sizes beyond Geist defaults
- Exact violet/purple shade selection within the palette
- Onboarding flow step count and copy
- Error message wording and troubleshooting tips
- Provider assembly implementation details (WALL-05)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Wallet Integration
- `.planning/REQUIREMENTS.md` — WALL-01 through WALL-07: wallet detection, connection, disconnect, status display, provider assembly, install prompt, auto-reconnect
- `.planning/PROJECT.md` §Context — 1am.xyz wallet API details (`window.midnight['1am']`), provider architecture (ZK config, indexer, wallet, proof providers)

### UI & Theme
- `.planning/REQUIREMENTS.md` — PAGE-04: shadcn/ui dark theme, PAGE-06: responsive mobile layout
- `.planning/PROJECT.md` §Key Decisions — shadcn/ui with dark theme decision

### Midnight SDK
- `.planning/codebase/STACK.md` §Key Dependencies — Full list of installed `@midnight-ntwrk/*` packages with versions
- `.planning/codebase/INTEGRATIONS.md` §Midnight Network — SDK package details, planned integration architecture

### Codebase Patterns
- `.planning/codebase/CONVENTIONS.md` — Naming, code style, component patterns, import organization
- `.planning/codebase/STRUCTURE.md` §Where to Add New Code — File placement conventions for components, lib, API routes

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/layout.tsx`: Root layout with Geist Sans/Mono fonts loaded as CSS variables. Will be extended with dark theme class and wallet provider wrapper.
- `app/globals.css`: Tailwind v4 imported with basic CSS custom properties for background/foreground. Will be overhauled for dark-only theme with violet accent tokens.
- Geist font family already configured — no additional font setup needed.

### Established Patterns
- Next.js 16 App Router with server components by default. Client components need `"use client"` directive.
- TypeScript strict mode with `import type` convention.
- `@/*` path alias maps to project root.
- Tailwind v4 with `@theme inline` for custom properties.

### Integration Points
- `app/layout.tsx` — needs wallet context provider wrapping `{children}`, dark theme class on `<html>`
- `app/page.tsx` — will be replaced with hero landing page + wallet connection CTA
- `components/ui/` — new directory for shadcn/ui components
- `lib/midnight/` — new directory for wallet hook, provider factory, and SDK utilities
- `next.config.ts` — may need WASM/WebAssembly config for Midnight SDK packages

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. The guided onboarding flow should feel welcoming to users who may be new to crypto wallets, not just developers.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-wallet-ui-foundation*
*Context gathered: 2026-04-08*
