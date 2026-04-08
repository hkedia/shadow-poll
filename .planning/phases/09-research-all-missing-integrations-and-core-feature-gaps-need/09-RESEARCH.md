# Phase 9: Research — Missing Integrations & Core Feature Gaps

**Researched:** 2026-04-09
**Domain:** Midnight SDK contract mutations, TanStack Query wiring, Neon Postgres data layer, unauthenticated poll reads
**Confidence:** HIGH (all findings verified by reading live source files)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-09-01:** RESEARCH.md is the primary artifact consumed by the planner. `09-CONTEXT.md` holds the decisions.
- **D-09-02:** Research depth = deep — every gap gets exact file+line reference, root cause, and specific code change needed.
- **D-09-03:** Restore client-side architecture — browser calls `findPollContract()` + `callCreatePoll()`/`callCastVote()` directly. Do NOT implement `/api/polls/create` or `/api/polls/vote` server routes.
- **D-09-04:** `use-create-poll.ts` must be rewritten — remove `fetch("/api/polls/create", ...)`, restore direct contract calls.
- **D-09-05:** `use-vote-mutation.ts` must be rewritten — remove `fetch("/api/polls/vote", ...)`, restore direct contract calls.
- **D-09-06:** `enabled: isConnected` gate must be removed from `usePoll()` read queries. Poll detail pages must be readable without a wallet.
- **D-09-07:** `GET /api/polls` is the correct unauthenticated data source. Planner chooses: `?id=` query param vs. client-side filter.
- **D-09-08:** Invite code on-chain submission is fully client-side. `pollIdBytes` must be the real `Uint8Array` from the contract result, not `new Uint8Array(32)`.
- **D-09-09:** Use `inviteCodeToBytes32()` from `lib/midnight/invite-codes.ts`. Sequence: generate codes → derive hash → `callAddInviteCodes()` per code.
- **D-09-10:** Participation proof is correctly wired. Unblocking `cast_vote` makes it work automatically.
- **D-09-11/12:** Phase 7 (Neon Postgres) is in scope. Audit completeness and verify or implement any gaps.

### the agent's Discretion

- How to expose poll data for unauthenticated `usePoll(pollId)` calls: `GET /api/polls?id=xxx`, `GET /api/polls/:id`, or client-side filter.
- Whether `use-invite-vote-mutation.ts` needs the same mutation architecture fix — researcher must check.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| POLL-01 | Create a new poll on-chain | GAP-1, GAP-2: `use-create-poll.ts` calls phantom route; fix restores direct contract calls |
| POLL-02 | Cast a vote on an open poll | GAP-3: `use-vote-mutation.ts` calls phantom route; fix restores direct `callCastVote()` |
| POLL-03 | View poll results (tallies + options) | GAP-4: `usePoll()` blocked by `isConnected` gate; fix allows unauthenticated reads |
| POLL-04 | Invite-only polls with code validation | GAP-6: invite code hashes never submitted on-chain; GAP-2: mock poll ID bytes |
| POLL-05 | Poll expiration enforcement | GAP-12: expiry badge requires block number, blocked for unauthenticated users (low impact) |
| POLL-06 | Invite code on-chain submission | GAP-6: `callAddInviteCodes()` loop never called; fix in same `use-create-poll.ts` rewrite |
| ZKPR-01 | Generate participation proof | GAP-10: already wired correctly; unblocked once vote mutation executes |
| ZKPR-02 | Verify participation proof | No gap — `use-verify-proof.ts` correctly implemented |
| ZKPR-03 | Nullifier-based double-vote prevention | No gap — circuit handles this; unblocked with working mutation |
| INFRA-01 | Neon Postgres schema + migrations | GAP-9: code is complete; no execution gaps found |
| INFRA-02 | POST /api/polls/metadata stores metadata | GAP-9: `metadata-handler.ts` POST fully implemented |
| INFRA-03 | GET /api/polls/metadata retrieves metadata | GAP-9: `metadata-handler.ts` GET fully implemented |
| INFRA-04 | On-chain hash verification on write | GAP-9: hash comparison present in `metadata-handler.ts` |
| INFRA-05 | Upsert on duplicate poll ID | GAP-9: `ON CONFLICT (poll_id) DO UPDATE` present |
</phase_requirements>

---

## Summary

Shadow Poll has a fully deployed Midnight contract, a complete TypeScript contract-service layer, and a correct Bun.serve() API server — but the browser-side TanStack Query mutation hooks never call any of it. Two critical mutations (`use-create-poll.ts` and `use-vote-mutation.ts`) were wired to server API routes that do not exist, creating a silent 404-on-every-action failure. The contract service functions (`findPollContract`, `callCreatePoll`, `callCastVote`, `callAddInviteCodes`) are all fully implemented and correct; they just need to be called from the browser.

