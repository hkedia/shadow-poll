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
- TypeScript 5.9.3 - All application code (`app/**/*.tsx`, `app/**/*.ts`)
- TSX - React component files
- CSS - Global styles via Tailwind CSS (`app/globals.css`)
## Runtime
- Node.js v25.9.0
- Bun 1.3.11 (used as package manager; lockfile: `bun.lock`)
- Bun 1.3.11
- Lockfile: `bun.lock` (lockfileVersion 1)
## Frameworks
- Next.js 16.2.2 - Full-stack React framework (App Router)
- React 19.2.4 - UI library
- React DOM 19.2.4 - DOM renderer
- Not detected - No test framework configured
- Next.js built-in compiler (Turbopack for dev, SWC for production)
- PostCSS via `postcss.config.mjs` with `@tailwindcss/postcss` plugin
## Key Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 16.2.2 | Full-stack React framework with App Router |
| `react` | 19.2.4 | UI component library |
| `react-dom` | 19.2.4 | React DOM renderer |
| `graphql` | 16.13.2 | GraphQL query language runtime |
| `graphql-yoga` | 5.21.0 | GraphQL server framework (for building API endpoints) |
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
| `tailwindcss` | 4.2.2 | Utility-first CSS framework |
| `@tailwindcss/postcss` | ^4 | PostCSS integration for Tailwind v4 |
| `typescript` | 5.9.3 | Static type checking |
| `eslint` | 9.39.4 | Code linting |
| `eslint-config-next` | 16.2.2 | Next.js ESLint rules (core-web-vitals + TypeScript) |
## Configuration
- `.env*` files listed in `.gitignore` — no `.env` or `.env.example` files committed
- No environment variables currently referenced in source code (project is in early scaffold stage)
- `next.config.ts` - Next.js configuration (currently default/empty)
- `tsconfig.json` - TypeScript config (target: ES2017, strict: true, module: esnext, moduleResolution: bundler)
- `postcss.config.mjs` - PostCSS with Tailwind CSS v4 plugin
- `eslint.config.mjs` - ESLint flat config with Next.js core-web-vitals and TypeScript presets
- `@/*` → `./*` (project root alias)
## Platform Requirements
- Node.js v25+ or Bun 1.3+
- Run `bun install` to install dependencies
- Run `bun run dev` to start dev server (Next.js dev mode)
- Vercel deployment hints (`.vercel` in `.gitignore`, Vercel links in scaffold page)
- Run `bun run build` then `bun run start` for production
- No Dockerfile or custom deployment configuration detected
## Development Tools
- ESLint 9.39.4 with flat config (`eslint.config.mjs`)
- Extends: `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`
- Ignores: `.next/`, `out/`, `build/`, `next-env.d.ts`
- Run via: `bun run lint`
- Not detected - No Prettier, Biome, or other formatter configured
- TypeScript 5.9.3 in strict mode
- Target: ES2017
- Module: ESNext with bundler resolution
- Incremental compilation enabled
- Next.js TypeScript plugin enabled
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Conventions
- kebab-case for config files: `eslint.config.mjs`, `postcss.config.mjs`, `next.config.ts`
- lowercase for Next.js App Router files: `page.tsx`, `layout.tsx`, `globals.css`
- Use kebab-case for any new non-route files (e.g., utility modules, lib files)
- PascalCase for component function names: `Home`, `RootLayout`
- Default exports for page and layout components (required by Next.js App Router)
- Named exports for metadata objects: `export const metadata: Metadata`
- camelCase for all functions and variables: `geistSans`, `geistMono`
- PascalCase for React component functions: `RootLayout`, `Home`
- camelCase: `geistSans`, `geistMono`, `nextConfig`, `eslintConfig`
- CSS custom properties use `--kebab-case`: `--font-geist-sans`, `--color-background`
- PascalCase for types: `Metadata`, `NextConfig`
- Prefer `type` imports with `import type { ... }` syntax (see `app/layout.tsx` line 1, `next.config.ts` line 1)
- Inline types for component props using `Readonly<{ ... }>` pattern (see `app/layout.tsx` line 22-24)
- camelCase for module-level constants: `geistSans`, `nextConfig`
- No UPPER_SNAKE_CASE constants observed yet — follow camelCase for non-environment values
## Code Style
- No Prettier config detected — relies on ESLint and editor defaults
- Indentation: 2 spaces (observed across all files)
- Quotes: double quotes for strings (`"next"`, `"latin"`, `"Create Next App"`)
- Semicolons: yes (all statements terminated with semicolons)
- Trailing commas: yes (in multiline objects and arrays — see `tsconfig.json`, component props)
- Line length: no explicit limit configured
- ESLint 9 with flat config: `eslint.config.mjs`
- Extends `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- Run via: `npm run lint` or `eslint`
## Component Patterns
- Functional components only (no class components)
- Use `export default function ComponentName()` pattern for pages/layouts
- Server Components by default (Next.js App Router convention — no `"use client"` directive unless needed)
- Inline destructured props with `Readonly<>` wrapper for type safety:
- Wrap all props in `Readonly<{ ... }>` for immutability
- No client-side state management library installed
- Use React's built-in `useState`/`useReducer` for client components when needed
- Server Components should fetch data directly (no state needed)
- Not yet established — use `handleX` for internal handlers, `onX` for prop callbacks when adding interactivity
## Styling
- Import via `@import "tailwindcss"` in `app/globals.css`
- Tailwind theme extended inline with `@theme inline { }` block in `app/globals.css`
- CSS custom properties for theming: `--background`, `--foreground`
- Dark mode: media query based (`prefers-color-scheme: dark`) plus `dark:` Tailwind utilities
- Fonts: Geist Sans and Geist Mono loaded via `next/font/google`, applied as CSS variables
- Use Tailwind utility classes directly on elements
- Use CSS custom properties for design tokens (colors, fonts)
- Responsive design via Tailwind breakpoint prefixes (`sm:`, `md:`)
## Error Handling
- Not yet established in the codebase (scaffold only)
- Use Next.js App Router error boundaries: create `error.tsx` files in route segments
- Use `not-found.tsx` for 404 handling per route segment
- Use `loading.tsx` for loading states per route segment
- No logging framework installed
- Use `console` for development; plan for structured logging if backend logic grows
## TypeScript Patterns
- Enforce strict null checks, strict function types, no implicit any
- Use `import type { X }` for type-only imports (enforced pattern in `app/layout.tsx`, `next.config.ts`)
- This enables tree-shaking of type imports at build time
- Use `Readonly<>` for component props (see `app/layout.tsx`)
- Use `React.ReactNode` for children props
- Strict mode prevents implicit `any`
- Avoid explicit `any` — use `unknown` with type narrowing instead
- `@/*` maps to project root (configured in `tsconfig.json`)
- Use `@/app/...`, `@/lib/...`, etc. for absolute imports
## Import Organization
- Type imports before value imports from the same source
- Separate external and internal imports with a blank line
- Use path alias `@/` for non-relative imports within the project
## Git Conventions
- Only one commit exists: `"Initial commit from Create Next App"` (generated)
- No established convention yet — use imperative present tense (e.g., "Add polling feature", "Fix vote counting bug")
- Primary branch: `main`
- No feature branches exist yet — use `feature/`, `fix/`, `chore/` prefixes when branching
- Not established yet
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- Next.js 16 App Router with React 19 Server Components by default
- Tailwind CSS v4 for styling via PostCSS
- Midnight Network SDK dependencies installed (blockchain/ZK-proof integration planned)
- `graphql` and `graphql-yoga` dependencies installed (GraphQL API layer planned)
- No database, no API routes, no authentication, no state management implemented yet
- Bun as package manager (evidenced by `bun.lock`)
## Layers
- Purpose: Renders pages and UI components
- Location: `app/`
- Contains: `page.tsx` (home page), `layout.tsx` (root layout), `globals.css` (global styles)
- Depends on: Next.js framework, Tailwind CSS
- Used by: End users via browser
- Purpose: Serves static SVG images and favicon
- Location: `public/`
- Contains: `file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`
- Depends on: Nothing
- Used by: Presentation layer via `<Image>` component and direct URL references
## Data Flow
- None implemented. No client-side state, no stores, no context providers.
- Default Next.js caching behavior only. No custom caching configuration.
## Key Abstractions
- Purpose: Defines the HTML document shell, loads Geist fonts, applies global CSS
- Pattern: Next.js root layout convention (must export default function returning `<html>`)
- Purpose: Default landing page — currently scaffold boilerplate
- Pattern: Next.js page convention (default export = route handler)
## Entry Points
- Location: `app/layout.tsx` (root layout, wraps all pages)
- Triggers: Every page request
- Responsibilities: HTML shell, font loading, global CSS
- Location: `app/page.tsx`
- Triggers: `GET /`
- Responsibilities: Renders the landing page
## Planned Integrations (Dependencies Installed, Not Yet Used)
- `@midnight-ntwrk/compact-js` — Compact language JS runtime
- `@midnight-ntwrk/ledger-v8` — Ledger integration (v8)
- `@midnight-ntwrk/midnight-js-contracts` — Smart contract interactions
- `@midnight-ntwrk/midnight-js-fetch-zk-config-provider` — ZK proof configuration
- `@midnight-ntwrk/midnight-js-indexer-public-data-provider` — Public data indexer
- `@midnight-ntwrk/midnight-js-network-id` — Network identification
- `@midnight-ntwrk/midnight-js-types` — TypeScript type definitions
- `graphql` — GraphQL core library
- `graphql-yoga` — GraphQL server (likely for Next.js API routes)
## Error Handling
- No custom `error.tsx` or `not-found.tsx` boundary files exist
- No global error boundary configured
## Cross-Cutting Concerns
## Database Schema
## API Surface
## Module Boundaries
| Module | Responsibility | Dependencies |
|--------|---------------|--------------|
| `app/layout.tsx` | Root HTML shell, fonts, global CSS | `next`, `next/font/google`, `globals.css` |
| `app/page.tsx` | Home page rendering | `next/image` |
| `app/globals.css` | Global styles and Tailwind theme | `tailwindcss` |
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
