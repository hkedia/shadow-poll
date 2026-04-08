# Phase 8: NIGHT Token Payment — Context

**Gathered:** 2026-04-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Poll creation requires a payment of NIGHT tokens (tNIGHT on testnet). The smart contract collects the fee via a shielded token transfer at the time `create_poll` is called. Voters pay nothing — they need only DUST (sponsored by 1am wallet). The fee amount is configurable and the token type is network-aware (tNIGHT on Preview/preprod, NIGHT on mainnet). The existing create poll UI is updated to show the cost before submission and to surface a clear error if the user has insufficient balance.

This phase is a monetisation milestone. It does not change the voter experience in any way.

</domain>

<decisions>
## Implementation Decisions

### D-80: Fee amount and configurability
- **D-80:** Fee is **5 NIGHT / tNIGHT** per poll creation. Amount is defined as a single named constant (`POLL_CREATION_FEE`) in a dedicated fee-config file (`lib/midnight/fee-config.ts`). All downstream code imports from that file — the fee never appears as a bare literal in business logic.

### D-81: Network-aware token type
- **D-81:** The token denomination (NIGHT vs tNIGHT) is derived from the network ID detected by the 1am wallet at connection time. Preview network and preprod use `tNIGHT`; mainnet uses `NIGHT`. A helper `getFeeTokenId(networkId: string): string` in `lib/midnight/fee-config.ts` encapsulates the switch. The network ID is already available in `MidnightProviderSet` via the indexer config.

