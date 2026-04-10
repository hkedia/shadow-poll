# Phase 13: Comprehensive Testing - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning
**Source:** Technical requirements derived from roadmap

<domain>
## Phase Boundary

This phase delivers comprehensive test coverage for the Shadow Poll application, including:
1. **Contract Testing**: Integrate testkit-js for testing Compact smart contracts
2. **Unit Testing**: Add Vitest tests for all services, hooks, and utilities
3. **Component Testing**: Expand React Testing Library coverage for all UI components
4. **Integration Testing**: Test critical user flows (create poll, vote, verify proof)

## Current State

**Existing Test Infrastructure:**
- Vitest configured with `vitest run` and `vitest` (watch mode) scripts
- Testing Library (React, Jest-DOM) already installed
- One existing test: `components/__tests__/wallet-onboarding.test.tsx`
- jsdom environment configured

**Testing Gaps:**
- No testkit-js integration for Midnight contract testing
- No tests for contract service layer (`lib/midnight/contract-service.ts`)
- No tests for data hooks (`lib/hooks/`)
- No tests for API routes (`lib/api/`)
- No tests for utility functions (`lib/utils.ts`)
- No tests for ZK proof services

</domain>

<decisions>
## Implementation Decisions

### Testing Framework
- **D-13-01**: Use Vitest as the test runner (already configured)
- **D-13-02**: Use Testing Library for React component tests (already installed)
- **D-13-03**: Use testkit-js for Midnight contract testing (Midnight's official testing library)

### Test Organization
- **D-13-04**: Co-locate tests with source files using `.test.ts` suffix (e.g., `contract-service.test.ts`)
- **D-13-05**: Keep component tests in `__tests__/` directories within component folders

### Coverage Priorities (High to Low)
- **D-13-06**: Contract circuits (via testkit-js) - critical for correctness
- **D-13-07**: Service layer functions - business logic verification
- **D-13-08**: Data hooks - state management and side effects
- **D-13-09**: API routes - request/response handling
- **D-13-10**: Utility functions - pure function correctness
- **D-13-11**: React components - user interaction flows

### Mocking Strategy
- **D-13-12**: Mock Midnight SDK providers in unit tests (no real network calls)
- **D-13-13**: Use testkit-js simulator for contract tests (simulated ledger)
- **D-13-14**: Mock Neon DB in API route tests

</decisions>

<canonical_refs>
## Canonical References

### Testing Libraries
- `@midnight-ntwrk/testkit-js` — Official Midnight testing library for contract tests
- `vitest` — Test runner (already in devDependencies)
- `@testing-library/react` — React component testing (already installed)

### Source Files to Test
- `contracts/src/` — Compact contract source files
- `lib/midnight/contract-service.ts` — Contract interaction service
- `lib/midnight/invite-codes.ts` — Invite code utilities
- `lib/hooks/` — All data hooks (use-create-poll.ts, use-vote-mutation.ts, etc.)
- `lib/api/` — API route handlers
- `lib/utils.ts` — Utility functions

</canonical_refs>

<specifics>
## Specific Requirements

### testkit-js Integration
- Install `@midnight-ntwrk/testkit-js` package
- Set up simulator environment for contract testing
- Create tests for all contract circuits:
  - `create_poll` circuit
  - `cast_vote` circuit
  - `cast_invite_vote` circuit
  - `add_invite_codes` circuit

### App-Wide Coverage Targets
- Services: 80%+ coverage
- Hooks: 70%+ coverage
- Utilities: 90%+ coverage
- Components: 60%+ coverage (critical paths)

### Critical Test Scenarios
1. Poll creation with valid/invalid parameters
2. Voting on public and invite-only polls
3. Invite code generation and verification
4. Duplicate vote prevention
5. Poll expiration handling
6. ZK proof generation and verification
7. Metadata storage and retrieval

</specifics>

<deferred>
## Deferred Ideas

- E2E testing with Playwright (future phase)
- Performance benchmarking (future phase)
- Visual regression testing (future phase)

</deferred>

---

*Phase: 13-comprehensive-testing*
*Context gathered: 2026-04-10 via automated planning*
