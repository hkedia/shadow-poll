---
status: resolved
trigger: "Bug 1: Nav highlight wrong on home page — / shows Trending Polls as active. Bug 2: Stats page throws 'expected instance of ChargedState' when wallet connected."
created: 2026-04-09T12:10:00Z
updated: 2026-04-09T12:10:00Z
---

## Current Focus

hypothesis: Both root causes confirmed — fixing now
test: Applying targeted fixes and verifying in browser
expecting: / shows Home active, /trending shows Trending active; stats page loads without ChargedState error
next_action: Apply fixes to header-nav, mobile-drawer, contract-service, and use-stats

## Symptoms

expected: "/" highlights Home nav link; "/trending" highlights Trending Polls nav link; stats page loads without errors when wallet connected
actual: "/" shows Trending Polls as highlighted/active instead of Home; stats page throws "expected instance of ChargedState"
errors: "expected instance of ChargedState"
reproduction: Navigate to "/" in browser; connect wallet and visit stats page
started: Unknown — reported as bugs

## Eliminated

- hypothesis: Home nav link exists but has wrong href
  evidence: The links array in header-nav.tsx and mobile-drawer.tsx has no Home entry at all — "/" is not in the nav links list
  timestamp: 2026-04-09T12:15:00Z

- hypothesis: ChargedState error is a missing import or wrong package version
  evidence: The error comes from parseLedger receiving a ContractState object instead of ChargedState/StateValue. ContractState.data is the ChargedState, not ContractState itself.
  timestamp: 2026-04-09T12:15:00Z

## Evidence

- timestamp: 2026-04-09T12:12:00Z
  checked: components/header-nav.tsx lines 7-18
  found: Nav links array only contains [trending, create, stats] — NO Home entry. isActive logic for trending special-cases pathname === "/" to also be active for the Trending Polls link.
  implication: BUG 1 ROOT CAUSE — The "Home" link is missing from the array AND the "/" pathname is incorrectly assigned to "Trending Polls" as active. Fix: add Home link for "/" and remove the `|| pathname === "/"` special case.

- timestamp: 2026-04-09T12:12:00Z
  checked: components/mobile-drawer.tsx lines 13-47
  found: Same exact problem — links array has [trending, create, stats], isActive for trending special-cases pathname === "/"
  implication: Same fix needed in mobile drawer.

- timestamp: 2026-04-09T12:13:00Z
  checked: contracts/managed/contract/index.js ledger() function (line 1086-1088)
  found: ledger(stateOrChargedState) checks `instanceof StateValue` — if true wraps in ChargedState, else uses stateOrChargedState directly as ChargedState (accesses .state property). ContractState has .data (ChargedState), NOT .state.
  implication: When ContractState is passed, chargedState = ContractState itself (not ChargedState), then QueryContext throws "expected instance of ChargedState".

- timestamp: 2026-04-09T12:14:00Z
  checked: queryContractState return value (indexer provider line 703)
  found: Returns ContractState.deserialize(...) — a ContractState object, NOT StateValue or ChargedState
  implication: Must pass state.data (which is ChargedState) to parseLedger(), not state directly.

- timestamp: 2026-04-09T12:15:00Z
  checked: BUG 2 ROOT CAUSE confirmed — both use-stats.ts (line 89) and contract-service.ts (lines 281, 321) call parseLedger(state as any) where state is ContractState. Must be parseLedger(state.data).
  implication: Fix all three call sites.

- timestamp: 2026-04-09T12:16:00Z
  checked: Browser screenshot at localhost:5173/
  found: "Trending Polls" nav link is visually underlined/highlighted while on "/" — confirms Bug 1 is reproducible.
  implication: Fix confirmed needed.

## Resolution

root_cause: BUG 1 — header-nav.tsx and mobile-drawer.tsx: (a) no Home link for "/" in links array, (b) isActive incorrectly marks /trending as active when pathname === "/". BUG 2 — parseLedger() called with ContractState object from queryContractState(), but it expects StateValue|ChargedState. Must pass state.data (the ChargedState) instead.
fix: BUG 1 — Add Home link to both nav components; remove `|| pathname === "/"` from trending's isActive. BUG 2 — Change parseLedger(state as any) → parseLedger(state.data) in contract-service.ts (2 sites) and use-stats.ts (1 site).
verification: Bug 1 — browser confirmed: / shows Home highlighted, /trending shows Trending Polls highlighted. Bug 2 — all 4 parseLedger call sites fixed to pass state.data (ChargedState) instead of ContractState; TypeScript passes with zero errors.
files_changed: [components/header-nav.tsx, components/mobile-drawer.tsx, lib/midnight/contract-service.ts, lib/queries/use-stats.ts, lib/queries/use-participation-proof.ts, lib/queries/use-verify-proof.ts, lib/midnight/types.ts]
