---
phase: quick/260410-ars-make-poll-page-show-live-results-vote-co
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - lib/queries/use-poll.ts
  - src/routes/poll-detail.tsx
autonomous: true
requirements: [quick-260410-ars]
must_haves:
  truths:
    - "Poll page shows live results and vote counts without wallet connection"
    - "Poll page shows expiration date/time without wallet connection"
    - "Wallet is only required for casting votes and viewing participation proof"
  artifacts:
    - path: "lib/queries/use-poll.ts"
      provides: "usePoll hook with wallet-free tallies + block height"
      contains: "currentBlockHeight"
    - path: "src/routes/poll-detail.tsx"
      provides: "Poll detail page without wallet gate for viewing"
  key_links:
    - from: "src/routes/poll-detail.tsx"
      to: "lib/queries/use-poll.ts"
      via: "usePoll hook returning currentBlockHeight"
      pattern: "usePoll"
---

<objective>
Make the poll detail page fully viewable without a wallet connection. Live results, vote counts, and expiration info are public on-chain data available via the indexer API — no wallet needed. The wallet should only gate: (1) casting a vote, and (2) viewing the participation proof card.

Purpose: Currently visitors without a wallet see a blocking overlay and empty data. The on-chain data (poll metadata, tallies, block height) is all served by the existing `/api/polls?id=` and `/api/indexer/block` endpoints, so removing the wallet gate is a data plumbing change, not a new feature.

Output: Modified `usePoll` hook and `poll-detail.tsx` page.
</objective>

<execution_context>
@$HOME/.config/opencode/get-shit-done/workflows/execute-plan.md
@$HOME/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
@lib/queries/use-poll.ts
@src/routes/poll-detail.tsx
@lib/api/polls-handler.ts
@lib/api/indexer-handler.ts
@components/results-panel.tsx
@components/vote-panel.tsx
@components/proof-panel.tsx
@lib/queries/use-polls.ts
@components/wallet-onboarding.tsx

<interfaces>
<!-- Key type: PollTallies — what tallies look like -->
From lib/midnight/ledger-utils.ts:
```typescript
export interface PollTallies {
  pollId: string;
  counts: bigint[];
  total: bigint;
}
```

<!-- Key type: usePoll return — what poll-detail.tsx consumes -->
From lib/queries/use-poll.ts:
```typescript
export function usePoll(pollId: string | null | undefined) {
  return {
    poll: PollWithId | null,
    tallies: PollTallies | null,
    metadata: PollMetadata | null,
    isLoading: boolean,
    isError: boolean,
    error: Error | null,
    refetch: () => void,
  };
}
```

<!-- Server API response shape for single poll -->
From lib/api/polls-handler.ts, GET /api/polls?id=XXX returns:
```json
{
  "currentBlockHeight": number,
  "poll": {
    "id": string,
    "metadataHash": string,
    "optionCount": number,
    "pollType": number,
    "expirationBlock": string,
    "creator": string,
    "tallies": { "counts": string[], "total": string }
  }
}
```

<!-- Server API response shape for block height -->
From lib/api/indexer-handler.ts, GET /api/indexer/block returns:
```json
{ "height": number, "hash": string, "timestamp": number, "author": string }
```

<!-- Existing pattern: usePolls (already wallet-free) -->
From lib/queries/use-polls.ts:
```typescript
export function usePolls() {
  // Fetches from /api/polls — no wallet required
  // Returns { polls, tallies, currentBlockHeight }
}
```

