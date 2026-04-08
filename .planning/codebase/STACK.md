# Technology Stack

**Analysis Date:** 2026-04-08

## Languages

**Primary:**
- TypeScript 5.9.3 - All application code (`app/**/*.tsx`, `app/**/*.ts`)
- TSX - React component files

**Secondary:**
- CSS - Global styles via Tailwind CSS (`app/globals.css`)

## Runtime

**Environment:**
- Node.js v25.9.0
- Bun 1.3.11 (used as package manager; lockfile: `bun.lock`)

**Package Manager:**
- Bun 1.3.11
- Lockfile: `bun.lock` (lockfileVersion 1)

## Frameworks

**Core:**
- Next.js 16.2.2 - Full-stack React framework (App Router)
- React 19.2.4 - UI library
- React DOM 19.2.4 - DOM renderer

**Testing:**
- Not detected - No test framework configured

**Build/Dev:**
- Next.js built-in compiler (Turbopack for dev, SWC for production)
- PostCSS via `postcss.config.mjs` with `@tailwindcss/postcss` plugin

## Key Dependencies

**Critical:**

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 16.2.2 | Full-stack React framework with App Router |
| `react` | 19.2.4 | UI component library |
| `react-dom` | 19.2.4 | React DOM renderer |
| `graphql` | 16.13.2 | GraphQL query language runtime |
| `graphql-yoga` | 5.21.0 | GraphQL server framework (for building API endpoints) |

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
| `tailwindcss` | 4.2.2 | Utility-first CSS framework |
| `@tailwindcss/postcss` | ^4 | PostCSS integration for Tailwind v4 |
| `typescript` | 5.9.3 | Static type checking |
| `eslint` | 9.39.4 | Code linting |
| `eslint-config-next` | 16.2.2 | Next.js ESLint rules (core-web-vitals + TypeScript) |

## Configuration

**Environment:**
- `.env*` files listed in `.gitignore` — no `.env` or `.env.example` files committed
- No environment variables currently referenced in source code (project is in early scaffold stage)

**Build:**
- `next.config.ts` - Next.js configuration (currently default/empty)
- `tsconfig.json` - TypeScript config (target: ES2017, strict: true, module: esnext, moduleResolution: bundler)
- `postcss.config.mjs` - PostCSS with Tailwind CSS v4 plugin
- `eslint.config.mjs` - ESLint flat config with Next.js core-web-vitals and TypeScript presets

**TypeScript Path Aliases:**
- `@/*` → `./*` (project root alias)

## Platform Requirements

**Development:**
- Node.js v25+ or Bun 1.3+
- Run `bun install` to install dependencies
- Run `bun run dev` to start dev server (Next.js dev mode)

**Production:**
- Vercel deployment hints (`.vercel` in `.gitignore`, Vercel links in scaffold page)
- Run `bun run build` then `bun run start` for production
- No Dockerfile or custom deployment configuration detected

## Development Tools

**Linter:**
- ESLint 9.39.4 with flat config (`eslint.config.mjs`)
- Extends: `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`
- Ignores: `.next/`, `out/`, `build/`, `next-env.d.ts`
- Run via: `bun run lint`

**Formatter:**
- Not detected - No Prettier, Biome, or other formatter configured

**Type Checking:**
- TypeScript 5.9.3 in strict mode
- Target: ES2017
- Module: ESNext with bundler resolution
- Incremental compilation enabled
- Next.js TypeScript plugin enabled

---

*Stack analysis: 2026-04-08*
