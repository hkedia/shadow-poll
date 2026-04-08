# Requirements: Shadow Poll

**Defined:** 2026-04-08
**Core Value:** Users can vote on polls anonymously with cryptographic guarantees — no one can link a voter to their chosen option, but anyone can verify a vote was legitimately cast.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Wallet Integration

- [x] **WALL-01**: User can detect whether 1am.xyz wallet extension is installed
- [x] **WALL-02**: User can connect wallet to Midnight Preview network
- [x] **WALL-03**: User can disconnect wallet from the application
- [x] **WALL-04**: User can see wallet connection status and truncated address in navigation
- [x] **WALL-05**: App assembles complete provider set (ZK config, indexer, wallet, proof providers)
- [x] **WALL-06**: User sees a prompt to install 1am.xyz when wallet is not detected
- [x] **WALL-07**: Wallet reconnects automatically on page refresh if previously connected

### Smart Contracts

- [x] **CONT-01**: Compact contract exists for creating polls with title, description, options, and poll type
- [x] **CONT-02**: Compact contract exists for casting votes on a poll
- [x] **CONT-03**: Contract compilation pipeline with scripts in /contracts produces deployable artifacts
- [x] **CONT-04**: Compiled ZK proving/verifying keys are served from public folder with proper CORS
- [x] **CONT-05**: Invite-only poll votes are verified via ZK proof of valid invite code in contract
- [x] **CONT-06**: Contract prevents the same wallet from voting twice on the same poll

### Poll Management

- [x] **POLL-01**: User can create a public poll via on-chain transaction
- [x] **POLL-02**: User can create an invite-only poll via on-chain transaction
- [x] **POLL-03**: User can vote on a public poll via on-chain transaction
- [x] **POLL-04**: User can view poll details with live vote tallies
- [x] **POLL-05**: User can vote on an invite-only poll with invite code + ZK verification
- [x] **POLL-06**: Poll creator can generate and manage invite codes off-chain
- [x] **POLL-07**: Polls can expire/close after a creator-defined time period

### ZK Proofs

- [ ] **ZKPR-01**: User can generate a client-side ZK proof of poll participation without revealing chosen option
- [ ] **ZKPR-02**: Third parties can verify a participation proof is valid
- [ ] **ZKPR-03**: User can share a proof via link or visual badge

### Pages & UI

- [x] **PAGE-01**: Home / Trending Polls page displays polls from the indexer sorted by activity
- [x] **PAGE-02**: Create Poll page has form with public/invite-only toggle and submits on-chain
- [x] **PAGE-03**: Poll Detail page at /poll/[id] shows details, tallies, and voting UI
- [x] **PAGE-04**: UI uses shadcn/ui components with dark-first theme
- [ ] **PAGE-05**: Stats / Analytics page shows global trends, participation rates, aggregate vote counts
- [x] **PAGE-06**: All pages are responsive and usable on mobile screens

### Data Layer

- [x] **DATA-01**: App reads poll data from the public Midnight Preview indexer GraphQL endpoint
- [x] **DATA-02**: GraphQL client (graphql-yoga) configured for indexer queries
- [x] **DATA-03**: Thin API routes proxy indexer queries and serve static contract artifacts
- [x] **DATA-04**: Vote tallies update optimistically before on-chain confirmation

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Governance

- **GOVN-01**: Weighted voting based on token holdings
- **GOVN-02**: Multi-round voting (runoff elections)
- **GOVN-03**: Delegation of voting power

### Notifications

- **NOTF-01**: User receives notification when a poll they created gets votes
- **NOTF-02**: User receives notification when a poll they voted on expires

### Social

- **SOCL-01**: User can comment on polls (on-chain or off-chain)
- **SOCL-02**: User can share polls to social media with preview cards

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| User accounts / authentication | Wallet IS the identity — no separate auth system |
| Server-side vote storage | All state lives on Midnight blockchain |
| Mobile native app | Web-first; responsive design sufficient for v1 |
| Multi-chain support | Midnight Preview only — avoid complexity |
| WebSocket real-time updates | Polling/refetch sufficient for v1; WebSocket adds infra complexity |
| Admin dashboard / moderation | Decentralized — no central authority over polls |
| Token economics / incentives | Pure polling utility; tokenomics is a separate product decision |
| Mainnet deployment | Preview network (testnet) only for v1 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| WALL-01 | Phase 1 | Complete |
| WALL-02 | Phase 1 | Complete |
| WALL-03 | Phase 1 | Complete |
| WALL-04 | Phase 1 | Complete |
| WALL-05 | Phase 1 | Complete |
| WALL-06 | Phase 1 | Complete |
| WALL-07 | Phase 1 | Complete |
| CONT-01 | Phase 2 | Complete |
| CONT-02 | Phase 2 | Complete |
| CONT-03 | Phase 2 | Complete |
| CONT-04 | Phase 2 | Complete |
| CONT-05 | Phase 5 | Complete |
| CONT-06 | Phase 5 | Complete |
| POLL-01 | Phase 4 | Complete |
| POLL-02 | Phase 5 | Complete |
| POLL-03 | Phase 4 | Complete |
| POLL-04 | Phase 4 | Complete |
| POLL-05 | Phase 5 | Complete |
| POLL-06 | Phase 5 | Complete |
| POLL-07 | Phase 4 | Complete |
| ZKPR-01 | Phase 6 | Pending |
| ZKPR-02 | Phase 6 | Pending |
| ZKPR-03 | Phase 6 | Pending |
| PAGE-01 | Phase 4 | Complete |
| PAGE-02 | Phase 4 | Complete |
| PAGE-03 | Phase 4 | Complete |
| PAGE-04 | Phase 1 | Complete |
| PAGE-05 | Phase 6 | Pending |
| PAGE-06 | Phase 1 | Complete |
| DATA-01 | Phase 3 | Complete |
| DATA-02 | Phase 3 | Complete |
| DATA-03 | Phase 3 | Complete |
| DATA-04 | Phase 3 | Complete |

**Coverage:**
- v1 requirements: 33 total
- Mapped to phases: 33
- Unmapped: 0

---
*Requirements defined: 2026-04-08*
*Last updated: 2026-04-08 after roadmap creation*