<!-- WalletOnboarding component — requiresWallet=false means it renders nothing -->
From components/wallet-onboarding.tsx:
```typescript
export function WalletOnboarding({ requiresWallet = false }: { requiresWallet?: boolean })
// Only shows blocking overlay when requiresWallet=true AND wallet state is bad
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Make usePoll hook serve tallies and block height without wallet</name>
  <files>lib/queries/use-poll.ts</files>
  <action>
Update the `usePoll` hook to provide tallies and current block height without requiring a wallet connection. The server API already returns both.

**Changes to `lib/queries/use-poll.ts`:**

1. **Extend `PollOnChain` interface** to include tallies and add a top-level `currentBlockHeight`:
   ```typescript
   interface PollOnChain {
     id: string;
     metadataHash: string;
     optionCount: number;
     pollType: number;
     expirationBlock: string;
     creator: string;
     tallies: { counts: string[]; total: string }; // NEW
   }

   interface SinglePollApiResponse {
     currentBlockHeight: number;
     poll: PollOnChain;
   }
   ```

2. **Add `blockQuery`** — a new TanStack Query that fetches current block height from `/api/indexer/block` regardless of wallet state:
   ```typescript
   const blockQuery = useQuery({
     queryKey: ["currentBlock"],
     queryFn: async () => {
       const res = await fetch("/api/indexer/block");
       if (!res.ok) throw new Error("Failed to fetch block height");
       const data = await res.json() as { height: number };
       return data.height;
     },
     refetchInterval: 30_000,
   });
   ```

3. **Fix `talliesQuery`** — remove the `isConnected` gate and add an unauthenticated path:
   - Change `enabled` from `isConnected && !!pollId` to `!!pollId`
   - When wallet IS connected + providers available: use `fetchPollWithTallies` (existing path)
   - When wallet NOT connected: fetch `/api/polls?id=XXX` and extract tallies from the response. Parse tallies `{ counts: string[], total: string }` into `PollTallies` with `BigInt()` conversion. This mirrors the pattern already used in `usePolls.ts`
   - The query function should check `isConnected && providers` to choose the path

4. **Update the return type** to include `currentBlockHeight`:
   ```typescript
   return {
     poll: pollQuery.data ?? null,
     tallies: talliesQuery.data ?? null,
     metadata: metadataQuery.data?.metadata ?? null,
     currentBlockHeight: blockQuery.data ?? null, // NEW
     isLoading: pollQuery.isLoading || talliesQuery.isLoading,
     isError: pollQuery.isError || talliesQuery.isError,
     error: pollQuery.error || talliesQuery.error,
     refetch: () => { pollQuery.refetch(); talliesQuery.refetch(); },
   };
   ```

5. **Remove the `walletContext` dependency from talliesQuery** — import `PollType` from `@/contracts/managed/contract` as needed for the unauthenticated path (same pattern as the pollQuery unauthenticated path already does).

6. **Keep the authenticated path for tallies** — when `isConnected` and `providers` are available, use `fetchPollWithTallies` as before. This gives fresher data and validates the live indexer path.
  </action>
  <verify>grep -n "currentBlockHeight" lib/queries/use-poll.ts && grep -n "enabled: !!pollId" lib/queries/use-poll.ts</verify>
  <done>usePoll returns tallies and currentBlockHeight without wallet connection. talliesQuery enabled when pollId is truthy regardless of wallet state. Authenticated path still uses fetchPollWithTallies for live data.</done>
</task>

<task type="auto">
  <name>Task 2: Remove wallet gate from poll detail page — view without wallet</name>
  <files>src/routes/poll-detail.tsx</files>
  <action>
Update `poll-detail.tsx` so the entire page is viewable without a wallet. Wallet is only required for voting and proof.

**Changes to `src/routes/poll-detail.tsx`:**

1. **Remove `<WalletOnboarding requiresWallet />`** from ALL render branches:
   - Remove from loading state (line ~59)
   - Remove from error state (line ~86)
   - Remove from not-found state (line ~107)
   - Remove from success state (line ~132)
   - The `WalletOnboarding` component renders nothing when `requiresWallet=false` (default), so simply delete these `<WalletOnboarding requiresWallet />` lines entirely — no replacement needed. The VotePanel already has its own "Connect Wallet" button for unauthenticated users, and ProofPanel is gated by `isConnected`.

2. **Replace the `useEffect`-based `currentBlock` state** with the `currentBlockHeight` from `usePoll`:
   - Remove the `useState<bigint>` for `currentBlock`
   - Remove the `useEffect` that fetches `getCurrentBlockNumber(providers.indexerConfig.indexerUri)` with interval
   - Remove the `import { getCurrentBlockNumber }` from `@/lib/midnight/witness-impl` (no longer needed)
   - Destructure `currentBlockHeight` from `usePoll(pollId)`
   - Derive `currentBlock` from `currentBlockHeight`:
     ```typescript
     const currentBlock = currentBlockHeight != null ? BigInt(currentBlockHeight) : BigInt(0);
     ```
   - Remove the `isExpired` calculation that depends on `currentBlock` and move it after `currentBlock` is derived:
     ```typescript
     const isExpired = poll !== null && currentBlock > BigInt(0) && poll.data.expiration_block <= currentBlock;
     ```

3. **Remove the `providers` dependency** from poll-data rendering:
   - Remove the line `const { status, providers } = useWalletContext();` — wait, keep `status` for `isConnected`:
     ```typescript
     const { status } = useWalletContext();
     const isConnected = status === "connected";
     ```
   - The `providers` object is no longer needed in this component since `currentBlock` no longer requires it

4. **Update `usePoll` destructuring** to include `currentBlockHeight`:
   ```typescript
   const { poll, tallies, metadata, currentBlockHeight, isLoading, isError, error, refetch } = usePoll(pollId);
   ```

5. **Remove `useEffect` import** if it's no longer used (keep `useState` only if still needed — it won't be since `currentBlock` is now derived, not state).

The resulting page flow:
- **No wallet**: Page loads fully — sees poll title, description, results panel, expiration info, vote counts. VotePanel shows "Connect Wallet" button (already handles this). ProofPanel doesn't render (guarded by `isConnected`).
- **With wallet**: Same as before — live data via indexer, can vote, can see proof.
  </action>
  <verify>grep -c "WalletOnboarding" src/routes/poll-detail.tsx && grep -c "getCurrentBlockNumber" src/routes/poll-detail.tsx && grep -c "currentBlockHeight" src/routes/poll-detail.tsx</verify>
  <done>Poll detail page renders completely without wallet connection. No WalletOnboarding overlay blocks the page. Current block height comes from usePoll (server API) instead of wallet-dependent getCurrentBlockNumber. Wallet is only needed for VotePanel's vote button and ProofPanel rendering.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Client → Server API | Untrusted input crossing trust boundary — poll ID in query params |
| Server API → Indexer | Server-to-indexer communication — already trusted path |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-quick-01 | I (Info Disclosure) | /api/polls?id= endpoint | accept | Tallies are public on-chain data — no PII or private info exposed |
| T-quick-02 | S (Spoofing) | Poll ID parameter | mitigate | Existing server validation: poll ID is passed as URL param, validated against on-chain state |
</threat_model>

<verification>
1. Run `bun run build` — must compile without errors
2. Open poll page without wallet — should see poll title, description, live results, vote counts, expiration badge
3. Verify VotePanel still shows "Connect Wallet" button when not connected
4. Verify ProofPanel does NOT render when wallet is not connected
5. Connect wallet — all existing functionality should work unchanged
</verification>

<success_criteria>
- Poll page displays live results, vote counts, and expiration info without wallet connection
- Wallet is only required for casting votes (VotePanel) and viewing participation proof (ProofPanel)
- No WalletOnboarding overlay blocks the poll page
- `usePoll` hook serves tallies and block height from server API when wallet is not connected
- Build passes cleanly
</success_criteria>

<output>
After completion, create `.planning/quick/260410-ars-make-poll-page-show-live-results-vote-co/260410-ars-SUMMARY.md`
</output>