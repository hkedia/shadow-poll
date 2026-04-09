---
phase: 11-hono-api-migration
verified: 2026-04-09T13:15:53Z
status: human_needed
score: 8/8 must-haves verified
gaps: []
human_verification:
  - test: "Start server with bun run serve and hit each API endpoint"
    expected: "GET/POST /api/polls/metadata, GET /api/polls, GET /api/indexer/status, /block, /contract all respond with correct JSON shapes"
    why_human: "Requires running server with DATABASE_URL and indexer access; cannot verify programmatically without starting external services"
  - test: "Verify CORS headers appear on /api/* and /zk-keys/* responses"
    expected: "Access-Control-Allow-Origin header present on API and ZK key responses"
    why_human: "Requires live HTTP request inspection"
  - test: "Verify static file serving and SPA fallback work"
    expected: "public/ files served at root, dist/ files served, unmatched routes return index.html"
    why_human: "Requires running server and browser/curl to test file serving behavior"
---

# Phase 11: Hono API Migration Verification Report

**Phase Goal:** Migrate the API layer from Bun server to Hono framework
**Verified:** 2026-04-09T13:15:53Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | bun run serve starts a Hono server that responds to all existing API endpoints | ✓ VERIFIED | server.ts:72-75 uses `Bun.serve({ fetch: app.fetch })`; all 6 API routes defined in Hono sub-routers |
| 2 | server.ts uses Bun.serve({ fetch: app.fetch }) with hono/bun adapter | ✓ VERIFIED | server.ts:72-75 `Bun.serve({ port: PORT, fetch: app.fetch })`; line 19 `import { Hono } from "hono"` |
| 3 | lib/api/routes.ts exports a Hono router with /api/* routes | ✓ VERIFIED | routes.ts:14 `export const apiRoutes = new Hono()`; lines 18-20 mount metadataRoutes, pollsRoutes, indexerRoutes; line 16 applies CORS middleware |
| 4 | All existing API response shapes are unchanged | ✓ VERIFIED | Handler functions (handleGet, handlePost, handlePollsRequest, handleStatus, handleBlock, handleContract) preserved unchanged; Hono routes delegate to same functions via `c.req.raw` |
| 5 | CORS headers are set via Hono middleware on /api/* and /zk-keys/* routes | ✓ VERIFIED | routes.ts:16 `apiRoutes.use("/api/*", cors())`; server.ts:31 `app.all("/zk-keys/*", cors({...}))`; polls-handler.ts:20 and indexer-handler.ts:23 also apply domain-specific CORS |
| 6 | Static file serving from public/ and dist/ still works | ✓ VERIFIED | server.ts:44-52 (public/ serving) and server.ts:55-63 (dist/ serving) use Bun.file() with existence check, same pattern as before |
| 7 | SPA fallback to dist/index.html still works | ✓ VERIFIED | server.ts:66-70 `app.get("*", ...)` serves `dist/index.html` with Content-Type: text/html |
| 8 | bun run build succeeds with no TypeScript errors | ✓ VERIFIED | `bun run build` completed successfully; warnings about WebSocket imports are pre-existing (Midnight SDK) |

**Score:** 8/8 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `server.ts` | Hono app entry point with Bun.serve() | ✓ VERIFIED | Contains `import { Hono }`, `import { apiRoutes }`, `Bun.serve({ fetch: app.fetch })`, CORS, static serving, SPA fallback |
| `lib/api/routes.ts` | Hono router with all /api/* routes | ✓ VERIFIED | 20 lines, exports `apiRoutes`, imports and mounts all 3 sub-routers, applies CORS middleware |
| `lib/api/metadata-handler.ts` | Metadata API as Hono route | ✓ VERIFIED | 178 lines, exports `metadataRoutes`, defines GET/POST `/api/polls/metadata`, preserves handleGet/handlePost logic with Neon Postgres queries |
| `lib/api/polls-handler.ts` | Polls API as Hono route | ✓ VERIFIED | 109 lines, exports `pollsRoutes`, defines GET `/api/polls`, preserves handlePollsRequest with indexer data flow |
| `lib/api/indexer-handler.ts` | Indexer API as Hono route | ✓ VERIFIED | 157 lines, exports `indexerRoutes`, defines GET routes for status/block/contract, preserves handler logic |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| server.ts | lib/api/routes.ts | import `apiRoutes` | ✓ WIRED | server.ts:22 `import { apiRoutes } from "./lib/api/routes"`; line 28 `app.route("/", apiRoutes)` |
| lib/api/routes.ts | lib/api/metadata-handler.ts | import + mount `metadataRoutes` | ✓ WIRED | routes.ts:10 `import { metadataRoutes }`; line 18 `apiRoutes.route("/", metadataRoutes)` |
| lib/api/routes.ts | lib/api/polls-handler.ts | import + mount `pollsRoutes` | ✓ WIRED | routes.ts:11 `import { pollsRoutes }`; line 19 `apiRoutes.route("/", pollsRoutes)` |
| lib/api/routes.ts | lib/api/indexer-handler.ts | import + mount `indexerRoutes` | ✓ WIRED | routes.ts:12 `import { indexerRoutes }`; line 20 `apiRoutes.route("/", indexerRoutes)` |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| metadata-handler.ts | `rows` (SQL query results) | `sql` from `@/lib/db/client` (Neon Postgres) | Yes — parameterized SQL queries | ✓ FLOWING |
| polls-handler.ts | `contractState`, `polls` array | `indexerPublicDataProvider` + `fetchLatestBlock` from Midnight indexer | Yes — real on-chain data | ✓ FLOWING |
| indexer-handler.ts | `status`, `block`, `action` | `fetchPollContractStatus`, `fetchLatestBlock`, `fetchContractAction` from indexer-client | Yes — real indexer queries | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| TypeScript build succeeds | `bun run build` | Build completed successfully in 3.89s, dist/ output generated | ✓ PASS |
| No old URL routing in server.ts | `grep -c "url.pathname" server.ts` | 0 matches | ✓ PASS |
| Hono dependency in package.json | `grep '"hono"' package.json` | `"hono": "^4.12.12"` found | ✓ PASS |
| All 6 API endpoint routes defined | Hono route grep | 6 routes: metadata GET/POST, polls GET, indexer status/block/contract GET | ✓ PASS |
| Vite dev proxy preserved | `vite.config.ts` check | `/api` proxy to `localhost:3001` unchanged | ✓ PASS |

### Requirements Coverage

| Requirement | Source | Description | Status | Evidence |
|-------------|--------|-------------|--------|---------|
| HONO-01 | SPEC.md | All existing API endpoints respond with identical request/response shapes | ✓ SATISFIED | Handler functions preserved unchanged; Hono wraps same logic |
| HONO-02 | SPEC.md | server.ts uses hono/bun adapter with Bun.serve({ fetch: app.fetch }) | ✓ SATISFIED | server.ts:72-75 |
| HONO-03 | SPEC.md | API routes defined in separate route files under lib/api/ with Hono router | ✓ SATISFIED | 3 sub-router files + routes.ts combiner |
| HONO-04 | SPEC.md | CORS middleware applied to /api/* and /zk-keys/* routes | ✓ SATISFIED | routes.ts:16 + server.ts:31 + per-domain CORS in handlers |
| HONO-05 | SPEC.md | Static file serving from public/ and dist/ preserved | ✓ SATISFIED | server.ts:44-63 with Bun.file() pattern |
| HONO-06 | SPEC.md | SPA fallback to dist/index.html preserved | ✓ SATISFIED | server.ts:66-70 |
| HONO-07 | SPEC.md | bun run build succeeds with no TypeScript errors | ✓ SATISFIED | Build passes |
| HONO-08 | SPEC.md | Vite dev proxy continues routing /api to localhost:3001 | ✓ SATISFIED | vite.config.ts unchanged, proxy config intact |
| HONO-09 | SPEC.md | Centralized error handler for API routes | ⚠️ PARTIAL | No `app.onError()` middleware; individual handlers have own try/catch blocks. "Should" priority only — no unhandled exceptions leak stack traces from handler logic |
| HONO-10 | SPEC.md | dev:api and serve npm scripts unchanged | ✓ SATISFIED | package.json scripts unchanged: `"serve": "bun run server.ts"`, `"dev:api": "PORT=3001 bun run server.ts"` |

**Note:** HONO-09 is "Should" priority per SPEC.md, not "Must". Individual handlers have comprehensive try/catch error handling that prevents raw stack traces from leaking. A centralized `app.onError()` middleware would be a nice-to-have improvement but is not required for the migration goal.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| polls-handler.ts:20 | 20 | Dual CORS headers (manual + middleware) | ℹ️ Info | `pollsRoutes.use("/api/polls*", cors())` plus manual CORS in `json()` helper — documented design decision (D-11-02) to minimize risk |
| indexer-handler.ts:23 | 23 | Dual CORS headers (manual + middleware) | ℹ️ Info | Same as above for `/api/indexer*` — harmless duplicate headers |

No TODO/FIXME/placeholder comments found. No empty implementations found. No stub patterns found. No `return null`, `return {}`, or `return []` stubs. No console.log-only handlers.

### Human Verification Required

### 1. Server Startup and API Endpoint Responses

**Test:** Start the server with `bun run serve` and make HTTP requests to each of the 6 API endpoints
**Expected:** All endpoints respond with correct JSON shapes matching pre-migration behavior
**Why human:** Requires running server with DATABASE_URL configured and access to Midnight Preview indexer

### 2. CORS Header Verification

**Test:** Make a preflight OPTIONS request to `/api/polls/metadata` and `/zk-keys/` endpoints
**Expected:** `Access-Control-Allow-Origin` header present in responses
**Why human:** Requires live HTTP request inspection with running server

### 3. Static File Serving and SPA Fallback

**Test:** Request static files (favicon, etc.) and an arbitrary client-side route (e.g., `/poll/abc`)
**Expected:** Static files served from `public/` and `dist/`; unmatched routes return `dist/index.html`
**Why human:** Requires running server and browser/curl to test file serving behavior

### Gaps Summary

No code-level gaps found. All 8 must-have truths are verified at the code level. All artifacts exist, are substantive, and are properly wired. Data flows through real sources (Neon Postgres, Midnight indexer). The build passes cleanly. HONO-09 (centralized error handler) is partially met — individual handlers have error handling, but no global `app.onError()` middleware exists. This is a "Should" priority item, not a "Must" requirement for the phase goal.

The phase goal — "Migrate the API layer from Bun server to Hono framework" — is achieved. Human verification is needed to confirm the running server behaves correctly at runtime.

---

_Verified: 2026-04-09T13:15:53Z_
_Verifier: the agent (gsd-verifier)_