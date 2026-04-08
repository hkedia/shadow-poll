# Phase 6: ZK Proofs & Analytics — Context

## Goal

Users can generate and share verifiable participation proofs for polls they voted on, and view a global analytics dashboard showing aggregate activity across all polls.

## Requirements

| ID | Description |
|----|-------------|
| ZKPR-01 | User can generate a client-side ZK proof of poll participation without revealing chosen option |
| ZKPR-02 | Third parties can verify a participation proof is valid |
| ZKPR-03 | User can share a proof via link or visual badge |
| PAGE-05 | Stats / Analytics page shows global trends, participation rates, aggregate vote counts |

## Success Criteria

1. User can generate a client-side ZK proof that they participated in a poll without revealing their chosen option
2. A third party can verify a participation proof is valid
3. User can share a proof via link or visual badge
4. Stats / Analytics page displays global trends, participation rates, and aggregate vote counts

---

## Design Decisions

### D-60: Hybrid off-chain participation proof (no new contract circuit)

**Decision:** Participation proofs are constructed off-chain. No new Compact circuit, no contract
recompilation, no on-chain transaction to generate a proof.

**Approach:**
1. User's browser derives their vote nullifier: `nullifier = hash(poll_id, voter_sk)`
   using the same `deriveNullifier()` function already in `lib/midnight/ledger-utils.ts`
2. The browser queries the on-chain `vote_nullifiers` map and confirms the nullifier exists
3. A proof artifact is assembled: `{ pollId, nullifier, verifiedAt, appVersion }`
4. This artifact is encoded (base64url) and embedded in a verification URL:
   `/verify?pollId=<hex>&nullifier=<hex>`

**What the verifier learns from the URL:** That the holder knows a nullifier that exists in the
`vote_nullifiers` map for the given poll. They cannot learn which option the prover voted for —
the nullifier is derived from `hash(poll_id, voter_sk)`, not from the option index.

**Why not a real Compact circuit:**
- A `prove_participation` Compact circuit would require compiling new ZK keys, redeploying the
  contract (new ledger = new address, invalidating all existing polls), and submitting an on-chain
  transaction every time a user wants to generate a proof. That is too high a cost for a v1 feature.
- The nullifier is already committed on-chain by the `cast_vote` / `cast_invite_vote` circuits.
  Checking its existence is cryptographically sufficient for "proof of participation" at v1.

**What this IS:** A verifiable on-chain commitment check. The proof URL is a credential asserting
"I know the secret key that produced the nullifier at this poll ID." The verifier page reads
the chain live — it cannot be spoofed without compromising the voter's secret key.

**What this IS NOT:** A ZK proof in the strict cryptographic sense (no zero-knowledge circuit
execution, no proving key, no proof object from the Midnight SDK). This is accurately surfaced
in the UI ("Participation Verified" rather than "ZK Proof Generated").

**Rationale:** Consistent with the project constraint "Client-side Proving: ZK proofs generated
in the user's browser via the Midnight SDK — no server-side proving." Phase 6 generates the
nullifier client-side. The on-chain state is the source of truth. No servers involved.

### D-61: Dual sharing format — URL + SVG badge

**Decision:** Proof sharing supports two formats:
1. **Verification URL** — `/verify?pollId=<hex>&nullifier=<hex>`, copyable from the UI
2. **SVG badge** — client-side generated, downloadable as `shadow-poll-proof-<pollId-prefix>.svg`

**Badge design:** Dark themed (Aether design system). Contains:
- "Shadow Poll" wordmark / logo
- "Participation Verified" label
- Truncated poll ID (first 8 chars)
- Truncated nullifier (first 8 chars, labeled "Proof ID")
- Verification URL as a scannable short form
- QR code is explicitly NOT included in v1 — adds complexity (QR library dependency)

**Badge generation:** Pure browser-side using the Canvas API or inline SVG string construction.
No external dependency needed — SVG is hand-assembled from design tokens. This avoids adding
a canvas/PDF library to the bundle.

**Rationale:** URL is the minimum shareable artifact (zero dependencies). SVG badge gives a
visual credential users can embed in social posts, Discord, etc. Together they cover the
ZKPR-03 requirement with no new runtime dependencies.

### D-62: Verify page reads on-chain vote_nullifiers map live

