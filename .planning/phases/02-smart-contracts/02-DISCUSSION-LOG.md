# Phase 2: Smart Contracts — Discussion Log

## Session: 2026-04-08

### Participants
- Developer (user)
- AI Agent

### Topics Discussed

#### 1. Single Contract vs Factory Pattern
**Question:** Should each poll be a separate contract or should one contract manage all polls?
**Decision:** Single "Poll Manager" contract (D-20). Factory pattern rejected because deploying a contract per poll requires a full on-chain transaction with ZK proof generation — terrible UX. Map-based state is the standard Midnight pattern.

#### 2. Vote Privacy Model
**Question:** What does "anonymous voting" mean for public polls?
**Decision:** Public tallies, private voter identity (D-21). Vote counts are visible; voter-to-option linkage is not. Phase 2 focuses on public polls only.

#### 3. Poll Metadata Storage
**Question:** Where should poll title, description, and option labels live?
**Options presented:**
- Hash on-chain only (recover from indexer)
- Full text on-chain (using Opaque<"string">)
**Decision:** Hash on-chain only (D-22). Keeps contract lean, avoids Compact's string limitations.

#### 4. Maximum Poll Options
**Question:** Should we cap the number of options?
**Options presented:** 5, 10, or 20
**Decision:** 10 options max (D-23). Covers most use cases, simplifies circuit to `Vector<10, Counter>`.

#### 5. Expiration Mechanism
**Question:** How should poll expiration work without native timestamps?
**Options presented:**
- Block number based (on-chain enforceable)
- Caller-enforced timestamp (client-side only)
- No on-chain expiration
**Decision:** Block number based (D-24). Enforceable on-chain, cryptographically verifiable.

#### 6. Compilation Pipeline
**Question:** How automated should compilation be?
**Options presented:**
- Simple manual script (`bun run compile:contracts`)
- Watch mode with auto-copy
**Decision:** Simple manual script (D-25). Sufficient for development pace.

#### 7. Plan Count
**Question:** How many plans for this phase?
**Decision:** 2 plans. Plan 1: contract writing + compilation. Plan 2: pipeline scripts + ZK key serving.

### Assumptions
- Compact compiler CLI (v0.5.1+) is available and working
- Midnight SDK packages in `package.json` are compatible with contract artifacts
- Indexer can recover transaction parameters for metadata retrieval
- Block numbers are accessible within Compact circuits for expiration checks
