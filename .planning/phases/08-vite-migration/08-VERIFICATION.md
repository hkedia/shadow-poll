---
phase: 08-vite-migration
verified: 2026-04-09T10:30:00Z
status: gaps_found
score: 4/6 must-haves verified
gaps:
  - truth: "`bun run build` produces a working production bundle"
    status: failed
    reason: "vite-plugin-top-level-await@1 requires rollup module, which Vite 8 does not bundle (Vite 8 uses Rolldown). Both `bun run dev` and `bun run build` crash with 'Cannot find module rollup'."
    artifacts:
      - path: "vite.config.ts"
        issue: "Plugin vite-plugin-top-level-await@1 is incompatible with Vite 8 — needs rollup peer dep that Vite 8 doesn't include"
      - path: "package.json"
        issue: "Missing rollup dependency or needs vite-plugin-top-level-await version compatible with Vite 8"
    missing:
      - "Either install rollup as a dependency, upgrade vite-plugin-top-level-await to a Vite 8-compatible version, or remove the plugin if Vite 8's native top-level-await support (target: esnext) makes it unnecessary"
  - truth: "WASM modules from the Midnight SDK load successfully at runtime in the browser"
    status: failed
    reason: "Cannot verify runtime WASM loading because neither dev server nor production build starts — blocked by the rollup dependency issue."
    artifacts:
      - path: "vite.config.ts"
        issue: "Correct WASM plugin configuration exists but cannot execute"
    missing:
      - "Fix the build failure first, then verify WASM modules load in browser"
human_verification:
  - test: "After build fix, verify WASM modules load in browser DevTools console"
    expected: "No WASM-related errors, SDK operations execute successfully"
    why_human: "WASM runtime loading requires a running browser environment"
  - test: "After build fix, create a poll and cast a vote end-to-end"
    expected: "Full ZK proof generation and verification works without errors"
    why_human: "End-to-end ZK proof flow requires wallet connection and blockchain interaction"
  - test: "Navigate to all 9 routes in the browser"
    expected: "Each page renders correctly with no blank screens or console errors"
    why_human: "Visual rendering verification requires browser"
  - test: "Run `bun run serve` and test /api/polls/metadata endpoint"
    expected: "GET returns poll list, POST stores metadata successfully"
    why_human: "Requires running server with DATABASE_URL configured"
---

# Phase 8: Vite Migration Verification Report

**Phase Goal:** All Midnight SDK WASM modules load correctly at runtime by replacing Next.js + Turbopack with Vite (client bundling) + React Router (routing) + Bun.serve() (API + static serving)
**Verified:** 2026-04-09T10:30:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `@midnight-ntwrk/*` packages import via normal static imports (no dynamic imports, no stub file) | ✓ VERIFIED | Zero `await import.*@midnight-ntwrk` matches in lib/components/src. All 11 files (contract-service.ts, providers.ts, indexer.ts, ledger-utils.ts, invite-codes.ts, 5 query hooks, invite-code-panel.tsx) have static top-level imports. `lib/midnight-sdk-stub.ts` deleted. |
| 2 | WASM modules from the Midnight SDK load successfully at runtime in the browser | ✗ FAILED | Cannot verify — both `bun run dev` and `bun run build` crash with `Cannot find module 'rollup'` due to vite-plugin-top-level-await@1 incompatibility with Vite 8. |
| 3 | All 9 existing routes render correctly under React Router | ✓ VERIFIED (code) | All 9 route files exist in `src/routes/` with correct default exports. `src/app.tsx` has all 9 Route elements with lazy loading. All `next/*` imports replaced. All `"use client"` removed. (Runtime rendering needs human verification.) |
| 4 | The metadata API endpoint (`/api/polls/metadata`) works via Bun.serve() | ✓ VERIFIED (code) | `server.ts` routes `/api/polls/metadata` to `handleMetadataRequest`. `lib/api/metadata-handler.ts` has full GET/POST logic with SQL queries, validation, and Web standard Request/Response. No NextRequest/NextResponse. (Runtime needs human verification with DB.) |
| 5 | `bun run build` produces a working production bundle | ✗ FAILED | `bun run build` crashes: `Error: Cannot find module 'rollup'` from `vite-plugin-top-level-await/dist/index.js`. No `dist/` directory exists. |
| 6 | ZK proof generation works end-to-end (create poll, vote, verify proof) | ? UNCERTAIN | Cannot test without running app. Code structure is preserved from pre-migration. Requires human verification after build fix. |

