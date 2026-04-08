# Testing Patterns

**Analysis Date:** 2026-04-08

## Test Framework

**Runner:**
- No test framework is currently installed or configured
- No test runner config files found (no `jest.config.*`, `vitest.config.*`, `playwright.config.*`)
- No test scripts defined in `package.json`

**Recommended Setup:**
- Install Vitest (aligns well with Next.js + TypeScript + ESM ecosystem)
- Alternatively, use `@next/jest` if Jest is preferred
- For E2E testing, consider Playwright

## Test Structure

**Unit tests location:** None exist yet
**Integration tests location:** None exist yet
**E2E tests location:** None exist yet

**Recommended Structure:**
```
app/
├── __tests__/           # Co-located route tests
├── page.test.tsx        # Or co-located with source
lib/
├── __tests__/           # Unit tests for utilities
tests/
├── e2e/                 # End-to-end tests (Playwright)
├── integration/         # Integration tests
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
import Home from "@/app/page";

describe("Home", () => {
  it("renders the heading", () => {
    render(<Home />);
    expect(screen.getByRole("heading")).toBeInTheDocument();
  });
});
```

**Utility Testing:**
```typescript
import { myUtil } from "@/lib/utils";

describe("myUtil", () => {
  it("does the expected thing", () => {
    expect(myUtil("input")).toBe("expected");
  });
});
```

**Mocking Guidelines:**
- Mock external API calls and blockchain interactions (`@midnight-ntwrk/*` packages)
- Mock `next/navigation`, `next/image` as needed for component tests
- Use dependency injection patterns to make business logic testable

## Test Commands

| Command | Purpose |
|---------|---------|
| `npm run lint` | Run ESLint (only check currently available) |
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

**Everything is untested.** This is a fresh scaffold from `create-next-app` with no application logic yet.

**Priority areas to test as code is added:**
- Midnight Network blockchain contract interactions (`@midnight-ntwrk/*` packages) — complex integration, high risk
- Poll creation/voting logic (core business logic)
- GraphQL API layer (if `graphql-yoga` is used for API routes)
- React component rendering and user interactions
- Data flow between server and client components

## CI Testing

**CI Pipeline:** Not configured
**Required Checks:** None established

**Recommended:**
- Add GitHub Actions workflow for lint + test on PR
- Run `eslint` and `vitest` in CI
- Add Playwright for E2E tests in CI with appropriate browser setup

---

*Testing analysis: 2026-04-08*
