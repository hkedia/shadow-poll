# Quick Task 260410-i2o: Fix @/ path alias with deployment.json in Docker

## Summary

**One-liner:** Replaced `@/deployment.json` path alias with relative path `../../deployment.json` in 3 files.

## What Was Done

Fixed the Docker runtime error `Cannot find module '@/deployment.json'` by replacing the Vite-only `@/` path alias with a relative path that works in both Vite dev server and Bun production server.

### Files Modified

| File | Change |
|------|--------|
| `lib/api/polls-handler.ts` | `import deployment from "@/deployment.json"` → `import deployment from "../../deployment.json"` |
| `lib/api/indexer-handler.ts` | `import deployment from "@/deployment.json"` → `import deployment from "../../deployment.json"` |
| `lib/midnight/contract-service.ts` | `import deployment from "@/deployment.json"` → `import deployment from "../../deployment.json"` |

## Root Cause

The `@/` path alias is configured in Vite (`vite.config.ts`) and only works during frontend bundling. When Docker runs the server with `bun server.ts`, Bun's native module resolution doesn't know about Vite aliases, causing the error.

## Verification

- `bun run lint` passes
- All 3 imports now use relative path `../../deployment.json`
- Path resolves correctly: `lib/api/*.ts` → `../../deployment.json` (project root)

## Commit

```
7c7eec4 fix: replace @/ path alias with relative path for deployment.json
```