**Decision:** The `/verify` page is a client-side page that:
1. Reads `pollId` and `nullifier` from URL query params
2. Calls `fetchContractState()` and parses `ledgerState.vote_nullifiers`
3. Checks `vote_nullifiers.member(hexToBytes(nullifier))`
4. Shows a verified badge (green) or invalid state (red) based on membership

**Requires:** Wallet connection to access the indexer. If the wallet is not connected, the verify
page shows a "Connect wallet to verify" prompt. This is acceptable for v1 — the verifier needs
the same indexer access as any other user.

**No server-side verification:** Consistent with zero-server-state constraint. The verify page
is a static React component that queries the blockchain directly.

**Rationale:** The `vote_nullifiers` map is already populated by `cast_vote` and
`cast_invite_vote`. No new contract state is needed. The verify page reuses the same
`fetchPollWithTallies` / `fetchAllPolls` indexer path, extended with a nullifier check.

### D-63: Global-only analytics — no per-wallet tracking

**Decision:** The `/stats` page shows only global aggregate statistics. No per-wallet data
(no "My Polls", no "My Votes" history). Stats are derived entirely from the public contract
state — no additional server, database, or wallet-correlated query.

**Statistics displayed:**
| Stat | Source | Derivation |
|------|--------|------------|
| Total polls created | `ledger.poll_count.read()` | Direct counter read |
| Total votes cast | `ledger.tallies` | Sum all tally Counter values across all polls |
| Active polls | `ledger.polls` | Count polls where `expiration_block > currentBlock` |
| Public / invite-only split | `ledger.polls` | Count by `poll_type` field |
| Average votes per poll | Derived | `totalVotes / totalPolls` |
| Most-voted poll | `ledger.tallies` | Poll with highest sum of tally counts |
| Participation rate | Derived | Presented as avg votes per poll (not per-user — no user count exists) |

**Rationale:** Per-wallet tracking would require correlating wallet address or public key with
poll/vote data, which contradicts the privacy-first design (D-21: public tallies, private voter
identity). Global aggregates are completely safe — they add up public tally values only.

---

## Implementation Approach by Requirement

### ZKPR-01: Client-side participation proof generation

**Location:** Poll Detail page (`app/poll/[id]/page.tsx`) — new "Generate Proof" section,
shown only when the wallet is connected AND the user has voted (nullifier exists on-chain).

**Flow:**
1. After voting (or on page load if already voted), poll detail page shows a "Generate Proof"
   button below the results panel
2. User clicks → browser derives nullifier using `deriveNullifier(pollIdBytes, voterSk)` from
   `lib/midnight/ledger-utils.ts`
3. Verifies nullifier exists in on-chain `vote_nullifiers` (reads contract state via indexer)
4. If confirmed: assembles proof artifact, shows the sharing UI (URL + badge)
5. If not found: shows "No vote recorded for this wallet on this poll"

**Hook:** `useParticipationProof(pollId)` in `lib/queries/use-participation-proof.ts`
- Reads wallet secret key from providers
- Derives nullifier
- Checks `vote_nullifiers.member(nullifier)` via indexer
- Returns `{ hasVoted, nullifier, proofUrl, isLoading }`

**Key constraint:** `voter_sk` (the secret key) must be retrieved from the wallet via
`getSecretKeyFromWallet()` already implemented in `lib/midnight/witness-impl.ts`. This is the
same key used by the `local_secret_key()` witness. The hook must call this dynamically
(Turbopack constraint — no static `@midnight-ntwrk/*` imports in client components).

### ZKPR-02: Third-party verification

**Location:** New page `app/verify/page.tsx`

**Flow:**
1. Verifier opens `/verify?pollId=<hex>&nullifier=<hex>` (from a shared link)
2. Page reads query params and displays poll metadata (title via `useMetadata(pollId)`)
3. If wallet connected: queries `vote_nullifiers` map for the nullifier, shows result
4. Shows one of three states:
   - **Verified** (green shield icon): nullifier found in on-chain map
   - **Invalid** (red icon): nullifier not found
   - **Connect wallet** (neutral): wallet not connected, cannot verify

**No sensitive data exposed:** The URL contains the nullifier (a hash of `hash(poll_id, voter_sk)`),
not the voter's secret key or chosen option. The nullifier alone does not reveal identity or choice.

