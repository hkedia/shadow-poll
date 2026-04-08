# Phase 9: Research Missing Integrations & Core Feature Gaps - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Research and document every broken or missing integration preventing a working Shadow Poll app. The research agent reads the live codebase and produces:
1. A comprehensive `RESEARCH.md` with exact file+line gap references, root-cause analysis, and the specific code change needed for each gap
2. CONTEXT.md implementation decisions (this file) consumed by the planner

Scope is limited to making existing intended features actually work — no new capabilities. The contract is already deployed on Midnight Preview. The Vite/Bun SPA is the runtime. All gaps must be bridged using the existing architecture.

</domain>

<decisions>
## Implementation Decisions

### Research Output Format
- **D-09-01:** Research phase produces BOTH `09-CONTEXT.md` (decisions) AND `09-RESEARCH.md` (deep gap inventory). The RESEARCH.md is the primary artifact consumed by the planner.
- **D-09-02:** Research depth = deep: every gap gets exact file+line reference, root cause, and specific code change needed. No high-level summaries — the planner needs to act directly on research output.

### Mutation Architecture (Critical Decision)
- **D-09-03:** Restore original architecture — browser calls `findPollContract()` + `callCreatePoll()`/`callCastVote()` directly using the wallet providers from `useWalletContext()`. The 1am wallet signs and submits the transaction. Do NOT implement server-side proxy routes for `/api/polls/create` or `/api/polls/vote`.
- **D-09-04:** `use-create-poll.ts` must be rewritten: remove the `fetch("/api/polls/create", ...)` call, restore direct calls to `findPollContract()` and `callCreatePoll()` with the wallet's `providers` set.
- **D-09-05:** `use-vote-mutation.ts` must be rewritten: remove the `fetch("/api/polls/vote", ...)` call, restore direct calls to `findPollContract()` and `callCastVote()` with the wallet's `providers` set.

### Poll Data Visibility
- **D-09-06:** Poll detail pages (tallies, metadata, options) must be readable without a wallet connection. Fix: `usePoll()` should read poll data via the server-side `/api/polls` handler (no wallet required), falling back to direct indexer calls only when a wallet is connected. The `enabled: isConnected` gate must be removed for read queries.
- **D-09-07:** The existing `/api/polls` GET handler (`lib/api/polls-handler.ts`) returns all polls from the indexer without requiring a wallet — this is the correct data source for unauthenticated poll reads. The planner should wire `usePoll(pollId)` to call `GET /api/polls?id={pollId}` or `GET /api/polls` + filter client-side.

### Invite Code Flow
- **D-09-08:** The correct invite code on-chain submission flow is fully client-side: after `callCreatePoll()` returns the poll ID, call `callAddInviteCodes()` once per invite code (not server-side). The `pollIdBytes` must be the real Uint8Array derived from the hex poll ID returned by the contract, not `new Uint8Array(32)`.
- **D-09-09:** The `inviteCodeToBytes32()` utility already exists in `lib/midnight/invite-codes.ts`. The research must document the exact call sequence: generate codes → convert each to Bytes<32> → derive invite key hash → call `callAddInviteCodes()` per code.

### Participation Proof
- **D-09-10:** Participation proof generation is already correctly wired (nullifier-based, no new Compact circuit needed). The fix is unblocking the mutation flow — once `cast_vote` / `cast_invite_vote` actually executes and writes the nullifier on-chain, the proof generation via `useParticipationProof()` will work.

### Phase 7 (Persistent Data Layer)
- **D-09-11:** Phase 7 (Neon Postgres metadata persistence) is included in Phase 9's scope. The metadata handler code already exists in `lib/api/metadata-handler.ts` and `lib/db/` but Phase 7's plan (`07-01-PLAN.md`) was never executed. Research should audit whether the implementation is complete or has gaps, then the execution phase implements any missing pieces.
- **D-09-12:** Phase 7 requirements (INFRA-01..05) should be verified as part of Phase 9 research. If the implementation is already correct, Phase 7 is effectively superseded by Phase 9's execution.

### the agent's Discretion
- How to expose poll data for unauthenticated `usePoll(pollId)` calls: the planner may choose between adding a `GET /api/polls/:id` route, a `GET /api/polls?id=xxx` query param, or having `usePoll` call `GET /api/polls` and filter. Pick the cleanest approach given the existing server structure.
- Whether `use-invite-vote-mutation.ts` needs the same mutation architecture fix as `use-vote-mutation.ts` — the researcher should check.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements fully captured in decisions above.

### Codebase: Critical Files to Audit

