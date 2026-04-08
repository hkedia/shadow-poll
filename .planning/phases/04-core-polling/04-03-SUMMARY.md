---
phase: 04-core-polling
plan: 03
subsystem: ui
tags: [react, next-js, tailwind, aether-design-system, midnight-sdk, tanstack-query, bento-grid]

# Dependency graph
requires:
  - phase: 04-core-polling/01
    provides: "contract-service.ts (deploy, find, call APIs), witness-impl.ts (getCurrentBlockNumber)"
  - phase: 04-core-polling/02
    provides: "usePoll, usePolls, useVoteMutation, useCreatePoll hooks, HeaderNav navigation"
  - phase: 03-data-layer
    provides: "useMetadata hook, metadata-store.ts (validatePollMetadata, PollMetadata), ledger-utils.ts (PollWithId, PollTallies)"
  - phase: 01-wallet-ui-foundation
    provides: "Aether design system (globals.css tokens, Tailwind theme), shadcn/ui components (Button, Skeleton, Spinner), HeroSection, InstallPrompt, WalletProvider/useWalletContext"
provides:
  - "Trending Polls page (/) with bento grid, featured poll card, empty/loading/error states, FAB"
  - "Create Poll page (/create) with full validation form, duration selector, publish flow"
  - "Poll Detail page (/poll/[id]) with asymmetric layout, vote panel, live results panel"
  - "ExpirationBadge component (block-to-time conversion)"
  - "PollCard component (self-fetching metadata, trending list card)"
  - "VotePanel component (radio selection, anonymous vote, connect prompt, expired state)"
  - "ResultsPanel component (glass panel, progress bars, BigInt-safe percentages)"
  - "CreatePollForm component (question, dynamic options, duration, client-side validation)"
affects: [05-invite-only-polls, 06-zk-proofs-analytics]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Self-fetching card pattern: PollCard calls useMetadata(poll.id) internally instead of receiving metadata as prop"
    - "Block-to-time conversion: ~20 sec/block on Midnight Preview, BLOCKS_PER_DAY = 4320"
    - "Bento grid layout: md:grid-cols-12 with col-span-8/4 alternation for visual variety"
    - "Glass panel: bg-[rgba(35,36,58,0.6)] backdrop-blur-[30px] for results overlay"
    - "useParams<{ id: string }>() for Next.js 16 dynamic route params"

key-files:
  created:
    - "components/expiration-badge.tsx"
    - "components/poll-card.tsx"
    - "components/create-poll-form.tsx"
    - "components/vote-panel.tsx"
    - "components/results-panel.tsx"
    - "app/create/page.tsx"
    - "app/poll/[id]/page.tsx"
  modified:
    - "app/page.tsx"

key-decisions:
  - "PollCard self-fetches metadata via useMetadata(poll.id) — avoids N+1 problem at page level, each card independently resolves from TanStack Query cache"
  - "Block-based expiration uses getCurrentBlockNumber from witness-impl.ts with 30s polling interval in Poll Detail page"
  - "CreatePollForm uses BLOCKS_PER_DAY = BigInt(4320) constant for duration-to-blocks conversion (~20 sec/block)"
  - "ResultsPanel uses BigInt-safe percentage: Number(count * BigInt(1000) / total) / 10 for one decimal place"

patterns-established:
  - "Self-fetching card: components that need supplementary data call hooks internally rather than requiring parent to orchestrate"
  - "Bento grid: md:grid-cols-12 with featured (col-span-8) and standard (col-span-4) alternation"
  - "Glass panel styling for overlay components"
  - "Conditional page rendering: connected → feature view, disconnected → hero, not_detected → install prompt"

requirements-completed: [POLL-04, POLL-07, PAGE-01, PAGE-02, PAGE-03]

# Metrics
duration: 13min
completed: 2026-04-08
---

# Phase 4 Plan 03: Core Polling UI Pages Summary

**Three main UI pages — Trending Polls bento grid, Create Poll form with validation, and Poll Detail with radio voting + live results glass panel — all matching the Aether Privacy dark design system**

## Performance

- **Duration:** 13 min
- **Started:** 2026-04-08T09:35:22Z
- **Completed:** 2026-04-08T09:48:30Z
- **Tasks:** 3 (2 auto + 1 human-verify checkpoint)
- **Files modified:** 8

