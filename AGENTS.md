# AGENTS.md

## Project

**Shadow Poll** — Anonymous polling on Midnight blockchain. Users create polls, cast votes, and generate ZK proofs of participation via 1am.xyz wallet on Preview network. No PII stored; all state-changing actions on-chain.

**Core Value:** Vote anonymously with cryptographic guarantees — no one can link a voter to their choice, but anyone can verify a vote was legitimately cast.

### Constraints

- **Blockchain:** All state-changing ops via Midnight confidential smart contracts (Compact language)
- **Privacy:** Zero PII stored server-side or in any database
- **Wallet:** 1am.xyz only; handle detection/connection/disconnection gracefully
- **Network:** Midnight Preview (testnet) only
- **Runtime:** Bun (package manager + runtime)
- **Client-side Proving:** ZK proofs generated in-browser via Midnight SDK

## Tech Stack

- **Frontend:** React 19 + React Router 7 + TanStack Query, bundled by Vite 8
- **Styling:** Tailwind CSS 4 (dark mode, `@theme inline` tokens, material-symbols icons)
- **API:** Hono on Bun (`server.ts` → `Bun.serve({ fetch: app.fetch })`), proxies in dev via Vite
- **Database:** Neon Postgres (serverless) for poll metadata
- **Blockchain:** Midnight SDK (compact-js, ledger-v8, midnight-js-contracts)

## Commands

- `bun install` — Install dependencies
- `bun run dev` — Start Vite dev server (HMR)
- `bun run dev:api` — Start API server on port 3001
- `bun run build` — Production build
- `bun run serve` — Production server
- `bun run lint` — ESLint check

## Key Paths

- `src/routes/` — Page components (kebab-case files, PascalCase exports)
- `src/app.tsx` — Root component, router, provider tree
- `lib/midnight/` — Contract service, wallet provider, invite codes, metadata store
- `lib/api/` — Hono route handlers (metadata, polls, indexer)
- `lib/db/` — Neon Postgres client + migrations
- `server.ts` — Hono app entry point
- `contracts/src/` — Compact smart contracts

## Conventions

- Imports: `import type { X }` for type-only imports; `@/` path alias maps to project root
- Components: Named `export function ComponentName()`, `Readonly<{ ... }>` for props
- Handlers: `handleX` for internal, `onX` for prop callbacks
- Naming: kebab-case files/config, PascalCase components/types, camelCase functions/vars
- Commit messages: Imperative present tense ("Add feature", "Fix bug")

## Skills

Midnight skills are in `.agents/skills/` — each has a `SKILL.md` index:

- **midnight-compact-guide** — Compact language reference (v0.19+), ZK patterns, common errors
- **midnight-sdk-guide** — TypeScript SDK integration, wallet connection patterns
- **midnight-infra-setup** — Local node/indexer/proof-server setup
- **midnight-deploy** — Deploy contracts to local or preview network
- **midnight-test-runner** — Run and debug Compact contract tests