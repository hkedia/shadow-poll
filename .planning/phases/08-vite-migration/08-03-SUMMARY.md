---
phase: 08-vite-migration
plan: 03
subsystem: api, infra
tags: [bun-serve, metadata-api, web-standard-request-response, spa-fallback, cors]

# Dependency graph
requires:
  - phase: 08-01
    provides: Vite build configuration and src/ directory structure
  - phase: 07-persistent-data-layer
    provides: Neon DB client (lib/db/client.ts) and migrations (lib/db/migrations.ts)
provides:
  - "Bun.serve() production server (server.ts) for API, static files, and SPA fallback"
  - "Web standard metadata API handler (lib/api/metadata-handler.ts)"
affects: [deployment, production-serving]

# Tech tracking
tech-stack:
  added: [Bun.serve()]
  patterns: [web-standard-request-response, dynamic-import-for-api-routes, spa-fallback-routing]

key-files:
  created:
    - server.ts
    - lib/api/metadata-handler.ts
  modified:
    - scripts/deploy.ts

key-decisions:
  - "Dynamic import for metadata handler in server.ts — keeps cold start fast and isolates DB module loading"
  - "Web standard Request/Response instead of Next.js NextRequest/NextResponse — framework-agnostic API layer"
  - "CORS only on /zk-keys/* path — public proving keys by design, all other routes restricted"

patterns-established:
  - "Bun.serve() fetch handler pattern: API routes → public/ static → dist/ static → SPA fallback"
  - "json() helper for consistent Response creation with Content-Type header"

requirements-completed: [MIGR-03]

# Metrics
duration: 3min
completed: 2026-04-08
---

# Phase 08 Plan 03: Bun.serve() Production Server & Metadata API Summary

**Bun.serve() production server with metadata API handler migrated from Next.js route handler to Web standard Request/Response, serving static files from dist/ with SPA fallback**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-08T20:27:19Z
- **Completed:** 2026-04-08T20:30:11Z
- **Tasks:** 1
- **Files modified:** 3

## Accomplishments
- Created Bun.serve() server (server.ts) handling API routes, ZK key serving with CORS, static file serving, and SPA fallback
- Migrated metadata API handler from Next.js route handler to Web standard Request/Response (lib/api/metadata-handler.ts)
- Updated deploy script env var references from NEXT_PUBLIC_POLL_CONTRACT_ADDRESS to VITE_POLL_CONTRACT_ADDRESS
- Confirmed no NextRequest/NextResponse imports remain in lib/ or src/

## Task Commits

Each task was committed atomically:

1. **Task 1: Create metadata handler and Bun.serve() server** - `f9dce93` (feat)

## Files Created/Modified
- `server.ts` - Bun.serve() production server with API routing, static file serving, SPA fallback, and CORS for ZK keys
- `lib/api/metadata-handler.ts` - Metadata API handler using Web standard Request/Response (GET list/single, POST upsert)
- `scripts/deploy.ts` - Updated env var references to VITE_POLL_CONTRACT_ADDRESS

## Decisions Made
- Dynamic import for metadata handler in server.ts to keep cold start fast and isolate DB module loading
- Web standard Request/Response for framework-agnostic API layer — no Next.js server dependencies
- CORS `Access-Control-Allow-Origin: *` only on `/zk-keys/*` path — proving keys are public by design

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 08 complete — all 3 plans (Vite config, component migration, production server) executed
- Ready for build verification and production deployment testing

## Self-Check: PASSED

All created files verified on disk. Task commit f9dce93 verified in git log.

---
*Phase: 08-vite-migration*
*Completed: 2026-04-08*
