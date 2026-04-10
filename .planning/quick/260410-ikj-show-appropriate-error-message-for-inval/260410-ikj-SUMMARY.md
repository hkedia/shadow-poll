---
phase: quick/260410-ikj-show-appropriate-error-message-for-inval
plan: 01
subsystem: ui
tags: [error-handling, vote-panel, compact-contract, ux]

requires:
  - phase: 05-smart-contracts-extended
    provides: Compact contract assertion messages that reach the UI
provides:
  - Specific user-facing error messages for all 7 Compact contract assertion errors
  - Info/error icon distinction based on error type
affects: [vote-panel, error-handling, ux]

tech-stack:
  added: []
  patterns: [contract-error-message-mapping]

key-files:
  created: []
  modified:
    - components/vote-panel.tsx

key-decisions:
  - "Informational errors (already voted, invite code used, invalid invite code, expired, not found) show info icon; technical errors show error icon"

patterns-established:
  - "Contract assertion error mapping: match substring from error.message to user-friendly text with isInfo flag"

requirements-completed: [UX-01]

duration: 1min
completed: 2026-04-10
---

# Quick Task 260410-ikj: Show Appropriate Error Messages Summary

**Map all 7 Compact contract assertion errors to specific user-facing messages with info/error icon distinction in VotePanel**

## Performance

- **Duration:** 1 min
- **Started:** 2026-04-10T08:01:03Z
- **Completed:** 2026-04-10T08:03:50Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Fixed the reported bug: "Invalid invite code" now shows "This invite code is not valid for this poll" instead of generic "Failed to cast vote"
- Added specific messages for "Poll has expired", "Poll not found", "Invalid option index", and wrong vote method errors
- Distinguished informational errors (info icon) from technical errors (error icon) via `isInfo` flag

## Task Commits

Each task was committed atomically:

1. **Task 1: Add specific error messages for all contract assertion errors in VotePanel** - `4decab7` (fix)

## Files Created/Modified

- `components/vote-panel.tsx` - Extended error handler IIFE with specific messages for all 7 contract assertion errors and isInfo classification

## Decisions Made

- Informational errors (Already voted, Invite code already used, Invalid invite code, Poll has expired, Poll not found) show `info` icon since they convey user-facing status, not bugs
- Technical errors (Invalid option index, wrong vote method, transaction failures, generic fallback) show `error` icon

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Error handling for contract assertions is complete
- All vote-path error states now show meaningful messages to users

## Self-Check: PASSED

- `components/vote-panel.tsx` — FOUND
- Commit `4decab7` — FOUND

---
*Phase: quick/260410-ikj*
*Completed: 2026-04-10*