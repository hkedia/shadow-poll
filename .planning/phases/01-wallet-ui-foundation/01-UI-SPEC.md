---
phase: 1
slug: wallet-ui-foundation
status: approved
shadcn_initialized: true
preset: custom (Aether Privacy design system)
created: 2026-04-08
updated: 2026-04-08
---

# Phase 1 — UI Design Contract

> Visual and interaction contract for the wallet connection and app shell phase. Updated to match design mockups in `.design/`. Approved by gsd-ui-checker — 6/6 dimensions passed.

---

## Design Source

Design mockups are in `.design/` and serve as the canonical visual reference:

| Screen | Files | Phase Relevance |
|--------|-------|-----------------|
| `aether_privacy/DESIGN.md` | Design system tokens | Phase 1 (design system setup) |
| `create_poll/` | `screen.png`, `code.html` | Phase 4 (reference only — establishes shared shell, header, footer patterns) |
| `view_poll/` | `screen.png`, `code.html` | Phase 4 (reference only — establishes shared shell, header, footer patterns) |
| `trending_polls/` | `screen.png`, `code.html` | Phase 4 (reference only — establishes shared shell, header, footer patterns) |

Phase 1 implements: header shell, footer shell, wallet connection button, hero landing page, color system, typography, and the design token foundation that future phases build on.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | shadcn (v4, custom theme — not a built-in preset) |
| Component library | Radix UI primitives (via shadcn) |
| Icon library | Material Symbols Outlined (Google Fonts, variable weight/fill) |
| Headlines font | Manrope (Google Fonts) — `font-headline` |
| Body/Label font | Plus Jakarta Sans (Google Fonts) — `font-body`, `font-label` |
| Monospace font | Geist Mono (already loaded) — wallet addresses only |
| Color system | Material Design 3 surface hierarchy adapted for dark-only theme |

**Font loading:** Replace Geist Sans with Manrope + Plus Jakarta Sans via `next/font/google`. Keep Geist Mono for wallet addresses.

**Icon setup:** Load Material Symbols Outlined via Google Fonts link or self-hosted. Configure font-variation-settings: `'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24` as defaults. Use `'FILL' 1` for filled variants (wallet icon in CTA, shield icons).

**shadcn config** (`components.json`):
- Style: custom (not radix-nova — use custom theme aligned with Aether design)
- RSC: `true`
- TypeScript: `true`
- CSS variables: `true`
- Aliases: `@/components`, `@/components/ui`, `@/lib`, `@/hooks`

---

## Spacing Scale

Declared values (multiples of 4 only):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, inline padding between icon and label |
| sm | 8px | Compact element spacing, pill internal padding, gap between nav items |
| md | 16px | Default element spacing, card internal padding, button horizontal padding |
| lg | 24px | Section padding, header vertical padding, card padding (p-6) |
| xl | 32px | Layout gaps between major sections, card padding (p-8) |
| 2xl | 48px | Hero section vertical padding |
| 3xl | 64px | Page-level top/bottom spacing |

Exceptions:
- Touch targets minimum 44px height on mobile (wallet connect button, hamburger menu icon button)
- Header height: `py-4` (16px top/bottom) + content = ~64px total
- Max content width: `max-w-7xl` (1280px) with `mx-auto`

---

## Typography

Constrained to **4 font sizes** and **2 font weights** for visual consistency:

| Role | Font | Size | Weight | Line Height | Usage |
|------|------|------|--------|-------------|-------|
| Display | Manrope | 48px (3rem) mobile / 60px (3.75rem) desktop | 700 (bold) | 1.1 | Hero headlines, page titles |
| Heading | Manrope | 24px (1.5rem) | 700 (bold) | 1.2 | Card headings, section titles, nav links, footer logo |
| Body | Plus Jakarta Sans | 16px (1rem) | 400 (regular) | 1.5 | Paragraph text, descriptions, subtitles |
| Label | Plus Jakarta Sans | 14px (0.875rem) | 700 (bold) | 1.4 | Uppercase category labels, button text, timestamps, badge text, wallet addresses (Geist Mono) |

**Font size scale:** 14px, 16px, 24px, 48-60px (4 sizes, responsive variants count as one).

