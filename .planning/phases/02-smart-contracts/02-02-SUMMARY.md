# Plan 02-02 Summary: Compilation Pipeline and ZK Key Serving

## Status: COMPLETE

## What Was Done

Built the contract compilation pipeline (`bun run compile:contracts`) and configured Next.js to serve ZK proving/verifying keys from `public/zk-keys/` with CORS headers.

## Artifacts Created/Modified

| File | Action | Purpose |
|------|--------|---------|
| `contracts/scripts/compile.sh` | Created | Compilation script with `--skip-zk` flag support |
| `package.json` | Modified | Added `compile:contracts` script |
| `public/zk-keys/.gitkeep` | Created | Ensures ZK keys directory is tracked in git |
| `next.config.ts` | Modified | Added CORS headers for `/zk-keys/:path*` |
| `.gitignore` | Modified | Added `contracts/managed/` and ZK key file patterns |
| `eslint.config.mjs` | Modified | Added `contracts/managed/**` to ESLint ignores |

## Compilation Output

Full compilation (with ZK key generation) produces:

| Artifact | Location | Purpose |
|----------|----------|---------|
| `contract/index.js` | `contracts/managed/` | JS contract module for `@midnight-ntwrk/compact-js` |
| `contract/index.d.ts` | `contracts/managed/` | TypeScript declarations |
| `zkir/*.zkir` | `contracts/managed/` | ZK intermediate representation |
| `zkir/*.bzkir` | `contracts/managed/` | Binary ZK IR |
| `keys/*.prover` | `contracts/managed/` | Proving keys (also copied to `public/zk-keys/`) |
| `keys/*.verifier` | `contracts/managed/` | Verifying keys (also copied to `public/zk-keys/`) |

## ZK Keys Served

| File | Size | Purpose |
|------|------|---------|
| `create_poll.prover` | ~19.5 MB | Client-side proving key for poll creation |
| `create_poll.verifier` | ~2 KB | Verifying key for poll creation |
| `cast_vote.prover` | ~2.8 MB | Client-side proving key for vote casting |
| `cast_vote.verifier` | ~2 KB | Verifying key for vote casting |

CORS headers configured: `Access-Control-Allow-Origin: *`, `Cache-Control: public, max-age=31536000, immutable`.

## Additional Fix

Added `contracts/managed/**` to ESLint ignores (`eslint.config.mjs`) because the Compact compiler generates JS/TS files that don't conform to the project's ESLint rules (e.g., `any` types, unused variables).

## Requirements Satisfied

- **CONT-03:** Running `bun run compile:contracts` compiles the Compact contract and produces deployable artifacts ✅
- **CONT-04:** ZK proving/verifying keys are accessible from `public/zk-keys/` with CORS headers ✅
