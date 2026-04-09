# Phase 11: Hono API Migration — Specification

## Goal

Replace the raw `Bun.serve()` API layer in `server.ts` with the Hono web framework, gaining structured routing, built-in middleware, type-safe request handling, and a cleaner separation of concerns — while preserving all existing API functionality and the Vite dev proxy setup.

## Motivation

The current `server.ts` uses a single `fetch()` handler with a chain of `if/else` branches for URL matching. This works but has several limitations:

1. **No structured routing** — Every new route requires another `if` branch in the `fetch()` function, making the file grow linearly and harder to reason about.
2. **No middleware** — CORS headers, error handling, and request logging are all inline. Hono provides middleware for all of these.
3. **No type-safe route params** — Query params and request bodies are parsed manually with no compile-time validation.
4. **No path param extraction** — The indexer handler manually parses `/api/indexer/*` sub-paths with string manipulation.
5. **Difficult to test** — Route handlers are coupled to the Bun.serve() entry point and can't be tested independently.

Hono is the natural choice because:
- First-class Bun adapter (`hono/bun`) — `Bun.serve({ fetch: app.fetch })` is the integration pattern
- Web standard `Request`/`Response` — all existing handlers already use these, zero refactoring needed for handler logic
- Small bundle size (~14KB), zero dependencies
- Built-in CORS middleware, error boundaries, and body parsing
- Type-safe routing with path params and query params

## Scope

### In Scope

- Install `hono` package and create route files under `lib/api/`
- Rewrite `server.ts` to use Hono app with `Bun.serve({ fetch: app.fetch })`
- Convert all 3 API handlers to Hono route definitions
- Add CORS middleware and centralized error handling
- Preserve static file serving from `public/` and `dist/`
- Preserve SPA fallback to `index.html`
- Keep all existing API response shapes unchanged
- Verify Vite dev proxy still works (`/api` → `localhost:3001`)

### Out of Scope

- No changes to the Vite client bundle or SPA routes
- No changes to database schema or queries
- No new API endpoints or feature changes
- No deployment pipeline changes (still `bun run serve`)
- No authentication or authorization changes

## Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| HONO-01 | All existing API endpoints respond with identical request/response shapes | Must |
| HONO-02 | `server.ts` uses `hono/bun` adapter with `Bun.serve({ fetch: app.fetch })` | Must |
| HONO-03 | API routes defined in separate route files under `lib/api/` with Hono router | Must |
| HONO-04 | CORS middleware applied to `/api/*` and `/zk-keys/*` routes | Must |
| HONO-05 | Static file serving from `public/` and `dist/` preserved | Must |
| HONO-06 | SPA fallback to `dist/index.html` preserved for client-side routes | Must |
| HONO-07 | `bun run build` succeeds with no TypeScript errors | Must |
| HONO-08 | Vite dev proxy continues routing `/api` to `localhost:3001` during development | Must |
| HONO-09 | Centralized error handler for API routes (no unhandled exceptions return raw stack traces) | Should |
| HONO-10 | `dev:api` and `serve` npm scripts unchanged (still `bun run server.ts`) | Must |

## Success Criteria

1. `bun run serve` starts the Hono server on the configured port
2. `GET /api/polls/metadata` returns poll metadata (same shape as before)
3. `POST /api/polls/metadata` creates/updates poll metadata (same shape as before)
4. `GET /api/polls` returns on-chain poll data with tallies (same shape as before)
5. `GET /api/polls?id=<hex>` returns a single poll (same shape as before)
6. `GET /api/indexer/status`, `/api/indexer/block`, `/api/indexer/contract` all work
7. `GET /zk-keys/*` serves ZK proving keys with CORS headers
8. Static files from `public/` and `dist/` are served correctly
9. SPA fallback serves `dist/index.html` for all unmatched non-API routes
10. `bun run build` produces a clean production bundle

## Dependencies

- **Phase 8** (Vite Migration) — completed; provides current `server.ts` and build setup
- **Phase 9** (Integration Fixes) — completed; provides current API handler implementations
- **Phase 7** (Persistent Data Layer) — API pending but handler code exists; Hono migration must not break Neon Postgres integration

## Files Affected

| File | Change |
|------|--------|
| `package.json` | Add `hono` dependency |
| `server.ts` | Rewrite to use Hono app with Bun adapter |
| `lib/api/metadata-handler.ts` | Convert to Hono route (or create separate route file) |
| `lib/api/polls-handler.ts` | Convert to Hono route (or create separate route file) |
| `lib/api/indexer-handler.ts` | Convert to Hono route (or create separate route file) |
| `lib/api/routes.ts` | NEW — Hono router combining all API routes |
| `vite.config.ts` | No changes needed (proxy config stays the same) |

## Approach

1. Install `hono` as a dependency
2. Create `lib/api/routes.ts` — a Hono app that mounts all API sub-routers
3. Convert each handler to a Hono sub-router (preserving function signatures where possible)
4. Add CORS middleware and error boundary middleware to the Hono app
5. Rewrite `server.ts` to create a root Hono app that mounts `/api` routes and serves static files with SPA fallback
6. Test all endpoints against existing behavior

## Design Decisions

- **D-110**: Use Hono's `Hono<{ Variables: ... }>()` typed router for each API domain (metadata, polls, indexer) rather than one monolithic route file
- **D-111**: Keep static file serving and SPA fallback in `server.ts` as Hono `all()` catch-all routes rather than using Hono's serveStatic (Bun.file() is simpler and already works)
- **D-112**: Keep handler business logic in existing `lib/api/*-handler.ts` files — only wrap them in Hono route definitions, don't rewrite internals
- **D-113**: Mount API routes at `/api` prefix using Hono's `route()` method for clean separation
- **D-114**: Use `hono/bun` adapter's `Bun.serve({ fetch: app.fetch })` pattern — no custom fetch wrapper needed