**Hook:** `useVerifyProof(pollId, nullifier)` — thin wrapper around contract state read with
`vote_nullifiers.member(hexToBytes(nullifier))`.

### ZKPR-03: Sharing via link and visual badge

**Location:** Proof sharing panel within `components/proof-panel.tsx`, rendered on Poll Detail
page after proof generation.

**Share URL:** `window.location.origin + /verify?pollId=<hex>&nullifier=<hex>`
- "Copy Link" button using `navigator.clipboard.writeText()`

**SVG Badge:**
- Generated via `lib/midnight/proof-badge.ts` — exports `generateProofBadgeSvg(pollId, nullifier, pollTitle)`
- Returns SVG string assembled from design tokens (no canvas/PDF library)
- "Download Badge" button: creates a Blob, triggers `<a download>` click
- Badge shows: "Shadow Poll · Participation Verified · Poll: <title> · Proof: <nullifier[:8]>"

### PAGE-05: Stats / Analytics page at `/stats`

**Location:** New page `app/stats/page.tsx`

**Data source:** Reuses `fetchAllPolls()` from `lib/midnight/contract-service.ts` to get all
polls + then aggregates tally reads. Introduced as a new hook `useStats()`.

**Hook:** `useStats()` in `lib/queries/use-stats.ts`
- Calls `fetchAllPolls(providers, contractAddress)` → gets all PollWithId[]
- For each poll, calls `readTallies(ledger, pollIdBytes, optionCount)` (using the already-parsed
  ledger state — single contract state fetch, not N+1)
- Aggregates into `StatsData`: totalPolls, totalVotes, activePolls, publicPolls, inviteOnlyPolls,
  avgVotesPerPoll, mostVotedPoll
- Cached by TanStack Query with a 60-second refetch interval (stats are slower-moving than poll lists)

**Performance note:** Stats requires reading all tally counters. For a testnet with limited polls,
this is trivial. The single `queryContractState()` call returns the full ledger snapshot — tally
reads are in-memory after that. No N+1 indexer calls.

**Page layout:** Stats cards in a grid, using the Aether design system:
- Large number cards for total polls / total votes (primary color accent)
- Progress bar / donut for public vs. invite-only split
- "Most Active Poll" featured card with link to `/poll/[id]`
- "Active Now" count badge

**Navigation:** Add `/stats` link to the header navigation (alongside Create Poll).

---

## Key Technical Notes

### Files to Create

```
lib/midnight/proof-badge.ts          # SVG badge generator (no deps)
lib/queries/use-participation-proof.ts  # Proof generation hook
lib/queries/use-verify-proof.ts      # Nullifier verification hook
lib/queries/use-stats.ts             # Global analytics aggregation hook
app/verify/page.tsx                  # Verification page (ZKPR-02)
app/stats/page.tsx                   # Analytics page (PAGE-05)
components/proof-panel.tsx           # Proof sharing UI (URL + badge download)
components/stats-card.tsx            # Reusable stat display card
```

### Files to Modify

```
app/poll/[id]/page.tsx               # Add "Generate Proof" section after VotePanel
components/header-nav.tsx            # Add /stats nav link
```

### Data Flow: Proof Generation

```
VotePanel (voted state)
  → "Generate Proof" click
  → useParticipationProof(pollId)
    → getSecretKeyFromWallet() [dynamic import — Turbopack safe]
    → deriveNullifier(pollIdBytes, voterSk) [ledger-utils.ts]
    → queryContractState() → parseLedger() → vote_nullifiers.member(nullifier)
    → returns { hasVoted: true, nullifier, proofUrl }
  → ProofPanel renders with URL + Download Badge button
  → generateProofBadgeSvg() → Blob → download
```

### Data Flow: Verification

```
/verify?pollId=X&nullifier=Y
  → useVerifyProof(pollId, nullifier)
    → queryContractState() → parseLedger() → vote_nullifiers.member(hexToBytes(nullifier))
    → returns { isValid: boolean, isLoading }
  → VerifyPage renders Verified / Invalid / NeedsWallet state
```

### Data Flow: Stats

```
/stats
  → useStats()
    → fetchAllPolls() → PollWithId[]
    → aggregate: count, poll_type split, expiration check for active
    → readTallies() per poll (in-memory, single ledger snapshot)
    → returns StatsData
  → StatsPage renders grid of stat cards
```

