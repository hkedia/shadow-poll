/**
 * Re-exports from the compiled Compact contract for app-level use.
 * Isolates the codebase from the generated contract path.
 *
 * WARNING: The generated contract module depends on @midnight-ntwrk/compact-runtime.
 * In client components, import this module only via dynamic import() — never at the
 * top level — because Turbopack stubs Midnight SDK packages in the browser bundle.
 * Server-side code (API routes, Server Components) can import normally.
 */
export type { PollData, PollType, Ledger, Witnesses, Circuits, ImpureCircuits } from "@/contracts/managed/contract";
export { PollType as PollTypeEnum, ledger as parseLedger } from "@/contracts/managed/contract";
