# Codebase Concerns

**Analysis Date:** 2026-04-09 (post Vite migration)

## Technical Debt

| Area | Issue | Severity | Effort |
|------|-------|----------|--------|
| `app/` directory | Old Next.js App Router files still exist — should be deleted entirely | high | S |
| `next.config.ts` | Stale Next.js config file — no longer used | high | S |
| No test framework | Zero test files, no test runner configured | high | M |
| `lib/midnight/server-contract-service.ts` | Unused `@ts-expect-error` directive, missing contract module references | med | S |
| `.planning/codebase/` | Documentation was stale (referenced Next.js) — now updated | low | Done |

## Known Bugs

None currently known.

## Security Concerns

- [ ] **No security headers in production server:** `server.ts` does not set `Content-Security-Policy`, `X-Frame-Options`, `Strict-Transport-Security`, or other security headers. The Midnight SDK WASM modules may need `wasm-eval` in CSP.
- [ ] **No rate limiting:** `server.ts` has no rate limiting on the metadata API endpoint. Could be abused for spam poll creation.
- [ ] **No input validation library:** No `zod`, `yup`, or similar schema validation library. Metadata validation is hand-written in `metadata-store.ts`.
- [ ] **DATABASE_URL not exposed to client:** Correctly uses `process.env` (not `VITE_*` prefix) so it stays server-side only.

## Performance Concerns

- [ ] **Large WASM modules:** Midnight SDK WASM modules are excluded from Vite's `optimizeDeps` — loaded at runtime. First-load performance should be audited.
- [ ] **`chunkSizeWarningLimit: 12000`:** The build warning limit is set very high (12MB), suggesting large bundles. Consider code splitting.
- [ ] **No image optimization:** Using native `<img>` tags without lazy loading or size optimization.

## Scalability Concerns

- **Single API endpoint:** Only `/api/polls/metadata` exists. If more server-side logic is needed, `server.ts` routing will need structure.
- **No connection pooling:** Neon Postgres uses HTTP-based serverless driver — fine for low traffic but may need pooling at scale.

## Maintainability Concerns

- **No test framework installed:** No safety net for regressions.
- **Old `app/` directory still present:** LSP errors from stale Next.js files. Must be deleted.

## Dependency Concerns

- **Niche ecosystem:** The `@midnight-ntwrk/*` packages are from the Midnight blockchain network. Documentation and community support may be limited.
- **WASM complexity:** Multiple WASM modules with specific exclusion rules in Vite config add build complexity.

## Recommended Priorities

1. **Immediate:**
   - Delete remaining `app/` directory and `next.config.ts`
   - Set up a test framework (Vitest recommended)

2. **Short-term:**
   - Add security headers to `server.ts`
   - Add rate limiting to metadata API
   - Audit WASM bundle sizes and consider lazy loading

3. **Long-term:**
   - Set up CI pipeline with lint + test + build
   - Add E2E testing with Playwright
   - Add monitoring/error tracking

---

*Concerns audit: 2026-04-09*