**Score:** 4/6 truths verified (2 verified code-only pending runtime, 2 failed due to build issue, 1 uncertain)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `vite.config.ts` | Vite build config with WASM + React + Tailwind plugins | ✓ VERIFIED | Has wasm(), topLevelAwait(), react(), tailwindcss(), optimizeDeps.exclude for SDK packages, dev proxy |
| `index.html` | Vite entry HTML file | ✓ VERIFIED | Has `<script type="module" src="/src/main.tsx">`, `<div id="root">`, `<title>Shadow Poll</title>`, Material Symbols link |
| `src/main.tsx` | React root render with BrowserRouter | ✓ VERIFIED | Has createRoot, BrowserRouter, fontsource CSS imports, imports App from ./app |
| `src/vite-env.d.ts` | Vite environment type declarations | ✓ VERIFIED | Has `VITE_POLL_CONTRACT_ADDRESS` type, `/// <reference types="vite/client" />` |
| `src/globals.css` | Tailwind CSS with fontsource font names | ✓ VERIFIED | Has `@import "tailwindcss"`, font-headline: "Manrope", font-body: "Plus Jakarta Sans" |
| `src/app.tsx` | App shell with React Router routes | ✓ VERIFIED | Has 9 Route elements, lazy() imports, WalletProvider, QueryProvider, Header, Footer |
| `src/routes/home.tsx` | Home page route component | ✓ VERIFIED | Default export, no "use client", Link from "react-router" |
| `src/routes/poll-detail.tsx` | Poll detail page with :id param | ✓ VERIFIED | `useParams<{ id: string }>()` from "react-router", Link from "react-router" |
| `src/routes/verify.tsx` | Verify page with search params | ✓ VERIFIED | `useSearchParams` from "react-router" |
| `server.ts` | Production API + static file server | ✓ VERIFIED | Bun.serve(), API routing, zk-keys CORS, public/ static, dist/ static, SPA fallback |
| `lib/api/metadata-handler.ts` | Metadata API handler | ✓ VERIFIED | Web standard Request/Response, GET list/single, POST upsert, SQL queries, validation |
| `lib/midnight-sdk-stub.ts` | DELETED | ✓ VERIFIED | File does not exist |
| `next.config.ts` | DELETED | ✓ VERIFIED | File does not exist |
| `postcss.config.mjs` | DELETED | ✓ VERIFIED | File does not exist |
| `app/` directory | DELETED | ✓ VERIFIED | Directory does not exist |
| `tsconfig.json` | Vite types, no Next.js refs | ✓ VERIFIED | Has `src/vite-env.d.ts` in include, no "next" plugin, no next-env.d.ts |
| `eslint.config.mjs` | No eslint-config-next | ✓ VERIFIED | Minimal flat config with dist/build/contracts ignores only |
| `package.json` | Vite scripts, no next dep | ✓ VERIFIED | scripts.dev="vite", scripts.build="vite build", no "next" dep, has vite + react-router + fontsource |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `index.html` | `src/main.tsx` | `<script type="module" src="/src/main.tsx">` | ✓ WIRED | Line 15 of index.html |
| `src/main.tsx` | `src/app.tsx` | `import { App } from "./app"` | ✓ WIRED | Line 11 of src/main.tsx |
| `vite.config.ts` | `@midnight-ntwrk/* WASM packages` | `optimizeDeps.exclude` | ✓ WIRED | Lines 25-30, excludes 4 WASM packages |
| `src/app.tsx` | `src/routes/*.tsx` | `lazy(() => import(...))` | ✓ WIRED | 9 lazy imports on lines 9-17 |
| `components/header-nav.tsx` | `react-router` | `useLocation().pathname` | ✓ WIRED | Confirmed import and destructure |
| `components/create-poll-form.tsx` | `react-router` | `useNavigate()` | ✓ WIRED | Confirmed import and `navigate()` calls |
| `server.ts` | `lib/api/metadata-handler.ts` | `dynamic import` | ✓ WIRED | `handleMetadataRequest` imported and called on line 32-33 |
| `server.ts` | `dist/index.html` | `SPA fallback` | ✓ WIRED | Line 68: `Bun.file(join(DIST_DIR, "index.html"))` |
| `lib/api/metadata-handler.ts` | `lib/db/client.ts` | `import { sql }` | ✓ WIRED | Both files exist, SQL tagged template used in queries |
| `lib/midnight/contract-service.ts` | `import.meta.env` | `VITE_POLL_CONTRACT_ADDRESS` | ✓ WIRED | Confirmed in getContractAddress() |

### Data-Flow Trace (Level 4)

