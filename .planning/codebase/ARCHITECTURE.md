# Architecture

**Analysis Date:** 2026-04-09 (post Vite migration)

## Pattern Overview

**Overall:** Vite SPA with React Router (Client-Side Rendering)

This is a fully functional anonymous polling application built on the Midnight blockchain. The frontend is a Vite-powered React SPA with React Router for client-side routing. The backend consists of a Bun.serve() production server for API routes and static file serving, plus Neon Postgres for off-chain metadata storage.

**Key Characteristics:**
- Vite 8 SPA with React 19 and React Router 7 for client-side routing
- Tailwind CSS v4 via `@tailwindcss/vite` plugin (no PostCSS)
- Midnight Network SDK for blockchain/ZK-proof integration (fully wired)
- Neon Postgres for off-chain poll metadata storage
- Bun.serve() production server (`server.ts`) for API routes, static files, and SPA fallback
- TanStack React Query for data fetching and caching
- Client-side ZK proof generation via Midnight SDK WASM modules

## Layers

**Presentation Layer (React SPA):**
- Purpose: Renders pages and UI components (client-side SPA)
- Location: `src/` (`src/app.tsx` root, `src/routes/` for pages, `src/globals.css`)
- Contains: Route components (home, create-poll, poll-detail, deploy, stats, verify), shared UI components
- Depends on: React, React Router, TanStack Query, Tailwind CSS
- Used by: End users via browser

**Blockchain Integration Layer:**
- Purpose: Midnight blockchain integration, contract service, wallet context
- Location: `lib/midnight/`
- Contains: Contract service, wallet provider, metadata store, invite codes, provider types
- Depends on: Midnight SDK packages, WASM modules
- Used by: Route components via React hooks

**API/Data Layer:**
- Purpose: Off-chain metadata API and database access
- Location: `lib/api/`, `lib/db/`
- Contains: Metadata request handler, Neon Postgres client, migrations
- Depends on: `@neondatabase/serverless`
- Used by: Bun.serve() server (`server.ts`)

**Production Server:**
- Purpose: Serves static files and API in production
- Location: `server.ts` (project root)
- Contains: Bun.serve() with API routing, static file serving, SPA fallback
- Depends on: `lib/api/metadata-handler.ts`, `dist/` build output
- Used by: Production deployment

**Static Assets:**
- Purpose: SVG icons, logos, ZK keys
- Location: `public/`
- Contains: `favicon.svg`, `logo.svg`, `file.svg`, `globe.svg`, `window.svg`, `zk-keys/`
- Used by: Presentation layer via `<img>` tags and direct URL references

## Data Flow

**Request Lifecycle (Dev):**
1. Browser requests a URL
2. Vite dev server serves `index.html` with HMR client
3. React Router matches route to component in `src/routes/`
4. Component renders, potentially fetching data via TanStack Query
5. API calls to `/api/*` are proxied by Vite to `http://localhost:3001`

**Request Lifecycle (Production):**
1. Browser requests a URL
2. Bun.serve() handles the request
3. `/api/polls/metadata` → metadata handler → Neon Postgres
4. `/zk-keys/*` → public/ with CORS headers
5. Static files → `dist/` (Vite build output)
6. Everything else → `dist/index.html` (SPA fallback)

**State Management:**
- TanStack React Query manages server state (polls, metadata, votes)
- React useState/useReducer for local UI state
- Wallet context provides Midnight SDK providers to components

**Blockchain Flow:**
- Contract service calls go through Midnight SDK → blockchain
- ZK proofs generated client-side via WASM modules
- Metadata stored off-chain via API → Neon Postgres, verified by on-chain hash

## Key Abstractions

- `MidnightProviderSet` — Bundled wallet, indexer, ZK, and proof providers
- `useWalletContext()` — React hook for wallet connection state and providers
- `usePoll()` / `usePolls()` — TanStack Query hooks for poll data
- `contractService` — Functions for creating polls, casting votes, adding invite codes

## Entry Points

**Application Entry (Browser):**
- Location: `index.html` → `src/main.tsx` → `src/app.tsx`
- Triggers: Browser page load
- Responsibilities: React root, router setup, provider tree (QueryClient, WalletProvider)

**Production Server:**
- Location: `server.ts`
- Triggers: `bun run serve` (production)
- Responsibilities: API routes, static file serving, SPA fallback

## Active Integrations

- `@midnight-ntwrk/compact-js` — Compact contract runtime
- `@midnight-ntwrk/ledger-v8` — Ledger WASM bindings
- `@midnight-ntwrk/midnight-js-contracts` — Contract deployment and interaction
- `@midnight-ntwrk/midnight-js-fetch-zk-config-provider` — ZK proving key fetching
- `@midnight-ntwrk/midnight-js-indexer-public-data-provider` — On-chain data reads
- `@midnight-ntwrk/midnight-js-network-id` — Network configuration
- `@neondatabase/serverless` — Neon Postgres for metadata storage
- `graphql` + `graphql-yoga` — GraphQL for indexer queries

## Error Handling

**Strategy:**
- React Router error boundaries for route-level errors
- TanStack Query error/loading states for async operations
- Try/catch in contract service with user-facing error messages
- `console` for development logging

## Module Boundaries

| Module | Responsibility | Dependencies |
|--------|---------------|--------------|
| `src/app.tsx` | Root component, router, providers | `react-router`, `@tanstack/react-query` |
| `src/routes/*` | Page components | `lib/midnight/*`, UI components |
| `lib/midnight/*` | Blockchain integration | Midnight SDK packages |
| `lib/api/*` | Metadata API handler | `lib/db/*`, `lib/midnight/metadata-store` |
| `lib/db/*` | Database client and migrations | `@neondatabase/serverless` |
| `server.ts` | Production server | `lib/api/*`, `dist/` |

---

*Architecture analysis: 2026-04-09*
