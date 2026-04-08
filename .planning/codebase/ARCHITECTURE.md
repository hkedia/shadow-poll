# Architecture

**Analysis Date:** 2026-04-08

## Pattern Overview

**Overall:** Next.js App Router (Server-First Rendering)

This is an early-stage project scaffolded via `create-next-app` with Next.js 16. The application source consists of the default scaffold with no custom business logic yet. Midnight Network blockchain SDK packages are declared as dependencies but are not yet imported or used anywhere.

**Key Characteristics:**
- Next.js 16 App Router with React 19 Server Components by default
- Tailwind CSS v4 for styling via PostCSS
- Midnight Network SDK dependencies installed (blockchain/ZK-proof integration planned)
- `graphql` and `graphql-yoga` dependencies installed (GraphQL API layer planned)
- No database, no API routes, no authentication, no state management implemented yet
- Bun as package manager (evidenced by `bun.lock`)

## Layers

**Presentation Layer (React Server Components):**
- Purpose: Renders pages and UI components
- Location: `app/`
- Contains: `page.tsx` (home page), `layout.tsx` (root layout), `globals.css` (global styles)
- Depends on: Next.js framework, Tailwind CSS
- Used by: End users via browser

**Static Assets:**
- Purpose: Serves static SVG images and favicon
- Location: `public/`
- Contains: `file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`
- Depends on: Nothing
- Used by: Presentation layer via `<Image>` component and direct URL references

## Data Flow

**Current Request Lifecycle:**

1. Browser requests a URL
2. Next.js App Router matches the route to `app/page.tsx`
3. `app/layout.tsx` wraps the page with root HTML, fonts, and global styles
4. Server Component renders to HTML and streams to browser
5. Client hydration occurs (minimal — no client components exist yet)

**State Management:**
- None implemented. No client-side state, no stores, no context providers.

**Caching Strategy:**
- Default Next.js caching behavior only. No custom caching configuration.

## Key Abstractions

**Root Layout (`app/layout.tsx`):**
- Purpose: Defines the HTML document shell, loads Geist fonts, applies global CSS
- Pattern: Next.js root layout convention (must export default function returning `<html>`)

**Home Page (`app/page.tsx`):**
- Purpose: Default landing page — currently scaffold boilerplate
- Pattern: Next.js page convention (default export = route handler)

## Entry Points

**Application Entry:**
- Location: `app/layout.tsx` (root layout, wraps all pages)
- Triggers: Every page request
- Responsibilities: HTML shell, font loading, global CSS

**Home Route:**
- Location: `app/page.tsx`
- Triggers: `GET /`
- Responsibilities: Renders the landing page

## Planned Integrations (Dependencies Installed, Not Yet Used)

**Midnight Network Blockchain SDK:**
- `@midnight-ntwrk/compact-js` — Compact language JS runtime
- `@midnight-ntwrk/ledger-v8` — Ledger integration (v8)
- `@midnight-ntwrk/midnight-js-contracts` — Smart contract interactions
- `@midnight-ntwrk/midnight-js-fetch-zk-config-provider` — ZK proof configuration
- `@midnight-ntwrk/midnight-js-indexer-public-data-provider` — Public data indexer
- `@midnight-ntwrk/midnight-js-network-id` — Network identification
- `@midnight-ntwrk/midnight-js-types` — TypeScript type definitions

**GraphQL:**
- `graphql` — GraphQL core library
- `graphql-yoga` — GraphQL server (likely for Next.js API routes)

## Error Handling

**Strategy:** Not yet implemented. Default Next.js error handling only.

**Patterns:**
- No custom `error.tsx` or `not-found.tsx` boundary files exist
- No global error boundary configured

## Cross-Cutting Concerns

**Logging:** Not implemented. Console only.
**Validation:** Not implemented.
**Authentication:** Not implemented.

## Database Schema

No database is configured. No ORM, no database client, no schema files exist.

## API Surface

No API routes exist. The `app/` directory contains no `route.ts` files.

**Planned:** `graphql-yoga` dependency suggests a GraphQL API endpoint will be created (likely at `app/api/graphql/route.ts` or similar).

## Module Boundaries

| Module | Responsibility | Dependencies |
|--------|---------------|--------------|
| `app/layout.tsx` | Root HTML shell, fonts, global CSS | `next`, `next/font/google`, `globals.css` |
| `app/page.tsx` | Home page rendering | `next/image` |
| `app/globals.css` | Global styles and Tailwind theme | `tailwindcss` |

---

*Architecture analysis: 2026-04-08*