**Font weight scale:** 400 (regular) for body/descriptions, 700 (bold) for everything else (headlines, headings, labels, buttons, nav). Visual hierarchy is created through size + color, not weight variation.

**Headline gradient text:** Hero headlines use gradient text via `text-transparent bg-clip-text bg-gradient-to-r from-primary to-tertiary` on the emphasized word (e.g., "Forge Your **Voice**", "Decide the **Future**").

**Uppercase labels:** Category/section labels use `uppercase tracking-wide` or `tracking-widest` at 14px bold (e.g., "PRIMARY QUESTION", "PRIVACY SETTINGS", "GOVERNANCE").

**Monospace exception:** Wallet addresses use Geist Mono at 14px (Label size), weight 400, for visual distinction of hexadecimal content.

---

## Color

This is a **dark-only** application (decision D-09). No light mode. No theme toggle. The `dark` class is hardcoded on `<html>`.

### Core Palette (from design system)

| Role | Hex | CSS Variable | Usage |
|------|-----|-------------|-------|
| Background / Surface | `#0d0d19` | `--background`, `--surface` | Page background, dominant surface (60%) |
| Surface Container Low | `#121220` | `--surface-container-low` | Card backgrounds, footer background |
| Surface Container | `#181829` | `--surface-container` | Mid-level containers |
| Surface Container High | `#1e1e32` | `--surface-container-high` | Elevated cards, hover states, active tabs |
| Surface Container Highest | `#23243a` | `--surface-container-highest` | Input fields, option rows, deepest cards |
| Surface Variant | `#23243a` | `--surface-variant` | Alternative surface color |
| On Surface | `#e5e3ff` | `--on-surface`, `--foreground` | Primary text color |
| On Surface Variant | `#aaa8c5` | `--on-surface-variant`, `--muted-foreground` | Secondary text, descriptions, placeholders |
| Primary | `#b0aaff` | `--primary` | Brand accent — CTAs, active nav, logo text |
| Primary Container | `#a19afd` | `--primary-container` | Gradient endpoint for CTA buttons |
| Primary Dim | `#9992f5` | `--primary-dim` | Hover/pressed primary states |
| On Primary | `#2c2281` | `--on-primary` | Text on primary-colored elements |
| On Primary Container | `#211376` | `--on-primary-container` | Text on primary container |
| Tertiary | `#80fffa` | `--tertiary` | Turquoise accent — security badges, shield indicators |
| Tertiary Dim | `#3de5df` | `--tertiary-dim` | Muted tertiary for secondary accents |
| Tertiary Container | `#52f3ee` | `--tertiary-container` | Tertiary container backgrounds |
| Error | `#fd6f85` | `--error` | Error states, destructive hover |
| Error Container | `#8a1632` | `--error-container` | Error backgrounds |
| Outline | `#74738e` | `--outline` | Input placeholders, disabled text |
| Outline Variant | `#46465e` | `--outline-variant` | Subtle borders, dividers |

### 60/30/10 Split

| Split | Color | Elements |
|-------|-------|----------|
| 60% Dominant | `#0d0d19` (background) | Page body, main content area |
| 30% Secondary | `#121220` / `#1e1e32` / `#23243a` (surface hierarchy) | Header, cards, footer, inputs, dropdowns |
| 10% Accent | `#b0aaff` (primary) + `#80fffa` (tertiary) | See reserved list below |

### Primary Accent Reserved For (exhaustive list)

1. "Connect Midnight Wallet" CTA button (gradient from `--primary` to `--primary-container`)
2. Logo text color ("Shadow Poll" in `#b0aaff`)
3. Active navigation link (underlined with primary)
4. Focus rings on interactive elements
5. Step indicator dots (active step)
6. Loading spinner stroke color
7. Category labels on poll cards (e.g., "GOVERNANCE", "COMMUNITY")

### Tertiary Accent Reserved For (exhaustive list)

1. "SECURE ANONYMOUS VOTING ACTIVE" status badge
2. Shield/encryption icons and their labels
3. "Midnight Privacy Protocol" heading
4. ZK-proof info box background tint (`tertiary/10`)
5. "HOW IT WORKS" link text
6. Footer "Securely Anonymous" text accent
7. Gradient endpoint in hero headline text (from primary to tertiary)