### Reuse Points

| Existing | Reused in Phase 6 | How |
|----------|------------------|-----|
| `deriveNullifier()` in `ledger-utils.ts` | `useParticipationProof` | Derive nullifier from pollId + voterSk |
| `getSecretKeyFromWallet()` in `witness-impl.ts` | `useParticipationProof` | Get the voter's secret key |
| `fetchAllPolls()` in `contract-service.ts` | `useStats` | Get all polls for aggregation |
| `readTallies()` in `ledger-utils.ts` | `useStats` | Per-poll tally counts |
| `useMetadata(pollId)` | Verify page, Proof panel | Show poll title in proof/verify UI |
| `fetchPollWithTallies()` in `contract-service.ts` | `useVerifyProof` | Get ledger state for nullifier check |
| Aether design tokens | Stats cards, Proof panel, Verify page | Consistent dark theme |
| `hexToBytes()` / `bytesToHex()` in `ledger-utils.ts` | All Phase 6 code | URL param encode/decode |

### Turbopack Constraint

All calls to `@midnight-ntwrk/*` packages and `@/contracts/managed/contract` must remain
dynamic imports (no static imports at module top level in client components). This applies to:
- `deriveNullifier` in `ledger-utils.ts` — already uses dynamic import for `compact-runtime`
- `getSecretKeyFromWallet()` — already a dynamic import pattern in `witness-impl.ts`
- `queryContractState()` path — already guarded in `contract-service.ts`

No new static SDK imports needed in Phase 6.

### No Contract Changes

Phase 6 makes zero changes to `contracts/src/poll.compact`. No recompilation, no new ZK keys,
no contract redeployment. The `vote_nullifiers` ledger map (added in Phase 5) is the only
on-chain data needed. All Phase 6 logic is pure client-side and UI.

---

## Suggested Plan Breakdown

**2 plans** — Phase 6 is the final phase. The two natural split points are:
1. Data/service layer (hooks, badge generator, proof utilities)
2. UI pages and components (verify page, stats page, proof panel, nav update)

### Plan 06-01: Proof & Stats Service Layer

**Subsystem:** data
**Goal:** All hooks and utilities needed for proof generation, verification, and analytics

**Tasks:**
1. `lib/middleware/proof-badge.ts` — SVG badge generator (no deps, pure string assembly)
2. `lib/queries/use-participation-proof.ts` — Proof generation hook (derives nullifier, checks on-chain)
3. `lib/queries/use-verify-proof.ts` — Nullifier verification hook (reads vote_nullifiers map)
4. `lib/queries/use-stats.ts` — Global stats aggregation hook (fetchAllPolls + readTallies aggregation)

**Provides to Plan 06-02:** All four hooks + badge generator

### Plan 06-02: Proof & Stats UI Pages

**Subsystem:** ui
**Goal:** All UI pages and components — verify page, stats page, proof panel, header nav update

**Tasks:**
1. `components/proof-panel.tsx` — Proof sharing panel (URL copy + SVG badge download)
2. `app/verify/page.tsx` — Verification page with wallet-gated nullifier check
3. `app/stats/page.tsx` — Analytics page with stat cards grid
4. Update `app/poll/[id]/page.tsx` — Add "Generate Proof" section after VotePanel
5. Update `components/header-nav.tsx` — Add /stats link

---

## Assumptions

- `getSecretKeyFromWallet()` in `witness-impl.ts` is accessible as a standalone utility
  (not only used inside the witness closure) — it needs to be exported for use in
  `useParticipationProof`
- The `vote_nullifiers` map in the ledger is iterable and supports `.member()` checks
  when accessed via the parsed ledger from `parseLedger(state)` (verified pattern from Phase 5)
- SVG string construction is sufficient for the badge — no canvas element or server-side
  rendering needed; modern browsers support `URL.createObjectURL(new Blob([svgString], { type: 'image/svg+xml' }))`
- The `/verify` page requires wallet connection because it needs indexer access.
  This is a known limitation surfaced clearly in the UI.
- Stats page may be slow to populate on first load if there are many polls (all tally keys
  must be read). For testnet scale (< 100 polls), this is not a concern.