Beyond the broken mutations, the `usePoll()` read hook incorrectly gates itself behind `isConnected`, making every poll detail page blank for unauthenticated visitors. The invite code on-chain submission was stubbed out with a TODO and mock bytes. Phase 7's Neon Postgres layer is fully implemented but was never confirmed to execute — audit shows it is complete with no code gaps.

**Primary recommendation:** Rewrite `use-create-poll.ts` and `use-vote-mutation.ts` to call the contract service directly (2–3 files, ~80 lines total). Remove the `isConnected` gate from `usePoll()`. All other systems are correct and need no changes.

---

## Gap Inventory

### GAP-1 — `use-create-poll.ts`: Phantom `/api/polls/create` route call [CRITICAL]

| Property | Value |
|----------|-------|
| File | `lib/queries/use-create-poll.ts` |
| Lines | 78–91 |
| Confidence | HIGH — [VERIFIED: read file] |

**Root cause:**
```typescript
// Lines 78–91 — this route does NOT exist in server.ts
const response = await fetch("/api/polls/create", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    metadataHash: Array.from(metadataHash),
    optionCount: input.options.length,
    pollType: input.pollType === "invite_only" ? 1 : 0,
    expirationBlock,
  }),
});
if (!response.ok) throw new Error("Failed to create poll");
const data: CreatePollResponse = await response.json();
```

`server.ts` only handles: `/api/polls/metadata`, `/api/polls`, `/api/indexer/*`. There is no `/api/polls/create`. Every poll creation silently returns a 404, and the error is caught by the mutation's `onError` handler.

**Required change (per D-09-03/04):**
Remove lines 78–91 entirely. Replace with:
```typescript
// 1. Find contract (requires wallet providers — already checked above)
const contractAddress = getContractAddress();
if (!contractAddress) throw new Error("VITE_POLL_CONTRACT_ADDRESS not configured");
const contract = await findPollContract(providers, contractAddress, secretKey, blockNumber);

// 2. Call on-chain
const result = await callCreatePoll(contract, {
  metadataHash,
  optionCount: input.options.length,
  pollType: input.pollType === "invite_only" ? 1 : 0,
  expirationBlock,
});
```

**Imports to add:**
```typescript
import {
  findPollContract,
  callCreatePoll,
  callAddInviteCodes,
  getContractAddress,
} from "@/lib/midnight/contract-service";
```

---

### GAP-2 — `use-create-poll.ts`: Mock poll ID bytes (`new Uint8Array(32)`) [CRITICAL]

| Property | Value |
|----------|-------|
| File | `lib/queries/use-create-poll.ts` |
| Lines | 121 |
| Confidence | HIGH — [VERIFIED: read file] |

**Root cause:**
```typescript
// Line 121 — placeholder never replaced with real contract return value
const pollIdBytes = new Uint8Array(32); // Mock bytes
```

`callCreatePoll()` returns a transaction result. The real poll ID bytes are at `result?.private?.result` (a `Uint8Array`). The mock 32-zero bytes cause:
1. `bytesToHex(pollIdBytes)` produces `"0000…0000"` as the poll ID — every poll gets the same ID
2. `generateInviteCodes(n, pollIdBytes)` generates codes with the wrong binding
3. On-chain invite code hashes are derived from the wrong poll ID

**Required change:**
```typescript
// After callCreatePoll() result:
const rawResult = result?.private?.result ?? result?.result;
if (!rawResult) throw new Error("Contract did not return a poll ID");
const pollIdBytes =
  rawResult instanceof Uint8Array ? rawResult : new Uint8Array(rawResult);
const pollId = bytesToHex(pollIdBytes);
```

Then pass real `pollIdBytes` to `generateInviteCodes(input.inviteCodeCount, pollIdBytes)`.

---

### GAP-3 — `use-vote-mutation.ts`: Phantom `/api/polls/vote` route call [CRITICAL]

| Property | Value |
|----------|-------|
| File | `lib/queries/use-vote-mutation.ts` |
| Lines | 33–40 |
| Confidence | HIGH — [VERIFIED: read file] |

**Root cause:**
```typescript
// Lines 33–40 — this route does NOT exist in server.ts
const response = await fetch("/api/polls/vote", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ pollId: params.pollId, optionIndex: params.optionIndex }),
});
if (!response.ok) throw new Error("Failed to cast vote");
```

