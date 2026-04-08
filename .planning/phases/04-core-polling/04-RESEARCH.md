# Phase 4: Core Polling - Research

**Researched:** 2026-04-08
**Domain:** Full-stack Midnight blockchain contract interaction (deploy, call, read) + Next.js UI pages
**Confidence:** HIGH

## Summary

Phase 4 brings together all prior phases into a working end-to-end polling application. The wallet (Phase 1), smart contracts (Phase 2), and data layer (Phase 3) are ready — Phase 4 fills in the "Phase 4 placeholders" left throughout the codebase and builds the three main UI pages: Create Poll, Trending Polls, and Poll Detail/Voting.

The primary technical challenge is wiring the Midnight SDK's contract interaction APIs (`deployContract`, `findDeployedContract`, `callTx`) into the existing hook/query architecture while respecting the Turbopack stubbing constraint (all `@midnight-ntwrk/*` imports must be dynamic). The contract (`poll.compact`) is already compiled; witnesses (`local_secret_key`, `current_block_number`) need TypeScript implementations. The data hooks (`usePoll`, `usePolls`, `useVoteMutation`) have the correct structure with Phase 4 TODOs — only the `queryFn` and `mutationFn` bodies need to be implemented.

**Primary recommendation:** Structure Phase 4 into 3 plans: (1) contract interaction service layer (deploy/find/call + witness implementations + provider assembly for `MidnightProviders`), (2) fill existing data hooks with real SDK calls + update header navigation, (3) build the 3 pages (Create Poll, Trending Polls, Poll Detail) using the design references in `.design/`.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| POLL-01 | Create public poll on-chain | Contract `create_poll` circuit is compiled; needs witness impl + `deployContract`/`callTx` wiring |
| POLL-03 | Vote on public poll on-chain | Contract `cast_vote` circuit is compiled; `useVoteMutation` has optimistic update skeleton |
| POLL-04 | View poll details with live tallies | `usePoll` hook exists with correct keys; `readPoll`/`readTallies` ledger utils exist; needs `queryFn` |
| POLL-07 | Poll expiration | Contract enforces `block < expiration_block`; UI needs expiration display + enforcement |
| PAGE-01 | Home / Trending Polls page | Design ref at `.design/trending_polls/`; `usePolls` hook exists |
| PAGE-02 | Create Poll page | Design ref at `.design/create_poll/`; metadata store + hash functions exist |
| PAGE-03 | Poll Detail / Voting page | Design ref at `.design/view_poll/`; `usePoll` + `useVoteMutation` exist |
</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@midnight-ntwrk/midnight-js-contracts` | 4.0.4 | `deployContract`, `findDeployedContract`, `callTx` | SDK's canonical contract interaction API [VERIFIED: node_modules] |
| `@midnight-ntwrk/compact-js` | 2.5.0 | `CompiledContract.make`, `withWitnesses`, `withCompiledFileAssets` | Creates the compiled contract object for SDK [VERIFIED: node_modules] |
| `@midnight-ntwrk/midnight-js-types` | 4.0.4 | `MidnightProviders`, `PublicDataProvider`, `WalletProvider`, etc. | Canonical provider interfaces [VERIFIED: node_modules] |
| `@midnight-ntwrk/compact-runtime` | (transitive) | `WitnessContext`, `CircuitContext`, `StateValue` | Runtime types for witness implementations [VERIFIED: node_modules] |
| `@midnight-ntwrk/midnight-js-indexer-public-data-provider` | 4.0.4 | `indexerPublicDataProvider()` factory | Creates the `PublicDataProvider` instance [VERIFIED: node_modules] |
| `@tanstack/react-query` | 5.96.2 | Data fetching, caching, optimistic updates | Already integrated in Phase 3 [VERIFIED: package.json] |
| `next` | 16.2.2 | App Router pages, API routes | Framework [VERIFIED: package.json] |

### Supporting (Need to Install)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@radix-ui/react-label` | latest | Accessible form labels for Create Poll form | Form accessibility [ASSUMED] |
| `@radix-ui/react-radio-group` | latest | Radio button group for voting option selection | Poll Detail voting UI [ASSUMED] |
| `@radix-ui/react-progress` | latest | Progress bars for vote tallies | Poll Detail results display [ASSUMED] |