Not applicable for this phase — migration doesn't change data flow, only bundling/routing/serving infrastructure.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Vite dev server starts | `bun run dev` | `Cannot find module 'rollup'` | ✗ FAIL |
| Vite production build | `bun run build` | `Cannot find module 'rollup'` | ✗ FAIL |
| bun install succeeds | `bun install` | `Checked 458 installs (no changes)` | ✓ PASS |
| No dynamic SDK imports | `rg 'await import.*@midnight-ntwrk' lib/ components/ src/` | Zero matches | ✓ PASS |
| No "use client" directives | `rg '"use client"' components/ lib/ src/` | Zero matches | ✓ PASS |
| No next/* imports | `rg 'from "next/' components/ lib/ src/` | Zero matches | ✓ PASS |
| No NextRequest/NextResponse | `rg 'NextRequest\|NextResponse' lib/ src/` | Zero matches | ✓ PASS |
| No NEXT_PUBLIC_ env vars | `rg 'NEXT_PUBLIC_' lib/ src/ components/` | Zero matches | ✓ PASS |
| 9 route files exist | `ls src/routes/*.tsx \| wc -l` | 9 | ✓ PASS |
| Stub file deleted | `test ! -f lib/midnight-sdk-stub.ts` | Not found (good) | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| MIGR-01 | 08-01 | Midnight SDK WASM modules load via static imports without stubs | ✓ SATISFIED | All 35+ dynamic imports converted to static. Stub file deleted. Zero `await import.*@midnight-ntwrk` remaining. |
| MIGR-02 | 08-02 | All 9 routes work under React Router including /poll/:id | ✓ SATISFIED (code) | 9 route files with default exports, src/app.tsx with 9 Route elements, useParams typed, all next/ imports replaced. |
| MIGR-03 | 08-03 | Metadata API serves via Bun.serve() | ✓ SATISFIED (code) | server.ts routes /api/polls/metadata to handleMetadataRequest. Handler has full GET/POST with SQL. Web standard Request/Response. |
| MIGR-04 | 08-01 | Production build succeeds with Vite | ✗ BLOCKED | `bun run build` fails with `Cannot find module 'rollup'`. vite-plugin-top-level-await@1 incompatible with Vite 8. |
| MIGR-05 | 08-01 | ZK proof generation works end-to-end | ? NEEDS HUMAN | Cannot test without running app. Code preserved from pre-migration. |
| MIGR-06 | 08-01 | SDK stub file and Turbopack workarounds removed | ✓ SATISFIED | `lib/midnight-sdk-stub.ts` deleted. `next.config.ts` deleted. Zero dynamic SDK imports remain. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `package.json` | deps | `vite-plugin-top-level-await@1` incompatible with `vite@8` (requires `rollup` module) | 🛑 Blocker | Prevents both dev and build from running |

### Human Verification Required

### 1. WASM Runtime Loading
**Test:** After fixing build, open browser DevTools console and navigate the app. Check for WASM loading errors.
**Expected:** No WASM-related errors. SDK operations (poll creation, voting) should execute.
**Why human:** WASM runtime loading requires a running browser environment.

### 2. Route Rendering
**Test:** Navigate to all 9 routes in the browser (/, /create, /poll/test-id, /stats, /verify, /deploy, /about, /privacy, /community).
**Expected:** Each page renders correctly with proper layout, no blank screens, no console errors.
**Why human:** Visual rendering verification requires browser.

### 3. Metadata API End-to-End
**Test:** Run `bun run serve` with DATABASE_URL configured. Test GET /api/polls/metadata and POST.
**Expected:** GET returns poll list JSON. POST stores and returns metadata.
**Why human:** Requires running server with external Neon database connection.

### 4. ZK Proof End-to-End
**Test:** With wallet connected, create a poll, cast a vote, then generate and verify participation proof.
**Expected:** Full ZK proof lifecycle completes without errors.
**Why human:** Requires wallet connection, blockchain interaction, and browser-based proof generation.

### Gaps Summary

**1 critical blocker prevents the phase goal from being fully achieved:**

The `vite-plugin-top-level-await@1` plugin has a hard dependency on `rollup` which Vite 8 does not bundle (Vite 8 uses Rolldown as its bundler). This causes both `bun run dev` and `bun run build` to crash with `Error: Cannot find module 'rollup'`. No `dist/` directory has ever been produced.

**Root cause:** Version incompatibility between `vite-plugin-top-level-await@1` and `vite@8`.

**Fix options (ordered by preference):**
1. **Remove the plugin** — Vite 8 with `build.target: "esnext"` natively supports top-level await. The plugin may be unnecessary.
2. **Add rollup as explicit dependency** — `bun add rollup` may satisfy the peer dep, but risks further incompatibilities.
3. **Downgrade Vite** to v6 or v7 which bundles rollup, or find a Vite 8-compatible version of the plugin.

All other migration work (static imports, React Router routes, component updates, server.ts, metadata handler) is code-complete and verified. The build fix is the only remaining blocker.

---

_Verified: 2026-04-09T10:30:00Z_
_Verifier: the agent (gsd-verifier)_
