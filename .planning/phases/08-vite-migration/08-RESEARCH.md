# Phase 8: Vite Migration - Research

**Researched:** 2026-04-09
**Domain:** Build tooling migration (Next.js → Vite + React Router + Bun.serve())
**Confidence:** HIGH

## Summary

Shadow Poll is functionally an SPA — 24 of 24 interactive files use `"use client"`, the only server logic is a single metadata API route, and the entire reason for Next.js was its framework convention, not SSR. The core problem driving this migration is that Turbopack cannot handle wasm-bindgen ESM imports (`import * as wasm from "*.wasm"`), forcing a 357-line stub file and dynamic imports throughout the codebase. Vite + `vite-plugin-wasm` handles this pattern natively.

The migration replaces three things: (1) Next.js bundler → Vite with `vite-plugin-wasm` for client bundling, (2) Next.js App Router → React Router v7 for client-side routing, (3) Next.js API routes → Bun.serve() for the metadata API and static file serving. The `@fontsource/*` packages replace `next/font/google` for self-hosted fonts. The Tailwind CSS v4 setup migrates cleanly via `@tailwindcss/vite` plugin.

**Primary recommendation:** Use Vite 8 + `vite-plugin-wasm` + React Router 7 (declarative mode) + Bun.serve() for the API server. Convert all dynamic `await import("@midnight-ntwrk/*")` to static top-level imports. Delete the stub file and all Turbopack workarounds.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MIGR-01 | Midnight SDK WASM modules load via static imports without stubs | `vite-plugin-wasm` handles the exact wasm-bindgen ESM pattern used by `@midnight-ntwrk/*` packages — verified by reading the WASM glue files |
| MIGR-02 | All 9 routes work under React Router including dynamic `/poll/:id` | React Router v7 declarative mode with `<BrowserRouter>` supports all 9 routes; `:id` replaces `[id]` |
| MIGR-03 | Metadata API serves via Bun.serve() | Bun.serve() replaces Next.js API routes; URL pattern matching for `/api/polls/metadata` with GET/POST |
| MIGR-04 | Production build succeeds with Vite | `vite build` produces `dist/` with WASM assets; `bun run server.ts` serves both API and static files |
| MIGR-05 | ZK proof generation works end-to-end | With static imports, all SDK packages load real WASM instead of stubs — proving chain is unblocked |
| MIGR-06 | SDK stub file and all Turbopack workarounds removed | Delete `lib/midnight-sdk-stub.ts`, remove `next.config.ts`, remove all `await import("@midnight-ntwrk/*")` patterns |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `vite` | 8.0.7 | Client bundler | Native ESM, WASM plugin ecosystem, fast HMR [VERIFIED: npm registry] |
| `@vitejs/plugin-react` | 6.0.1 | React JSX/refresh in Vite | Official React plugin for Vite [VERIFIED: npm registry] |
| `vite-plugin-wasm` | 3.6.0 | WASM ESM integration | Handles `import * as wasm from "*.wasm"` — the exact pattern Midnight SDK uses [VERIFIED: GitHub Menci/vite-plugin-wasm] |
| `vite-plugin-top-level-await` | 1.6.0 | Top-level await transform | Required by vite-plugin-wasm unless target is esnext [VERIFIED: GitHub Menci/vite-plugin-wasm README] |
| `react-router` | 7.14.0 | Client-side routing | Declarative mode with BrowserRouter — replaces Next.js App Router [VERIFIED: npm registry] |
| `@tailwindcss/vite` | 4.2.2 | Tailwind CSS v4 Vite plugin | Replaces `@tailwindcss/postcss` — native Vite integration [VERIFIED: npm registry] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@fontsource/manrope` | 5.2.8 | Self-hosted Manrope font | Replaces `next/font/google` Manrope import [VERIFIED: npm registry] |
| `@fontsource/plus-jakarta-sans` | 5.2.8 | Self-hosted Plus Jakarta Sans font | Replaces `next/font/google` Plus_Jakarta_Sans import [VERIFIED: npm registry] |
| `@fontsource/geist-mono` | 5.2.7 | Self-hosted Geist Mono font | Replaces `next/font/google` Geist_Mono import [VERIFIED: npm registry] |

### Packages to REMOVE

| Package | Reason |
|---------|--------|
| `next` | Replaced by Vite + React Router + Bun.serve() |
| `eslint-config-next` | Next.js-specific ESLint rules no longer applicable |
| `@tailwindcss/postcss` | Replaced by `@tailwindcss/vite` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| React Router v7 (declarative) | React Router v7 (framework mode / Remix) | Framework mode adds SSR complexity we don't need — this is a pure SPA |
| `@fontsource/*` | Google Fonts CDN `<link>` | Fontsource is self-hosted (no external requests), better for privacy-focused app |
| `vite-plugin-wasm` | Manual WASM loading with `WebAssembly.instantiate` | Plugin handles the wasm-bindgen pattern automatically — manual loading would require rewriting SDK glue code |

**Installation:**
```bash
bun add vite@8 @vitejs/plugin-react@6 vite-plugin-wasm@3 vite-plugin-top-level-await@1 react-router@7 @fontsource/manrope @fontsource/plus-jakarta-sans @fontsource/geist-mono
bun add -D @tailwindcss/vite@4
bun remove next eslint-config-next @tailwindcss/postcss
```

## Architecture Patterns

### Recommended Project Structure (Post-Migration)

```
shadow-poll/
├── index.html               # Vite entry point (replaces app/layout.tsx HTML shell)
├── vite.config.ts            # Vite config with WASM + React + Tailwind plugins
├── server.ts                 # Bun.serve() — API routes + static file serving
├── src/
│   ├── main.tsx              # React root render + BrowserRouter
│   ├── app.tsx               # App shell (Header, Footer, routes)
│   ├── routes/               # Page components (moved from app/)
│   │   ├── home.tsx          # / (was app/page.tsx)
│   │   ├── create.tsx        # /create (was app/create/page.tsx)
│   │   ├── poll-detail.tsx   # /poll/:id (was app/poll/[id]/page.tsx)
│   │   ├── stats.tsx         # /stats (was app/stats/page.tsx)
│   │   ├── verify.tsx        # /verify (was app/verify/page.tsx)
│   │   ├── deploy.tsx        # /deploy (was app/deploy/page.tsx)
│   │   ├── about.tsx         # /about (was app/about/page.tsx)
│   │   ├── privacy.tsx       # /privacy (was app/privacy/page.tsx)
│   │   └── community.tsx     # /community (was app/community/page.tsx)
│   ├── components/           # (stays as-is from components/)
│   ├── lib/                  # (stays as-is from lib/)
│   └── globals.css           # (moved from app/globals.css)
├── public/                   # Static assets (unchanged — logo.svg, zk-keys/, favicon.svg)
├── contracts/                # Compact contracts (unchanged)
└── dist/                     # Vite build output (replaces .next/)
```

### Pattern 1: Vite WASM Configuration

**What:** Configure Vite to handle wasm-bindgen ESM imports from `@midnight-ntwrk/*` packages
**When to use:** Always — this is the core reason for the migration

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [
    wasm(),
    topLevelAwait(),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  build: {
    target: "esnext",
  },
  optimizeDeps: {
    // Exclude WASM packages from esbuild pre-bundling — they use ESM WASM
    // imports that esbuild cannot handle. vite-plugin-wasm handles them instead.
    exclude: [
      "@midnight-ntwrk/compact-js",
      "@midnight-ntwrk/ledger-v8",
      "@midnight-ntwrk/compact-runtime",
      "@midnight-ntwrk/onchain-runtime-v3",
    ],
  },
  server: {
    proxy: {
      // Proxy API calls to Bun.serve() during development
      "/api": "http://localhost:3001",
    },
  },
});
```

### Pattern 2: React Router v7 Declarative Mode

**What:** Replace Next.js App Router file-based routing with explicit React Router configuration
**When to use:** For all 9 application routes

```tsx
// src/app.tsx
import { Routes, Route } from "react-router";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { WalletProvider } from "@/lib/midnight/wallet-context";
import { WalletButton } from "@/components/wallet-button";
import { QueryProvider } from "@/lib/queries/query-provider";
import { lazy, Suspense } from "react";

// Code-split route components
const Home = lazy(() => import("@/src/routes/home"));
const Create = lazy(() => import("@/src/routes/create"));
const PollDetail = lazy(() => import("@/src/routes/poll-detail"));
const Stats = lazy(() => import("@/src/routes/stats"));
const Verify = lazy(() => import("@/src/routes/verify"));
const Deploy = lazy(() => import("@/src/routes/deploy"));
const About = lazy(() => import("@/src/routes/about"));
const Privacy = lazy(() => import("@/src/routes/privacy"));
const Community = lazy(() => import("@/src/routes/community"));

export function App() {
  return (
    <WalletProvider>
      <QueryProvider>
        <Header walletSlot={<WalletButton />} />
        <main className="flex-1 flex flex-col w-full pt-20 pb-8 md:pb-12 px-4 sm:px-6 md:px-8">
          <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
            <Suspense fallback={<div className="flex-1" />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/create" element={<Create />} />
                <Route path="/poll/:id" element={<PollDetail />} />
                <Route path="/stats" element={<Stats />} />
                <Route path="/verify" element={<Verify />} />
                <Route path="/deploy" element={<Deploy />} />
                <Route path="/about" element={<About />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/community" element={<Community />} />
              </Routes>
            </Suspense>
          </div>
        </main>
        <Footer />
      </QueryProvider>
    </WalletProvider>
  );
}
```

### Pattern 3: Bun.serve() API + Static Files

**What:** Single Bun process serves both the API routes and static SPA files
**When to use:** Production server, replaces `next start`

```typescript
// server.ts
import { join } from "path";

const DIST_DIR = join(import.meta.dir, "dist");
const PORT = Number(process.env.PORT) || 3000;

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    // --- API routes ---
    if (url.pathname === "/api/polls/metadata") {
      // Dynamic import keeps server.ts from bundling API deps at top level
      const { handleMetadataRequest } = await import("./lib/api/metadata-handler");
      return handleMetadataRequest(req);
    }

    // --- CORS headers for zk-keys ---
    if (url.pathname.startsWith("/zk-keys/")) {
      const file = Bun.file(join("public", url.pathname));
      if (await file.exists()) {
        return new Response(file, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      }
    }

    // --- Static files from dist/ ---
    const filePath = join(DIST_DIR, url.pathname);
    const file = Bun.file(filePath);
    if (await file.exists()) {
      return new Response(file);
    }

    // --- SPA fallback: serve index.html for all other routes ---
    return new Response(Bun.file(join(DIST_DIR, "index.html")), {
      headers: { "Content-Type": "text/html" },
    });
  },
});

console.log(`Shadow Poll server running on http://localhost:${PORT}`);
```

### Pattern 4: Static Import Conversion

**What:** Convert all dynamic `await import("@midnight-ntwrk/*")` to normal static imports
**When to use:** Every file that currently uses dynamic imports for SDK packages

```typescript
// BEFORE (Turbopack workaround):
async function buildCompiledContract(secretKey: Uint8Array, blockNumber: bigint) {
  const { CompiledContract } = await import("@midnight-ntwrk/compact-js");
  const { Contract } = await import("@/contracts/managed/contract");
  const { createWitnesses } = await import("./witness-impl");
  // ...
}

// AFTER (Vite with vite-plugin-wasm):
import { CompiledContract } from "@midnight-ntwrk/compact-js";
import { Contract } from "@/contracts/managed/contract";
import { createWitnesses } from "./witness-impl";

function buildCompiledContract(secretKey: Uint8Array, blockNumber: bigint) {
  // Same logic, no dynamic imports needed
  // ...
}
```

### Pattern 5: index.html Entry Point

**What:** Vite requires an `index.html` as the application entry point
**When to use:** Replaces the root `app/layout.tsx` HTML shell

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="en" class="dark antialiased overflow-x-hidden">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Shadow Poll</title>
    <meta name="description" content="Create secure, anonymous polls that prioritize privacy without sacrificing engagement." />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="icon" href="/favicon.ico" />
    <link rel="apple-touch-icon" href="/favicon.svg" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
  </head>
  <body class="flex flex-col bg-background text-foreground overflow-x-hidden" style="min-height: 100dvh">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### Pattern 6: Font Loading with @fontsource

**What:** Replace `next/font/google` with `@fontsource/*` self-hosted packages
**When to use:** In `src/main.tsx` — replaces the font setup from `app/layout.tsx`

```typescript
// src/main.tsx
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/700.css";
import "@fontsource/plus-jakarta-sans/400.css";
import "@fontsource/plus-jakarta-sans/700.css";
import "@fontsource/geist-mono/400.css";
import "./globals.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { App } from "./app";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
```

**CSS update for globals.css** — update the `@theme inline` font references:
```css
@theme inline {
  /* Typography — @fontsource packages set these font-family names */
  --font-headline: "Manrope", system-ui, sans-serif;
  --font-body: "Plus Jakarta Sans", system-ui, sans-serif;
  --font-label: "Plus Jakarta Sans", system-ui, sans-serif;
  --font-mono: "Geist Mono", monospace;
}
```

### Anti-Patterns to Avoid

- **Keeping dynamic imports for SDK packages:** The whole point of the migration is to use static imports. Every `await import("@midnight-ntwrk/*")` must become a static import.
- **Using `postcss.config.mjs` with Tailwind:** Vite has a native Tailwind plugin (`@tailwindcss/vite`) — don't use the PostCSS integration.
- **Leaving `"use client"` directives:** These are Next.js-specific and have no meaning in Vite. Remove them all.
- **Keeping `next-env.d.ts` or `.next/` references in tsconfig.json:** Remove all Next.js-specific TypeScript configuration.
- **Bundling the API server:** `server.ts` runs under Bun natively — it should NOT go through Vite's bundler.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| WASM ESM loading | Custom `WebAssembly.instantiate` loader | `vite-plugin-wasm` | Handles wasm-bindgen glue code, content hashing, and dev/prod differences automatically |
| Client routing | Manual `window.location` or `popstate` | React Router v7 | Handles history, params, code splitting, nested routes out of the box |
| Font loading | Manual `@font-face` declarations | `@fontsource/*` packages | Pre-built CSS files with correct unicode-range, weight subsets, font-display |
| SPA fallback in prod | Custom 404 → index.html rewrite | Bun.serve() catch-all pattern | Simple: if no file matches, serve `index.html` |
| Dev server API proxy | Separate reverse proxy (nginx/caddy) | Vite `server.proxy` | Built-in, zero config, auto-handles WebSocket upgrade |

**Key insight:** The migration swaps framework-level abstractions (Next.js) for explicit, composable tools (Vite + React Router + Bun.serve). Every piece is simpler individually, but you must wire them together yourself. The patterns above are the standard wiring.

## Common Pitfalls

### Pitfall 1: WASM Packages in optimizeDeps

**What goes wrong:** Vite's dev server uses esbuild for dependency pre-bundling. esbuild cannot handle `.wasm` ESM imports and crashes with `No loader is configured for ".wasm" files`.
**Why it happens:** By default, Vite pre-bundles all dependencies in `node_modules`.
**How to avoid:** Add all `@midnight-ntwrk/*` packages with WASM to `optimizeDeps.exclude`:
```typescript
optimizeDeps: {
  exclude: [
    "@midnight-ntwrk/compact-js",
    "@midnight-ntwrk/ledger-v8",
    "@midnight-ntwrk/compact-runtime",
    "@midnight-ntwrk/onchain-runtime-v3",
  ],
}
```
**Warning signs:** Build or dev server crashes mentioning `.wasm` loader errors. [VERIFIED: vite-plugin-wasm README explicitly states this]

### Pitfall 2: SPA Client-Side Routing in Production

**What goes wrong:** User refreshes on `/poll/abc123` and gets a 404 because the server tries to find a file at that path.
**Why it happens:** Bun.serve() serves files literally by default — no SPA fallback.
**How to avoid:** The `server.ts` catch-all pattern: if no static file matches, serve `dist/index.html`.
**Warning signs:** Any non-root route returns 404 on page refresh.

### Pitfall 3: Environment Variable Prefix Change

**What goes wrong:** `process.env.NEXT_PUBLIC_*` variables are undefined at runtime.
**Why it happens:** Vite uses `import.meta.env.VITE_*` prefix, not `process.env.NEXT_PUBLIC_*`.
**How to avoid:** 
- Rename `NEXT_PUBLIC_POLL_CONTRACT_ADDRESS` → `VITE_POLL_CONTRACT_ADDRESS`
- Change `process.env.NEXT_PUBLIC_POLL_CONTRACT_ADDRESS` to `import.meta.env.VITE_POLL_CONTRACT_ADDRESS` in `contract-service.ts`
- `DATABASE_URL` stays as `process.env.DATABASE_URL` in `server.ts` / `lib/db/client.ts` (server-side, not Vite-processed)
**Warning signs:** Contract address is undefined, app tries to deploy instead of finding existing contract.

### Pitfall 4: Conditional Exports Resolution

**What goes wrong:** Vite resolves the `"node"` export condition from `@midnight-ntwrk/ledger-v8/package.json` instead of the `"browser"` export, loading the `fs.readFileSync`-based WASM loader.
**Why it happens:** The packages have conditional exports: `"browser"` → ESM WASM import, `"node"` → `fs.readFileSync`.
**How to avoid:** Vite defaults to `"browser"` condition in dev/build, which is correct. If issues arise, explicitly set:
```typescript
resolve: {
  conditions: ["browser", "import", "module"],
}
```
**Warning signs:** Errors mentioning `fs.readFileSync` or `require('path')` in the browser. [VERIFIED: read package.json exports fields]

### Pitfall 5: `useParams` Return Type Difference

**What goes wrong:** TypeScript errors because React Router's `useParams` returns `Params<string>` (values are `string | undefined`), while Next.js `useParams` returns `Record<string, string | string[]>`.
**Why it happens:** Different router libraries, different types.
**How to avoid:** In `poll-detail.tsx`, change from:
```typescript
const params = useParams();
const id = params.id as string;
```
to:
```typescript
const { id } = useParams<{ id: string }>();
```
**Warning signs:** TypeScript errors on `useParams()` result. [ASSUMED]

### Pitfall 6: Missing `useRouter().push()` Replacement

**What goes wrong:** `useRouter` from `next/navigation` doesn't exist in React Router.
**Why it happens:** Different API — React Router uses `useNavigate()`.
**How to avoid:** In `create-poll-form.tsx`:
```typescript
// BEFORE:
import { useRouter } from "next/navigation";
const router = useRouter();
router.push(`/poll/${pollId}`);

// AFTER:
import { useNavigate } from "react-router";
const navigate = useNavigate();
navigate(`/poll/${pollId}`);
```
**Warning signs:** Import errors for `useRouter` from non-existent module. [VERIFIED: codebase grep shows useRouter in create-poll-form.tsx]

### Pitfall 7: Large WASM Bundle Size

**What goes wrong:** The production bundle is 12+ MB because WASM files are inlined or not properly chunked.
**Why it happens:** `@midnight-ntwrk/ledger-v8` WASM is ~10 MB alone.
**How to avoid:** `vite-plugin-wasm` emits WASM files as separate assets with content hashes by default — verify in `dist/assets/` after build. Consider `build.chunkSizeWarningLimit` adjustment:
```typescript
build: {
  target: "esnext",
  chunkSizeWarningLimit: 12000, // Suppress WASM chunk warnings
}
```
**Warning signs:** Warning about chunk size during `vite build`. [ASSUMED]

## Code Examples

### Next.js → React Router Import Mapping

Every file needs these replacements:

```typescript
// next/link → react-router
// BEFORE:
import Link from "next/link";
// AFTER:
import { Link } from "react-router";

// next/navigation → react-router
// BEFORE:
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useSearchParams } from "next/navigation";
// AFTER:
import { useParams, useNavigate, useLocation, useSearchParams } from "react-router";
// usePathname → useLocation().pathname
// useRouter().push(x) → useNavigate()(x)
```

### Files Requiring Import Changes (Complete List)

| File | Imports to Replace |
|------|--------------------|
| `components/header.tsx` | `next/link` → `react-router` Link, `next/image` → `<img>` |
| `components/footer.tsx` | `next/link` → `react-router` Link, `next/image` → `<img>` |
| `components/header-nav.tsx` | `next/link` → `react-router` Link, `usePathname` → `useLocation().pathname` |
| `components/mobile-drawer.tsx` | `next/link` → `react-router` Link, `usePathname` → `useLocation().pathname` |
| `components/poll-card.tsx` | `next/link` → `react-router` Link |
| `components/create-poll-form.tsx` | `useRouter` → `useNavigate` |
| `app/page.tsx` → `src/routes/home.tsx` | `next/link` → `react-router` Link |
| `app/poll/[id]/page.tsx` → `src/routes/poll-detail.tsx` | `useParams` → `react-router` useParams, `next/link` → `react-router` Link |
| `app/stats/page.tsx` → `src/routes/stats.tsx` | `next/link` → `react-router` Link |
| `app/verify/page.tsx` → `src/routes/verify.tsx` | `useSearchParams` → `react-router` useSearchParams, `next/link` → `react-router` Link |

### next/image → Native `<img>` Tag

`next/image` is only used for the SVG logo in header and footer. Since there's no image optimization needed for SVGs, replace with a standard `<img>` tag:

```tsx
// BEFORE:
import Image from "next/image";
<Image src="/logo.svg" alt="Shadow Poll" width={260} height={40} priority className="h-10 w-auto" />

// AFTER:
<img src="/logo.svg" alt="Shadow Poll" width={260} height={40} className="h-10 w-auto" />
```

### Metadata API Migration (NextRequest → Request/Response)

```typescript
// lib/api/metadata-handler.ts
// Migrated from app/api/polls/metadata/route.ts
// Uses Web standard Request/Response instead of NextRequest/NextResponse

import {
  validatePollMetadata,
  validateMetadataHash,
  type PollMetadata,
  type StoreMetadataRequest,
  type MetadataResponse,
} from "@/lib/midnight/metadata-store";
import { sql } from "@/lib/db/client";
import { runMigrations } from "@/lib/db/migrations";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function handleMetadataRequest(req: Request): Promise<Response> {
  try {
    await runMigrations();
  } catch (err) {
    console.error("[metadata] Migration failed:", err);
    return json({ error: "Database unavailable — please try again later" }, 503);
  }

  if (req.method === "GET") {
    return handleGet(req);
  } else if (req.method === "POST") {
    return handlePost(req);
  }
  return json({ error: "Method not allowed" }, 405);
}

async function handleGet(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const pollId = url.searchParams.get("pollId");
  // ... same logic as current route.ts, using json() instead of NextResponse.json()
}
```

### Vite Environment Variable Types

```typescript
// src/vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_POLL_CONTRACT_ADDRESS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `vite-plugin-wasm` v2 | `vite-plugin-wasm` v3 | 2024 | Supports Vite 5-8, improved ESM handling |
| `react-router-dom` separate package | `react-router` v7 unifies everything | 2024 | Single package for all routing needs |
| Tailwind CSS PostCSS plugin | `@tailwindcss/vite` native plugin | 2024 (Tailwind v4) | Faster, no PostCSS config needed |
| `next/font` for optimization | `@fontsource/*` for self-hosting | N/A | Different approach — fontsource is framework-agnostic |

## Assumptions Log

> List all claims tagged `[ASSUMED]` in this research.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | React Router v7 `useParams<{ id: string }>()` provides typed params | Common Pitfalls #5 | Low — if not, use `as string` cast (same as current code) |
| A2 | `vite-plugin-wasm` emits WASM as separate assets with content hashes | Common Pitfalls #7 | Medium — if inlined, bundle will be huge; would need manual `assetsInlineLimit: 0` |
| A3 | `@fontsource/*` packages set font-family names matching their CSS class usage | Font Loading Pattern | Low — font-family names are documented in fontsource README |

**If this table is empty:** N/A — three assumptions identified above.

## Open Questions

1. **`@midnight-ntwrk/compact-runtime` version pinning**
   - What we know: `compact-runtime` is pinned to `0.15.0` (not `^`) in package.json while other SDK packages use `^4.0.4`
   - What's unclear: Whether Vite's dependency resolution will handle this pinned version correctly with the WASM exclude
   - Recommendation: Keep the pin, test WASM loading for `onchain-runtime-v3` (transitive dep) specifically

2. **Dev server port conflict**
   - What we know: Vite dev server runs on 5173 by default, Bun.serve() API on 3001
   - What's unclear: Whether the current codebase hardcodes port 3000 anywhere beyond providers.ts
   - Recommendation: Use Vite proxy (`/api → localhost:3001`) and update the one `http://localhost:3000` reference in providers.ts to use `window.location.origin`

3. **`level` package compatibility**
   - What we know: `level` v8 is a dependency (used by `@midnight-ntwrk/midnight-js-level-private-state-provider`). It uses Node.js native addons.
   - What's unclear: Whether `level` will cause issues when Vite tries to bundle it for the browser
   - Recommendation: If not directly imported by app code, it may only be needed server-side. Monitor for build errors.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Bun | Package manager + API server | ✓ | 1.3.11 | — |
| Node.js | npm registry access | ✓ | v25.9.0 | Bun handles npm install natively |
| PostgreSQL (Neon) | Metadata API | ✓ (external) | — | Requires `DATABASE_URL` env var |

**Missing dependencies with no fallback:** None
**Missing dependencies with fallback:** None

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None configured (no test framework in project) |
| Config file | None |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MIGR-01 | WASM modules load via static imports | manual smoke | Open app, connect wallet, check console for WASM errors | ❌ Manual |
| MIGR-02 | All 9 routes work under React Router | manual smoke | Navigate to each route, verify render | ❌ Manual |
| MIGR-03 | Metadata API via Bun.serve() | manual curl | `curl http://localhost:3000/api/polls/metadata` | ❌ Manual |
| MIGR-04 | `bun run build` succeeds | build command | `bun run build` | ✅ Built-in |
| MIGR-05 | ZK proof generation e2e | manual smoke | Create poll → vote → generate proof → verify | ❌ Manual |
| MIGR-06 | Stub file and workarounds deleted | grep check | `grep -r "midnight-sdk-stub" . && echo FAIL \|\| echo PASS` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `bun run build` (must succeed)
- **Per wave merge:** Full build + manual smoke test of all 9 routes
- **Phase gate:** Full build + WASM load + route navigation + API call + ZK proof e2e

### Wave 0 Gaps

- [ ] No automated test infrastructure — all validation is manual smoke testing and build verification
- [ ] Consider adding a minimal build-check script: `bun run build && echo "BUILD OK"`

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Wallet-based (unchanged) |
| V3 Session Management | No | No sessions (unchanged) |
| V4 Access Control | No | Contract-level (unchanged) |
| V5 Input Validation | Yes | Existing validation in metadata-handler (migrated as-is) |
| V6 Cryptography | No | ZK proofs via Midnight SDK (unchanged) |

### Known Threat Patterns for Vite + Bun.serve()

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Path traversal in static file serving | Information Disclosure | Bun.file() with path validation, serve only from `dist/` and `public/` |
| CORS misconfiguration on zk-keys | Information Disclosure | Explicit `Access-Control-Allow-Origin: *` only on `/zk-keys/*` path |
| Environment variable exposure | Information Disclosure | Only `VITE_*` prefix exposed to client; `DATABASE_URL` stays server-only |

## Sources

### Primary (HIGH confidence)
- `node_modules/@midnight-ntwrk/ledger-v8/midnight_ledger_wasm.js` — verified exact WASM import pattern (`import * as wasm from "./midnight_ledger_wasm_bg.wasm"`)
- `node_modules/@midnight-ntwrk/ledger-v8/package.json` — verified conditional exports (browser vs node)
- `node_modules/@midnight-ntwrk/onchain-runtime-v3/package.json` — verified same WASM pattern
- npm registry — verified all package versions via `npm view`
- GitHub `Menci/vite-plugin-wasm` README — verified plugin handles wasm-pack/wasm-bindgen output, `optimizeDeps.exclude` requirement
- Codebase grep — mapped all 21 `next/*` imports across the project

### Secondary (MEDIUM confidence)
- React Router v7 documentation — declarative routing API with `<BrowserRouter>`, `useParams`, `useNavigate`
- Vite documentation — `server.proxy` configuration, `build.target`, `optimizeDeps.exclude`
- Bun documentation — `Bun.serve()` API, `Bun.file()` for static serving

### Tertiary (LOW confidence)
- None — all critical claims verified against source code or official documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified via npm registry, WASM pattern verified in source
- Architecture: HIGH — patterns based on verified tool capabilities and existing codebase structure
- Pitfalls: HIGH (5/7) MEDIUM (2/7) — most pitfalls verified against docs, two are assumed from experience

**Research date:** 2026-04-09
**Valid until:** 2026-05-09 (stable ecosystem, 30-day validity)