**Note:** These Radix primitives are optional — the design HTMLs use native inputs with CSS. Shadcn/ui `Input`, `Label`, `RadioGroup`, `Progress` components can be added via `bunx shadcn@latest add input label radio-group progress` to follow existing patterns. [ASSUMED]

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| shadcn RadioGroup | Native `<input type="radio">` | Design HTMLs use native + CSS; shadcn provides consistent accessible API |
| react-hook-form | Native form state | Small form (3-5 fields); react-hook-form is overkill |
| date-fns for expiration | Native Date + BigInt | Expiration is block-number-based (D-24), not date — no date library needed |

## Architecture Patterns

### Recommended Project Structure
```
lib/
├── midnight/
│   ├── contract-service.ts   # NEW: deploy, find, call contract functions
│   ├── witness-impl.ts       # NEW: local_secret_key + current_block_number witnesses
│   ├── contract-types.ts     # EXISTS: re-exports from compiled contract
│   ├── indexer.ts             # EXISTS: createIndexerProvider, createZkConfigProvider
│   ├── ledger-utils.ts        # EXISTS: readPoll, readTallies, deriveTallyKey
│   ├── metadata-store.ts      # EXISTS: computeMetadataHash, validatePollMetadata
│   ├── providers.ts           # UPDATE: assembleProviders → return full MidnightProviders
│   ├── types.ts               # UPDATE: tighten remaining any types
│   ├── use-wallet.ts          # EXISTS
│   └── wallet-context.tsx     # EXISTS
├── queries/
│   ├── use-poll.ts            # UPDATE: fill queryFn placeholders
│   ├── use-polls.ts           # UPDATE: fill queryFn placeholder
│   ├── use-vote-mutation.ts   # UPDATE: fill mutationFn with callTx.cast_vote
│   ├── use-create-poll.ts     # NEW: mutation for poll creation
│   ├── use-metadata.ts        # EXISTS: fully functional
│   ├── query-client.ts        # EXISTS
│   └── query-provider.tsx     # EXISTS
app/
├── page.tsx                   # UPDATE: replace HeroSection with TrendingPolls when connected
├── create/page.tsx            # NEW: Create Poll page (PAGE-02)
├── poll/[id]/page.tsx         # NEW: Poll Detail page (PAGE-03)
├── api/polls/metadata/route.ts # EXISTS
components/
├── header.tsx                 # UPDATE: add nav links (Create Poll, Trending Polls)
├── poll-card.tsx              # NEW: poll card for trending list
├── create-poll-form.tsx       # NEW: multi-step form with options
├── vote-panel.tsx             # NEW: radio options + vote button
├── results-panel.tsx          # NEW: progress bars with live tallies
├── expiration-badge.tsx       # NEW: time remaining indicator
```

### Pattern 1: Contract Interaction Service (Dynamic Import)
**What:** A service module that wraps all SDK contract calls behind dynamic imports to comply with the Turbopack stubbing constraint.
**When to use:** Every time we need to deploy, find, or call a contract circuit.
**Example:**
```typescript
// lib/midnight/contract-service.ts
// ALL @midnight-ntwrk imports MUST be dynamic (Turbopack stubs them statically)

export async function deployPollContract(providers: MidnightProviders) {
  const { CompiledContract } = await import("@midnight-ntwrk/compact-js");
  const { deployContract } = await import("@midnight-ntwrk/midnight-js-contracts");
  const { Contract } = await import("@/contracts/managed/contract");

  const compiledContract = CompiledContract.make("poll-manager", Contract)
    |> CompiledContract.withWitnesses(witnessImplementations)
    |> CompiledContract.withCompiledFileAssets("contracts/managed");

  return deployContract(providers, { compiledContract });
}
```
[VERIFIED: SDK types from node_modules]

### Pattern 2: Witness Implementation
**What:** TypeScript implementations for the two Compact witness functions declared in `poll.compact`.
**When to use:** Required before any circuit can be proven.
**Example:**
```typescript
// lib/midnight/witness-impl.ts
import type { WitnessContext, Ledger } from "@/contracts/managed/contract";

// The witnesses type from the compiled contract:
// local_secret_key(context: WitnessContext<Ledger, PS>): [PS, Uint8Array]
// current_block_number(context: WitnessContext<Ledger, PS>): [PS, bigint]

export function createWitnesses<PS>() {
  return {
    local_secret_key: (context: WitnessContext<Ledger, PS>): [PS, Uint8Array] => {
      // The secret key comes from the wallet — it's the shielded address or a
      // derived key. The wallet provider supplies this.
      // Return [unchanged private state, key bytes]
      const sk = /* derive from wallet context */ ;
      return [context.privateState, sk];
    },
    current_block_number: (context: WitnessContext<Ledger, PS>): [PS, bigint] => {
      // Query the current block from the indexer or use a cached value.
      // The ZK proof guarantees the assertion — the prover cannot lie.
      return [context.privateState, currentBlockNumber];
    },
  };
}
```
[VERIFIED: Witnesses type from contracts/managed/contract/index.d.ts]

