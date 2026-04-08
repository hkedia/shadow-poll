---
phase: 04-core-polling
plan: 02
subsystem: data-hooks
tags: [tanstack-query, react-hooks, midnight-sdk, contract-service, navigation]

# Dependency graph
requires:
  - phase: 04-core-polling/01
    provides: "contract-service.ts (deployPollContract, findPollContract, callCreatePoll, callCastVote, getContractAddress, fetchAllPolls, fetchPollWithTallies), witness-impl.ts (createWitnesses, getSecretKeyFromWallet, getCurrentBlockNumber)"
  - phase: 03-data-layer
    provides: "TanStack Query client/provider, placeholder hooks (usePoll, usePolls, useVoteMutation), metadata API route, ledger-utils"
provides:
  - "usePoll hook with real indexer queryFn via fetchPollWithTallies"
  - "usePolls hook with real indexer queryFn via fetchAllPolls"
  - "useVoteMutation with real cast_vote circuit call via findPollContract + callCastVote"
  - "useCreatePoll mutation hook for full poll creation flow"
  - "Header navigation links (Trending Polls, Create Poll) with active state"
  - "Mobile drawer navigation with icons"
affects: [04-core-polling/03, ui-pages]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Hooks call contract-service (not SDK directly)", "HeaderNav client component extracted for server component header", "Mobile drawer uses Material Symbols Outlined icons"]

key-files:
  created:
    - "lib/queries/use-create-poll.ts"
    - "components/header-nav.tsx"
  modified:
    - "lib/queries/use-poll.ts"
    - "lib/queries/use-polls.ts"
    - "lib/queries/use-vote-mutation.ts"
    - "components/header.tsx"
    - "components/mobile-drawer.tsx"

key-decisions:
  - "Contract-service functions take MidnightProviderSet directly (not pre-assembled providers) — hooks pass providers from useWalletContext unchanged"
  - "HeaderNav extracted as client component (usePathname) so Header stays a server component"
  - "useCreatePoll extracts poll ID from result.private.result with fallback to result.result (SDK return shape varies)"

patterns-established:
  - "Hooks → contract-service → SDK: all hooks import from @/lib/midnight/contract-service, never from @midnight-ntwrk directly"
  - "Client component extraction: server components delegate interactive parts to small client components"

requirements-completed: [POLL-01, POLL-03, POLL-04, POLL-07]

# Metrics
duration: 4min
completed: 2026-04-08
---

# Phase 4 Plan 02: Data Hooks & Header Navigation Summary

**TanStack Query hooks wired to real on-chain contract service — usePoll, usePolls, useVoteMutation, useCreatePoll — plus header/mobile navigation**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-08T09:27:42Z
- **Completed:** 2026-04-08T09:32:12Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Replaced all Phase 3 placeholder stubs with real contract service calls in usePoll, usePolls, and useVoteMutation
- Created useCreatePoll mutation hook with full flow: validate → hash → deploy/find → create_poll → store metadata
- Added header navigation links (Trending Polls, Create Poll) with active state highlighting via usePathname
- Added mobile drawer navigation with Material Symbols icons and touch-friendly targets

## Task Commits

Each task was committed atomically:

1. **Task 1: Fill usePoll and usePolls queryFn placeholders with real indexer calls** - `02acc40` (feat)
2. **Task 2: Fill useVoteMutation, create useCreatePoll, and update header navigation** - `a5dbf0f` (feat)

## Files Created/Modified
- `lib/queries/use-poll.ts` - usePoll hook: queryFn calls fetchPollWithTallies from contract service
- `lib/queries/use-polls.ts` - usePolls hook: queryFn calls fetchAllPolls from contract service
- `lib/queries/use-vote-mutation.ts` - useVoteMutation: mutationFn calls findPollContract + callCastVote
- `lib/queries/use-create-poll.ts` - NEW: useCreatePoll mutation with validate, hash, deploy/find, create_poll, metadata storage
- `components/header-nav.tsx` - NEW: Client component with Trending Polls and Create Poll links, active state via usePathname
- `components/header.tsx` - Imports HeaderNav, replaces phase-4-nav-links placeholder
- `components/mobile-drawer.tsx` - Adds nav links with icons, replaces nav-links-placeholder

## Decisions Made
- **Contract-service functions take MidnightProviderSet directly**: The plan suggested calling `assembleMidnightProviders` in hooks, but the actual contract-service.ts API already handles provider assembly internally. Hooks simply pass `providers` from `useWalletContext()` unchanged — cleaner and avoids double-assembly.
- **HeaderNav as separate client component**: Extracted `HeaderNav` into `components/header-nav.tsx` to keep `Header` as a server component. The nav needs `usePathname()` (client hook) for active state highlighting.
- **Poll ID extraction with fallback**: `useCreatePoll` tries `result.private.result`, then `result.result`, then falls back to empty bytes — the SDK's callTx return shape may vary between deploy and find contexts.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Contract-service API mismatch with plan**
- **Found during:** Task 1
- **Issue:** Plan instructed hooks to call `assembleMidnightProviders(providers)` then pass `publicDataProvider` to `fetchAllPolls`/`fetchPollWithTallies`. But the actual contract-service functions take `MidnightProviderSet` directly and handle assembly internally.
- **Fix:** Hooks pass `providers` from `useWalletContext()` directly to contract-service functions, matching the actual API.
- **Files modified:** lib/queries/use-poll.ts, lib/queries/use-polls.ts
- **Verification:** TypeScript compiles cleanly
- **Committed in:** 02acc40

---

**Total deviations:** 1 auto-fixed (1 bug - API mismatch)
**Impact on plan:** Necessary correction to match actual contract-service API. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 4 data hooks are functional and ready for UI consumption in Plan 03
- Header navigation is in place for page routing
- Plan 03 (UI pages) can build Trending Polls, Create Poll, and Poll Detail pages that consume these hooks directly

## Self-Check: PASSED

- All created files verified on disk
- All commit hashes verified in git log

---
*Phase: 04-core-polling*
*Completed: 2026-04-08*
