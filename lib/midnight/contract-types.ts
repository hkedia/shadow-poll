/**
 * Re-exports from the compiled Compact contract for app-level use.
 * Isolates the codebase from the generated contract path.
 *
 * WARNING: The generated contract module depends on @midnight-ntwrk/compact-runtime.
 * In client components, import this module only via dynamic import() — never at the
 * top level — to keep the initial bundle lightweight. WASM-heavy SDK packages are
 * loaded on demand when contract interactions are needed.
 */
export type { PollData, PollType, Ledger, Witnesses, Circuits, ImpureCircuits } from "@/contracts/managed/contract";
export { PollType as PollTypeEnum, ledger as parseLedger } from "@/contracts/managed/contract";