### Pattern 3: Provider Assembly for MidnightProviders
**What:** The SDK's `deployContract`/`findDeployedContract` requires a full `MidnightProviders` object with 6 providers: `privateStateProvider`, `publicDataProvider`, `zkConfigProvider`, `proofProvider`, `walletProvider`, `midnightProvider`.
**When to use:** Before any contract interaction.
**Key insight:** The current `MidnightProviderSet` (from Phase 1/3) stores `indexerConfig` (URIs) and loose `any` types for wallet/proof. Phase 4 must:
1. Create real `PublicDataProvider` via `indexerPublicDataProvider(uri, wsUri)` 
2. Map wallet's `enabledApi` to SDK's `WalletProvider` interface (`balanceTx`, `getCoinPublicKey`, `getEncryptionPublicKey`)
3. Map wallet's `enabledApi` to SDK's `MidnightProvider` interface (`submitTx`)
4. Create a `PrivateStateProvider` (in-memory is fine for v1/testnet)
[VERIFIED: MidnightProviders interface from midnight-js-types/dist/providers.d.ts]

### Pattern 4: Contract Address Management  
**What:** After deploying the poll manager contract, the contract address must be stored so all users can find it.
**When to use:** Deployment happens once; all subsequent interactions use `findDeployedContract`.
**Key insight:** The single Poll Manager contract (D-20) means ONE deployed contract serves all polls. The contract address needs to be:
- Stored after first deployment (env var, API route, or constant)
- Used by all clients to `findDeployedContract` and get the `callTx` interface
- The first user to interact with the app would deploy; subsequent users find
[ASSUMED — need to decide: deploy-on-first-use vs. pre-deployed address]

### Anti-Patterns to Avoid
- **Static imports of @midnight-ntwrk packages in client components:** Will break Turbopack bundling. ALL SDK imports must use `await import()`. [VERIFIED: next.config.ts resolveAlias]
- **Nested Map access in ledger reads:** Compact doesn't support `Map<Map<Counter>>`. The flat `hash(poll_id, option_index)` scheme is correct. [VERIFIED: poll.compact]
- **Bigint literals (`123n`):** tsconfig targets ES2017 which doesn't support bigint literals. Use `BigInt(123)`. [VERIFIED: previous decision from Phase 3]
- **Passing string to circuit expecting Uint8Array:** All Compact `Bytes<32>` map to `Uint8Array` in TypeScript. Use `hexToBytes()` from ledger-utils. [VERIFIED: contract/index.d.ts]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Contract deployment/discovery | Custom transaction builder | `deployContract` / `findDeployedContract` from midnight-js-contracts | Handles proof generation, VK insertion, state tracking |
| Transaction submission | Manual proof + balance + submit | SDK's `callTx` interface from `FoundContract` | Chains: prove → balance → submit → wait for finalization |
| Query cache invalidation | Manual state tracking | TanStack Query's `invalidateQueries` + `setQueryData` | Already wired in useVoteMutation's onSettled |
| Metadata hash computation | Custom hash | `computeMetadataHash` from metadata-store.ts | SHA-256 with deterministic JSON encoding already exists |
| Tally key derivation | Custom hash | `deriveTallyKey` from ledger-utils.ts | Uses compact-runtime's `persistentHash` to match contract |
| Form validation | Custom validation | `validatePollMetadata` from metadata-store.ts | Already validates title, description, options, lengths |
| Accessible radio buttons | Custom CSS radio | shadcn/ui RadioGroup (or native with proper ARIA) | Keyboard nav, screen reader support |

## Common Pitfalls

### Pitfall 1: Turbopack Alias Resolution in Dynamic Imports
**What goes wrong:** Dynamic `import("@midnight-ntwrk/...")` in client components resolves to the stub module because Turbopack's `resolveAlias` applies to ALL imports, not just static ones.
**Why it happens:** The `next.config.ts` `turbopack.resolveAlias` maps all `@midnight-ntwrk/*` to `./lib/midnight-sdk-stub.ts`.
**How to avoid:** Contract interaction code that uses SDK packages must run server-side (API routes or Server Components) OR be triggered only after the page loads via a callback (the dynamic import at runtime bypasses Turbopack). The existing `createIndexerProvider` in `indexer.ts` uses this pattern. All new SDK calls should follow the same dynamic import pattern in event handlers, not at module level.
**Warning signs:** Getting `undefined` from SDK imports, or the stub module's `undefined` exports.