Every vote silently returns 404. ZK proof is never generated on-chain. Nullifiers are never written.

**Required change (per D-09-05):**
Replace lines 33–40 with:
```typescript
if (!providers) throw new Error("Wallet not connected");
const contractAddress = getContractAddress();
if (!contractAddress) throw new Error("No contract deployed");
const secretKey = await getSecretKeyFromWallet(providers.walletProvider);
const blockNumber = await getCurrentBlockNumber(providers.indexerConfig.indexerUri);
const contract = await findPollContract(providers, contractAddress, secretKey, blockNumber);
await callCastVote(contract, {
  pollId: hexToBytes(params.pollId),
  optionIndex: params.optionIndex,
});
```

**Imports to add:**
```typescript
import {
  findPollContract,
  callCastVote,
  getContractAddress,
} from "@/lib/midnight/contract-service";
import {
  getSecretKeyFromWallet,
  getCurrentBlockNumber,
} from "@/lib/midnight/witness-impl";
import { hexToBytes } from "@/lib/midnight/ledger-utils";
```

Note: `providers` is already available via `useWalletContext()` — confirm it is destructured at hook init.

---

### GAP-4 — `use-poll.ts`: `isConnected` gate blocks unauthenticated poll reads [MEDIUM]

| Property | Value |
|----------|-------|
| File | `lib/queries/use-poll.ts` |
| Lines | 48, 64 |
| Confidence | HIGH — [VERIFIED: read file] |

**Root cause:**
```typescript
// Line 48 — poll data query
enabled: isConnected && !!pollId,

// Line 64 — tallies query
enabled: isConnected && !!pollQuery.data !== null,
```

```typescript
// Line 40 — queryFn early return
if (!providers || !pollId) return null;
```

An unauthenticated visitor on `/polls/:id` sees no data at all — the queries are disabled, `fetchPollWithTallies()` never fires, and the page renders empty/loading forever.

**Required change (per D-09-06/07):**

Two-path strategy:
1. **Unauthenticated path:** Call `GET /api/polls?id={pollId}` (after extending `polls-handler.ts` — see GAP-5). Change `enabled: !!pollId`.
2. **Authenticated path (when wallet connected):** Continue using `fetchPollWithTallies()` to get live tallies.

Minimal change if planner picks client-side filter:
```typescript
// Replace queryFn to use server API when no wallet
queryFn: async () => {
  if (pollId) {
    const res = await fetch("/api/polls");
    const all = await res.json();
    return all.find((p: PollOnChain) => p.pollId === pollId) ?? null;
  }
  return null;
},
enabled: !!pollId,  // Remove isConnected gate
```

Tallies query can remain wallet-gated (tallies require on-chain reads) — just ensure the outer poll query renders without them.

---

### GAP-5 — `polls-handler.ts`: No single-poll fetch support [MEDIUM]

| Property | Value |
|----------|-------|
| File | `lib/api/polls-handler.ts` |
| Lines | entire `handleGet()` function |
| Confidence | HIGH — [VERIFIED: read file] |

**Root cause:**
`handleGet()` always returns the full polls array. There is no `?id=` filter. `usePoll(pollId)` would need to either:
- Fetch all polls and filter client-side (works but transfers unnecessary data), or
- Have the server filter by `?id=`

