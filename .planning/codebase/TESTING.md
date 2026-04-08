# Testing Patterns

**Analysis Date:** 2026-04-09 (post Vite migration)

## Test Framework

**Runner:**
- No test framework is currently installed or configured
- No test runner config files found
- No test scripts defined in `package.json`

**Recommended Setup:**
- Install Vitest (aligns with Vite ecosystem)
- For E2E testing, consider Playwright

## Test Structure

**Unit tests location:** None exist yet
**Integration tests location:** None exist yet
**E2E tests location:** None exist yet

**Recommended Structure:**
```
src/
├── routes/
│   └── __tests__/         # Route component tests
lib/
├── __tests__/             # Unit tests for utilities
├── midnight/__tests__/    # Contract service tests
tests/
├── e2e/                   # End-to-end tests (Playwright)
```

## Coverage

**Current coverage:** No tests exist — 0% coverage
**Coverage requirements:** None configured
**Coverage tool:** Not configured

**`.gitignore` includes `/coverage`**, indicating coverage tooling is anticipated.

## Test Patterns

No test patterns established. When adding tests:

**Component Testing:**
```typescript
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { Home } from "@/src/routes/home";

describe("Home", () => {
  it("renders the heading", () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    expect(screen.getByRole("heading")).toBeInTheDocument();
  });
});
```

**Mocking Guidelines:**
- Mock Midnight SDK WASM modules (`@midnight-ntwrk/*` packages)
- Mock `@neondatabase/serverless` for API handler tests
- Use dependency injection patterns to make business logic testable

## Test Commands

| Command | Purpose |
|---------|---------|
| `bun run lint` | Run ESLint (only check currently available) |
| (none) | No test command configured |

**Recommended additions to `package.json` scripts:**
```json
{
  "test": "vitest",
  "test:watch": "vitest --watch",
  "test:coverage": "vitest --coverage",
  "test:e2e": "playwright test"
}
```

## Test Gaps

**Everything is untested.** The application is feature-complete but has no test coverage.

**Priority areas to test:**
- Contract service functions (create poll, cast vote, add invite codes)
- Metadata API handler (GET/POST validation, database interactions)
- Wallet connection flow
- React component rendering and user interactions
- ZK proof generation flow

## CI Testing

**CI Pipeline:** Not configured
**Required Checks:** None established

**Recommended:**
- Add GitHub Actions workflow for lint + test on PR
- Run `eslint` and `vitest` in CI

---

*Testing analysis: 2026-04-09*
