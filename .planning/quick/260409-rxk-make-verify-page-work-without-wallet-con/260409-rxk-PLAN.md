---
phase: quick
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - lib/api/indexer-handler.ts
  - lib/queries/use-verify-proof.ts
  - src/routes/verify.tsx
autonomous: true
requirements: [D-62]
must_haves:
  truths:
    - "Verify page displays proof status without requiring wallet connection"
    - "Server-side nullifier check confirms on-chain vote existence"
    - "Invalid nullifiers show correct 'not found' UI state"
  artifacts:
    - path: "lib/api/indexer-handler.ts"
      provides: "GET /api/indexer/verify-nullifier endpoint"
      contains: "verify-nullifier"
    - path: "lib/queries/use-verify-proof.ts"
      provides: "Wallet-free verification query hook"
      contains: "fetch.*verify-nullifier"
    - path: "src/routes/verify.tsx"
      provides: "Verify page without wallet gate"
  key_links:
    - from: "lib/queries/use-verify-proof.ts"
      to: "/api/indexer/verify-nullifier"
      via: "TanStack Query fetch"
      pattern: "fetch.*verify-nullifier"
---

<objective>
Make the /verify page work without wallet connection by moving the on-chain nullifier check to a server-side API endpoint and calling it via fetch instead of requiring wallet-gated SDK indexer access.

Purpose: Third-party proof verification (ZKPR-02) should work for anyone with a link — no wallet required. Currently D-62 specifies "wallet required" because the SDK's IndexerPublicDataProvider needs wallet-provided indexer URIs. The same data is available via our server-side indexer API, so we can eliminate the wallet gate.

Output: Verify page that works for any visitor with a valid /verify?pollId=...&nullifier=... link.
</objective>

<execution_context>
$HOME/.config/opencode/get-shit-done/workflows/execute-plan.md
$HOME/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md

Key existing patterns:

**Polls handler** (lib/api/polls-handler.ts) already does server-side indexer + ledger parsing:
```typescript
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { ledger as parseLedger } from "@/contracts/managed/contract";

const provider = indexerPublicDataProvider(INDEXER_URI, INDEXER_WS_URI);
const contractState = await provider.queryContractState(CONTRACT_ADDRESS);
const ledgerState = parseLedger(contractState.data);
```

**Indexer handler** (lib/api/indexer-handler.ts) already has Hono sub-router with CORS and env-configured defaults.

**Current verify hook** (lib/queries/use-verify-proof.ts) requires wallet for URIs:
```typescript
const { status, providers } = useWalletContext();   // ← wallet gate
const publicDataProvider = await createIndexerProvider(
  providers.indexerConfig.indexerUri,              // ← only available from wallet
  providers.indexerConfig.indexerWsUri,
);
const state = await publicDataProvider.queryContractState(contractAddress);
const ledgerState = parseLedger(state.data);
return ledgerState.vote_nullifiers.member(nullifierBytes);
```

**Contract** (contracts/src/poll.compact): `vote_nullifiers: Map<Bytes<32>, Boolean>` — global map, nullifier = hash(poll_id, voter_sk), so membership check alone proves a vote was cast.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add server-side verify-nullifier endpoint</name>
  <files>lib/api/indexer-handler.ts</files>
  <action>
Add a new route `GET /api/indexer/verify-nullifier?nullifier=<hex>` to the existing Hono sub-router in `lib/api/indexer-handler.ts`.

Implementation:
1. Add imports at the top: `indexerPublicDataProvider` from `@midnight-ntwrk/midnight-js-indexer-public-data-provider`, `ledger as parseLedger` from `@/contracts/managed/contract`, `hexToBytes` from `@/lib/midnight/ledger-utils`, `IndexerQueryError` from `@/lib/midnight/indexer-client`.
2. Add route handler after the existing `/api/indexer/contract` route:
   ```
   indexerRoutes.get("/api/indexer/verify-nullifier", async (c) => {
     return handleVerifyNullifier(new URL(c.req.url));
   });
   ```
3. Add `handleVerifyNullifier(url: URL): Promise<Response>` function that:
   - Reads `nullifier` from query params (required, must be 64-char hex string)
   - Uses `CONTRACT_ADDRESS` env var (already defined as `DEFAULT_CONTRACT_ADDRESS` in the file)
   - Creates `indexerPublicDataProvider(INDEXER_URI, INDEXER_WS_URI)` — same pattern as `polls-handler.ts`
   - Calls `provider.queryContractState(CONTRACT_ADDRESS)` to get contract state
   - If no state: return `json({ nullifier, found: false })` (contract not deployed yet, not an error)
   - Parses with `parseLedger(contractState.data)`
   - Converts nullifier hex to bytes with `hexToBytes(nullifier)`
   - Checks `ledgerState.vote_nullifiers.member(nullifierBytes)` — returns boolean
   - Returns `json({ nullifier, found: <boolean> })`
   - On error: returns appropriate error response (503 for IndexerQueryError, 500 for unexpected)

4. Add `INDEXER_URI` and `INDEXER_WS_URI` constants at the top (same values as polls-handler: `process.env.INDEXER_URI ?? "https://indexer.preview.midnight.network/api/v3/graphql"` and `process.env.INDEXER_WS_URI ?? "wss://indexer.preview.midnight.network/api/v3/graphql/ws"`).

