---
phase: 08-vite-migration
plan: 02
subsystem: routing-migration
tags: [react-router, route-migration, next-removal, use-client-removal]
dependency_graph:
  requires: [vite-config, vite-entry-points]
  provides: [react-router-routes, app-shell, next-free-codebase]
  affects: [all-route-pages, all-components, all-query-hooks, all-wallet-hooks]
tech_stack:
  added: []
  removed: []
  patterns: [react-router-lazy-loading, useLocation-for-pathname, useNavigate-for-routing, native-img-tags]
key_files:
  created:
    - src/app.tsx
    - src/routes/home.tsx
    - src/routes/create.tsx
    - src/routes/poll-detail.tsx
    - src/routes/stats.tsx
    - src/routes/verify.tsx
    - src/routes/deploy.tsx
    - src/routes/about.tsx
    - src/routes/privacy.tsx
    - src/routes/community.tsx
  modified:
    - components/header.tsx
    - components/footer.tsx
    - components/header-nav.tsx
    - components/mobile-drawer.tsx
    - components/poll-card.tsx
    - components/create-poll-form.tsx
    - components/hero-section.tsx
    - components/install-prompt.tsx
    - components/wallet-onboarding.tsx
    - components/wallet-button.tsx
    - components/proof-panel.tsx
    - components/results-panel.tsx
    - components/vote-panel.tsx
    - components/expiration-badge.tsx
    - components/invite-code-panel.tsx
    - components/ui/separator.tsx
    - components/ui/sheet.tsx
    - components/ui/dropdown-menu.tsx
    - lib/midnight/wallet-context.tsx
    - lib/midnight/use-wallet.ts
    - lib/queries/query-provider.tsx
    - lib/queries/use-polls.ts
    - lib/queries/use-poll.ts
    - lib/queries/use-metadata.ts
    - lib/queries/use-vote-mutation.ts
    - lib/queries/use-invite-vote-mutation.ts
    - lib/queries/use-add-invite-codes.ts
    - lib/queries/use-create-poll.ts
  deleted:
    - app/ (entire directory - 12 files including pages, globals.css, favicon, API routes)
decisions:
  - "Deleted app/api/polls/metadata/route.ts with app/ directory - API routes will be recreated in Plan 03 as Bun.serve() endpoints"
  - "Used native <img> tags to replace Next.js Image component - no optimization library needed for SVG logos"
  - "React Router Link uses 'to' prop instead of 'href' - all Link usages updated consistently"
metrics:
  duration: ~17m
  completed: 2026-04-08T20:24:00Z
  tasks_completed: 2
  tasks_total: 2
  files_created: 10
  files_modified: 28
  files_deleted: 12
---

# Phase 08 Plan 02: React Router Migration Summary

React Router app shell with lazy-loaded routes for all 9 pages, complete removal of Next.js imports (next/link, next/navigation, next/image) and "use client" directives from 26 component and library files.

## Task 1: Create src/app.tsx and move all 9 route pages to src/routes/

**Commit:** `b9445e1`

Created the React Router app shell (`src/app.tsx`) with `<Routes>` configuration wrapping all 9 paths. Each route uses `lazy()` for code-splitting. The shell includes `WalletProvider`, `QueryProvider`, `Header`, and `Footer` as the persistent app frame.

Migrated all 9 page components from `app/` (Next.js App Router convention) to `src/routes/` (flat file structure):

| Route | File | Key Changes |
|-------|------|-------------|
| `/` | `src/routes/home.tsx` | Replaced `next/link` Link with `react-router` Link (`to` prop) |
| `/create` | `src/routes/create.tsx` | Removed `"use client"` only |
| `/poll/:id` | `src/routes/poll-detail.tsx` | `useParams` from `react-router` with typed `useParams<{ id: string }>()`, Link `to` prop |
| `/stats` | `src/routes/stats.tsx` | Replaced `next/link` Link with `react-router` Link |
| `/verify` | `src/routes/verify.tsx` | `useSearchParams` from `react-router` (tuple destructure `[searchParams]`), Link `to` prop |
| `/deploy` | `src/routes/deploy.tsx` | Updated `NEXT_PUBLIC_` env var references to `VITE_` in UI text |
| `/about` | `src/routes/about.tsx` | No changes needed (pure server component, no Next.js imports) |
| `/privacy` | `src/routes/privacy.tsx` | No changes needed |
| `/community` | `src/routes/community.tsx` | No changes needed |

Deleted the entire `app/` directory including `globals.css` (already copied to `src/` in Plan 01), `favicon.ico`, and the `api/polls/metadata/route.ts` API route (to be recreated as Bun.serve() endpoint in Plan 03).

## Task 2: Update all component Next.js imports and remove "use client" directives

**Commit:** `66c6497`

Updated 28 files across `components/` and `lib/` to remove all Next.js artifacts:

**Import Replacements (6 files):**

| File | Before | After |
|------|--------|-------|
| `components/header.tsx` | `next/link` Link, `next/image` Image | `react-router` Link (`to` prop), native `<img>` |
| `components/footer.tsx` | `next/link` Link, `next/image` Image | `react-router` Link (`to` prop), native `<img>` |
| `components/header-nav.tsx` | `next/link` Link, `usePathname` | `react-router` Link + `useLocation` |
| `components/mobile-drawer.tsx` | `next/link` Link, `usePathname` | `react-router` Link + `useLocation` |
| `components/poll-card.tsx` | `next/link` Link | `react-router` Link (`to` prop) |
| `components/create-poll-form.tsx` | `useRouter` + `router.push()` | `useNavigate` + `navigate()` |

**"use client" Removal (26 files):**
- 13 component files (hero-section, install-prompt, wallet-onboarding, wallet-button, proof-panel, results-panel, vote-panel, expiration-badge, invite-code-panel, poll-card, header-nav, mobile-drawer, create-poll-form)
- 3 UI primitive files (separator, sheet, dropdown-menu)
- 10 lib files (wallet-context, use-wallet, query-provider, use-polls, use-poll, use-metadata, use-vote-mutation, use-invite-vote-mutation, use-add-invite-codes, use-create-poll)

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

| Check | Result |
|-------|--------|
| `src/app.tsx` exists | PASS |
| 9 route files in `src/routes/` | PASS |
| Zero `"use client"` in components/lib/src | PASS |
| Zero `next/` imports in components/lib/src | PASS |
| `app/` directory deleted | PASS |

## Self-Check: PASSED

All 10 created files verified on disk. Both commit hashes (b9445e1, 66c6497) confirmed in git log. app/ directory deletion confirmed.
