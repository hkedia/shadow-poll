---
phase: 05-invite-only-polls
plan: 03
subsystem: ui
tags: [invite-codes, poll-type-toggle, invite-code-panel, vote-panel, poll-card, clipboard-api, csv-export]

# Dependency graph
requires:
  - phase: 05-invite-only-polls
    plan: 02
    provides: "useCreatePoll with pollType/inviteCodeCount, useInviteVoteMutation, invite-codes.ts formatters"
provides:
  - "Create Poll form with Public/Invite-Only toggle and code count slider"
  - "InviteCodePanel component with Copy All, Download CSV, single-code copy"
  - "VotePanel with invite code input for invite-only polls and Already voted handling"
  - "PollCard with invite-only badge (lock icon, tertiary color)"
  - "PollDetailPage passing pollType to VotePanel with invite-only indicator"
affects: [05-invite-only-polls]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Number(poll.data.poll_type) === 1 for PollType comparison (avoids compact-runtime import in client)"
    - "Dynamic import for invite-codes.ts in InviteCodePanel (clipboard/CSV formatters)"
    - "Uppercase normalization in invite code input via toUpperCase() onChange handler"
    - "activeMutation pattern: select mutation based on pollType for shared pending/error UI"

key-files:
  created:
    - components/invite-code-panel.tsx
  modified:
    - components/create-poll-form.tsx
    - components/vote-panel.tsx
    - components/poll-card.tsx
    - app/poll/[id]/page.tsx

key-decisions:
  - "Number(poll_type) === 1 instead of PollType.invite_only enum — avoids importing contract module with compact-runtime dependency in client components (Turbopack stub issue)"
  - "InviteCodePanel uses dynamic import for invite-codes.ts formatters — only loaded when panel is displayed"
  - "activeMutation pattern in VotePanel — single variable selects correct mutation for shared isPending/isError UI"

patterns-established:
  - "Poll type detection: Number(poll.data.poll_type) === 1 for invite-only in client components"
  - "Tertiary color (turquoise) for all invite-only UI elements, primary (lavender) for public"
  - "activeMutation pattern for dual mutation handlers in a single component"

requirements-completed: [POLL-02, POLL-05, POLL-06, PAGE-02, PAGE-03]

# Metrics
duration: 7min
completed: 2026-04-08
---

# Phase 5 Plan 03: Invite-Only Poll UI Summary

**Create Poll form with Public/Invite-Only toggle and code count slider, InviteCodePanel with Copy All/Download CSV/single-code copy, VotePanel with invite code input and Already voted handling, PollCard with invite-only badge — all using tertiary color theme for invite-only elements**

## Performance

- **Duration:** 7 min
- **Started:** 2026-04-08T10:24:40Z
- **Completed:** 2026-04-08T10:31:53Z
- **Tasks:** 3 (of 4 — Task 4 is human-verify checkpoint, skipped per instructions)
- **Files created:** 1
- **Files modified:** 4

## Accomplishments

- Added Public/Invite-Only toggle to Create Poll form with invite code count slider (1-100) and conditional ZK trust messaging
- Created InviteCodePanel component with responsive code grid, Copy All (clipboard), Download CSV, per-code click-to-copy, and save warning
- Updated VotePanel with invite code input for invite-only polls, dual mutation handler (public vs invite-only), and distinct "Already voted" error messaging
- Updated PollCard to show "Invite Only" badge with lock icon in tertiary color or "Public" in primary color based on poll_type
- Updated PollDetailPage to pass pollType to VotePanel and display invite-only indicator badge

## Task Commits

Each task was committed atomically:

1. **Task 1: Update Create Poll form with Public/Invite-Only toggle** — `c8eeada` (feat)
2. **Task 2: Create InviteCodePanel component** — `8461c59` (feat)
3. **Task 3: Update VotePanel, PollCard, and PollDetailPage for invite-only support** — `bf520e3` (feat)

## Files Created/Modified

- `components/invite-code-panel.tsx` — **NEW** — Invite code display panel with Copy All, Download CSV, single-code copy, save warning, and View Your Poll navigation (125 lines)
- `components/create-poll-form.tsx` — Added pollType toggle (Public/Invite-Only), inviteCodeCount slider, createdCodes state, InviteCodePanel early return, updated ZK trust messaging (260→342 lines)
- `components/vote-panel.tsx` — Added pollType prop, invite code input field, useInviteVoteMutation, activeMutation pattern, "Already voted" distinct error (142→195 lines)
- `components/poll-card.tsx` — Added isInviteOnly check, "Invite Only" badge with lock icon and tertiary color (72→79 lines)
- `app/poll/[id]/page.tsx` — Added isInviteOnly flag, invite-only indicator, pollType prop to VotePanel (200→210 lines)

## Decisions Made

- **Number(poll_type) for comparison:** Used `Number(poll.data.poll_type) === 1` instead of `PollType.invite_only` enum comparison to avoid importing the contract module (which triggers compact-runtime in Turbopack-stubbed client bundles). Safe because PollType is a simple 0/1 enum.
- **Dynamic import for invite-codes formatters:** `InviteCodePanel` uses `await import("@/lib/midnight/invite-codes")` for `formatCodesForCopy` and `formatCodesForCSV` — keeps the panel lightweight until displayed.
- **activeMutation pattern:** Single `activeMutation` variable selects between `voteMutation` and `inviteVoteMutation` based on `pollType`, enabling shared `isPending`/`isError` UI without duplicating JSX.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Avoided PollType enum import in client components**
- **Found during:** Task 3
- **Issue:** Plan suggested importing `PollType` from `@/contracts/managed/contract` for enum comparison, but this module imports `@midnight-ntwrk/compact-runtime` which is stubbed by Turbopack in client bundles
- **Fix:** Used `Number(poll.data.poll_type) === 1` instead of `PollType.invite_only` comparison
- **Files modified:** `components/poll-card.tsx`, `app/poll/[id]/page.tsx`
- **Commit:** `bf520e3`

---

**Total deviations:** 1 auto-fixed (Rule 3 blocking)
**Impact on plan:** Necessary to avoid runtime errors in Turbopack client bundles. No functional difference.

## Issues Encountered

None beyond the auto-fixed deviation above.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Complete invite-only poll UI flow is ready for end-to-end testing (Task 4 human-verify)
- All components use tertiary color consistently for invite-only elements
- TypeScript compiles without errors; `bun run build` passes cleanly
- Ready for Phase 6 or additional polish iterations

## Self-Check: PASSED

- ✅ `components/invite-code-panel.tsx` exists with InviteCodePanel export
- ✅ `components/create-poll-form.tsx` has poll type toggle and InviteCodePanel import
- ✅ `components/vote-panel.tsx` has pollType prop and invite code input
- ✅ `components/poll-card.tsx` has isInviteOnly badge logic
- ✅ `app/poll/[id]/page.tsx` passes pollType to VotePanel
- ✅ Commit c8eeada exists (Task 1)
- ✅ Commit 8461c59 exists (Task 2)
- ✅ Commit bf520e3 exists (Task 3)
- ✅ `npx tsc --noEmit` passes with zero errors
- ✅ `bun run build` completes successfully

---
*Phase: 05-invite-only-polls*
*Completed: 2026-04-08*