**Optional improvement (at planner's discretion per D-09-07):**
Add to `handleGet()`:
```typescript
const url = new URL(request.url);
const id = url.searchParams.get("id");
if (id) {
  const poll = polls.find((p) => p.pollId === id);
  if (!poll) return new Response("Not found", { status: 404 });
  return Response.json(poll);
}
// ... existing return all polls path
```

This is a small additive change. If the planner prefers client-side filter, this gap can be skipped.

---

### GAP-6 — `use-create-poll.ts`: Invite code hashes never submitted on-chain [HIGH]

| Property | Value |
|----------|-------|
| File | `lib/queries/use-create-poll.ts` |
| Lines | 119–127 |
| Confidence | HIGH — [VERIFIED: read file] |

**Root cause:**
```typescript
// Lines 119–127 — the TODO was never implemented
if (input.pollType === "invite_only" && input.inviteCodeCount && input.inviteCodeCount > 0) {
  const codeSet = await generateInviteCodes(input.inviteCodeCount, pollIdBytes);
  inviteCodes = codeSet.codes;
  // TODO: Submit code hashes on-chain via server-side API
  storeInviteCodes(pollId, inviteCodes);
}
```

The codes are generated and stored locally, but the on-chain `add_invite_codes` circuit is never called. Any attempt to use an invite code will fail on-chain because the contract has no record of the code's hash.

**Required change (per D-09-08):**
```typescript
if (input.pollType === "invite_only" && input.inviteCodeCount && input.inviteCodeCount > 0) {
  const codeSet = await generateInviteCodes(input.inviteCodeCount, pollIdBytes);
  inviteCodes = codeSet.codes;
  // Submit each code hash on-chain
  for (const code of inviteCodes) {
    await callAddInviteCodes(contract, {
      pollId: pollIdBytes,
      codeHash: code.hash,
    });
  }
  storeInviteCodes(pollId, inviteCodes);
}
```

`contract` is the same reference obtained in GAP-1's fix — available in the same scope.

---

### GAP-7 — `use-invite-vote-mutation.ts`: CORRECTLY IMPLEMENTED ✅

| Property | Value |
|----------|-------|
| File | `lib/queries/use-invite-vote-mutation.ts` |
| Confidence | HIGH — [VERIFIED: read file] |

Already calls `findPollContract()` + `callCastInviteVote()` directly from the browser with real bytes. The `inviteCodeToBytes32()` normalization is present and correct. **No changes needed.**

---

### GAP-8 — `use-add-invite-codes.ts`: CORRECTLY IMPLEMENTED ✅

| Property | Value |
|----------|-------|
| File | `lib/queries/use-add-invite-codes.ts` |
| Confidence | HIGH — [VERIFIED: read file] |

Already calls `findPollContract()` + `callAddInviteCodes()` per code with real `hexToBytes(params.pollId)`. Usable for post-creation code additions. **No changes needed.**

---

### GAP-9 — Phase 7 DB layer (Neon Postgres): FUNCTIONALLY COMPLETE ✅

| Property | Value |
|----------|-------|
| Files | `lib/db/client.ts`, `lib/db/migrations.ts`, `lib/api/metadata-handler.ts` |
| Confidence | HIGH — [VERIFIED: read files + `.env.local`] |

**Audit result: Phase 7 is fully implemented. No code gaps exist.**

| Requirement | Status | Evidence |
|-------------|--------|----------|
| INFRA-01: Schema + migrations | ✅ | `migrations.ts`: `CREATE TABLE IF NOT EXISTS poll_metadata (...)` — idempotent, runs on first API hit |
| INFRA-02: POST /api/polls/metadata | ✅ | `metadata-handler.ts`: full validation, hash check, upsert |
| INFRA-03: GET /api/polls/metadata | ✅ | `metadata-handler.ts`: supports `?pollId=` filter and full list |
| INFRA-04: On-chain hash verification | ✅ | `metadata-handler.ts`: computes hash of incoming metadata, compares to `metadataHash` field |
| INFRA-05: Upsert on duplicate | ✅ | `ON CONFLICT (poll_id) DO UPDATE SET ...` present |
| Route registered | ✅ | `server.ts` lines 31–34: `/api/polls/metadata` routed correctly |
| `DATABASE_URL` set | ✅ | `.env.local` has `DATABASE_URL` set and non-empty |

**One operational concern:** `lib/db/client.ts` throws at module-load time if `DATABASE_URL` is missing. Since `client.ts` is only imported server-side (via `metadata-handler.ts` → `server.ts`), this is safe in practice. But the error message could be more descriptive. Low priority.

---

### GAP-10 — `use-participation-proof.ts`: Correctly wired, blocked by GAP-3 [INFORMATIONAL]

| Property | Value |
|----------|-------|
| File | `lib/queries/use-participation-proof.ts` |
| Confidence | HIGH — [VERIFIED: read file] |

The hook is correctly implemented — it reads the on-chain nullifier for the current user's vote. It is only blocked because `callCastVote()` never actually executes (GAP-3). Once GAP-3 is fixed, nullifiers will be written on-chain and participation proofs will work automatically. **No code changes needed in this file.**

---

### GAP-11 — `poll-detail.tsx`: Expired badge missing for unauthenticated users [LOW]

| Property | Value |
|----------|-------|
| File | `src/routes/poll-detail.tsx` |
| Lines | 26–45 |
| Confidence | HIGH — [VERIFIED: read file] |

`getCurrentBlockNumber()` is called inside a `useEffect` that depends on `providers?.indexerConfig?.indexerUri`. When no wallet is connected, `providers` is null, so `currentBlock` stays `0`, and `isExpired` is always `false`.

**Impact:** Unauthenticated users don't see the "expired" badge on expired polls. Not functionally blocking — votes will still be rejected on-chain if the poll is expired.

**Optional fix:** Use a hardcoded indexer URI from env:
```typescript
const indexerUri =
  providers?.indexerConfig?.indexerUri ?? import.meta.env.VITE_INDEXER_URI;
```
Only implement if `VITE_INDEXER_URI` is already set in `.env.local` (verify before including in plan).

---

### GAP-12 — `vite.config.ts`: Dev proxy port alignment [INFORMATIONAL]

| Property | Value |
|----------|-------|
| File | `vite.config.ts` |
| Lines | 45 |
| Confidence | HIGH — [VERIFIED: read files] |

Dev proxy targets `http://localhost:3001`. The `dev:api` npm script runs `PORT=3001 bun run server.ts`, so the port is intentionally set to 3001 in the dev script. No code fix needed. The configuration is correct as long as both `dev` and `dev:api` run together (via `dev:all`). No changes needed.

---

## Standard Stack

### Core (no changes needed — already correct)

| Library | Version | Purpose |
|---------|---------|---------|
| `@midnight-ntwrk/compact-js` | 2.5.0 | Compact contract TypeScript runtime |
| `@midnight-ntwrk/midnight-js-contracts` | 4.0.4 | Contract deployment + interaction |
| `@midnight-ntwrk/midnight-js-types` | 4.0.4 | SDK type definitions |
| `@midnight-ntwrk/ledger-v8` | 8.0.3 | Ledger WASM bindings |
| `@tanstack/react-query` | 5.x | Mutation + query management |
| `@neondatabase/serverless` | 1.x | Neon Postgres driver |

All dependencies already installed. `bun install` required after any `package.json` change, but no new packages are needed for these fixes.

---

## Architecture Patterns

### Correct Pattern: Client-Side Contract Mutation

```typescript
// Source: lib/midnight/contract-service.ts (VERIFIED — read file)
// The correct pattern already used by use-invite-vote-mutation.ts

const providers = useWalletContext().providers; // MidnightProviderSet
const secretKey = await getSecretKeyFromWallet(providers.walletProvider);
const blockNumber = await getCurrentBlockNumber(providers.indexerConfig.indexerUri);
const contractAddress = getContractAddress(); // from env VITE_POLL_CONTRACT_ADDRESS
const contract = await findPollContract(providers, contractAddress, secretKey, blockNumber);
await callCastVote(contract, { pollId: hexToBytes(pollId), optionIndex });
```

### Correct Pattern: `callCreatePoll` Result Extraction

```typescript
// Source: inferred from Midnight SDK contract result shape (ASSUMED — not in official docs)
// Pattern used by other Compact JS call results:
const result = await callCreatePoll(contract, { ... });
const rawResult = result?.private?.result ?? result?.result;
const pollIdBytes =
  rawResult instanceof Uint8Array ? rawResult : new Uint8Array(rawResult);
```

> ⚠️ **ASSUMED:** The exact shape of `callCreatePoll()`'s return value (`result.private.result`) is inferred from the contract circuit signature and how other Compact JS transactions return private state. This must be verified by checking the actual TypeScript types generated from the Compact contract or by testing.

### Correct Pattern: Unauthenticated Poll Reads (existing server route)

```typescript
// Source: lib/api/polls-handler.ts (VERIFIED — read file)
// GET /api/polls returns all polls without wallet. usePoll() can use this.
const res = await fetch("/api/polls");
const all: PollOnChain[] = await res.json();
const poll = all.find((p) => p.pollId === pollId) ?? null;
```

### Correct Pattern: Invite Code On-Chain Submission

```typescript
// Source: lib/queries/use-add-invite-codes.ts (VERIFIED — read file)
// use-add-invite-codes.ts is the canonical reference for this pattern
for (const code of inviteCodes) {
  await callAddInviteCodes(contract, {
    pollId: pollIdBytes,         // real Uint8Array from contract result
    codeHash: code.hash,        // Uint8Array from generateInviteCodes()
  });
}
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Poll ID bytes from contract result | Custom parsing | `result?.private?.result` | Midnight SDK returns typed Uint8Array in private result |
| Bytes ↔ hex conversion | `Buffer.from()` / manual | `bytesToHex()` / `hexToBytes()` in `lib/midnight/ledger-utils.ts` | Already implemented, handles encoding consistently |
| Invite code normalization | Manual padding | `inviteCodeToBytes32()` in `lib/midnight/invite-codes.ts` | Already handles Bytes<32> padding |
| Contract provider assembly | Manual provider wiring | `assembleMidnightProviders()` in `lib/midnight/providers.ts` | Complex ZK/indexer/wallet wiring |
| Secret key extraction | Direct wallet API | `getSecretKeyFromWallet()` in `lib/midnight/witness-impl.ts` | Handles 1am wallet API quirks |

---

## Complete Rewrite Templates

### `use-create-poll.ts` — full `mutationFn` after fixes

```typescript
// Source: synthesized from lib/midnight/contract-service.ts + existing use-invite-vote-mutation.ts
mutationFn: async (input: CreatePollInput): Promise<CreatePollResult> => {
  if (!providers) throw new Error("Wallet not connected");

  // Validate
  const validationError = validatePollMetadata({
    title: input.title,
    description: input.description,
    options: input.options,
  });
  if (validationError) throw new Error(validationError);

  // Metadata hash
  const metadataHash = await computeMetadataHash({
    title: input.title,
    description: input.description,
    options: input.options,
  });

  // Witness inputs (these lines already exist in the file — keep them)
  const secretKey = await getSecretKeyFromWallet(providers.walletProvider);
  const blockNumber = await getCurrentBlockNumber(providers.indexerConfig.indexerUri);
  const expirationBlock = blockNumber + input.expirationBlocks;

  // Find contract
  const contractAddress = getContractAddress();
  if (!contractAddress) throw new Error("VITE_POLL_CONTRACT_ADDRESS not configured");
  const contract = await findPollContract(providers, contractAddress, secretKey, blockNumber);

  // Create poll on-chain
  const result = await callCreatePoll(contract, {
    metadataHash,
    optionCount: input.options.length,
    pollType: input.pollType === "invite_only" ? 1 : 0,
    expirationBlock,
  });

  // Extract real poll ID bytes (ASSUMED shape — verify against generated types)
  const rawResult = result?.private?.result ?? result?.result;
  if (!rawResult) throw new Error("Contract did not return a poll ID");
  const pollIdBytes =
    rawResult instanceof Uint8Array ? rawResult : new Uint8Array(rawResult);
  const pollId = bytesToHex(pollIdBytes);

  // Store metadata off-chain
  await fetch("/api/polls/metadata", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pollId,
      metadata: {
        title: input.title,
        description: input.description,
        options: input.options,
        createdAt: new Date().toISOString(),
      },
      metadataHash: bytesToHex(metadataHash),
    }),
  });

  // Invite-only: submit hashes on-chain, store codes locally
  let inviteCodes: InviteCode[] | undefined;
  if (input.pollType === "invite_only" && input.inviteCodeCount && input.inviteCodeCount > 0) {
    const codeSet = await generateInviteCodes(input.inviteCodeCount, pollIdBytes);
    inviteCodes = codeSet.codes;
    for (const code of inviteCodes) {
      await callAddInviteCodes(contract, { pollId: pollIdBytes, codeHash: code.hash });
    }
    storeInviteCodes(pollId, inviteCodes);
  }

  return { pollId, inviteCodes };
},
```

### `use-vote-mutation.ts` — full `mutationFn` after fixes

```typescript
// Source: synthesized from lib/midnight/contract-service.ts + existing use-invite-vote-mutation.ts
mutationFn: async (params: CastVoteParams): Promise<void> => {
  if (!providers) throw new Error("Wallet not connected");
  const contractAddress = getContractAddress();
  if (!contractAddress) throw new Error("No contract deployed");
  const secretKey = await getSecretKeyFromWallet(providers.walletProvider);
  const blockNumber = await getCurrentBlockNumber(providers.indexerConfig.indexerUri);
  const contract = await findPollContract(providers, contractAddress, secretKey, blockNumber);
  await callCastVote(contract, {
    pollId: hexToBytes(params.pollId),
    optionIndex: params.optionIndex,
  });
},
```

---

## Common Pitfalls

### Pitfall 1: `callCreatePoll` result shape — `result.private.result` vs. `result.result`
**What goes wrong:** If the result field path is wrong, `rawResult` is undefined, the code throws "Contract did not return a poll ID", and poll creation fails after the on-chain transaction already succeeded (producing an orphaned on-chain poll with no metadata or codes).
**Why it happens:** Midnight SDK transaction results have a nested structure that depends on whether the circuit has private outputs. `callCreatePoll` likely returns private state.
**How to avoid:** Verify the type by printing `Object.keys(result)` and `Object.keys(result.private ?? {})` on first test run. The fallback chain `result?.private?.result ?? result?.result` provides defensive coverage.
**Warning signs:** Error "Contract did not return a poll ID" after a successful on-chain transaction.

### Pitfall 2: Re-using stale `contract` after `findPollContract`
**What goes wrong:** If `findPollContract()` is called once and the result is cached (e.g., in a ref), the contract state may be stale (wrong block height). Subsequent calls using a stale contract may fail or use wrong witness data.
**Why it happens:** Midnight contract instances are bound to a specific block height.
**How to avoid:** Always call `findPollContract()` fresh inside each mutation invocation. Do not cache the contract object between mutations.

### Pitfall 3: Sequential `callAddInviteCodes` blocking the UI
**What goes wrong:** If an invite-only poll has 10+ codes, the sequential `for...of` loop calling `callAddInviteCodes()` once per code can take 30+ seconds (each call is a blockchain transaction). The UI appears frozen.
**Why it happens:** Each `callAddInviteCodes` is a separate ZK proof + transaction submission.
**How to avoid:** Show a progress indicator during code submission. Consider batching if the contract supports it (research Compact contract's `add_invite_codes` circuit signature). If batching is not available, parallelize with `Promise.all()` if the contract allows concurrent transactions from the same account.
**Warning signs:** UI hangs on "Creating poll…" for invite-only polls with many codes.

### Pitfall 4: `DATABASE_URL` missing in production → server crash on first API call
**What goes wrong:** `lib/db/client.ts` throws synchronously if `DATABASE_URL` is not set. The Bun server process doesn't crash at startup (it's lazily imported), but the first request to `/api/polls/metadata` will throw an unhandled error.
**Why it happens:** The `neon()` client call is at module level, not wrapped in a function.
**How to avoid:** Ensure `DATABASE_URL` is set in every deployment environment. Add a startup health-check that hits `/api/polls/metadata`.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `callCreatePoll()` returns `result.private.result` as a `Uint8Array` poll ID | GAP-2, Rewrite Template | If shape is different, poll ID extraction throws after on-chain tx succeeds — orphaned poll |
| A2 | `contract` reference from `findPollContract()` is valid for subsequent `callAddInviteCodes()` calls in the same execution | GAP-6 | If contract becomes stale, invite code submission fails silently |

**Note:** A1 is the highest-risk assumption. The planner should add a verification task: log `result` shape on first test run and confirm or correct the path before merging.

---

## Environment Availability

| Dependency | Required By | Available | Value | Notes |
|------------|-------------|-----------|-------|-------|
| `DATABASE_URL` | Neon Postgres (metadata-handler) | ✅ | Set in `.env.local` | Server-only, not bundled |
| `VITE_POLL_CONTRACT_ADDRESS` | Contract mutations (getContractAddress) | ✅ | Set in `.env.local` | Browser-accessible |
| `VITE_INDEXER_URI` | Unauthenticated block number (GAP-11 optional fix) | ❓ | Not verified | Only needed for GAP-11 optional fix |
| Midnight Preview network | On-chain transactions | ✅ | User confirmed contract deployed | External |
| 1am.xyz wallet | All mutations | ✅ | Supported — wallet context implemented | User-installed |

**Missing dependencies with no fallback:** None — all critical dependencies confirmed available.

---

## Validation Architecture

> `workflow.nyquist_validation` not found in `.planning/config.json` — treating as enabled.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | No test framework detected |
| Config file | None |
| Quick run command | N/A |
| Full suite command | N/A |

No `jest.config.*`, `vitest.config.*`, `pytest.ini`, or test directories (`__tests__/`, `tests/`, `test/`) detected in the project. No `test` script in `package.json`.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| POLL-01 | `callCreatePoll` called from browser with real providers | integration | manual — requires live Midnight Preview + wallet | ❌ |
| POLL-02 | `callCastVote` called from browser with real providers | integration | manual — requires live contract + wallet | ❌ |
| POLL-03 | `usePoll(id)` returns data without wallet connection | smoke | manual — load poll detail in incognito | ❌ |
| POLL-04 | Invite code hashes submitted on-chain after poll creation | integration | manual — create invite poll, verify on-chain | ❌ |
| INFRA-01..05 | Neon DB schema + CRUD | integration | manual — POST/GET to `/api/polls/metadata` | ❌ |

### Wave 0 Gaps

All phase requirements require live blockchain or live DB for meaningful testing. No automated test framework is present in the project.

- **Recommendation:** Tests are manual-only for this phase. The planner should include explicit "verify by hand" steps in each task rather than automated test commands.
- If the team wants to add automated tests in the future: `vitest` + `msw` for mock-based unit tests of the mutation hooks would be the appropriate stack.

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Wallet-based (non-password) |
| V3 Session Management | No | Stateless — wallet connection only |
| V4 Access Control | Yes | Contract enforces on-chain; off-chain API has no auth (metadata is public by design) |
| V5 Input Validation | Yes | `validatePollMetadata()` already in `use-create-poll.ts`; `metadata-handler.ts` validates POST body |
| V6 Cryptography | Yes | ZK proof generation via Midnight SDK — never hand-rolled |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Metadata hash mismatch (inject false metadata off-chain) | Tampering | `metadata-handler.ts` recomputes hash and rejects mismatches |
| Replay attack (reuse invite code) | Spoofing | On-chain nullifier prevents double-use; contract enforces |
| Invite code enumeration (brute-force codes) | Info Disclosure | Codes are random Bytes<32> — 2^256 space |
| Phantom API route 404 silently failing | Repudiation | Fixed by GAP-1/GAP-3 — mutations now call contract directly |

---

## Open Questions

1. **`callCreatePoll` return value shape**
   - What we know: Compact circuits with private return values produce a result object. Other Compact JS transactions have been observed to use `result.private.result`.
   - What's unclear: The exact field path for this specific contract's `create_poll` circuit. The generated TypeScript types in `contracts/managed/contract/index.d.ts` would confirm this.
   - Recommendation: Planner should include a task to check `contracts/managed/contract/index.d.ts` (or equivalent) before implementing the poll ID extraction. Add a `console.log(result)` guard in a dev-only test run.

2. **`callAddInviteCodes` parallelism**
   - What we know: Each call is a separate on-chain transaction. Sequential calls are safe but slow.
   - What's unclear: Whether the Midnight SDK allows parallel transactions from the same wallet without nonce conflicts.
   - Recommendation: Start with sequential `for...of` (safe). Add a UX progress counter. Optimize to `Promise.all()` only if sequential proves too slow in testing.

3. **`VITE_INDEXER_URI` availability**
   - What we know: It would enable block number fetching without a wallet (for GAP-11 expired badge).
   - What's unclear: Whether this env var is already set in `.env.local`.
   - Recommendation: GAP-11 is low priority — skip it for now and only address if the team specifically wants the expired badge for unauthenticated users.

---

## Sources

### Primary (HIGH confidence)
- `lib/queries/use-create-poll.ts` — read in full, GAPs 1/2/6/14 verified at exact line numbers
- `lib/queries/use-vote-mutation.ts` — read in full, GAP-3 verified at exact line numbers
- `lib/queries/use-poll.ts` — read in full, GAP-4 verified at exact line numbers
- `lib/queries/use-invite-vote-mutation.ts` — read in full, confirmed correct
- `lib/queries/use-add-invite-codes.ts` — read in full, confirmed correct
- `lib/api/polls-handler.ts` — read in full, GAP-5 confirmed
- `lib/api/metadata-handler.ts` — read in full, Phase 7 confirmed complete
- `lib/db/client.ts` — read in full, `DATABASE_URL` usage confirmed
- `lib/db/migrations.ts` — read in full, schema confirmed correct
- `lib/midnight/contract-service.ts` — read in full, canonical reference for fix patterns
- `lib/midnight/witness-impl.ts` — read in full, `getSecretKeyFromWallet` + `getCurrentBlockNumber` confirmed
- `lib/midnight/invite-codes.ts` — read in full, `generateInviteCodes` + `inviteCodeToBytes32` confirmed
- `lib/midnight/ledger-utils.ts` — read in full, `bytesToHex` + `hexToBytes` confirmed
- `lib/midnight/providers.ts` — read in full, `assembleMidnightProviders` confirmed
- `lib/midnight/wallet-context.tsx` — read in full, `useWalletContext` hook confirmed
- `server.ts` — read in full, missing routes confirmed
- `vite.config.ts` — read in full, proxy config confirmed
- `.env.local` — read, `DATABASE_URL` and `VITE_POLL_CONTRACT_ADDRESS` confirmed set

---

## Metadata

**Confidence breakdown:**
- Gap identification: HIGH — every gap verified by reading the actual file at the exact line number
- Fix patterns: HIGH for removal of phantom fetch calls; ASSUMED for `callCreatePoll` result shape (A1)
- Phase 7 status: HIGH — all files read, env var confirmed
- Architecture patterns: HIGH — synthesized from correct existing code (`use-invite-vote-mutation.ts`)

**Research date:** 2026-04-09
**Valid until:** 2026-05-09 (stable codebase — no active Midnight SDK upgrades expected)