- `lib/queries/use-create-poll.ts` — broken mutation (calls phantom `/api/polls/create`)
- `lib/queries/use-vote-mutation.ts` — broken mutation (calls phantom `/api/polls/vote`)
- `lib/queries/use-invite-vote-mutation.ts` — likely broken (check for same pattern)
- `lib/queries/use-add-invite-codes.ts` — check if invite code hashes are submitted correctly
- `lib/queries/use-poll.ts` — broken for unauthenticated visitors (`enabled: isConnected`)
- `lib/midnight/contract-service.ts` — the correct contract interaction layer (already correct)
- `lib/midnight/providers.ts` — `assembleMidnightProviders()` function (already correct)
- `lib/midnight/invite-codes.ts` — `generateInviteCodes()`, `inviteCodeToBytes32()` (to be used)
- `lib/api/polls-handler.ts` — `GET /api/polls` server handler (correct, extend for poll detail)
- `lib/api/metadata-handler.ts` — Neon Postgres metadata handler (audit completeness)
- `lib/db/client.ts` — Neon Postgres client (verify `DATABASE_URL` is wired)
- `lib/db/migrations.ts` — DB migration script (verify correctness)
- `server.ts` — Bun.serve() route registration (check what's missing)
- `contracts/managed/contract/index.d.ts` or equivalent — check contract type exports
- `.planning/ROADMAP.md` Phase 7 plan — check `07-01-PLAN.md` status

### Project Documents
- `.planning/STATE.md` — current phase history and accumulated decisions
- `.planning/REQUIREMENTS.md` — POLL-01..07, ZKPR-01..03, INFRA-01..05 requirements

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/midnight/contract-service.ts`: `deployPollContract()`, `findPollContract()`, `callCreatePoll()`, `callCastVote()`, `callCastInviteVote()`, `callAddInviteCodes()` — all fully implemented, just not called from the browser mutations
- `lib/midnight/providers.ts`: `assembleMidnightProviders()` — converts `MidnightProviderSet` to the SDK's full provider object; `assembleProviders()` — builds `MidnightProviderSet` from 1am ConnectedAPI
- `lib/midnight/witness-impl.ts`: `getSecretKeyFromWallet()`, `getCurrentBlockNumber()` — both fully implemented
- `lib/midnight/invite-codes.ts`: `generateInviteCodes()`, `inviteCodeToBytes32()`, `storeInviteCodes()` — all implemented
- `lib/api/polls-handler.ts`: `handlePollsRequest()` — returns all polls from indexer without wallet
- `lib/api/metadata-handler.ts`: `handleMetadataRequest()` — Neon Postgres GET/POST fully implemented
- `lib/midnight/ledger-utils.ts`: `bytesToHex()`, `hexToBytes()`, `deriveNullifier()`, `readPoll()`, `readTallies()` — already implemented
- `lib/queries/use-participation-proof.ts` — correctly wired, will work once nullifiers are on-chain

### Established Patterns
- All state-changing operations go through wallet → `assembleMidnightProviders()` → contract `callTx.*`
- Read operations go through server-side API routes (no wallet) or `fetchPollWithTallies()` (with wallet)
- Off-chain metadata: POST to `/api/polls/metadata` after on-chain poll creation
- Optimistic updates via TanStack Query `onMutate` / `onError` rollback pattern

### Integration Points
- `useWalletContext()` → `providers: MidnightProviderSet | null` → feed into `findPollContract()` / `assembleMidnightProviders()`
- `server.ts` Bun.serve() → needs `/api/polls/:id` or `?id=` param support for unauthenticated poll reads
- `lib/queries/` hooks → the only consumer of contract service functions (currently broken)

### Known Broken Integrations (from codebase scan)
1. `use-create-poll.ts:78` — calls `fetch("/api/polls/create", ...)` which doesn't exist in `server.ts`
2. `use-vote-mutation.ts:33` — calls `fetch("/api/polls/vote", ...)` which doesn't exist in `server.ts`
3. `use-create-poll.ts:121` — `pollIdBytes = new Uint8Array(32)` — mock bytes, invite code flow broken
4. `use-poll.ts:48` — `enabled: isConnected` — poll detail unreachable without wallet
5. Phase 7 `07-01-PLAN.md` — unchecked, but `lib/api/metadata-handler.ts` and `lib/db/` exist

</code_context>

<specifics>
## Specific Ideas

- User confirmed the contract is deployed on Midnight Preview — `VITE_POLL_CONTRACT_ADDRESS` env var should be set
- The researcher should verify what `VITE_POLL_CONTRACT_ADDRESS` is set to (check `.env` or `.env.local` if they exist)
- Research should document the exact sequence for a working poll creation end-to-end: wallet connect → `findPollContract()` → `callCreatePoll()` → POST metadata → (for invite-only) `callAddInviteCodes()` per code
- Research should document the exact sequence for a working vote: wallet connect → `findPollContract()` → `callCastVote()` or `callCastInviteVote()` → invalidate queries
- The `use-create-poll.ts` hook already calls `getSecretKeyFromWallet()` and `getCurrentBlockNumber()` correctly — those lines survive the rewrite

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 09-research-all-missing-integrations-and-core-feature-gaps-need*
*Context gathered: 2026-04-09*
