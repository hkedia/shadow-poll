# CLAUDE.md

This file provides guidance to Claude and other AI coding agents when working with code in this repository.

## Repository Overview

**Night Skills** is a collection of skills for AI agents to build, deploy, and interact with Midnight Network dApps. Skills are packaged instructions and scripts that extend agent capabilities for privacy-preserving blockchain development.

**Maintained by:** [Webisoft Development Labs](https://webisoft.com) - [Utkarsh Varma (@UvRoxx)](https://github.com/UvRoxx)

## About Midnight Network

Midnight is a privacy-first blockchain platform using zero-knowledge proofs:

- **Private Smart Contract State** - Encrypted ledger data
- **Selective Disclosure** - Prove claims without revealing data
- **Shielded Tokens** - Private token transfers
- **Unshielded Tokens** - Public when needed

## Available Skills

### midnight-compact-guide
Complete Compact language reference (v0.19+) for writing privacy-preserving smart contracts.

**Triggers:** "write contract", "Compact syntax", "ZK proof", "ledger state", "circuit function"

**Rules:**
- `privacy-selective-disclosure.md` - ZK disclosure patterns
- `tokens-shielded-unshielded.md` - Token vault patterns
- `common-errors.md` - Error messages and solutions
- `openzeppelin-patterns.md` - Security patterns (Ownable, Pausable, AccessControl)

**Critical Syntax Notes:**
- Pragma: `pragma language_version >= 0.19;`
- Ledger: Individual declarations, NOT block syntax
- Return type: `[]` (empty tuple), NOT `Void`
- Witness: Declaration only, NO body in Compact
- Pure helpers: `pure circuit`, NOT `pure function`
- Enum access: Dot notation (`Choice.rock`), NOT double colon

### midnight-sdk-guide
TypeScript SDK integration guide for Midnight dApps.

**Triggers:** "SDK", "TypeScript", "wallet integration", "connect dApp", "call contract"

**Rules:**
- `wallet-integration.md` - Complete wallet integration patterns

### midnight-infra-setup
Set up and run Midnight infrastructure locally using official dev tools.

**Triggers:** "setup infrastructure", "start node", "run indexer", "proof server"

**Based on:**
- [midnight-infra-dev-tools](https://github.com/midnightntwrk/midnight-infra-dev-tools)
- [midnight-node](https://github.com/midnightntwrk/midnight-node)
- [midnight-indexer](https://github.com/midnightntwrk/midnight-indexer)
- [midnight-ledger](https://github.com/midnightntwrk/midnight-ledger)

### midnight-deploy
Deploy Midnight contracts to local or preview network.

**Triggers:** "deploy contract", "deploy to testnet", "deploy to preview"

### midnight-test-runner
Run and debug Midnight contract tests.

**Triggers:** "run tests", "test contract", "debug test failure"

## Common Compact Syntax (v0.19+)

### Quick Reference

```compact
pragma language_version >= 0.19;

import CompactStandardLibrary;

// Ledger - individual declarations
export ledger counter: Counter;
export ledger owner: Bytes<32>;

// Witness - declaration only
witness local_secret_key(): Bytes<32>;

// Circuit - returns []
export circuit increment(): [] {
  counter.increment(1);
}

// Pure circuit (NOT function)
pure circuit helper(x: Field): Field {
  return x + 1;
}
```

### Common Mistakes

| Wrong | Correct |
|-------|---------|
| `ledger { }` block | `export ledger field: Type;` |
| `Void` return | `[]` return |
| `pure function` | `pure circuit` |
| `Choice::rock` | `Choice.rock` |
| `counter.value()` | `counter.read()` |

## Resources

| Resource | URL |
|----------|-----|
| Midnight Docs | https://docs.midnight.network |
| Compact Guide | https://docs.midnight.network/develop/reference/compact/lang-ref |
| Lace Wallet | https://www.lace.io |
| Faucet | https://faucet.preview.midnight.network |
| midnight-mcp | https://github.com/Olanetsoft/midnight-mcp |
| OpenZeppelin Compact | https://github.com/OpenZeppelin/compact-contracts |

## License

MIT - [Webisoft Development Labs](https://webisoft.com)

<!-- GSD:project-start source:PROJECT.md -->
## Project

**Shadow Poll**

An anonymous polling application built on the Midnight blockchain. Users connect the 1am.xyz wallet on the Preview network to create polls, cast votes, and generate zero-knowledge proofs of participation — all through confidential smart contracts. The app stores no personally identifiable information; all state-changing actions happen on-chain with rational privacy and selective disclosure.

**Core Value:** Users can vote on polls anonymously with cryptographic guarantees — no one can link a voter to their chosen option, but anyone can verify a vote was legitimately cast.

### Constraints

- **Blockchain:** All state-changing operations (create poll, cast vote) must go through Midnight confidential smart contracts — no off-chain state mutations
- **Privacy:** Zero personally identifiable information stored server-side or in any database
- **Wallet:** 1am.xyz is the only supported wallet; must handle detection, connection, and disconnection gracefully
- **Network:** Midnight Preview (testnet) only — no mainnet considerations for v1
- **Contract Language:** Compact (Midnight's DSL) for smart contracts — cannot use Solidity or other contract languages
- **Runtime:** Bun as package manager and runtime
- **Client-side Proving:** ZK proofs generated in the user's browser via the Midnight SDK — no server-side proving
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript 5.x — All application code (`src/**/*.tsx`, `src/**/*.ts`, `lib/**/*.ts`)
- TSX — React component files
- CSS — Global styles via Tailwind CSS (`src/globals.css`)
- Compact — Midnight smart contract language (`contracts/src/`)
## Runtime
- Bun 1.3+ — Package manager, dev runtime, and production server (`bun.lock`)
## Frameworks
- Vite 8 — Dev server + bundler (replaces Next.js as of Phase 08)
- React 19.2.4 — UI library (client-side SPA, no server components)
- React Router 7 — Client-side routing
- React DOM 19.2.4 — DOM renderer
- Tailwind CSS 4 via `@tailwindcss/vite` plugin (no PostCSS)
## Key Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `vite` | 8 | Dev server + production bundler |
| `@vitejs/plugin-react` | 6 | React Fast Refresh + JSX transform |
| `react` | 19.2.4 | UI component library |
| `react-dom` | 19.2.4 | React DOM renderer |
| `react-router` | 7 | Client-side SPA routing |
| `@tanstack/react-query` | 5.x | Data fetching, caching, optimistic updates |
| `graphql` | 16.13.2 | GraphQL query language runtime |
| `graphql-yoga` | 5.21.0 | GraphQL server framework |
| `@neondatabase/serverless` | 1.x | Neon Postgres serverless driver |
| `vite-plugin-wasm` | 3 | WASM module loading for Midnight SDK |

| Package | Version | Purpose |
|---------|---------|---------|
| `@midnight-ntwrk/compact-js` | 2.5.0 | TypeScript execution environment for Compact smart contracts |
| `@midnight-ntwrk/midnight-js-contracts` | 4.0.4 | Contract interaction module |
| `@midnight-ntwrk/midnight-js-types` | 4.0.4 | Shared types and interfaces for MidnightJS |
| `@midnight-ntwrk/midnight-js-network-id` | 4.0.4 | Network ID configuration for runtime/ledger WASM API |
| `@midnight-ntwrk/midnight-js-fetch-zk-config-provider` | 4.0.4 | ZK proving/verifying key retrieval |
| `@midnight-ntwrk/midnight-js-indexer-public-data-provider` | 4.0.4 | Public data provider via Midnight Pub-sub indexer |
| `@midnight-ntwrk/ledger-v8` | 8.0.3 | Ledger WASM bindings (v8 runtime) |

| Package | Version | Purpose |
|---------|---------|---------|
| `tailwindcss` | 4.x | Utility-first CSS framework |
| `@tailwindcss/vite` | 4 | Vite plugin for Tailwind v4 |
| `typescript` | 5.x | Static type checking |
| `eslint` | 9.x | Code linting |
| `@radix-ui/*` | various | Accessible UI primitives (Dialog, Dropdown, Separator) |
| `lucide-react` | 1.x | Icon library |
## Configuration
- `.env*` files listed in `.gitignore` — environment variables use `VITE_*` prefix for client-side, `DATABASE_URL` for server-side
- `vite.config.ts` — Vite configuration with WASM plugin, React plugin, Tailwind plugin, path aliases
- `tsconfig.json` — TypeScript config (target: ESNext, strict: true, module: esnext, moduleResolution: bundler, jsx: react-jsx)
- `eslint.config.mjs` — ESLint 9 flat config with global ignores for `dist/`, `build/`, `contracts/managed/`
- `@/*` → `./*` (project root alias via both Vite resolve.alias and tsconfig paths)
- `index.html` — Vite SPA entry point (root of project, references `src/main.tsx`)
## Platform Requirements
- Bun 1.3+
- Run `bun install` to install dependencies
- Run `bun run dev` to start Vite dev server (HMR enabled)
- Run `bun run build` then `bun run serve` for production (Bun.serve() in `server.ts`)
- API proxy in dev: Vite proxies `/api` requests to `http://localhost:3001`
## Development Tools
- ESLint 9.x with flat config (`eslint.config.mjs`)
- Ignores: `dist/`, `build/`, `contracts/managed/`
- Run via: `bun run lint`
- No Prettier or formatter configured — relies on ESLint and editor defaults
- TypeScript 5.x in strict mode
- Target: ESNext
- Module: ESNext with bundler resolution
- Incremental compilation enabled
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Conventions
- kebab-case for config files: `eslint.config.mjs`, `vite.config.ts`
- kebab-case for route files: `src/routes/create-poll.tsx`, `src/routes/poll-detail.tsx`
- Use kebab-case for any new non-route files (e.g., utility modules, lib files)
- PascalCase for component function names: `App`, `CreatePoll`, `PollDetail`
- Named exports for components: `export function ComponentName()`
- camelCase for all functions and variables
- PascalCase for React component functions
- CSS custom properties use `--kebab-case`: `--color-background`, `--color-primary`
- PascalCase for types: `PollMetadata`, `MidnightProviderSet`
- Prefer `type` imports with `import type { ... }` syntax
- Inline types for component props using `Readonly<{ ... }>` pattern
- camelCase for module-level constants
## Code Style
- No Prettier config detected — relies on ESLint and editor defaults
- Indentation: 2 spaces (observed across all files)
- Quotes: double quotes for strings
- Semicolons: yes (all statements terminated with semicolons)
- Trailing commas: yes (in multiline objects and arrays)
- Line length: no explicit limit configured
- ESLint 9 with flat config: `eslint.config.mjs`
- Global ignores: `dist/`, `build/`, `contracts/managed/`
- Run via: `bun run lint`
## Component Patterns
- Functional components only (no class components)
- Client-side SPA — all components are client components (no server components)
- React Router for page routing (`src/routes/`)
- `src/app.tsx` — root App component with router and providers
- `src/main.tsx` — React DOM entry point
- Inline destructured props with `Readonly<>` wrapper for type safety
- TanStack React Query for server state management
- React `useState`/`useReducer` for local UI state
- `handleX` for internal handlers, `onX` for prop callbacks
## Styling
- Import via `@import "tailwindcss"` in `src/globals.css`
- Tailwind theme extended inline with `@theme inline { }` block in `src/globals.css`
- CSS custom properties for theming (Aether Privacy design system)
- Dark mode by default (class-based)
- Fonts: Manrope + Plus Jakarta Sans loaded via `@fontsource` packages
- Material Symbols Outlined for icons
- Use Tailwind utility classes directly on elements
- Use CSS custom properties for design tokens (colors, fonts)
- Responsive design via Tailwind breakpoint prefixes (`sm:`, `md:`)
## Error Handling
- React Router error boundaries for route-level errors
- TanStack Query error/loading states for async data
- `console` for development logging
## TypeScript Patterns
- Enforce strict null checks, strict function types, no implicit any
- Use `import type { X }` for type-only imports
- Use `Readonly<>` for component props
- Use `React.ReactNode` for children props
- Avoid explicit `any` — use `unknown` with type narrowing instead
- `@/*` maps to project root (configured in both `tsconfig.json` and `vite.config.ts`)
- Use `@/src/...`, `@/lib/...`, etc. for absolute imports
## Import Organization
- Type imports before value imports from the same source
- Separate external and internal imports with a blank line
- Use path alias `@/` for non-relative imports within the project
## Git Conventions
- Imperative present tense for commit messages (e.g., "Add polling feature", "Fix vote counting bug")
- Primary branch: `main`
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- Vite 8 SPA with React 19 and React Router 7 for client-side routing
- Tailwind CSS v4 via `@tailwindcss/vite` plugin (no PostCSS)
- Midnight Network SDK for blockchain/ZK-proof integration (fully wired)
- Neon Postgres for off-chain poll metadata storage
- Bun.serve() production server (`server.ts`) for API routes, static files, and SPA fallback
- TanStack React Query for data fetching and caching
## Layers
- Purpose: Renders pages and UI components (client-side SPA)
- Location: `src/` (`src/app.tsx` root, `src/routes/` for pages, `src/globals.css`)
- Contains: Route components (home, create-poll, poll-detail, deploy, stats, verify), shared UI components
- Depends on: React, React Router, TanStack Query, Tailwind CSS
- Used by: End users via browser
- Purpose: Midnight blockchain integration, contract service, wallet context
- Location: `lib/midnight/`
- Contains: Contract service, wallet provider, metadata store, invite codes, provider types
- Depends on: Midnight SDK packages, WASM modules
- Used by: Route components via React hooks
- Purpose: Off-chain metadata API and database access
- Location: `lib/api/`, `lib/db/`
- Contains: Metadata request handler, Neon Postgres client, migrations
- Depends on: `@neondatabase/serverless`
- Used by: Bun.serve() server (`server.ts`)
- Purpose: Serves static files and API in production
- Location: `server.ts` (project root)
- Contains: Bun.serve() with API routing, static file serving, SPA fallback
- Depends on: `lib/api/metadata-handler.ts`, `dist/` build output
- Used by: Production deployment
## Data Flow
- TanStack React Query manages server state (polls, metadata, votes)
- React useState/useReducer for local UI state
- Wallet context provides Midnight SDK providers to components
- Contract service calls go through Midnight SDK → blockchain
- Metadata stored off-chain via API → Neon Postgres, verified by on-chain hash
## Key Abstractions
- `MidnightProviderSet` — Bundled wallet, indexer, ZK, and proof providers
- `useWalletContext()` — React hook for wallet connection state and providers
- `usePoll()` / `usePolls()` — TanStack Query hooks for poll data
- `contractService` — Functions for creating polls, casting votes, adding invite codes
## Entry Points
- Location: `index.html` → `src/main.tsx` → `src/app.tsx`
- Triggers: Browser page load
- Responsibilities: React root, router setup, provider tree (QueryClient, WalletProvider)
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
- React Router error boundaries for route-level errors
- TanStack Query error/loading states for async operations
- Try/catch in contract service with user-facing error messages
## Module Boundaries
| Module | Responsibility | Dependencies |
|--------|---------------|--------------|
| `src/app.tsx` | Root component, router, providers | `react-router`, `@tanstack/react-query` |
| `src/routes/*` | Page components | `lib/midnight/*`, UI components |
| `lib/midnight/*` | Blockchain integration | Midnight SDK packages |
| `lib/api/*` | Metadata API handler | `lib/db/*`, `lib/midnight/metadata-store` |
| `lib/db/*` | Database client and migrations | `@neondatabase/serverless` |
| `server.ts` | Production server | `lib/api/*`, `dist/` |
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