**Accent is NOT used for:** body text, card backgrounds, standard borders, or decorative non-interactive elements.

---

## Glass & Surface Effects

The design uses layered glass/blur effects for elevated surfaces:

| Element | Effect | CSS |
|---------|--------|-----|
| Header (fixed) | Frosted glass with deep shadow | `bg-[#0d0d19]/60 backdrop-blur-xl shadow-[0px_24px_48px_rgba(0,0,0,0.4)]` |
| Glass panels (results card) | Semi-transparent with blur | `background: rgba(35,36,58,0.6); backdrop-filter: blur(30px)` |
| CTA button glow | Primary-colored box shadow | `shadow-[0px_8px_32px_rgba(176,170,255,0.3)]` |
| CTA button hover glow | Stronger primary shadow | `shadow-[0px_12px_48px_rgba(176,170,255,0.4)]` |
| Decorative glow orb | Blurred background element | `bg-primary/20 blur-[60px]` positioned absolutely |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| DEFAULT | `0.25rem` (4px) | Small elements, default |
| lg | `0.5rem` (8px) | Inputs, small cards |
| xl | `0.75rem` (12px) | Cards, containers, inputs |
| 2xl | `1.5rem` (24px) | Large cards (poll cards in trending view) |
| 3xl | `1.5rem` (24px) | Same as 2xl, used for rounded-3xl in bento grid |
| full | `9999px` | CTA buttons (pill shape), badges, avatar circles |

**Key pattern:** CTA buttons are always `rounded-full` (pill shape). Cards use `rounded-xl` to `rounded-3xl`. Inputs use `rounded-xl`.

---

## Gradients

| Element | Gradient | CSS |
|---------|----------|-----|
| CTA buttons | Primary to primary-container | `bg-gradient-to-br from-primary to-primary-container` |
| Hero headline accent word | Primary to tertiary (horizontal) | `bg-gradient-to-r from-primary to-tertiary` on `text-transparent bg-clip-text` |
| Image overlay (bottom fade) | Background to transparent | `bg-gradient-to-t from-background via-transparent to-transparent` |

---

## Component Inventory (Phase 1)

shadcn components to install via `bunx shadcn@latest add <name>`:

| Component | shadcn Name | Usage |
|-----------|-------------|-------|
| Button | `button` | CTA buttons, retry buttons, disconnect button (already installed) |
| Card | `card` | Onboarding step cards, install prompt card, wallet info card |
| Badge | `badge` | Wallet address pill in header |
| Dropdown Menu | `dropdown-menu` | Wallet pill dropdown (disconnect, network info) |
| Sheet | `sheet` | Mobile hamburger drawer |
| Skeleton | `skeleton` | Loading states for wallet connection |
| Separator | `separator` | Dividers in dropdown and drawer |

Custom components (not from shadcn):

| Component | Location | Purpose |
|-----------|----------|---------|
| `Header` | `components/header.tsx` | Fixed top header with logo + nav + wallet controls |
| `Footer` | `components/footer.tsx` | Page footer with logo, links, copyright |
| `WalletButton` | `components/wallet-button.tsx` | Wallet connection/status button with dropdown |
| `WalletOnboarding` | `components/wallet-onboarding.tsx` | Full-page guided onboarding flow |
| `InstallPrompt` | `components/install-prompt.tsx` | 1am.xyz install screen/card |
| `HeroSection` | `components/hero-section.tsx` | Landing page hero with value prop + CTA |
| `MobileDrawer` | `components/mobile-drawer.tsx` | Hamburger menu sheet for mobile |
| `Spinner` | `components/ui/spinner.tsx` | Loading indicator for async wallet operations |

---

## Layout Contract

### Header (Fixed)

```
┌─────────────────────────────────────────────────────────────────┐
│  [Shadow Poll]                                           [CTA]  │
│  Logo (primary)                                    Wallet btn   │
└─────────────────────────────────────────────────────────────────┘
```

