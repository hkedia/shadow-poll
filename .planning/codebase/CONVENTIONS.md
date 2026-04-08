# Coding Conventions

**Analysis Date:** 2026-04-08

## Naming Conventions

**Files:**
- kebab-case for config files: `eslint.config.mjs`, `postcss.config.mjs`, `next.config.ts`
- lowercase for Next.js App Router files: `page.tsx`, `layout.tsx`, `globals.css`
- Use kebab-case for any new non-route files (e.g., utility modules, lib files)

**Components:**
- PascalCase for component function names: `Home`, `RootLayout`
- Default exports for page and layout components (required by Next.js App Router)
- Named exports for metadata objects: `export const metadata: Metadata`

**Functions:**
- camelCase for all functions and variables: `geistSans`, `geistMono`
- PascalCase for React component functions: `RootLayout`, `Home`

**Variables:**
- camelCase: `geistSans`, `geistMono`, `nextConfig`, `eslintConfig`
- CSS custom properties use `--kebab-case`: `--font-geist-sans`, `--color-background`

**Types/Interfaces:**
- PascalCase for types: `Metadata`, `NextConfig`
- Prefer `type` imports with `import type { ... }` syntax (see `app/layout.tsx` line 1, `next.config.ts` line 1)
- Inline types for component props using `Readonly<{ ... }>` pattern (see `app/layout.tsx` line 22-24)

**Constants:**
- camelCase for module-level constants: `geistSans`, `nextConfig`
- No UPPER_SNAKE_CASE constants observed yet — follow camelCase for non-environment values

## Code Style

**Formatting:**
- No Prettier config detected — relies on ESLint and editor defaults
- Indentation: 2 spaces (observed across all files)
- Quotes: double quotes for strings (`"next"`, `"latin"`, `"Create Next App"`)
- Semicolons: yes (all statements terminated with semicolons)
- Trailing commas: yes (in multiline objects and arrays — see `tsconfig.json`, component props)
- Line length: no explicit limit configured

**Linting:**
- ESLint 9 with flat config: `eslint.config.mjs`
- Extends `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- Run via: `npm run lint` or `eslint`

## Component Patterns

**Component Style:**
- Functional components only (no class components)
- Use `export default function ComponentName()` pattern for pages/layouts
- Server Components by default (Next.js App Router convention — no `"use client"` directive unless needed)

**Props Pattern:**
- Inline destructured props with `Readonly<>` wrapper for type safety:
  ```typescript
  export default function RootLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
  ```
- Wrap all props in `Readonly<{ ... }>` for immutability

**State Management:**
- No client-side state management library installed
- Use React's built-in `useState`/`useReducer` for client components when needed
- Server Components should fetch data directly (no state needed)

**Event Handler Naming:**
- Not yet established — use `handleX` for internal handlers, `onX` for prop callbacks when adding interactivity

## Styling

**Framework:** Tailwind CSS v4 via `@tailwindcss/postcss`
- Import via `@import "tailwindcss"` in `app/globals.css`
- Tailwind theme extended inline with `@theme inline { }` block in `app/globals.css`
- CSS custom properties for theming: `--background`, `--foreground`
- Dark mode: media query based (`prefers-color-scheme: dark`) plus `dark:` Tailwind utilities
- Fonts: Geist Sans and Geist Mono loaded via `next/font/google`, applied as CSS variables

**Pattern:**
- Use Tailwind utility classes directly on elements
- Use CSS custom properties for design tokens (colors, fonts)
- Responsive design via Tailwind breakpoint prefixes (`sm:`, `md:`)

## Error Handling

**Patterns:**
- Not yet established in the codebase (scaffold only)
- Use Next.js App Router error boundaries: create `error.tsx` files in route segments
- Use `not-found.tsx` for 404 handling per route segment
- Use `loading.tsx` for loading states per route segment

**Logging:**
- No logging framework installed
- Use `console` for development; plan for structured logging if backend logic grows

## TypeScript Patterns

**Strict Mode:** Enabled (`"strict": true` in `tsconfig.json`)
- Enforce strict null checks, strict function types, no implicit any

**Type Imports:**
- Use `import type { X }` for type-only imports (enforced pattern in `app/layout.tsx`, `next.config.ts`)
- This enables tree-shaking of type imports at build time

**Utility Types:**
- Use `Readonly<>` for component props (see `app/layout.tsx`)
- Use `React.ReactNode` for children props

**any/unknown Policy:**
- Strict mode prevents implicit `any`
- Avoid explicit `any` — use `unknown` with type narrowing instead

**Path Aliases:**
- `@/*` maps to project root (configured in `tsconfig.json`)
- Use `@/app/...`, `@/lib/...`, etc. for absolute imports

## Import Organization

**Order (observed pattern):**
1. External type imports: `import type { Metadata } from "next"`
2. External module imports: `import { Geist, Geist_Mono } from "next/font/google"`
3. Internal/relative imports: `import "./globals.css"`

**Guidelines:**
- Type imports before value imports from the same source
- Separate external and internal imports with a blank line
- Use path alias `@/` for non-relative imports within the project

## Git Conventions

**Commit Messages:**
- Only one commit exists: `"Initial commit from Create Next App"` (generated)
- No established convention yet — use imperative present tense (e.g., "Add polling feature", "Fix vote counting bug")

**Branch Naming:**
- Primary branch: `main`
- No feature branches exist yet — use `feature/`, `fix/`, `chore/` prefixes when branching

**PR Process:**
- Not established yet

---

*Convention analysis: 2026-04-08*
