# Phase 9: Research Missing Integrations & Core Feature Gaps - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-09
**Phase:** 09-research-all-missing-integrations-and-core-feature-gaps-need
**Areas discussed:** Research output format, Mutation architecture, Poll data visibility, Phase 7 handling, Invite code flow, Proof generation, Research depth

---

## Research Output Format

| Option | Description | Selected |
|--------|-------------|----------|
| RESEARCH.md + gap inventory | Produce a structured RESEARCH.md listing every broken/missing integration with root-cause analysis and recommended fix approach — feeds directly into planning | |
| CONTEXT.md decisions only | Skip the research document, just capture implementation decisions in CONTEXT.md and go straight to planning | |
| Both: CONTEXT.md + RESEARCH.md | Full discuss-phase context capture AND a research agent producing deep-dive analysis | ✓ |

**User's choice:** Both CONTEXT.md and RESEARCH.md
**Notes:** Research agent will read live codebase and produce RESEARCH.md as the primary planning artifact

---

## Mutation Architecture

| Option | Description | Selected |
|--------|-------------|----------|
| Client calls contract directly | Restore the original architecture: browser calls findPollContract() + callCreatePoll()/callCastVote() using the wallet providers — the 1am wallet signs & submits the tx | ✓ |
| Server-side proxy routes | Implement the missing /api/polls/create and /api/polls/vote server-side handlers that call the contract on behalf of the user | |
| Decide during planning | Leave architecture open — researcher investigates both and recommends | |

**User's choice:** Client calls contract directly
**Notes:** The phantom server routes `/api/polls/create` and `/api/polls/vote` should NOT be implemented. The broken mutation hooks need to be restored to use the contract service directly with wallet providers.

---

## Poll Data Visibility

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — read via /api/polls route | Poll detail (tallies, data) should load for any visitor via the server-side /api/polls handler — wallet only needed for voting | ✓ |
| No — wallet required to view | Keep the current gate: users must connect wallet to see poll details | |
| Hybrid — cached on server | Server fetches and caches poll state, client can read without wallet | |

**User's choice:** Yes — read via /api/polls route
**Notes:** The `enabled: isConnected` gate in `usePoll()` must be removed for read queries. The `/api/polls` server handler already works without a wallet.

---

## Phase 7 Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Include in Phase 9 scope | Phase 9 research covers Phase 7's unexecuted work as part of the overall gap analysis — the execution phase implements it all together | ✓ |
| Execute Phase 7 first separately | Run /gsd-execute-phase 7 independently before Phase 9, then research remaining gaps | |
| Mark Phase 7 as superseded | The metadata handler already uses Neon Postgres in code — verify it works and close Phase 7 as done | |

**User's choice:** Include in Phase 9 scope
**Notes:** Phase 7's plan is unchecked but the implementation code exists. Research should audit whether it's complete and flag any remaining gaps.

---

## Invite Code Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Document correct client-side flow | Research the correct client-side flow: generate codes, convert to Bytes<32>, call callAddInviteCodes() once per code using the wallet — document the complete sequence | ✓ |
| Server-side code submission | Server derives a fixed creator key to submit invite hashes on-chain after poll creation | |
| LocalStorage only for now | Skip on-chain invite code submission for now — codes are stored locally only | |

**User's choice:** Document correct client-side flow
**Notes:** `use-create-poll.ts:121` has `pollIdBytes = new Uint8Array(32)` (mock). The real flow uses `hexToBytes()` on the poll ID returned by the contract, then calls `callAddInviteCodes()` per code via the wallet.

---

## Proof Generation Gap

| Option | Description | Selected |
|--------|-------------|----------|
| Already wired — fix mutations | Research documents that proof generation is already fully wired (nullifier-based, no new circuit) but needs the wallet-connected provider flow to work — fix is unblocking the mutation | ✓ |
| Investigate missing circuits | Research whether additional ZK circuits are needed for proof generation that weren't implemented | |
| Full proof flow audit | Research the full end-to-end proof flow from vote cast to verify page, document any broken links | |

**User's choice:** Already wired — fix mutations
**Notes:** `useParticipationProof()` is correctly implemented. It will work once `cast_vote`/`cast_invite_vote` actually execute and write nullifiers on-chain.

---

## Research Depth

| Option | Description | Selected |
|--------|-------------|----------|
| Deep: exact fix per gap | Enumerate every gap with exact file+line references, root cause, and the specific code change needed — researcher reads the live codebase | ✓ |
| Shallow: gap categories only | High-level gap listing with categories — planning phase figures out the specifics | |
| Requirement audit matrix | Write passing/failing audit against each requirement (POLL-01, ZKPR-01, etc.) with evidence | |

**User's choice:** Deep: exact fix per gap
**Notes:** The research agent must read the live codebase and produce actionable, file-level guidance. The planner needs to act directly on research output.

---

## the agent's Discretion

- How to expose poll data for unauthenticated `usePoll(pollId)` calls: the planner may choose between adding a `GET /api/polls/:id` route, a `GET /api/polls?id=xxx` query param, or having `usePoll` call `GET /api/polls` and filter.
- Whether `use-invite-vote-mutation.ts` needs the same mutation architecture fix as `use-vote-mutation.ts`.

## Deferred Ideas

None — discussion stayed within phase scope.
