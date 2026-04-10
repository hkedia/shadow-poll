# Quick Task 260410-fu0 Summary

**Task:** Update Dockerfile for tests and remove unused dependencies
**Date:** 2026-04-10
**Status:** Complete

## Changes Made

### 1. Dockerfile Updates
- Added command to remove test files from production image:
  ```dockerfile
  RUN find ./lib -name "*.test.ts" -type f -delete
  ```
- This excludes 13 test files from production, reducing image size

### 2. Package.json Cleanup

**Removed unused dependencies:**
- `graphql-yoga` - Not used by app or any Midnight SDK package
- `radix-ui` (monolithic) - Only individual `@radix-ui/*` packages are used

**Documented peer dependencies:**
Added `_dependencyNotes` field explaining that these packages are required by Midnight SDK even though not directly imported:
- `graphql` - Required by `@midnight-ntwrk/midnight-js-indexer-public-data-provider`
- `rxjs` - Required by `@midnight-ntwrk/wallet-sdk-facade` and indexer provider
- `ws` - Required by `@midnight-ntwrk/midnight-js-indexer-public-data-provider`

### 3. Dependency Analysis Process

Checked Midnight SDK package dependencies to identify true peer dependencies:
- `@midnight-ntwrk/midnight-js-indexer-public-data-provider` depends on: graphql, graphql-ws, rxjs, ws
- `@midnight-ntwrk/wallet-sdk-facade` depends on: rxjs

## Commits

1. `be45f4f` - Main changes (Dockerfile, package.json, bun.lock, test files)
2. `7840729` - STATE.md update

## Impact

- **Production image:** Smaller (test files excluded)
- **Dependencies:** Cleaner package.json with documented peer deps
- **Build:** 2 packages removed (~273ms faster install)
