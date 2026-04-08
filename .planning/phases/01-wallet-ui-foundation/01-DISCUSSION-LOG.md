# Phase 1: Wallet & UI Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-08
**Phase:** 01-wallet-ui-foundation
**Areas discussed:** Wallet connection UX, App shell & navigation, Dark theme & color system, shadcn/ui setup approach

---

## Wallet Connection UX

| Option | Description | Selected |
|--------|-------------|----------|
| Guided onboarding flow | Full-page or large modal overlay that walks the user through detecting, installing, and connecting | ✓ |
| Simple connect button | Single "Connect Wallet" button in nav that opens a compact modal/dropdown | |
| Inline header widget | No modal -- inline status in header that expands to show connect/disconnect | |

**User's choice:** Guided onboarding flow
**Notes:** Preferred for first-time crypto users

| Option | Description | Selected |
|--------|-------------|----------|
| Prominent install screen | Dedicated screen/card explaining what 1am.xyz is, links to extension store | ✓ |
| Non-blocking banner | Banner or toast at top of page with install link | |
| On-demand prompt | Only show install prompt when user clicks connect | |

**User's choice:** Prominent install screen
**Notes:** Shows before anything else if wallet not detected

| Option | Description | Selected |
|--------|-------------|----------|
| Inline error with retry | Error within connection flow/modal with retry button and troubleshooting tips | ✓ |
| Toast notification | Toast that auto-dismisses after a few seconds | |
| Error help page | Redirect to dedicated error/help page | |

**User's choice:** Inline error with retry
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Address pill with dropdown | Truncated address as pill/badge in nav, clicking opens dropdown with disconnect | ✓ |
| Plain text address | Just truncated address as plain text with separate disconnect link | |
| Identicon avatar | Avatar generated from address, address shown on hover/click | |

**User's choice:** Address pill with dropdown
**Notes:** None

---

## App Shell & Navigation

| Option | Description | Selected |
|--------|-------------|----------|
| Top header bar | Fixed top header with logo, nav links, wallet controls. Content below. | ✓ |
| Left sidebar + header | Collapsible left sidebar with nav links, header for wallet | |
| Bottom tabs (mobile-first) | Bottom tab bar for mobile, top header for wallet only | |

**User's choice:** Top header bar
**Notes:** Standard Web3 dApp pattern

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal: logo + wallet only | Logo/app name left, wallet pill right. No other nav links yet. | ✓ |
| Placeholder nav links | Logo, greyed out nav links (Home, Create, Stats), wallet pill | |
| Logo + wallet + info link | Logo, wallet pill, plus 'About' or 'How it works' link | |

**User's choice:** Minimal: logo + wallet only
**Notes:** Nav links come in Phase 4

| Option | Description | Selected |
|--------|-------------|----------|
| Hamburger menu | Header collapses to logo + hamburger menu. Wallet controls in drawer. | ✓ |
| Stacked header | Header stacks vertically on small screens | |
| Compact horizontal | Header stays horizontal but smaller, wallet shrinks to icon | |

**User's choice:** Hamburger menu
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Hero + CTA | Hero section explaining value prop with prominent 'Connect Wallet' CTA | ✓ |
| Minimal splash | Just app name, tagline, and connect button | |
| You decide | Agent decides landing page layout | |

**User's choice:** Hero + CTA
**Notes:** None

---

## Dark Theme & Color System

| Option | Description | Selected |
|--------|-------------|----------|
| Dark-only | App is always dark. No toggle. | ✓ |
| Dark default + light toggle | Default dark with optional light mode toggle | |
| OS preference + toggle | Follow prefers-color-scheme with manual toggle | |

**User's choice:** Dark-only
**Notes:** Matches crypto/privacy aesthetic, simpler to maintain

| Option | Description | Selected |
|--------|-------------|----------|
| Neutral + single accent | Zinc/neutral grays with single accent for interactive elements | ✓ |
| Deep blue + cyan accent | Deep blue/indigo backgrounds with cyan/teal accents | |
| True black + bright accent | Pure black backgrounds with high-contrast bright accent | |

**User's choice:** Neutral + single accent
**Notes:** Clean, professional

| Option | Description | Selected |
|--------|-------------|----------|
| Violet/purple | Common in crypto/privacy apps, conveys trust | ✓ |
| Emerald/green | Signals success and growth | |
| Blue | Safe, professional, universally trusted | |
| You decide | Agent chooses what looks best | |

**User's choice:** Violet/purple
**Notes:** None

---

## shadcn/ui Setup Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Install as needed | Only Phase 1 components (Button, DropdownMenu, Card, Sheet, Badge) | ✓ |
| Bulk install common set | Broad set upfront for future phases | |
| You decide | Agent decides based on Phase 1 requirements | |

**User's choice:** Install as needed
**Notes:** Additional components added per phase

| Option | Description | Selected |
|--------|-------------|----------|
| components/ at root | shadcn/ui default: components/ui/ for shadcn, components/ for custom | ✓ |
| app/_components/ | Co-located with App Router | |
| src/components/ | Separation between source and config | |

**User's choice:** components/ at root
**Notes:** Standard shadcn/ui convention

| Option | Description | Selected |
|--------|-------------|----------|
| lib/ at root | Standard convention for utilities, hooks, SDK integration | ✓ |
| app/_lib/ | Co-located under App Router | |
| src/lib/ | Under src/ directory | |

**User's choice:** lib/ at root
**Notes:** Accessible via @/lib/

---

## Agent's Discretion

- Loading skeleton and spinner design
- Exact spacing, typography scale, and font sizes
- Exact violet/purple shade selection
- Onboarding flow step count and copy
- Error message wording and troubleshooting tips
- Provider assembly implementation details

## Deferred Ideas

None — discussion stayed within phase scope.
