---
phase: 03-data-layer
plan: 02
subsystem: ui
tags: [tanstack-query, react-query, hooks, optimistic-updates, data-fetching]

requires:
  - phase: 03-data-layer
    provides: Ledger read utilities, metadata API route, typed providers
provides:
  - TanStack Query provider wrapping the app
  - Data hooks: usePoll, usePolls, useMetadata, useStoreMetadata, useVoteMutation
  - Optimistic vote tally update pattern (snapshot → increment → rollback/settle)
  - Query key factories for cache management
affects: [04-core-polling, 05-invite-only-polls, 06-zk-proofs-analytics]

tech-stack:
  added: ["@tanstack/react-query@5.96.2"]
  patterns: [query key factory, optimistic mutations with rollback, singleton QueryClient]

key-files:
  created:
    - lib/queries/query-client.ts
    - lib/queries/query-provider.tsx
    - lib/queries/use-poll.ts
    - lib/queries/use-polls.ts
    - lib/queries/use-metadata.ts
    - lib/queries/use-vote-mutation.ts
  modified:
    - app/layout.tsx
    - package.json

key-decisions:
  - "D-32: TanStack Query for all data fetching, caching, and optimistic updates"
  - "QueryClient defaults: 10s staleTime, 5min gcTime, no mutation retry"
  - "usePoll refetchInterval: 15s for live tallies; usePolls: 30s for trending"
  - "useMetadata staleTime: 60s (metadata is immutable after creation)"
  - "On-chain query placeholders in usePoll/usePolls — real implementation in Phase 4"

patterns-established:
  - "Query key factory: pollKeys.all/lists/detail(id)/tallies(id) and metadataKeys.all/detail(id)"
  - "Optimistic mutation: onMutate snapshot + cache update → onError rollback → onSettled invalidate"
  - "QueryProvider inside WalletProvider in root layout"

requirements-completed: [DATA-04]

duration: 10min
completed: 2026-04-08
---

# Plan 03-02: TanStack Query Integration + Optimistic Updates Summary

**TanStack Query data layer with poll/metadata hooks and optimistic vote tallies that roll back on failure**

## Performance

- **Duration:** ~10 min
- **Tasks:** 3
- **Files created:** 6
- **Files modified:** 2

## Accomplishments
- Installed @tanstack/react-query and wired QueryProvider into root layout inside WalletProvider
- Created data hooks for single poll (usePoll), all polls (usePolls), and metadata (useMetadata, useStoreMetadata)
- Implemented useVoteMutation with full optimistic update cycle: snapshot tallies, increment chosen option, rollback on error, invalidate on settlement
- Query key factories enable precise cache invalidation across hooks

## Files Created/Modified
- `lib/queries/query-client.ts` — Singleton QueryClient with polling-optimized defaults
- `lib/queries/query-provider.tsx` — Client component wrapping children with QueryClientProvider
- `lib/queries/use-poll.ts` — usePoll hook, pollKeys factory, PollDetail type (on-chain queries are Phase 4 placeholders)
- `lib/queries/use-polls.ts` — usePolls hook for poll list (Phase 4 placeholder)
- `lib/queries/use-metadata.ts` — useMetadata (GET) and useStoreMetadata (POST) hooks — fully functional via API route
- `lib/queries/use-vote-mutation.ts` — useVoteMutation with optimistic tally updates and rollback
- `app/layout.tsx` — Added QueryProvider wrapping content inside WalletProvider
- `package.json` — Added @tanstack/react-query dependency

## Decisions Made
- Placed QueryProvider inside WalletProvider so query hooks can access wallet context
- On-chain poll/tally queries return null/empty placeholders — Phase 4 will wire the actual indexer calls
- useStoreMetadata seeds the query cache on success to avoid a round-trip GET after POST

## Deviations from Plan
None — plan executed as written.

## Issues Encountered
None.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- Data hooks ready for Phase 4 UI components to consume
- Phase 4 needs to fill in queryFn implementations in usePoll and usePolls with actual indexer calls
- Phase 4 needs to fill in mutationFn in useVoteMutation with actual cast_vote circuit call

---
*Phase: 03-data-layer*
*Completed: 2026-04-08*
