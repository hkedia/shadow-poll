# Coding Conventions

**Analysis Date:** 2026-04-09 (post Vite migration)

## Naming Conventions

**Files:**
- kebab-case for config files: `eslint.config.mjs`, `vite.config.ts`
- kebab-case for route files: `src/routes/create-poll.tsx`, `src/routes/poll-detail.tsx`
- Use kebab-case for any new non-route files (e.g., utility modules, lib files)

**Components:**
- PascalCase for component function names: `App`, `CreatePoll`, `PollDetail`
- Named exports for components: `export function ComponentName()`

**Functions:**
- camelCase for all functions and variables
- PascalCase for React component functions

**Variables:**
- CSS custom properties use `--kebab-case`: `--color-background`, `--color-primary`

**Types/Interfaces:**
- PascalCase for types: `PollMetadata`, `MidnightProviderSet`
- Prefer `type` imports with `import type { ... }` syntax
- Inline types for component props using `Readonly<{ ... }>` pattern

**Constants:**
- camelCase for module-level constants

## Code Style

**Formatting:**
- No Prettier config detected — relies on ESLint and editor defaults
- Indentation: 2 spaces (observed across all files)
- Quotes: double quotes for strings
- Semicolons: yes (all statements terminated with semicolons)
- Trailing commas: yes (in multiline objects and arrays)
- Line length: no explicit limit configured

**Linting:**
- ESLint 9 with flat config: `eslint.config.mjs`
- Global ignores: `dist/`, `build/`, `contracts/managed/`
- Run via: `bun run lint`

## Component Patterns

**Component Style:**
- Functional components only (no class components)
- Client-side SPA — all components are client components (no server components)
- React Router for page routing (`src/routes/`)
- `src/app.tsx` — root App component with router and providers
- `src/main.tsx` — React DOM entry point

**Props Pattern:**
- Inline destructured props with `Readonly<>` wrapper for type safety

**State Management:**
- TanStack React Query for server state management
- React `useState`/`useReducer` for local UI state

**Event Handler Naming:**
- `handleX` for internal handlers, `onX` for prop callbacks

## Styling

**Framework:** Tailwind CSS v4 via `@tailwindcss/vite`
- Import via `@import "tailwindcss"` in `src/globals.css`
- Tailwind theme extended inline with `@theme inline { }` block in `src/globals.css`
- CSS custom properties for theming (Aether Privacy design system)
- Dark mode by default (class-based)
- Fonts: Manrope + Plus Jakarta Sans loaded via `@fontsource` packages
- Material Symbols Outlined for icons

**Pattern:**
- Use Tailwind utility classes directly on elements
- Use CSS custom properties for design tokens (colors, fonts)
- Responsive design via Tailwind breakpoint prefixes (`sm:`, `md:`)

## Error Handling

**Patterns:**
- React Router error boundaries for route-level errors
- TanStack Query error/loading states for async data
- `console` for development logging

## TypeScript Patterns

**Strict Mode:** Enabled (`"strict": true` in `tsconfig.json`)
- Enforce strict null checks, strict function types, no implicit any

**Type Imports:**
- Use `import type { X }` for type-only imports

**Utility Types:**
- Use `Readonly<>` for component props
- Use `React.ReactNode` for children props

**any/unknown Policy:**
- Avoid explicit `any` — use `unknown` with type narrowing instead

**Path Aliases:**
- `@/*` maps to project root (configured in both `tsconfig.json` and `vite.config.ts`)
- Use `@/src/...`, `@/lib/...`, etc. for absolute imports

## Import Organization

**Order (observed pattern):**
1. Type imports: `import type { PollMetadata } from "@/lib/midnight/metadata-store"`
2. External module imports: `import { useQuery } from "@tanstack/react-query"`
3. Internal/relative imports: `import { useWalletContext } from "@/lib/midnight/wallet-context"`

**Guidelines:**
- Type imports before value imports from the same source
- Separate external and internal imports with a blank line
- Use path alias `@/` for non-relative imports within the project

## Git Conventions

**Commit Messages:**
- Imperative present tense (e.g., "Add polling feature", "Fix vote counting bug")

**Branch Naming:**
- Primary branch: `main`

---

*Convention analysis: 2026-04-09*
