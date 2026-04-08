# Codebase Structure

**Analysis Date:** 2026-04-09 (post Vite migration)

## Directory Layout

```
shadow-poll/
├── .planning/              # Planning and codebase analysis documents
│   ├── codebase/           # Generated codebase mapping docs
│   └── phases/             # Phase planning, research, summaries
├── contracts/              # Midnight Compact smart contracts
│   ├── src/                # Compact source files
│   ├── managed/            # Auto-generated compiled output (gitignored)
│   └── scripts/            # Compilation scripts
├── lib/                    # Shared application logic
│   ├── api/                # API route handlers
│   │   └── metadata-handler.ts  # Metadata API (Web standard Request/Response)
│   ├── db/                 # Database client and migrations
│   │   ├── client.ts       # Neon Postgres client
│   │   └── migrations.ts   # Schema migrations
│   └── midnight/           # Midnight blockchain integration
│       ├── contract-service.ts   # Contract interaction functions
│       ├── wallet-context.tsx    # React wallet context provider
│       ├── metadata-store.ts     # Metadata validation and types
│       ├── invite-codes.ts       # Invite code management
│       └── provider-types.ts     # MidnightProviderSet type definitions
├── public/                 # Static assets served at root URL path
│   ├── favicon.svg         # Site favicon
│   ├── logo.svg            # Application logo
│   ├── file.svg            # Icon SVG
│   ├── globe.svg           # Icon SVG
│   ├── window.svg          # Icon SVG
│   └── zk-keys/            # ZK proving/verifying keys (gitignored)
├── scripts/                # Utility scripts (deploy, address printing)
├── src/                    # React SPA source
│   ├── app.tsx             # Root App component (router + providers)
│   ├── main.tsx            # React DOM entry point
│   ├── globals.css         # Global styles (Tailwind + Aether theme)
│   ├── vite-env.d.ts       # Vite environment type declarations
│   └── routes/             # Page components (React Router)
│       ├── home.tsx         # Landing page (/)
│       ├── create-poll.tsx  # Create poll page (/create)
│       ├── poll-detail.tsx  # Poll detail/voting page (/poll/:id)
│       ├── deploy.tsx       # Contract deployment page (/deploy)
│       ├── stats.tsx        # Analytics dashboard (/stats)
│       └── verify.tsx       # Vote verification page (/verify)
├── AGENTS.md               # AI agent instructions
├── CLAUDE.md               # Points to AGENTS.md
├── index.html              # Vite SPA entry point
├── server.ts               # Bun.serve() production server
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
├── eslint.config.mjs       # ESLint flat config
├── package.json            # Dependencies and scripts
└── bun.lock                # Bun lockfile
```

## Directory Purposes

**`src/`:**
- Purpose: React SPA source — all UI components and routing
- Contains: Root App component, entry point, routes, global styles
- Key files: `app.tsx` (root), `main.tsx` (entry), `routes/` (pages)

**`lib/`:**
- Purpose: Shared application logic — blockchain, API, database
- Contains: Midnight SDK integration, metadata API handler, Neon Postgres client
- Key files: `midnight/contract-service.ts`, `api/metadata-handler.ts`, `db/client.ts`

**`contracts/`:**
- Purpose: Midnight Compact smart contract source and compilation
- Contains: `.compact` source files, compilation scripts, managed output
- Key files: `src/poll_manager.compact`, `scripts/compile.sh`

**`public/`:**
- Purpose: Static file serving — files accessible at `/{filename}` in browser
- Contains: SVG icons, logos, ZK proving keys
- Key files: `favicon.svg`, `logo.svg`, `zk-keys/`

**`scripts/`:**
- Purpose: Utility scripts for deployment and development
- Contains: Contract deployment, address utilities

**`.planning/`:**
- Purpose: Project planning documentation and codebase analysis
- Contains: Roadmap, phases, research, summaries, codebase mapping

## Key File Locations

**Entry Points:**
- `index.html`: Vite SPA entry — loads `src/main.tsx`
- `src/main.tsx`: React DOM entry — renders `<App />`
- `src/app.tsx`: Root component — sets up React Router and provider tree
- `server.ts`: Production server — Bun.serve() with API + static + SPA fallback

**Configuration:**
- `package.json`: Dependencies, scripts (`dev`, `build`, `serve`, `lint`)
- `vite.config.ts`: Vite config (WASM plugin, React plugin, Tailwind plugin, aliases, proxy)
- `tsconfig.json`: TypeScript compiler options (strict, ESNext, `@/*` alias)
- `eslint.config.mjs`: ESLint flat config with global ignores

**Core Logic:**
- `lib/midnight/contract-service.ts`: All smart contract interactions
- `lib/midnight/wallet-context.tsx`: Wallet connection state management
- `lib/api/metadata-handler.ts`: Metadata API (GET/POST)
- `lib/db/client.ts`: Neon Postgres client

## Where to Add New Code

**New Page Route:**
- Create: `src/routes/{route-name}.tsx`
- Register in: `src/app.tsx` router configuration

**New Component:**
- Create in `src/` alongside routes, or in a `src/components/` directory if shared
- Use named exports: `export function ComponentName()`

**New Utility/Library Code:**
- Create in `lib/` at project root
- Midnight SDK integration: `lib/midnight/`
- Database logic: `lib/db/`
- API handlers: `lib/api/`

**New API Route:**
- Add handler in `lib/api/`
- Register in `server.ts` fetch handler

**Static Assets:**
- Place in `public/` — accessible at `/{filename}` URL

## Import Patterns

**Path Aliases:**
- `@/*` maps to `./*` (project root) — configured in both `tsconfig.json` and `vite.config.ts`
- Use `@/src/...`, `@/lib/...`, etc. for absolute imports

**Current Import Style:**
- Type imports first: `import type { PollMetadata } from "@/lib/midnight/metadata-store"`
- External packages: `import { useQuery } from "@tanstack/react-query"`
- Internal modules: `import { useWalletContext } from "@/lib/midnight/wallet-context"`

**Barrel Exports:**
- Not used (no `index.ts` barrel files)

## Special Directories

**`dist/`:**
- Purpose: Vite build output
- Generated: Yes (by `bun run build`)
- Committed: No (in `.gitignore`)

**`contracts/managed/`:**
- Purpose: Compiled Compact contract output (auto-generated)
- Generated: Yes (by `bun run compile:contracts`)
- Committed: No (in `.gitignore`)

**`node_modules/`:**
- Purpose: Installed npm/bun packages
- Generated: Yes (by `bun install`)
- Committed: No (in `.gitignore`)

---

*Structure analysis: 2026-04-09*