### Pitfall 2: Witness Implementation Must Match Compact Signature Exactly
**What goes wrong:** Circuit execution fails with cryptic errors if witness return types don't exactly match `[PrivateState, ReturnType]`.
**Why it happens:** The compiled contract's `Witnesses<PS>` type requires `local_secret_key(context): [PS, Uint8Array]` and `current_block_number(context): [PS, bigint]`. Any deviation causes runtime assertion failures.
**How to avoid:** Match the exact signature from `contracts/managed/contract/index.d.ts`. Return the unchanged `context.privateState` as the first tuple element.
**Warning signs:** `TypeError` or assertion failures during proof generation.

### Pitfall 3: Single Contract Architecture Requires Address Sharing
**What goes wrong:** Each user deploys a separate contract instance, creating fragmented state — polls created on one instance aren't visible to others.
**Why it happens:** Decision D-20 specifies a single Poll Manager contract, but the app needs a mechanism to share the deployed contract address.
**How to avoid:** Either (a) deploy the contract once and hardcode/env-var the address, or (b) implement an API route that returns the canonical contract address, deploying on first request if none exists.
**Warning signs:** Users see empty poll lists despite polls being created.

### Pitfall 4: Block Number for Expiration is Network-Specific
**What goes wrong:** Setting expiration_block too low (e.g., using local block numbers) causes polls to expire immediately on preview network, or vice versa.
**Why it happens:** Block numbers on Midnight Preview network increment at their own rate. The contract's `current_block_number()` witness must return the actual network block, not a local timestamp.
**How to avoid:** Query the actual current block number from the indexer/provider when creating a poll. Offer the user a duration (e.g., "1 day", "7 days") and convert to block count based on average block time.
**Warning signs:** Polls expiring immediately or never expiring.

### Pitfall 5: Ledger Map Iteration for Poll Listing
**What goes wrong:** `usePolls` tries to iterate `ledger.polls` but the `Symbol.iterator` on the Map type doesn't return data as expected.
**Why it happens:** The compiled contract's `Ledger.polls` has `[Symbol.iterator](): Iterator<[Uint8Array, PollData]>` but this operates on the parsed ledger state, which requires getting the full contract state first.
**How to avoid:** Get the contract state via `publicDataProvider.queryContractState(address)`, parse it with the `ledger()` function from the compiled contract, then iterate `ledger.polls`.
**Warning signs:** Empty arrays when polls exist on-chain.

## Code Examples

### Assembling MidnightProviders from Wallet
```typescript
// Source: SDK types from midnight-js-types/dist/providers.d.ts
// All imports must be dynamic in client code

export async function assembleMidnightProviders(
  walletProviderSet: MidnightProviderSet,
): Promise<MidnightProviders> {
  const { indexerPublicDataProvider } = await import(
    "@midnight-ntwrk/midnight-js-indexer-public-data-provider"
  );

  const publicDataProvider = indexerPublicDataProvider(
    walletProviderSet.indexerConfig.indexerUri,
    walletProviderSet.indexerConfig.indexerWsUri,
  );

  return {
    publicDataProvider,
    zkConfigProvider: walletProviderSet.zkConfigProvider,
    proofProvider: walletProviderSet.proofProvider,
    walletProvider: walletProviderSet.walletProvider,
    midnightProvider: walletProviderSet.walletProvider, // wallet API also submits txs
    privateStateProvider: createInMemoryPrivateStateProvider(),
  };
}
```

### Finding and Calling a Deployed Contract
```typescript
// Source: midnight-js-contracts types
import type { FoundContract } from "@midnight-ntwrk/midnight-js-contracts";

export async function findPollContract(
  providers: MidnightProviders,
  contractAddress: string,
) {
  const { findDeployedContract } = await import(
    "@midnight-ntwrk/midnight-js-contracts"
  );
  const { CompiledContract } = await import("@midnight-ntwrk/compact-js");
  const { Contract } = await import("@/contracts/managed/contract");

  const compiledContract = CompiledContract.make("poll-manager", Contract);
  // ... attach witnesses and assets path

  const found = await findDeployedContract(providers, {
    compiledContract,
    contractAddress,
  });

  // found.callTx.create_poll(metadataHash, optionCount, pollType, expirationBlock)
  // found.callTx.cast_vote(pollId, optionIndex)
  return found;
}
```

