---
phase: 06-zk-proofs-analytics
plan: "02"
subsystem: ui
tags: [zk-proofs, analytics, proof-panel, verify-page, stats-page, header-nav]
dependency_graph:
  requires:
    - lib/queries/use-participation-proof.ts (plan 06-01)
    - lib/queries/use-verify-proof.ts (plan 06-01)
    - lib/queries/use-stats.ts (plan 06-01)
    - lib/midnight/proof-badge.ts (plan 06-01)
    - lib/queries/use-metadata.ts
    - components/ui/spinner.tsx
  provides:
    - components/proof-panel.tsx
    - app/verify/page.tsx
    - app/stats/page.tsx
  affects:
    - app/poll/[id]/page.tsx (ProofPanel added)
    - components/header-nav.tsx (Analytics link added)
tech_stack:
  added: []
  patterns:
    - Client component with useSearchParams() wrapped in Suspense boundary
    - Blob URL for SVG badge download (client-side, no server involved)
    - Three-state proof panel (loading, not-voted, verified)
    - Stat card grid (2-col mobile, 3-col desktop)
key_files:
  created:
    - components/proof-panel.tsx
    - app/verify/page.tsx
    - app/stats/page.tsx
  modified:
    - app/poll/[id]/page.tsx
    - components/header-nav.tsx
    - components/ui/spinner.tsx
decisions:
  - "Spinner extended with lg size (Rule 1: auto-fix — plan referenced size='lg' but Spinner only had sm/md)"
  - "MostVotedCard receives poll prop directly instead of separate pollId — avoids type split across useMetadata"
  - "useMetadata return value is data.metadata.title (MetadataResponse shape) not metadata.title directly"
metrics:
  duration_minutes: 5
  completed_date: "2026-04-08"
  tasks_completed: 6
  files_created: 3
  files_modified: 3
requirements: [ZKPR-01, ZKPR-02, ZKPR-03, PAGE-05]
---

# Phase 06 Plan 02: ZK Proofs & Analytics UI Summary

**One-liner:** ProofPanel with copy link + SVG badge download, /verify third-party proof checker, /stats global analytics dashboard with 6 live stat cards, and Analytics link in header nav.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create ProofPanel component | 8012444 | components/proof-panel.tsx, components/ui/spinner.tsx |
| 2 | Create /verify page | d5a20f3 | app/verify/page.tsx |
| 3 | Create /stats page | 6b441c0 | app/stats/page.tsx |
| 4 | Add ProofPanel to poll detail page | b5d076f | app/poll/[id]/page.tsx |
| 5 | Add Analytics nav link | 57fe830 | components/header-nav.tsx |
| 6 | Final TypeScript + ESLint verification | — | All 0 errors, 7 pre-existing warnings |

## What Was Built

### `components/proof-panel.tsx`
Client component rendering three states for poll participants:
- **Loading:** Spinner with "Checking participation proof..."
- **Not voted:** Muted prompt to vote for generating a proof
- **Verified:** Full sharing UI with copy link button (clipboard API + "Copied!" feedback) and download SVG badge button (Blob URL download)

### `app/verify/page.tsx`
Third-party verification page reading `pollId` and `nullifier` from URL search params via `useSearchParams()`. Wrapped in Suspense boundary (Next.js requirement). Five states: missing params, needs wallet, loading, verified (turquoise verified_user icon + proof card), invalid (error icon). Uses `useVerifyProof()` for on-chain check and `useMetadata()` for poll title.

### `app/stats/page.tsx`
Global analytics dashboard with `useStats()`. Six responsive stat cards (2-col/3-col grid): Total Polls, Total Votes, Active Polls, Public Polls, Invite-Only, Avg Votes/Poll. Featured "Most Active Poll" card links to the poll page. Handles needs-wallet, loading skeleton, and error states.

### Updates
- **`app/poll/[id]/page.tsx`:** ProofPanel inserted below VotePanel, shown when `isConnected && poll !== null`
- **`components/header-nav.tsx`:** Third nav link `{ href: "/stats", label: "Analytics" }` added

## Decisions Made

- **Spinner lg size:** Extended Spinner to support `size="lg"` (h-12 w-12). Plan referenced this size for verify and stats pages but Spinner only had sm/md (Rule 1 auto-fix).
- **MostVotedCard receives full poll prop:** Takes `poll: PollWithId & { tallies: PollTallies }` directly from `stats.mostVotedPoll` — cleaner than separating pollId and totalVotes into fragmented props.
- **useMetadata return shape:** Accessed as `data.metadata.title` (MetadataResponse has `{ pollId, metadata: { title, description, options }, metadataHash }` structure).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Spinner `size="lg"` not supported**
- **Found during:** Task 1 implementation
- **Issue:** Plan specified `size="lg"` for spinners in verify/loading and stats/null states, but `Spinner` component only accepted `"sm" | "md"`
- **Fix:** Added `"lg"` to SpinnerProps union type and added `size === "lg" && "h-12 w-12"` class mapping
- **Files modified:** `components/ui/spinner.tsx`
- **Commit:** 8012444

## Known Stubs

None — all components render live data from `useParticipationProof`, `useVerifyProof`, and `useStats` hooks. No placeholder values in any data path.

## Threat Flags

None — no new network endpoints, auth paths, or schema changes. Badge download is a client-side Blob — no server involved. Verify page URL params flow to `hexToBytes()` which validates hex encoding (T-06-UI-02 mitigated as planned).

## Self-Check: PASSED

Files created:
- ✅ components/proof-panel.tsx
- ✅ app/verify/page.tsx
- ✅ app/stats/page.tsx

Files modified:
- ✅ app/poll/[id]/page.tsx (ProofPanel import + render)
- ✅ components/header-nav.tsx (Analytics link)
- ✅ components/ui/spinner.tsx (lg size added)

Commits verified:
- ✅ 8012444 feat(06-02): create ProofPanel component
- ✅ d5a20f3 feat(06-02): create /verify page for third-party proof verification
- ✅ 6b441c0 feat(06-02): create /stats global analytics page
- ✅ b5d076f feat(06-02): add ProofPanel to poll detail page
- ✅ 57fe830 feat(06-02): add Analytics link to header nav

TypeScript: ✅ 0 errors
ESLint: ✅ 0 errors (7 pre-existing warnings in unrelated files)