- **Position:** `fixed top-0 w-full z-50`
- **Background:** `bg-[#0d0d19]/60 backdrop-blur-xl shadow-[0px_24px_48px_rgba(0,0,0,0.4)]`
- **Padding:** `px-8 py-4` with `max-w-7xl mx-auto`
- **Logo:** "Shadow Poll" in Manrope, `text-2xl font-bold tracking-tighter text-[#b0aaff]`
- **Nav links:** Manrope `font-bold tracking-tight text-base`. Active: `text-primary border-b-2 border-primary pb-1`. Inactive: `text-on-surface-variant hover:text-primary transition-colors`
- **Phase 1 note:** Nav links are **hidden** in Phase 1 (D-06: minimal header — logo + wallet only). The nav `<nav>` element renders empty with a placeholder comment for Phase 4. Nav link styles are documented here for future phases but not rendered yet.
- **Wallet CTA:** `bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold px-6 py-3 rounded-full active:scale-95 duration-200 shadow-lg`
- **Mobile (< 768px):** Hide nav links (`hidden md:flex`). Show hamburger icon button. Logo + hamburger only.

### Footer

```
┌─────────────────────────────────────────────────────────────────┐
│  [Shadow Poll]     [Privacy Policy] [About] [Community]    [©]  │
└─────────────────────────────────────────────────────────────────┘
```

- **Background:** `bg-[#121220]`
- **Padding:** `py-12` with `px-8 max-w-7xl mx-auto`
- **Layout:** `flex flex-col md:flex-row justify-between items-center gap-6`
- **Logo:** Manrope, `text-base font-bold text-[#b0aaff]`
- **Links:** Plus Jakarta Sans, `text-sm text-[#aaa8c5] hover:text-[#b0aaff] transition-colors`
- **Copyright:** Plus Jakarta Sans, `text-sm text-[#aaa8c5]` — "© 2024 Shadow Poll. Securely Anonymous."

### Main Content

- **Top offset:** `pt-32` (128px — accounts for fixed header + visual breathing room, matching designs)
- **Bottom padding:** `pb-20`
- **Side padding:** `px-6` mobile, `px-8` desktop
- **Max width:** `max-w-7xl mx-auto` (1280px)

