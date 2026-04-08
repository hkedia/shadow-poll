# Technology Stack

**Analysis Date:** 2026-04-09 (post Vite migration)

## Languages

**Primary:**
- TypeScript 5.x — All application code (`src/**/*.tsx`, `src/**/*.ts`, `lib/**/*.ts`)
- TSX — React component files
- Compact — Midnight smart contract language (`contracts/src/`)

**Secondary:**
- CSS — Global styles via Tailwind CSS (`src/globals.css`)

## Runtime

**Environment:**
- Bun 1.3+ — Package manager, dev runtime, and production server

**Package Manager:**
- Bun — Lockfile: `bun.lock`

## Frameworks

**Core:**
- Vite 8 — Dev server + production bundler
- React 19.2.4 — UI library (client-side SPA, no server components)
- React Router 7 — Client-side routing
- React DOM 19.2.4 — DOM renderer

**Build/Dev:**
- Vite with `@vitejs/plugin-react` 6 (React Fast Refresh + JSX transform)
- `vite-plugin-wasm` 3 — WASM module loading for Midnight SDK
- Tailwind CSS 4 via `@tailwindcss/vite` plugin (no PostCSS)

**Testing:**
- Not configured — No test framework installed

## Key Dependencies

**Core Application:**

| Package | Version | Purpose |
|---------|---------|---------|
| `vite` | 8 | Dev server + production bundler |
| `@vitejs/plugin-react` | 6 | React Fast Refresh + JSX transform |
| `react` | 19.2.4 | UI component library |
| `react-dom` | 19.2.4 | React DOM renderer |
| `react-router` | 7 | Client-side SPA routing |
| `@tanstack/react-query` | 5.x | Data fetching, caching, optimistic updates |
| `graphql` | 16.13.2 | GraphQL query language runtime |
| `graphql-yoga` | 5.21.0 | GraphQL server framework (indexer queries) |
| `@neondatabase/serverless` | 1.x | Neon Postgres serverless driver |
| `vite-plugin-wasm` | 3 | WASM module loading for Midnight SDK |

**Midnight Network SDK (blockchain/smart contract layer):**

| Package | Version | Purpose |
|---------|---------|---------|
| `@midnight-ntwrk/compact-js` | 2.5.0 | TypeScript execution environment for Compact smart contracts |
| `@midnight-ntwrk/midnight-js-contracts` | 4.0.4 | Contract interaction module |
| `@midnight-ntwrk/midnight-js-types` | 4.0.4 | Shared types and interfaces for MidnightJS |
| `@midnight-ntwrk/midnight-js-network-id` | 4.0.4 | Network ID configuration for runtime/ledger WASM API |
| `@midnight-ntwrk/midnight-js-fetch-zk-config-provider` | 4.0.4 | ZK proving/verifying key retrieval |
| `@midnight-ntwrk/midnight-js-indexer-public-data-provider` | 4.0.4 | Public data provider via Midnight Pub-sub indexer |
| `@midnight-ntwrk/ledger-v8` | 8.0.3 | Ledger WASM bindings (v8 runtime) |

**Infrastructure (dev):**

| Package | Version | Purpose |
|---------|---------|---------|
| `tailwindcss` | 4.x | Utility-first CSS framework |
| `@tailwindcss/vite` | 4 | Vite plugin for Tailwind v4 |
| `typescript` | 5.x | Static type checking |
| `eslint` | 9.x | Code linting |
| `@radix-ui/*` | various | Accessible UI primitives (Dialog, Dropdown, Separator) |
| `lucide-react` | 1.x | Icon library |

## Configuration

**Environment:**
- `.env*` files listed in `.gitignore` — environment variables use `VITE_*` prefix for client-side, `DATABASE_URL` for server-side
- `VITE_POLL_CONTRACT_ADDRESS` — deployed contract address
- `VITE_INDEXER_URL` — Midnight indexer endpoint
- `VITE_NODE_URL` — Midnight node endpoint
- `VITE_PROOF_SERVER_URL` — ZK proof server endpoint
- `DATABASE_URL` — Neon Postgres connection string (server-side only)

**Build:**
- `vite.config.ts` — Vite configuration with WASM plugin, React plugin, Tailwind plugin, path aliases
- `tsconfig.json` — TypeScript config (target: ESNext, strict: true, module: esnext, moduleResolution: bundler, jsx: react-jsx)
- `eslint.config.mjs` — ESLint 9 flat config with global ignores for `dist/`, `build/`, `contracts/managed/`
- `index.html` — Vite SPA entry point (root of project, references `src/main.tsx`)

**TypeScript Path Aliases:**
- `@/*` → `./*` (project root alias via both Vite resolve.alias and tsconfig paths)

## Platform Requirements

**Development:**
- Bun 1.3+
- Run `bun install` to install dependencies
- Run `bun run dev` to start Vite dev server (HMR enabled)
- API proxy in dev: Vite proxies `/api` requests to `http://localhost:3001`

**Production:**
- Run `bun run build` then `bun run serve` for production (Bun.serve() in `server.ts`)

## Development Tools

**Linter:**
- ESLint 9.x with flat config (`eslint.config.mjs`)
- Ignores: `dist/`, `build/`, `contracts/managed/`
- Run via: `bun run lint`

**Formatter:**
- No Prettier or formatter configured — relies on ESLint and editor defaults

**Type Checking:**
- TypeScript 5.x in strict mode
- Target: ESNext
- Module: ESNext with bundler resolution
- Incremental compilation enabled

---

*Stack analysis: 2026-04-09*
