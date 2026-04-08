---
phase: 08-vite-migration
plan: 01
subsystem: build-toolchain
tags: [vite, migration, wasm, static-imports, turbopack-removal]
dependency_graph:
  requires: []
  provides: [vite-config, vite-entry-points, static-sdk-imports]
  affects: [all-midnight-sdk-modules, all-query-hooks, build-pipeline]
tech_stack:
  added: [vite@8, "@vitejs/plugin-react@6", vite-plugin-wasm@3, vite-plugin-top-level-await@1, react-router@7, "@fontsource/manrope", "@fontsource/plus-jakarta-sans", "@fontsource/geist-mono", "@tailwindcss/vite@4"]
  removed: [next, eslint-config-next, "@tailwindcss/postcss"]
  patterns: [static-sdk-imports, vite-wasm-plugin, fontsource-fonts, import-meta-env]
key_files:
  created:
    - vite.config.ts
    - index.html
    - src/main.tsx
    - src/globals.css
    - src/vite-env.d.ts
  modified:
    - package.json
    - bun.lock
    - tsconfig.json
    - eslint.config.mjs
    - lib/midnight/contract-service.ts
    - lib/midnight/providers.ts
    - lib/midnight/indexer.ts
    - lib/midnight/ledger-utils.ts
    - lib/midnight/invite-codes.ts
    - lib/queries/use-stats.ts
    - lib/queries/use-verify-proof.ts
    - lib/queries/use-participation-proof.ts
    - lib/queries/use-create-poll.ts
    - components/invite-code-panel.tsx
  deleted:
    - postcss.config.mjs
    - lib/midnight-sdk-stub.ts
    - next.config.ts
    - app/layout.tsx
decisions:
  - "Used vite-plugin-wasm + vite-plugin-top-level-await for WASM module loading (replaces Turbopack stubbing)"
  - "Excluded @midnight-ntwrk/compact-js and @midnight-ntwrk/compact-runtime from Vite optimizeDeps to prevent pre-bundling of WASM"
  - "Replaced next/font with @fontsource packages (Manrope, Plus Jakarta Sans, Geist Mono) for Vite compatibility"
  - "Replaced process.env.NEXT_PUBLIC_* with import.meta.env.VITE_* (Vite convention)"
  - "Kept 'use client' directives in some files as they are harmless and will be cleaned up in Plan 02"
metrics:
  duration: "~13 minutes"
  completed: "2026-04-08T20:04:11Z"
  tasks_completed: 2
  tasks_total: 2
  files_created: 5
  files_modified: 14
  files_deleted: 4
---

# Phase 08 Plan 01: Replace Next.js Toolchain with Vite Summary

Replaced the entire Next.js build toolchain with Vite 8, converting 35+ dynamic `await import()` workarounds to clean static imports via vite-plugin-wasm WASM loading.

## Task Results

| Task | Name | Commit | Key Changes |
|------|------|--------|-------------|
| 1 | Install Vite toolchain, create entry points, update config | `e7ddaad` | Added vite.config.ts, index.html, src/main.tsx; removed Next.js + PostCSS; updated tsconfig/eslint |
| 2 | Convert all dynamic SDK imports to static, delete stubs | `37b65b3` | Converted 35+ dynamic imports across 11 files; deleted sdk-stub, next.config.ts, app/layout.tsx |

## What Changed

### Task 1: Vite Foundation
- Installed Vite 8 with plugins: `vite-plugin-wasm`, `vite-plugin-top-level-await`, `@vitejs/plugin-react`, `@tailwindcss/vite`
- Created `vite.config.ts` with WASM support, dev proxy (`/api` → `localhost:3001`), and optimizeDeps exclusion for Midnight SDK packages
- Created `index.html` as Vite SPA entry point with Material Symbols link and meta tags
- Created `src/main.tsx` with fontsource CSS imports, React root, and BrowserRouter placeholder
- Created `src/globals.css` with fontsource font-family names replacing CSS variable references
- Created `src/vite-env.d.ts` with `VITE_POLL_CONTRACT_ADDRESS` type declaration
- Updated `tsconfig.json`: removed Next.js plugin/types, added `src/vite-env.d.ts`, excluded `dist/`
- Updated `eslint.config.mjs`: removed `eslint-config-next`, simplified to ignores-only flat config
- Updated `package.json` scripts: `dev=vite`, `build=vite build`, `preview=vite preview`, `serve=bun run server.ts`
- Removed `next`, `eslint-config-next`, `@tailwindcss/postcss` dependencies
- Deleted `postcss.config.mjs` (replaced by `@tailwindcss/vite` plugin)

### Task 2: Static Import Conversion
- **contract-service.ts**: Converted 10 dynamic imports (CompiledContract, Contract, PollType, witnesses, providers, deployContract, findDeployedContract, indexer, parseLedger, ledger-utils) to static; replaced `process.env.NEXT_PUBLIC_POLL_CONTRACT_ADDRESS` with `import.meta.env.VITE_POLL_CONTRACT_ADDRESS`
- **providers.ts**: Converted 4 dynamic imports (Transaction, CostModel, setNetworkId, FetchZkConfigProvider, createIndexerProvider) to static
- **indexer.ts**: Converted 1 dynamic import (indexerPublicDataProvider) to static
- **ledger-utils.ts**: Converted 4 dynamic imports (persistentHash, CompactTypeVector, CompactTypeBytes) to static
- **invite-codes.ts**: Converted 1 dynamic import (deriveInviteKey) to static
- **use-stats.ts**: Converted 5 dynamic imports to static
- **use-verify-proof.ts**: Converted 3 dynamic imports to static
- **use-participation-proof.ts**: Converted 4 dynamic imports to static
- **use-create-poll.ts**: Converted 1 dynamic import to static
- **invite-code-panel.tsx**: Converted 2 dynamic imports to static
- **Deleted**: `lib/midnight-sdk-stub.ts` (344 lines of Turbopack WASM stubs), `next.config.ts` (50 lines), `app/layout.tsx` (69 lines)
- Removed all "Turbopack constraint" comments from module docstrings

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

| File | Line | Description |
|------|------|-------------|
| lib/queries/use-create-poll.ts | 128 | Pre-existing TODO: "Submit code hashes on-chain via server-side API" (not introduced by this plan) |

## Self-Check: PASSED

All 5 created files verified present. Both commit hashes (e7ddaad, 37b65b3) confirmed in git log. All 4 deleted files confirmed absent.