## Accomplishments
- Built Trending Polls page with bento grid layout (featured col-span-8 + standard col-span-4 cards), hero headline with gradient text, loading/empty/error states, and floating action button
- Built Create Poll form with question textarea (200 char limit), dynamic options list (2–10 with add/remove), 5-tier duration selector (1/3/7/14/30 days), client-side validation via validatePollMetadata(), and full on-chain publish flow
- Built Poll Detail page with asymmetric two-column layout: left column for trust badge + title + VotePanel (radio selection, anonymous vote button, connect/expired states), right column for ResultsPanel (glass panel with progress bars, live tally percentages) + Midnight Privacy Protocol info box
- Created 5 reusable components: ExpirationBadge, PollCard, CreatePollForm, VotePanel, ResultsPanel

## Task Commits

Each task was committed atomically:

1. **Task 1: Create shared components and Trending Polls page** - `1b5e29b` (feat)
2. **Task 2: Create Poll page and Poll Detail page with voting** - `66351c2` (feat)
3. **Task 3: Verify complete core polling UI flow** - Human-verified checkpoint (approved)

## Files Created/Modified
- `components/expiration-badge.tsx` - Block-to-time conversion badge (active/expired states)
- `components/poll-card.tsx` - Self-fetching trending list card with metadata, option previews, vote count
- `components/create-poll-form.tsx` - Full poll creation form with validation, dynamic options, duration, publish
- `components/vote-panel.tsx` - Radio option selection with anonymous vote, connect wallet, expired states
- `components/results-panel.tsx` - Glass panel with progress bars, BigInt-safe percentages, live indicator
- `app/page.tsx` - Updated: trending polls grid when connected, hero when disconnected, install prompt when no wallet, FAB
- `app/create/page.tsx` - New: Create Poll route with hero header wrapping CreatePollForm
- `app/poll/[id]/page.tsx` - New: Poll Detail route with asymmetric layout, block-based expiration, loading/error/not-found states

## Decisions Made
- **PollCard self-fetches metadata**: Each card calls `useMetadata(poll.id)` internally rather than receiving metadata as a prop. This avoids orchestrating N metadata fetches at the page level and lets TanStack Query cache handle deduplication.
- **Block-based expiration polling**: Poll Detail page uses `getCurrentBlockNumber()` from `witness-impl.ts` with a 30-second refresh interval via `useEffect` + `setInterval`. This gives a reasonable approximation of expiration status without a dedicated block subscription.
- **BLOCKS_PER_DAY constant**: `BigInt(4320)` based on ~20 second block times on Midnight Preview (3 blocks/min × 60 min × 24 hrs). Used in CreatePollForm for duration-to-blocks conversion.
- **BigInt-safe percentage calculation**: `Number(count * BigInt(1000) / total) / 10` avoids floating-point BigInt conversion while giving one decimal place precision.

## Deviations from Plan

None — plan executed exactly as written.

**Note:** The Turbopack stub (`lib/midnight-sdk-stub.ts`) was missing compact-runtime exports needed by the compiled contract, causing `bun run build` to fail with 48 errors. This was a **pre-existing issue** (identical errors before and after this plan's changes) and was fixed separately by the user in commit `58801d8`. Not attributed to this plan.

## Issues Encountered
None — TypeScript compiled cleanly on all verification checks. Dev server started without issues.

## User Setup Required
None — no external service configuration required.

## Known Stubs
None — all components are wired to real data hooks from Plan 02. No placeholder data or TODO items.

## Next Phase Readiness
- **Phase 4 complete**: All 3 plans delivered. Users can browse trending polls, create new polls, and vote on existing polls through a polished dark-themed UI.
- **Phase 5 (Invite-Only Polls)**: Ready. The Create Poll form needs a public/invite-only toggle, and the Poll Detail page needs invite code entry UI. Both are straightforward extensions of the existing components.
- **Phase 6 (ZK Proofs & Analytics)**: Ready. The Poll Detail page's right column is a natural home for a "Generate Proof" button, and the Trending Polls page structure can host an analytics dashboard.

## Self-Check: PASSED

- All 8 created/modified files verified on disk
- Commit `1b5e29b` verified in git log
- Commit `66351c2` verified in git log

---
*Phase: 04-core-polling*
*Completed: 2026-04-08*
