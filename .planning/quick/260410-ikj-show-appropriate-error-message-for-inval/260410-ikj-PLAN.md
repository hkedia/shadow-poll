---
phase: quick/260410-ikj-show-appropriate-error-message-for-inval
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/vote-panel.tsx
autonomous: true
requirements:
  - UX-01
must_haves:
  truths:
    - "Using an invalid invite code shows 'This invite code is not valid for this poll' instead of generic error"
    - "Voting on an expired poll shows a specific expired message"
    - "Voting on a non-existent poll shows a specific not-found message"
    - "Previously handled error messages (Already voted, Invite code already used, Transaction errors) still work"
  artifacts:
    - path: "components/vote-panel.tsx"
      provides: "Specific error messages for all contract assertion errors"
      contains: "Invalid invite code"
  key_links:
    - from: "components/vote-panel.tsx"
      to: "contracts/src/poll.compact"
      via: "Contract assertion message strings"
      pattern: "includes.*Invalid invite code|includes.*Poll has expired|includes.*Poll not found"
---

<objective>
Add specific user-facing error messages for all contract assertion errors that currently fall through to the generic "Failed to cast vote" message in VotePanel.

Purpose: When a user uses an invite code from Poll A on Poll B, the contract throws "Invalid invite code" but the UI shows the generic "Failed to cast vote. Please try again." — making the user think it's a transient error rather than a specific problem with their code. Similarly, expired polls and not-found polls deserve specific messages.

Output: Updated error handler in `components/vote-panel.tsx` that maps every Compact contract assertion to a user-friendly message.
</objective>

<execution_context>
$HOME/.config/opencode/get-shit-done/workflows/execute-plan.md
$HOME/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
@components/vote-panel.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add specific error messages for all contract assertion errors in VotePanel</name>
  <files>components/vote-panel.tsx</files>
  <action>
In `components/vote-panel.tsx`, update the error handling IIFE (lines 175-194) that maps `activeMutation.error?.message` to friendly messages.

The Compact contract `cast_invite_vote` circuit throws these assertion messages:
- `"Invalid invite code"` (line 232) — **THE KEY MISSING CASE**
- `"Invite code already used"` (line 233) — already handled
- `"Already voted on this poll"` (line 240) — already handled
- `"Poll not found"` (line 214)
- `"Poll has expired"` (line 225)
- `"Use cast_vote for public polls"` (line 218) — wrong poll type for this circuit
- `"Invalid option index"` (line 221)

The `cast_vote` circuit throws:
- `"Already voted on this poll"` (line 188) — already handled
- `"Poll not found"` (line 165)
- `"Poll has expired"` (line 180)
- `"Use cast_invite_vote for invite-only polls"` (line 171) — wrong poll type
- `"Invalid option index"` (line 174)

Current handler (lines 176-186):
```typescript
const msg = activeMutation.error?.message ?? "";
let friendly: string;
if (msg.includes("Already voted")) {
  friendly = "You have already voted on this poll.";
} else if (msg.includes("Invite code already used")) {
  friendly = "This invite code has already been used. Each code can only be used once.";
} else if (msg.includes("Transaction submission error") || msg.includes("Operation failed")) {
  friendly = "Transaction failed to submit. Please try again — your wallet may need to be reconnected.";
} else {
  friendly = "Failed to cast vote. Please try again.";
}
const isInfo = msg.includes("Already voted") || msg.includes("Invite code already used");
```

Replace the entire `if/else if/else` chain with a comprehensive mapping that covers ALL contract assertion errors. Add these new cases BEFORE the generic fallback:

1. `"Invalid invite code"` → `"This invite code is not valid for this poll."` — **PRIMARY FIX** — this is the reported bug
2. `"Poll has expired"` → `"This poll has expired and no longer accepts votes."`
3. `"Poll not found"` → `"This poll could not be found. It may have been removed."`
4. `"Invalid option index"` → `"Invalid vote option. Please refresh the page and try again."`
5. `"Use cast_vote for public polls"` or `"Use cast_invite_vote for invite-only polls"` → `"Wrong vote method for this poll type. Please refresh the page and try again."`

Also update the `isInfo` variable to include the new informational (non-error-type) messages. `"Invalid invite code"`, `"Poll has expired"`, and `"Poll not found"` should be `isInfo = true` (show `info` icon instead of `error` icon) since they are informative, not bugs.

Keep the `"Already voted"` and `"Invite code already used"` and transaction error cases as-is — they are already working correctly.

The structure should be:
```typescript
const msg = activeMutation.error?.message ?? "";
let friendly: string;
let isInfo = false;

if (msg.includes("Already voted")) {
  friendly = "You have already voted on this poll.";
  isInfo = true;
} else if (msg.includes("Invite code already used")) {
  friendly = "This invite code has already been used. Each code can only be used once.";
  isInfo = true;
} else if (msg.includes("Invalid invite code")) {
  friendly = "This invite code is not valid for this poll.";
  isInfo = true;
} else if (msg.includes("Poll has expired")) {
  friendly = "This poll has expired and no longer accepts votes.";
  isInfo = true;
} else if (msg.includes("Poll not found")) {
  friendly = "This poll could not be found. It may have been removed.";
  isInfo = true;
} else if (msg.includes("Invalid option index")) {
  friendly = "Invalid vote option. Please refresh the page and try again.";
  isInfo = false;
} else if (msg.includes("Use cast_vote for public polls") || msg.includes("Use cast_invite_vote for invite-only polls")) {
  friendly = "Wrong vote method for this poll type. Please refresh the page and try again.";
  isInfo = false;
} else if (msg.includes("Transaction submission error") || msg.includes("Operation failed")) {
  friendly = "Transaction failed to submit. Please try again — your wallet may need to be reconnected.";
  isInfo = false;
} else {
  friendly = "Failed to cast vote. Please try again.";
  isInfo = false;
}
```

Then update the JSX to use the local `isInfo` variable instead of recomputing from `msg.includes(...)`:
```tsx
<p className="mt-4 text-error text-sm flex items-center gap-2">
  <span className="material-symbols-outlined text-base">{isInfo ? "info" : "error"}</span>
  {friendly}
</p>
```

Note: Keep the surrounding JSX structure (the IIFE pattern, the conditional rendering `activeMutation.isError && ...`) unchanged — only update the message mapping logic and replace the inline `isInfo` computation with the variable.
  </action>
  <verify>
    bun run build 2>&1 | tail -5
  </verify>
  <done>
    - All 7 Compact contract assertion errors from cast_invite_vote and cast_vote now have specific user-facing messages
    - "Invalid invite code" returns "This invite code is not valid for this poll." (the reported bug fix)
    - "Poll has expired" returns "This poll has expired and no longer accepts votes."
    - "Poll not found" returns "This poll could not be found. It may have been removed."
    - Informational errors (Already voted, Invite code already used, Invalid invite code, Poll has expired, Poll not found) show info icon; technical errors show error icon
    - Build succeeds with no TypeScript errors
  </done>
</task>

</tasks>

<verification>
- `bun run build` succeeds
- Manual: cast a vote on an invite-only poll with the wrong invite code and verify the specific error message appears
</verification>

<success_criteria>
Every Compact contract assertion error that can reach the UI now maps to a user-friendly message. The generic "Failed to cast vote" fallback only fires for truly unexpected errors. The reported bug (invalid invite code showing generic message) is fixed.
</success_criteria>

<output>
After completion, create `.planning/quick/260410-ikj-show-appropriate-error-message-for-inval/260410-ikj-SUMMARY.md`
</output>