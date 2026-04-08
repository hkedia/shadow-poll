---
phase: 08-vite-migration
plan: 04
subsystem: build-toolchain
tags: [vite, gap-closure, rollup, top-level-await, build-fix]
dependency_graph:
  requires: [08-01]
  provides: [working-production-build, wasm-runtime-unblocked]
  affects: [build-pipeline]
tech_stack:
  added: []
  removed: [vite-plugin-top-level-await@1]
  patterns: [native-tla-via-esnext-target]
key_files:
  created: []
  modified:
    - vite.config.ts
    - package.json
    - bun.lock
  deleted: []
decisions:
  - "Removed vite-plugin-top-level-await — Vite 8 with build.target: esnext natively supports TLA; the plugin's @rollup/plugin-virtual dependency required rollup which Vite 8 (Rolldown-based) does not bundle"
  - "Kept vite-plugin-wasm@3.6.0 — handles WASM loading independently and is Vite 8 compatible"
metrics:
  duration: "~2 minutes"
  completed: "2026-04-09T02:17:00Z"
  tasks_completed: 1
  tasks_total: 1
  files_created: 0
  files_modified: 3
  files_deleted: 0
---

# Phase 08 Plan 04: Fix Vite 8 Build Failure (Gap Closure)

Removed the incompatible `vite-plugin-top-level-await` plugin that caused `bun run build` to fail with "Cannot find module 'rollup'" error. Vite 8 uses Rolldown (not Rollup), and natively supports top-level await when `build.target: "esnext"` is set.

## Task Results

| Task | Name | Key Changes |
|------|------|-------------|
| 1 | Remove vite-plugin-top-level-await and fix build | Removed import + plugin call from vite.config.ts; uninstalled package |

## What Changed

### Task 1: Remove Incompatible Plugin
- **vite.config.ts**: Removed `import topLevelAwait from "vite-plugin-top-level-await"` and `topLevelAwait()` from plugins array
- **package.json**: Removed `"vite-plugin-top-level-await": "1"` from dependencies via `bun remove`
- **bun.lock**: Updated automatically by bun

### Root Cause
`vite-plugin-top-level-await@1` depends on `@rollup/plugin-virtual` which requires the `rollup` package. Vite 8 replaced Rollup with Rolldown as its bundler, so `rollup` is no longer available in `node_modules`. The plugin was unnecessary because:
1. `build.target: "esnext"` (already configured) enables native TLA support in Vite 8
2. `vite-plugin-wasm@3.6.0` handles WASM loading independently
3. No source files use top-level await outside async functions

## Gaps Closed

| Gap | Description | Status |
|-----|-------------|--------|
| MIGR-04 | `bun run build` fails with "Cannot find module 'rollup'" | CLOSED — build completes in ~3.8s, produces dist/ with index.html + JS bundles + WASM files |
| MIGR-05 | WASM runtime loading blocked | CLOSED — unblocked by fixing build; WASM files (ledger + onchain-runtime) included in dist/ |

## Verification

- `bun run build` exits 0 — 3087 modules transformed, dist/ produced
- `dist/index.html` exists (1.47 kB)
- `dist/assets/` contains JS bundles (e.g., `index-CY1Q42uH.js`) and WASM files
- `bun run dev` starts Vite dev server on port 5173 without "Cannot find module" errors
- `vite.config.ts` contains no reference to `topLevelAwait` or `top-level-await`
- `package.json` contains no `vite-plugin-top-level-await` dependency

## Deviations from Plan

None — plan executed exactly as written.

## Known Warnings (Pre-existing, Not Introduced)

| Source | Warning | Impact |
|--------|---------|--------|
| Midnight SDK | `Module "fs"/"path"/"assert" externalized for browser compatibility` | Harmless — SDK modules reference Node.js builtins that are correctly externalized |
| isomorphic-ws | `Import WebSocket will always be undefined` | Pre-existing SDK packaging issue — does not affect browser WebSocket usage |

## Self-Check: PASSED

Build succeeds. Dev server starts. Both verification gaps closed. Zero regressions to other plugins (wasm, react, tailwindcss).
