---
phase: quick
plan: 260410-ag2
subsystem: ui
tags: [expiration, ux, dates, block-conversion]
dependency_graph:
  requires: []
  provides: [human-readable-expiration]
  affects: [components/expiration-badge, components/results-panel, lib/utils]
tech_stack:
  added: []
  patterns: [block-to-date-conversion, relative-time-formatting]
key_files:
  created: []
  modified:
    - components/expiration-badge.tsx
    - components/results-panel.tsx
    - lib/utils.ts
decisions:
  - SECONDS_PER_BLOCK=10 as single source of truth in lib/utils.ts (not importing from create-poll-form)
  - Loading state shows "Loading expiration..." instead of raw block numbers
  - Expired state shows "Closed · Expired Dec 10" combining status and date
  - Active state shows "Expires Dec 15 (~2 days left)" combining absolute and relative time
metrics:
  duration: 2min
  tasks: 1
  files: 3
---

# Quick Task 260410-ag2: Update Poll Page Live Results to Show Human-Readable Expiration Summary

Replaced raw block number display with human-readable expiration dates across all poll pages — users now see "Expires Dec 15 (~2 days left)" instead of meaningless block numbers.

## Changes Made

### Task 1: Add block-to-date utility and update ExpirationBadge

**lib/utils.ts** — Added three utility functions:
- `blockToApproximateDate(expirationBlock, currentBlock?)` — converts block numbers to approximate Date using ~10s/block rate
- `formatExpirationDate(date)` — formats Date as "Dec 15, 2026" style string
- `formatRelativeTime(remainingSeconds)` — formats as "~2 days left" style relative string

**components/expiration-badge.tsx** — Complete rewrite:
- Active polls: `Expires Dec 15 (~2 days left)` — absolute date + relative time
- Expired polls: `Closed · Expired Dec 10` — status + absolute date
- Loading state: `Loading expiration...` — no raw block numbers shown

**components/results-panel.tsx** — Footer updated:
- Shows `12 total votes · Dec 15, 2026` alongside the ExpirationBadge
- Imports `blockToApproximateDate` and `formatExpirationDate` from utils

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None — no new trust boundaries beyond what the threat model already covers.

## Self-Check: PASSED

- FOUND: components/expiration-badge.tsx
- FOUND: components/results-panel.tsx
- FOUND: lib/utils.ts
- FOUND: 68ab310 (commit exists)