### D-82: Payment mechanism — shielded token transfer in `create_poll`
- **D-82:** The Compact `create_poll` circuit collects the fee using the `receive` / `send` built-ins for shielded tokens (Midnight's native private transfer primitives). The fee is transferred from the caller's shielded wallet to the contract's own shielded balance at poll creation time. This means the payment is atomic with the transaction — no separate approve step.
- Compact shielded token API: `receive(token_id, amount)` to accept tokens from the caller; tokens flow from the prover's shielded balance.

### D-83: Voters pay nothing
- **D-83:** `cast_vote` and `cast_invite_vote` circuits are **not modified**. Voters continue to use only DUST (automatically sponsored by the 1am wallet). No voter-facing token changes.

### D-84: UI cost disclosure
- **D-84:** The `CreatePollForm` component shows a fee notice banner above the submit button: `"Creating this poll costs 5 tNIGHT"`. The token label is resolved from `getFeeTokenId` using the connected wallet's network ID. The banner is only visible when the user has completed the form (not blocking initial state).

### D-85: Insufficient balance handling
- **D-85:** The contract's `receive` call will fail with an on-chain assertion error if the wallet has insufficient token balance. The TypeScript service layer catches this specific error pattern and re-throws a typed `PollCreationError` with `code: "INSUFFICIENT_BALANCE"`. The UI displays it as: `"Insufficient tNIGHT balance. You need 5 tNIGHT to create a poll."` This error is distinct from generic transaction failures.

### D-86: Fee collection address
- **D-86:** Fees are collected into the contract's own shielded token balance (not a separate treasury wallet). In Compact, `receive` deposits tokens to the contract's balance. A future `withdraw_fees` circuit (out of scope for this phase) would let the contract owner retrieve them. For v1, the contract acts as the collector.

### D-87: Compact `receive` and `TypedToken` API
- **D-87:** Midnight Compact v0.19+ exposes shielded token operations via `receive(tokenId: Bytes<32>, amount: Uint<64>)`. The token ID is a `Bytes<32>` value derived from the canonical token identifier string. The TypeScript prover must provide the token balance as part of the shielded inputs. The 1am SDK's `balanceTx` handles this automatically when the token ID and amount are correctly specified in the transaction.

### D-88: `NetworkId` constant in fee-config
- **D-88:** `lib/midnight/fee-config.ts` exports `PREVIEW_NETWORK_ID` (the string used by the Midnight Preview network as its `networkId` field) alongside the token switch logic. This isolates all network-detection coupling to one file.

### the agent's Discretion
- Exact Compact syntax for `receive` (confirm against Midnight v0.19 docs/runtime during implementation)
- Whether `receive` requires the amount to be a disclosed parameter or can be a constant
- Exact error message string returned by the SDK when token balance is insufficient (may need runtime testing — catch broadly and inspect the message)
- Whether the fee notice banner should be a separate component or inline in `CreatePollForm`

</decisions>

<specifics>
## Specific Ideas

**Fee notice UX (user's words):** `"Creating this poll costs 5 tNIGHT"` — shown before the user submits. Not a blocking modal, just a visible cost disclosure inline in the form.

**Insufficient balance error (user's words):** `"Handle insufficient balance gracefully with a clear error message"` — this is the only new error path that needs dedicated copy.

**Configurable fee (user's words):** `"The fee amount must be configurable (not hardcoded deep in logic) so it can be changed without a full rewrite"` — the constant-in-config-file pattern directly addresses this.

**Network awareness (user's words):** `"Preview network is the current target"` — tNIGHT is the default; the switch logic is there for future correctness.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing contract (being extended)
- `contracts/src/poll.compact` — The current `create_poll` circuit that will receive the `receive` call for fee collection
- `.planning/phases/02-smart-contracts/02-CONTEXT.md` (if exists) or `02-01-PLAN.md` — Contract architecture decisions (single contract, D-20 through D-25)

### Existing service layer (being extended)
- `lib/midnight/contract-service.ts` — `callCreatePoll` function that submits the on-chain transaction; will need the token ID passed as part of the circuit call
- `lib/midnight/types.ts` — `MidnightProviderSet` shape; `indexerConfig` carries `networkId` (check actual field name)
- `lib/midnight/witness-impl.ts` — Witness implementations; may need a shielded token balance witness

### UI being updated
- `components/create-poll-form.tsx` — The form that needs the cost banner and updated error handling
- `lib/queries/use-create-poll.ts` — The mutation hook that calls the contract service

### Midnight token API references
- Midnight Compact language reference v0.19 — `receive`, `send`, shielded token operations
- `@midnight-ntwrk/midnight-js-types` — `TokenId`, `CoinInfo` types relevant to shielded transfers

### Phase 5 context (witness pattern to follow)
- `.planning/phases/05-invite-only-polls/05-CONTEXT.md` — Pattern for extending circuits and witnesses

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/midnight/types.ts` `MidnightProviderSet` — already contains `indexerConfig.indexerUri` and implicitly the network ID; need to verify if `networkId` is stored or needs to be added
- `lib/midnight/wallet-context.tsx` — Sets up `providers` in state; the `NetworkConfig.networkId` is already fetched there and could be threaded through to `MidnightProviderSet`
- `lib/midnight/contract-service.ts` `buildCompiledContract` — The pattern for dynamic imports and witness wiring to follow when extending `callCreatePoll`
- `components/create-poll-form.tsx` `handleSubmit` / error state — The existing error display pattern (`setValidationError(string | null)`) is the place to surface `INSUFFICIENT_BALANCE`

### Established Patterns
- **Dynamic imports for all `@midnight-ntwrk/*`** — mandatory pattern (Turbopack constraint). Any new imports from SDK packages must be inside `async function` bodies.
- **`disclose()` for all circuit parameters that touch public ledger state** — confirmed pattern from Phases 2 and 5.
- **Named exports, no default for utilities** — `lib/midnight/fee-config.ts` should follow this.
- **`use client` on all interactive components** — `CreatePollForm` already has it.
- **`import type` for type-only imports** — enforced by ESLint/conventions.

### Integration Points
- `create_poll` circuit in `contracts/src/poll.compact` — Add `receive(token_id, amount)` call inside the circuit body before the poll is stored.
- `callCreatePoll` in `lib/midnight/contract-service.ts` — The token ID must be derivable from the network; may need to pass it as a parameter or make `callCreatePoll` accept `networkId`.
- `useCreatePoll` mutation hook — Needs to catch `INSUFFICIENT_BALANCE` errors and surface them distinctly.
- `CreatePollForm` — Add cost banner JSX and wire `INSUFFICIENT_BALANCE` to a specific error UI.
- `lib/midnight/use-wallet.ts` or `wallet-context.tsx` — If `networkId` is not currently in `MidnightProviderSet`, add it here (minor extension).

</code_context>

<deferred>
## Deferred Ideas

- **`withdraw_fees` circuit** — Lets the contract creator/owner withdraw accumulated NIGHT fees. Out of scope for v1; tracked as a future governance feature.
- **Mainnet deployment** — REQUIREMENTS.md explicitly excludes mainnet for v1. The token switch logic is there for correctness when the time comes.
- **Fee display on poll cards / home page** — Showing "costs 5 tNIGHT to create" in a site-wide banner or FAQ page. Out of scope; keep it in the creation flow only.
- **Dynamic fee (governance-adjustable fee)** — Fee set by on-chain governance vote. Way out of scope; constant is sufficient for v1.
- **Token balance display in UI** — Showing the user's current tNIGHT balance alongside the fee notice. Nice-to-have; the wallet popup shows balance. Out of scope to avoid pulling balance-query complexity into this phase.

</deferred>

---

*Phase: 08-night-token-payment*
