# Milestones

## v1.0 MVP (Shipped: 2026-04-10)

**Phases completed:** 13 phases, 31 plans, 40 tasks

**Key accomplishments:**

- shadcn/ui installed with Aether Privacy dark design tokens, glass-blur app shell (Header/Footer/MobileDrawer) and all 7 UI primitives configured for wallet integration.
- Complete 1am.xyz wallet integration: detection, connect/disconnect, auto-reconnect, ZK provider assembly, and all wallet UI components satisfying all 7 WALL requirements.
- Root layout wired with WalletProvider and WalletButton, hero landing page with gradient 'Forge Your Voice' headline deployed, and Next.js 16 configured to externalize Midnight SDK WASM packages via Turbopack alias stubs.
- Real SDK indexer provider, typed ledger read utilities, and off-chain metadata API route with hash verification
- TanStack Query data layer with poll/metadata hooks and optimistic vote tallies that roll back on failure
- Contract service layer with deploy/find/call APIs, witness implementations, and full MidnightProviders assembly from wallet state
- TanStack Query hooks wired to real on-chain contract service — usePoll, usePolls, useVoteMutation, useCreatePoll — plus header/mobile navigation
- Three main UI pages — Trending Polls bento grid, Create Poll form with validation, and Poll Detail with radio voting + live results glass panel — all matching the Aether Privacy dark design system
- Compact contract extended with nullifier-based duplicate vote prevention, ZK invite code verification, and creator-gated code management — 2 new ledger maps, 2 pure circuits, 2 new circuits, 1 modified circuit, plus matching TypeScript hash utilities
- TypeScript service layer with crypto-secure invite code generation, contract interaction functions for invite-only circuits, and TanStack Query mutations — 3 new files, 5 modified, all wired to Plan 01's compiled contract
- Create Poll form with Public/Invite-Only toggle and code count slider, InviteCodePanel with Copy All/Download CSV/single-code copy, VotePanel with invite code input and Already voted handling, PollCard with invite-only badge — all using tertiary color theme for invite-only elements
- One-liner:
- One-liner:
- Completed:
- Commit:
- Bun.serve() production server with metadata API handler migrated from Next.js route handler to Web standard Request/Response, serving static files from dist/ with SPA fallback
- One-liner:
- One-liner:
- One-liner:
- Migrated Bun.serve() API layer to Hono framework with per-domain sub-routers, CORS middleware, and preserved all response shapes
- Minor:
- Minor:
- Component tests skipped.

---