Follow the existing error handling pattern from `handleIndexerError`. Follow the existing validation pattern from `handleContract` for the hex param validation.
  </action>
  <verify>
    <automated>curl -s "http://localhost:3001/api/indexer/verify-nullifier?nullifier=0000000000000000000000000000000000000000000000000000000000000000" | python3 -m json.tool 2>/dev/null || echo "Server not running or endpoint not yet available — verify manually after dev:api start"</automated>
  </verify>
  <done>GET /api/indexer/verify-nullifier?nullifier=<hex> returns { nullifier, found: boolean } without requiring wallet connection. Invalid hex returns 400. Missing nullifier param returns 400. Indexer errors return 503.</done>
</task>

<task type="auto">
  <name>Task 2: Rewrite useVerifyProof without wallet + update verify page</name>
  <files>lib/queries/use-verify-proof.ts, src/routes/verify.tsx</files>
  <action>
**lib/queries/use-verify-proof.ts** — Complete rewrite to remove wallet dependency:

1. Remove all wallet-related imports (`useWalletContext`, `createIndexerProvider`, `getContractAddress`).
2. Remove Compact/WASM imports (`ledger as parseLedger`, `hexToBytes`) — server handles ledger parsing now.
3. Rewrite `useVerifyProof` to use TanStack Query with a simple `fetch()`:
   ```typescript
   import { useQuery } from "@tanstack/react-query";

   export interface VerifyProofResult {
     isValid: boolean | null;
     isLoading: boolean;
     isError: boolean;
     error: Error | null;
     needsWallet: false;  // always false now — type narrowing for callers
     refetch: () => void;
   }

   export function useVerifyProof(pollId: string, nullifier: string): VerifyProofResult {
     const hasParams = pollId.length > 0 && nullifier.length > 0;

     const query = useQuery({
       queryKey: ["verify-proof", pollId, nullifier],
       queryFn: async () => {
         const res = await fetch(
           `/api/indexer/verify-nullifier?nullifier=${encodeURIComponent(nullifier)}`
         );
         if (!res.ok) {
           const body = await res.json().catch(() => ({}));
           throw new Error(body.error ?? `Verification request failed (${res.status})`);
         }
         const data = await res.json();
         return data.found as boolean;
       },
       enabled: hasParams,
       staleTime: 60_000,
       retry: 1,
     });

     return {
       isValid: query.data !== undefined ? query.data : null,
       isLoading: query.isLoading,
       isError: query.isError,
       error: query.error instanceof Error ? query.error : null,
       needsWallet: false as const,
       refetch: query.refetch,
     };
   }
   ```

4. Keep the `VerifyProofResult` interface for backward compatibility but make `needsWallet` always `false`. Export both.

**src/routes/verify.tsx** — Remove wallet gate:

1. Remove `import { useWalletContext } from "@/lib/midnight/wallet-context"` import.
2. Remove `const { connect } = useWalletContext()` line.
3. Remove the entire "Needs wallet" conditional block (the `if (needsWallet)` block that renders the wallet connection UI). The variable `needsWallet` is now always `false` so this block would never render, but remove it for dead code elimination.
4. Remove the `needsWallet` destructuring from the `useVerifyProof` call (it's always false, keep only what's used: `isValid, isLoading, isError, error, refetch`).

No other changes needed — the loading, error, verified, and invalid states all work the same.
  </action>
  <verify>
    <automated>cd /home/hkedia/Code/ourobeam/shadow-poll && grep -c "useWalletContext" lib/queries/use-verify-proof.ts && grep -c "needsWallet" src/routes/verify.tsx</automated>
  </verify>
  <done>useVerifyProof hook uses fetch() to /api/indexer/verify-nullifier without wallet. Verify page has no wallet gate. Old wallet connection UI block removed from verify.tsx.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Client → API | Untrusted input (nullifier hex string from URL param) crosses here |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-quick-01 | Tampering | /api/indexer/verify-nullifier nullifier param | mitigate | Validate nullifier is 64-char hex via regex `/^[0-9a-f]{64}$/i` before processing, reject with 400 otherwise |
| T-quick-02 | Info Disclosure | verify-nullifier response | accept | Response only reveals boolean membership — nullifier is already a public hash, no PII disclosed |
| T-quick-03 | DoS | verify-nullifier endpoint | accept | Single indexer query per request; no amplification vector. Rate limiting can be added later if needed |
</threat_model>

<verification>
1. Start API server: `bun run dev:api`
2. Test endpoint: `curl "http://localhost:3001/api/indexer/verify-nullifier?nullifier=0000000000000000000000000000000000000000000000000000000000000000"` — returns `{ nullifier, found: false }`
3. Test missing param: `curl "http://localhost:3001/api/indexer/verify-nullifier"` — returns 400
4. Test bad hex: `curl "http://localhost:3001/api/indexer/verify-nullifier?nullifier=not_hex"` — returns 400
5. Start client: `bun run dev`, navigate to `/verify?pollId=<valid>&nullifier=<valid>` — page loads without wallet prompt, shows verified or invalid result
6. Verify no `useWalletContext` reference remains in `use-verify-proof.ts`
7. Verify "Connect Wallet to Verify" UI block removed from verify.tsx
</verification>

<success_criteria>
- Verify page loads and shows result for any visitor without wallet connection
- Server endpoint returns correct boolean for nullifier membership check
- No wallet-related imports or UI in verify page or useVerifyProof hook
- Error states (missing params, indexer down) handled gracefully in UI
</success_criteria>

<output>
After completion, create `.planning/quick/260409-rxk-make-verify-page-work-without-wallet-con/260409-rxk-SUMMARY.md`
</output>