### Hero Section (Landing Page)

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  Forge Your Voice                                   │  Display: Manrope bold
│  (gradient on "Voice")                              │  5xl mobile / 6xl desktop
│                                                     │
│  Create secure, anonymous polls that prioritize     │  Body: Plus Jakarta Sans
│  privacy without sacrificing engagement.            │  text-base, on-surface-variant
│                                                     │
│  [Connect Midnight Wallet]                          │  Gradient pill CTA
│                                                     │
└─────────────────────────────────────────────────────┘
```

- **Headline:** `font-headline text-5xl md:text-6xl font-bold tracking-tight`
- **Gradient word:** Wrap accent word in `<span class="text-transparent bg-clip-text bg-gradient-to-r from-primary to-tertiary">`
- **Subtitle:** `text-on-surface-variant font-body text-base`
- **Layout:** `text-left md:text-center md:max-w-2xl md:mx-auto` (left-aligned on mobile, centered on desktop)
- **CTA:** Same gradient button as header wallet CTA

---

## Interaction States

### Wallet Connection States

| State | Header Display | Main Content | Transition |
|-------|---------------|--------------|------------|
| **Not detected** | "Connect Midnight Wallet" gradient button | Full-page install prompt | Immediate on load |
| **Detected, disconnected** | "Connect Midnight Wallet" gradient button | Hero section with CTA | Immediate on load |
| **Connecting** | Button shows spinner + "Connecting..." (disabled) | Onboarding overlay with progress | 200ms fade-in |
| **Connected** | Address pill badge + dropdown | Hero section (connected state) | 200ms fade-in |
| **Error** | "Connect Midnight Wallet" button (re-enabled) | Inline error card with retry | 200ms fade-in |

### Wallet Address Pill (Connected State)

- **Format:** Green dot (8px, `bg-emerald-500`) + first 6 chars + `...` + last 4 chars
- **Font:** Geist Mono, 14px, weight 400
- **Container:** Badge with `bg-surface-container-high rounded-full px-4 py-2`
- **Click:** Opens DropdownMenu with network info + disconnect option

### Onboarding Flow (Guided Steps)

Three-step overlay:

1. **Step 1: Detect** — Checking for 1am.xyz extension (auto-advances)
2. **Step 2: Install** (conditional) — Shows install prompt if not detected
3. **Step 3: Connect** — "Connect your wallet" with connect button

- **Container:** Full-viewport overlay with `bg-background/80 backdrop-blur-sm`
- **Card:** Centered, max-width 480px, `bg-surface-container-low` background, `rounded-xl`, `p-8`
- **Step indicator:** Row of dots, 8px each, active dot uses `--primary`, inactive uses `--outline`
- **Transitions:** 300ms ease-in-out slide between steps

### Install Prompt (1am.xyz Not Detected)

- **Icon:** Material Symbols `wallet` at 48px, `text-outline`
- **Heading:** "1am.xyz Wallet Required" — Manrope bold 24px
- **Body:** Plus Jakarta Sans 16px, `text-on-surface-variant`
- **Primary CTA:** "Install 1am.xyz" — gradient pill button
- **Secondary CTA:** "I already installed it — refresh" — ghost button

### Connection Error (Inline)

- **Heading:** "Connection Failed" — Manrope bold, `text-error`
- **Body:** Plus Jakarta Sans, `text-on-surface-variant`
- **Retry:** "Try Connecting Again" — gradient pill button
- **Troubleshooting:** Expandable section with tips list

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| **Primary CTA (header + hero)** | "Connect Midnight Wallet" |
| **Secondary CTA (install)** | "Install 1am.xyz" |
| **Hero headline** | "Forge Your Voice" (with "Voice" in gradient) |
| **Hero subtitle** | "Create secure, anonymous polls that prioritize privacy without sacrificing engagement. Simple enough for anyone, secure enough for everyone." |
| **Empty state heading** | "Welcome to Shadow Poll" |
| **Empty state body** | "Connect your Midnight wallet to create polls and cast anonymous votes on the blockchain." |
| **Install prompt heading** | "1am.xyz Wallet Required" |
| **Install prompt body** | "Shadow Poll uses the 1am.xyz wallet to interact with the Midnight blockchain. Install the browser extension to get started." |
| **Install refresh fallback** | "I already installed it — refresh" |
| **Connecting state** | "Connecting..." |
| **Connected state (header)** | Truncated address: `0x1a2b...9f8e` format |
| **Network label** | "Midnight Preview" |
| **Error state heading** | "Connection Failed" |
| **Error state body** | "Could not connect to your wallet. Make sure 1am.xyz is unlocked and the Midnight Preview network is selected." |
| **Error retry** | "Try Connecting Again" |
| **Error troubleshooting toggle** | "Troubleshooting tips" |
| **Error tip 1** | "Refresh the page" |
| **Error tip 2** | "Check that 1am.xyz is unlocked" |
| **Error tip 3** | "Ensure \"Preview\" network is selected" |
| **Error tip 4** | "Disable other wallet extensions" |
| **Disconnect action** | "Disconnect Wallet" |
| **Disconnect confirmation** | "Disconnect wallet? You can reconnect at any time." |
| **App name** | "Shadow Poll" |
| **Mobile menu label** | "Menu" (sr-only on hamburger icon) |
| **Footer copyright** | "© 2024 Shadow Poll. Securely Anonymous." |
| **Footer links** | "Privacy Policy", "About", "Community" |
| **ZK info box** | "Your poll is secured by Zero-Knowledge proofs. Your identity is never stored or shared." |

---

## Loading & Skeleton States

| Element | Loading Pattern |
|---------|----------------|
| Wallet button (initial load) | Skeleton rectangle 140x40px, rounded-full, pulsing |
| Onboarding step transition | 300ms ease-in-out opacity + translateX |
| Wallet connecting | Spinner (20px) replacing button icon, button disabled, "Connecting..." text |
| Page initial render | No skeleton — hero section renders immediately, wallet state resolves async |

### Spinner Specification

- **Size:** 20px (inside buttons), 32px (standalone)
- **Stroke:** 2px, `--primary` color
- **Animation:** `spin 1s linear infinite`
- **Type:** Ring/arc (3/4 circle), not dots

---

## Responsive Breakpoints

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| Mobile | < 768px (`md`) | Hamburger menu, single-column, hero text-5xl, px-6, text-left |
| Desktop | >= 768px | Full header with nav, hero text-6xl, px-8, text-center |
| Large Desktop | >= 1024px (`lg`) | 12-column grid layouts (for future phases) |

### Mobile-Specific Adaptations

- Header: Logo left + hamburger icon-button right (nav links hidden, wallet button hidden)
- Hamburger opens Sheet (slide from right) containing: nav links + wallet status/connect + disconnect
- Hero CTA button: Full width (`w-full`) below 768px
- Hero text: Left-aligned on mobile, centered on desktop
- Onboarding card: Full width with 16px margin (`mx-4`)
- Install prompt: Stacks vertically, buttons full width

---

## Animation & Transition Contract

| Element | Property | Duration | Easing |
|---------|----------|----------|--------|
| Wallet state change | opacity | 200ms | ease-in-out |
| Onboarding step slide | opacity + transform | 300ms | ease-in-out |
| Mobile drawer open/close | transform (translateX) | 300ms | ease-in-out (handled by Sheet) |
| Dropdown open/close | opacity + scale | 150ms | ease-out (handled by Radix) |
| Button hover | background-color | 150ms | ease |
| Button press | scale(0.95) | 200ms | ease (`active:scale-95`) |
| Focus ring | box-shadow | 150ms | ease |
| Spinner | rotate | 1000ms | linear, infinite |
| Nav link hover | color | 150ms | ease (`transition-colors`) |
| Image hover (decorative) | transform scale | 700ms | ease (`group-hover:scale-110`) |
| Live pulse dot | opacity | continuous | `animate-pulse` |

**Reduced motion:** Respect `prefers-reduced-motion: reduce`. When active, all transitions set to 0ms duration except spinner (keeps rotating at 2s duration) and pulse (stops).

---

## Accessibility Contract

| Requirement | Implementation |
|-------------|---------------|
| Focus visible | 2px ring using `--primary` (`#b0aaff`) on all interactive elements |
| Keyboard navigation | Tab order: Logo -> Nav links -> Wallet button -> Main content CTA |
| Screen reader labels | Hamburger: `aria-label="Open menu"`. Wallet pill: `aria-label="Wallet menu, connected as 0x1a2b...9f8e"`. Status dot: `aria-label="Connected"` |
| Color contrast | On-surface (`#e5e3ff`) on background (`#0d0d19`) = ~15:1 ratio. Primary (`#b0aaff`) on background = ~8:1 ratio. On-surface-variant (`#aaa8c5`) on background = ~7:1 ratio. All pass WCAG AA. |
| Reduced motion | All animations respect `prefers-reduced-motion` |
| Semantic HTML | `<header>`, `<main>`, `<footer>`, `<nav>` landmarks. Onboarding uses `role="dialog"` with `aria-modal="true"` |
| Icon accessibility | Material Symbols marked `aria-hidden="true"` when decorative, with `aria-label` when functional |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official (`ui.shadcn.com`) | button, card, badge, dropdown-menu, sheet, skeleton, separator | not required |

No third-party registries declared. Only official shadcn components are used. All custom theming is done via CSS variables and Tailwind config, not third-party component blocks.

---

## CSS Variables Implementation Note

The `globals.css` file must be updated to:

1. Remove the current light/dark media-query approach
2. Hardcode `class="dark"` on `<html>`
3. Define all Aether design system color variables in `:root` (dark-only, no `.dark` selector needed)
4. Register the full Material Design 3 surface hierarchy as Tailwind-compatible custom properties
5. Add `font-headline`, `font-body`, `font-label` font family utilities in Tailwind config
6. Add the custom border radius scale
7. Add gradient and glass effect utility patterns

The tailwind config in the design HTML files (`tailwind.config` in `<script>`) serves as the definitive reference for color token names and values.

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved (2026-04-08)