### Querying Contract State for Poll List
```typescript
// Source: verified against compiled contract index.d.ts

export async function fetchAllPolls(
  publicDataProvider: PublicDataProvider,
  contractAddress: string,
): Promise<PollWithId[]> {
  const { ledger: parseLedger } = await import("@/contracts/managed/contract");

  const state = await publicDataProvider.queryContractState(contractAddress);
  if (!state) return [];

  const ledgerState = parseLedger(state);
  const polls: PollWithId[] = [];

  for (const [idBytes, data] of ledgerState.polls) {
    polls.push({
      id: bytesToHex(idBytes),
      idBytes,
      data,
    });
  }

  return polls;
}
```

### Create Poll Flow (End-to-End)
```typescript
// 1. Validate form → compute metadata hash → call create_poll → store metadata

const metadataHash = await computeMetadataHash({ title, description, options });
const expirationBlock = currentBlock + blocksPerDuration(duration);

// Call the on-chain circuit
const result = await contract.callTx.create_poll(
  metadataHash,
  BigInt(options.length),
  PollType.public_poll,
  BigInt(expirationBlock),
);

// result contains the poll ID (Bytes<32> return value from create_poll)
const pollId = bytesToHex(result./* extract return value */);

// Store metadata off-chain
await storeMetadata({ pollId, metadata: { title, description, options, createdAt }, metadataHash: bytesToHex(metadataHash) });
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `any` wallet/proof provider types | Tightened to SDK interfaces | Phase 4 | Type safety for contract calls |
| Placeholder `queryFn` returning null | Real SDK indexer queries | Phase 4 | Live data from blockchain |
| No contract deployment | Full deploy/find/call flow | Phase 4 | Actual on-chain transactions |
| HeroSection as home page | Trending Polls list | Phase 4 | Real app functionality |

## Assumptions Log

> List all claims tagged `[ASSUMED]` in this research.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | shadcn RadioGroup/Progress/Input/Label components should be added via `bunx shadcn@latest add` | Standard Stack (Supporting) | Low — could use native HTML instead |
| A2 | react-hook-form is overkill for a 3-5 field form | Alternatives Considered | Low — can add later if form grows |
| A3 | Contract address management approach (deploy-on-first-use vs. pre-deployed) | Architecture Pattern 4 | HIGH — fundamental architecture decision needed |
| A4 | `walletProvider.walletProvider` from 1am wallet satisfies both SDK `WalletProvider` and `MidnightProvider` interfaces | Code Examples | MEDIUM — needs verification against actual 1am wallet API |
| A5 | In-memory `PrivateStateProvider` is sufficient for v1/testnet | Architecture Pattern 3 | Low — testnet only, data loss on refresh is acceptable |
| A6 | Average block time on Midnight Preview is consistent enough for duration-to-block conversion | Pitfall 4 | MEDIUM — may need to use a generous multiplier |

## Open Questions

1. **Contract Address Management Strategy**
   - What we know: D-20 specifies single contract. Someone must deploy it once.
   - What's unclear: Should the contract address be pre-deployed and hardcoded? Or deployed on first use via the app?
   - Recommendation: Use an environment variable `NEXT_PUBLIC_POLL_CONTRACT_ADDRESS`. If empty, the app deploys on first use and stores the address via API route. This allows both pre-deployed and on-demand approaches.

2. **Wallet API to SDK Provider Mapping**
   - What we know: The 1am wallet's `enabledApi` provides `getConfiguration()`, `getShieldedAddresses()`, and a `getProvingProvider()`.
   - What's unclear: Exactly which methods the wallet exposes that map to `WalletProvider.balanceTx`, `WalletProvider.getCoinPublicKey`, `MidnightProvider.submitTx`.
   - Recommendation: Examine the wallet's return type at runtime (console.log the API shape during development) and adapt. The wallet likely provides these under its DApp connector API.

3. **Private State for Poll Manager Contract**
   - What we know: The contract has witnesses (`local_secret_key`, `current_block_number`) which require a `PrivateState`.
   - What's unclear: Whether the Poll Manager contract uses private state (the contract has no `private` ledger fields, only `export ledger`).
   - Recommendation: The private state is likely `undefined` since all ledger fields are public. Use `DeployContractOptionsBase` (without private state) for deployment.

4. **How to Get Current Block Number for Witness**
   - What we know: `current_block_number()` witness must return the actual Midnight network block number.
   - What's unclear: Which API exposes the current block number — the wallet, the indexer, or a separate endpoint.
   - Recommendation: The `FinalizedTxData` type includes `blockHeight`. Query a recent contract state or use the indexer's latest block info. Alternatively, the wallet's configuration may expose this.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Not configured — no test framework installed |
| Config file | None |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| POLL-01 | Create poll on-chain tx | manual-only | N/A — requires wallet + live blockchain | ❌ |
| POLL-03 | Vote on poll on-chain tx | manual-only | N/A — requires wallet + live blockchain | ❌ |
| POLL-04 | View poll details + tallies | manual-only | N/A — requires indexer connection | ❌ |
| POLL-07 | Poll expiration enforcement | manual-only | N/A — requires block progression | ❌ |
| PAGE-01 | Trending Polls page renders | manual-only | N/A — requires live data | ❌ |
| PAGE-02 | Create Poll page form works | manual-only | N/A — requires wallet | ❌ |
| PAGE-03 | Poll Detail page renders | manual-only | N/A — requires live data | ❌ |

**Justification for manual-only:** All Phase 4 requirements involve blockchain transactions, wallet interactions, or live indexer data. Automated testing would require mocking the entire Midnight SDK stack, which is not established. The project has no test framework configured (REQUIREMENTS.md notes "Not detected - No test framework configured"). Validation is through manual browser testing against Midnight Preview network.

### Wave 0 Gaps
- No test framework installed — would need vitest or jest to add unit tests
- Could unit-test: `computeMetadataHash`, `validatePollMetadata`, `deriveTallyKey`, `hexToBytes/bytesToHex`
- Cannot unit-test: contract interactions, wallet flows, indexer queries

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Wallet IS the identity — no auth system |
| V3 Session Management | No | No server sessions — stateless |
| V4 Access Control | Partial | Contract enforces poll expiration; no admin roles |
| V5 Input Validation | Yes | `validatePollMetadata` for title/desc/options; contract asserts option_count ≤ 10 |
| V6 Cryptography | No | ZK proofs handled by Midnight SDK — never hand-rolled |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Metadata tampering (modify off-chain title/options) | Tampering | On-chain `metadata_hash` verification via `validateMetadataHash()` |
| Replay vote (same wallet votes twice) | Spoofing | Phase 5 (CONT-06) — out of scope for Phase 4 public polls |
| Expired poll vote bypass | Tampering | Contract enforces `block < expiration_block` in ZK proof |
| Invalid option index | Tampering | Contract asserts `option_index < option_count` |
| DOS via poll creation spam | Denial of Service | Blockchain gas/fees provide natural rate limiting |

## Sources

### Primary (HIGH confidence)
- `contracts/managed/contract/index.d.ts` — Compiled contract TypeScript types (Ledger, Witnesses, Circuits, PollData)
- `node_modules/@midnight-ntwrk/midnight-js-contracts/dist/*.d.ts` — SDK contract API types (deployContract, findDeployedContract, ContractProviders)
- `node_modules/@midnight-ntwrk/midnight-js-types/dist/*.d.ts` — Provider interfaces (MidnightProviders, PublicDataProvider, WalletProvider)
- `node_modules/@midnight-ntwrk/compact-js/dist/dts/effect/CompiledContract.d.ts` — CompiledContract builder API
- Codebase files: `lib/midnight/*.ts`, `lib/queries/*.ts`, `app/api/**`, `components/**`
- Design references: `.design/create_poll/code.html`, `.design/trending_polls/code.html`, `.design/view_poll/code.html`

### Secondary (MEDIUM confidence)
- Midnight SDK documentation patterns inferred from type signatures and JSDoc comments in installed packages

### Tertiary (LOW confidence)
- Block time estimates for Midnight Preview network (not verified — may need runtime measurement)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified in node_modules with exact type signatures
- Architecture: HIGH — builds directly on Phases 1-3 with clear extension points
- Pitfalls: HIGH — derived from actual Turbopack config and SDK type constraints
- Contract interaction API: MEDIUM — types verified, but actual runtime behavior with 1am wallet needs testing

**Research date:** 2026-04-08
**Valid until:** 2026-05-08 (30 days — SDK versions are pinned)
