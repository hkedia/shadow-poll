# Phase: Docker Deployment — Research

**Researched:** 2026-04-09
**Domain:** Containerization, cloud deployment (fly.io), production build/serving
**Confidence:** HIGH

## Summary

Shadow Poll is a React SPA + Hono API server running on Bun. The app has two distinct parts: (1) a Vite-built frontend bundle served as static files, and (2) a Hono/Bun API server (`server.ts`) that handles `/api/*` routes, serves static assets from `public/` and `dist/`, and provides SPA fallback. The server uses Bun-specific APIs (`import.meta.dir`, `Bun.file()`, `Bun.serve()`) which require the Bun runtime — Node.js will NOT work.

The database is Neon serverless Postgres accessed over HTTPS (no TCP pool, no local Postgres needed). The app stores zero local persistent state — all on-chain data lives on Midnight, all metadata lives in Neon. The only local files are the ZK proving/verifying keys (~18MB) in `public/zk-keys/` and compiled contract artifacts (JS, not WASM) in `contracts/managed/`.

Docker containerization is straightforward: multi-stage build with `oven/bun:1.3.11-slim` as the production base. The build stage installs deps and runs `vite build`, then the production stage copies `dist/`, `public/`, `contracts/managed/`, `server.ts`, `lib/`, and `package.json`/`bun.lock`. No native modules need compilation. WASM modules are handled by `vite-plugin-wasm` at build time — runtime WASM loading only happens in the browser via the Midnight SDK scripts.

For fly.io deployment: a `fly.toml` with `internal_port = 3000`, health check on `/`, and a `[deploy]` section using the Dockerfile. No volumes needed (no persistent local state). Environment secrets (`DATABASE_URL`, `VITE_POLL_CONTRACT_ADDRESS`, `INDEXER_URI`, `INDEXER_WS_URI`) are set via `fly secrets set`. The Neon database is already serverless/remote, so no database provisioning is needed on fly.io.

**Primary recommendation:** Use a multi-stage Dockerfile with `oven/bun:1.3.11-slim` as production base. Build frontend in a `oven/bun:1.3.11` stage, copy only runtime artifacts. Deploy to fly.io with health checks. No volumes or persistent storage needed.

## User Constraints

No CONTEXT.md exists for this phase. Constraints derived from AGENTS.md and project architecture:

### Locked Decisions
- **Runtime:** Bun (package manager + runtime) — must use `oven/bun` Docker image
- **Blockchain:** All state-changing ops via Midnight, no server-side state persistence
- **Privacy:** Zero PII stored server-side
- **Network:** Midnight Preview (testnet) only
- **Stack:** React 19 + React Router 7 + Vite 8 (frontend), Hono (API), Neon Postgres (metadata)

### Agent's Discretion
- Docker base image variant (alpine vs slim vs debian)
- Health check endpoint design (dedicated `/health` vs testing existing routes)
- `.dockerignore` contents
- Container startup command details
- fly.toml configuration details

### Deferred Ideas (OUT OF SCOPE)
- Mainnet deployment
- CI/CD pipeline setup
- Auto-scaling / load balancing configuration
- CDN for static assets (ZK keys are cacheable — future optimization)

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| oven/bun | 1.3.11 | Bun runtime in Docker | Official Bun Docker image [VERIFIED: Docker Hub] |
| hono | 4.12.12 | HTTP framework / API routing | Already in use, Bun adapter [VERIFIED: package.json] |
| @neondatabase/serverless | 1.0.2 | HTTPS Postgres client | Already in use, no TCP connection needed [VERIFIED: package.json] |
| vite | 8.0 | Frontend build tool | Already in use [VERIFIED: package.json] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| oven/bun:1.3.11-slim | 1.3.11 | Production Docker base image | Minimal image, smaller than debian/alpine for Bun |
| oven/bun:1.3.11 | 1.3.11 | Build-stage Docker image | Full image for npm install + vite build |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|-----------|-----------|----------|
| oven/bun:slim | oven/bun:alpine | Alpine uses musl, some native modules may not work; slim uses glibc, more compatible |
| oven/bun:slim | oven/bun:distroless | Slightly smaller but harder to debug (no shell); slim is a good middle ground |
| oven/bun:slim | node:20-alpine | Would require rewriting server.ts away from Bun.file/import.meta.dir APIs — major rework |

**Docker image verification:**
```
oven/bun:1.3.11       — amd64, arm64; glibc; ~89MB compressed
oven/bun:1.3.11-slim  — amd64, arm64; glibc; ~50MB compressed (recommended)
oven/bun:1.3.11-alpine — amd64, arm64; musl; ~45MB compressed (risk: native module compat)
```

## Architecture Patterns

### Current Application Architecture
```
┌─────────────────────────────────────────────────┐
│                  Browser                         │
│  ┌──────────────┐  ┌──────────────────────────┐ │
│  │ React SPA    │  │ Midnight SDK (WASM)      │ │
│  │ (Vite build) │  │ - ZK proofs in browser   │ │
│  │ - Routes     │  │ - Wallet connection      │ │
│  │ - TanStack   │  │ - Contract interaction   │ │
│  └──────┬───────┘  └────────────┬─────────────┘ │
│         │                       │                │
└─────────┼───────────────────────┼────────────────┘
          │ HTTP / fetch          │
          ▼                       ▼
┌─────────────────────────────────────────────────┐
│  server.ts (Hono on Bun.serve)                  │
│                                                  │
│  ┌──────────┐ ┌────────────┐ ┌───────────────┐ │
│  │ /api/*   │ │ /zk-keys/* │ │ /* (SPA)      │ │
│  │ Hono     │ │ CORS+cache │ │ Static files  │ │
│  │ routes   │ │ from       │ │ dist/ +       │ │
│  │          │ │ public/    │ │ public/       │ │
│  └────┬─────┘ └────────────┘ └───────────────┘ │
│       │                                         │
│  ┌────▼──────────────────────────────────────┐ │
│  │ Neon Postgres (HTTPS)                      │ │
│  │ Midnight Preview Indexer (HTTPS + WS)     │ │
│  └────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### Recommended Dockerfile Structure (Multi-Stage)
```
Stage 1: Build (oven/bun:1.3.11)
  - COPY package.json bun.lock
  - RUN bun install --frozen-lockfile
  - COPY . (all source)
  - RUN bun run build (Vite build → dist/)

Stage 2: Production (oven/bun:1.3.11-slim)
  - COPY --from=build /app/dist/ ./dist/
  - COPY --from=build /app/public/ ./public/
  - COPY --from=build /app/contracts/managed/ ./contracts/managed/
  - COPY --from=build /app/server.ts ./server.ts
  - COPY --from=build /app/lib/ ./lib/
  - COPY --from=build /app/package.json ./package.json
  - RUN bun install --production --frozen-lockfile
  - EXPOSE 3000
  - CMD ["bun", "run", "server.ts"]
```

### Pattern: Static Asset Serving with Bun
```typescript
// server.ts uses Bun.file() and import.meta.dir — Bun-specific APIs
import { join } from "path";

// import.meta.dir resolves to the directory of server.ts at runtime
// In Docker, this will be /app (the WORKDIR)
const filePath = join(import.meta.dir, "public", c.req.path);
const file = Bun.file(filePath);
if (await file.exists()) {
  return new Response(file);
}
```

### Pattern: Environment Variables in Docker
```dockerfile
# runtime env vars (set via fly secrets or docker -e)
ENV PORT=3000
# DATABASE_URL, VITE_POLL_CONTRACT_ADDRESS, INDEXER_URI, INDEXER_WS_URI
# are NOT set in Dockerfile — they come from runtime env
```

**Important distinction:** `VITE_POLL_CONTRACT_ADDRESS` is used both:
1. At **build time** by Vite → baked into frontend JS bundle (via `import.meta.env`)
2. At **runtime** by server.ts → read from `process.env` (server-side Hono routes)

This means the Docker build needs `VITE_POLL_CONTRACT_ADDRESS` as a build arg if the frontend needs it baked in, OR the frontend reads it from an API endpoint at runtime. Currently, the **client** code uses `import.meta.env.VITE_POLL_CONTRACT_ADDRESS` which is build-time, and the **server** code uses `process.env.VITE_POLL_CONTRACT_ADDRESS` which is runtime. This dual usage is critical for the Docker build.

### Anti-Patterns to Avoid
- **Don't copy `node_modules/` into production image** — use `bun install --production` in the production stage
- **Don't use `oven/bun:alpine`** — musl libc can cause issues with native modules used by Midnight SDK dependencies (level, ws)
- **Don't bundle `contracts/managed/` into Vite build** — it's imported by server.ts at runtime, not part of the frontend bundle
- **Don't mount volumes for persistent data** — the app has zero local persistent state; Neon handles all data persistence
- **Don't try to use Node.js runtime** — server.ts uses `Bun.file()`, `import.meta.dir`, and `Bun.serve()` which are Bun-specific

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Health check endpoint | Custom `/health` route that checks DB | Simple `Bun.serve` response or reuse existing | The app already returns 200 for any unmatched route via SPA fallback. A dedicated `/health` in Hono that checks Neon connection is more robust. |
| Static file serving | Custom MIME type mapper | `Bun.file()` auto-detects content types | Bun.file() handles MIME detection, range requests, and ETags automatically [VERIFIED: Bun docs] |
| Process management | PM2, systemd, forever | `Bun.serve()` directly | Bun has built-in HTTP server; no process manager needed in container |
| SSL termination | Custom HTTPS in Bun | fly.io handles TLS termination | fly.io provides automatic HTTPS via load balancer [VERIFIED: fly.io docs] |

## Common Pitfalls

### Pitfall 1: VITE_POLL_CONTRACT_ADDRESS Dual Usage
**What goes wrong:** `VITE_POLL_CONTRACT_ADDRESS` is needed both at build time (Vite bakes `import.meta.env` into frontend JS) and at runtime (server.ts reads from `process.env`). If you only set it at runtime, the frontend won't have the contract address.
**Why it happens:** Vite replaces `import.meta.env.VITE_*` at build time, but the same var name is read from `process.env` at runtime by server code.
**How to avoid:** Pass `VITE_POLL_CONTRACT_ADDRESS` as a Docker build arg (`--build-arg VITE_POLL_CONTRACT_ADDRESS=...`) for the frontend build, AND set it as a runtime env var for the server.
**Warning signs:** Frontend can find polls but server API routes return 503 "contract address not configured", or vice versa.

### Pitfall 2: ZK Keys Not Copied to Docker Image
**What goes wrong:** The `public/zk-keys/` directory contains ~18MB of `.prover` and `.verifier` files that are git-ignored. If not regenerated during build or available at build time, the Docker image won't have them.
**Why it happens:** `.gitignore` excludes `public/zk-keys/keys/` and `public/zk-keys/zkir/`.
**How to avoid:** Either (a) run `bun run compile:contracts` in the Docker build stage, or (b) ensure the build context includes the local `public/zk-keys/` directory (since .dockerignore can be different from .gitignore). Option (b) is simpler and recommended — the compiled keys rarely change.
**Warning signs:** 404 errors for `/zk-keys/keys/*.prover` at runtime.

### Pitfall 3: contracts/managed/ Not Available at Runtime
**What goes wrong:** `server.ts` imports from `@/contracts/managed/contract` which resolves to `contracts/managed/contract/index.js`. If this file isn't in the Docker image, the server crashes on startup.
**Why it happens:** The `contracts/managed/` directory is git-ignored. It contains compiled contract JS+WASM artifacts.
**How to avoid:** Copy `contracts/managed/` into the Docker image OR run the compilation step inside Docker. Since compilation requires the `compact` CLI tool which is complex to install in Docker, copy the pre-compiled artifacts from the build context.
**Warning signs:** Server crash on startup with "Cannot find module '@/contracts/managed/contract'".

### Pitfall 4: Bun Native Modules in Alpine
**What goes wrong:** Using `oven/bun:alpine` may cause segfaults or failures with packages that use native bindings (e.g., `level` which uses `classic-level` with C++ bindings).
**Why it happens:** Alpine uses musl libc, but most npm packages with native bindings are compiled against glibc.
**How to avoid:** Use `oven/bun:1.3.11-slim` (Debian-based, glibc) instead of alpine.
**Warning signs:** Container exit code 132 (SIGILL) or 139 (SIGSEGV) on startup.

### Pitfall 5: Neon Serverless Connection from Container
**What goes wrong:** `DATABASE_URL` not set or incorrect format causes immediate crash on first API request (the `sql` module throws on import).
**Why it happens:** `lib/db/client.ts` throws `throw new Error("DATABASE_URL environment variable is not set")` at module scope — the entire server fails to start if the env var is missing.
**How to avoid:** Ensure `DATABASE_URL` is always provided as an environment variable. Consider adding a health check that validates DB connectivity.
**Warning signs:** Server exits immediately with `Error: DATABASE_URL environment variable is not set`.

### Pitfall 6: Port Binding in fly.io
**What goes wrong:** `Bun.serve({ port: PORT })` uses `process.env.PORT || 3000`. fly.io expects the app to listen on a specific internal port and provides a `PORT` env var.
**Why it happens:** fly.io assigns a random external port but sets the `PORT` env var to the internal port (default 8080 for fly.io, but configurable).
**How to avoid:** Use `PORT` env var in fly.toml and fly secrets. The server already reads `process.env.PORT || 3000`, so just set `internal_port` and `PORT` consistently.
**Warning signs:** Health check failures, "connection refused" in fly.io logs.

### Pitfall 7: Large ZK Key Files Slowing Docker Build
**What goes wrong:** The `public/zk-keys/` directory contains ~18MB of binary files. When included in the Docker build context, they increase build time and image size.
**Why it happens:** Docker sends the entire build context before building.
**How to avoid:** Use a `.dockerignore` that excludes `node_modules`, `.git`, `midnight-level-db`, `.env*`, but does NOT exclude `public/zk-keys/` or `contracts/managed/`. The ZK keys must be present in the build context.
**Warning signs:** Docker builds are very slow (30+ seconds just for build context transfer).

## Code Examples

### Multi-Stage Dockerfile (Verified Pattern)
```dockerfile
# Source: [ASSUMED] Based on oven/bun Docker Hub documentation + project analysis
# Stage 1: Build the frontend
FROM oven/bun:1.3.11 AS build

WORKDIR /app

# Install dependencies first (layer caching)
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build arg for Vite env vars that must be baked into frontend
ARG VITE_POLL_CONTRACT_ADDRESS=""
ENV VITE_POLL_CONTRACT_ADDRESS=$VITE_POLL_CONTRACT_ADDRESS

# Build frontend with Vite
RUN bun run build

# Stage 2: Production image
FROM oven/bun:1.3.11-slim AS production

WORKDIR /app

# Install production dependencies only
COPY package.json bun.lock ./
RUN bun install --production --frozen-lockfile

# Copy built frontend
COPY --from=build /app/dist ./dist/

# Copy static assets (favicon, logo, ZK keys)
COPY public ./public/

# Copy compiled contract artifacts (needed by server.ts at runtime)
COPY contracts/managed ./contracts/managed/

# Copy server code
COPY server.ts ./
COPY lib ./lib/

# Environment
ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000

CMD ["bun", "run", "server.ts"]
```

### .dockerignore
```
node_modules
.git
.planning
.env*
midnight-level-db
dist
*.tsbuildinfo
AGENTS.md
README.md
```

### fly.toml
```toml
# fly.toml — Shadow Poll deployment to fly.io
app = "shadow-poll"
primary_region = "lhr"  # London — close to Neon EU region

[build]
  dockerfile = "Dockerfile"

[build.args]
  VITE_POLL_CONTRACT_ADDRESS = ""  # Set to actual contract address

[env]
  PORT = "3000"
  NODE_ENV = "production"
  INDEXER_URI = "https://indexer.preview.midnight.network/api/v3/graphql"
  INDEXER_WS_URI = "wss://indexer.preview.midnight.network/api/v3/graphql/ws"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = "stop"
  auto_start_machines = true
  min_machines_running = 0

[http_service.concurrency]
  type = "connections"
  hard_limit = 200
  soft_limit = 150

[[http_service.checks]]
  grace_period = "10s"
  interval = "30s"
  method = "get"
  path = "/api/indexer/block"
  timeout = "5s"
  tls_skip_verify = false
```

### Health Check Endpoint (Recommended Addition to server.ts)
```typescript
// Add to server.ts API routes section, BEFORE the catch-all routes
app.get("/api/health", async (c) => {
  // Simple health check — verify DB connectivity
  try {
    const { sql } = await import("@/lib/db/client");
    await sql`SELECT 1`;
    return c.json({ status: "healthy", timestamp: new Date().toISOString() });
  } catch {
    return c.json({ status: "degraded", timestamp: new Date().toISOString() }, 503);
  }
});
```

### Docker Compose for Local Testing
```yaml
# docker-compose.yml — Local development testing only
services:
  shadow-poll:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        VITE_POLL_CONTRACT_ADDRESS: ${VITE_POLL_CONTRACT_ADDRESS}
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - VITE_POLL_CONTRACT_ADDRESS=${VITE_POLL_CONTRACT_ADDRESS}
      - INDEXER_URI=https://indexer.preview.midnight.network/api/v3/graphql
      - INDEXER_WS_URI=wss://indexer.preview.midnight.network/api/v3/graphql/ws
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 5s
      retries: 3
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|---|---|---|---|
| Node.js + Express | Bun + Hono | Bun 1.x stable (2024) | Bun.serve() with Hono adapter is faster and simpler |
| Vercel serverless | Docker container + fly.io | — | Persistent runtime, no cold start issues |
| Next.js SSR | Vite SPA + Hono API | Phase 8 (2026-04-09) | WASM modules load correctly, simpler architecture |

**Deprecated/outdated:**
- `oven/bun:1.x` — always pin to exact version (1.3.11) for reproducibility
- Using `node:` image — server.ts requires Bun runtime, cannot use Node.js

## Environment Variables

### Required at Build Time (Vite build)
| Variable | Purpose | How to Set in Docker |
|----------|---------|---------------------|
| `VITE_POLL_CONTRACT_ADDRESS` | Midnight contract address for frontend | `ARG` in Dockerfile, `--build-arg` or fly.toml `[build.args]` |

### Required at Runtime (server.ts)
| Variable | Purpose | Default | How to Set |
|----------|---------|---------|-------------|
| `DATABASE_URL` | Neon Postgres HTTPS connection string | None (CRASHES if missing) | `fly secrets set DATABASE_URL=...` |
| `VITE_POLL_CONTRACT_ADDRESS` | Contract address for server-side API routes | `""` (causes 503) | `fly secrets set VITE_POLL_CONTRACT_ADDRESS=...` |
| `INDEXER_URI` | Midnight indexer HTTP endpoint | `https://indexer.preview.midnight.network/api/v3/graphql` | `fly.toml [env]` |
| `INDEXER_WS_URI` | Midnight indexer WebSocket endpoint | `wss://indexer.preview.midnight.network/api/v3/graphql/ws` | `fly.toml [env]` |
| `PORT` | HTTP server port | `3000` | `fly.toml [env]` |

**Critical observation:** `DATABASE_URL` is read at module scope in `lib/db/client.ts` (not lazily). If unset, the server crashes on import. This means the container will NOT start without a valid `DATABASE_URL` set. This is actually desirable for fail-fast behavior, but the error message could be clearer.

**Observation on `VITE_POLL_CONTRACT_ADDRESS`**: The same env var name is used in two different contexts:
1. **Client-side** (`contract-service.ts:268`): `import.meta.env.VITE_POLL_CONTRACT_ADDRESS` — replaced at Vite build time
2. **Server-side** (`indexer-handler.ts:31`, `polls-handler.ts:27`): `process.env.VITE_POLL_CONTRACT_ADDRESS` — read at runtime

The build-time value gets baked into the JavaScript bundle. The runtime value is separate. For the Docker build, the build-arg pattern handles this correctly — the build-time value goes into the frontend JS, and the runtime value is set separately.

## Database Considerations

### Neon Serverless Connection
- **Connection method:** HTTPS via `@neondatabase/serverless` — no TCP connection, no connection pool needed
- **Migration strategy:** `lib/db/migrations.ts` runs `CREATE TABLE IF NOT EXISTS` idempotently on first API request
- **No local database needed:** Neon is fully remote and serverless
- **No volume mounting needed:** Zero local persistent state

### Migration Execution
Migrations run lazily on the first request to metadata endpoints. The code uses a module-level flag (`migrationRan`) to prevent re-running within the same process. This means:
1. Every cold start triggers one migration attempt
2. Migrations are idempotent (`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`)
3. No separate migration CLI needed — the server handles it

### Database URL in Container
The `DATABASE_URL` must be a Neon connection string with `?sslmode=require`. Example:
```
postgresql://neondb_owner:password@ep-xxx.eu-west-2.aws.neon.tech/neondb?sslmode=require
```

## Cloud Deployment Readiness

### fly.io Requirements
1. **fly.toml** — Configuration file defining app name, region, build, and services
2. **Dockerfile** — fly.io builds from Dockerfile (no buildpack needed)
3. **Health checks** — fly.io uses TCP or HTTP checks to determine instance health
4. **Port binding** — App must listen on `0.0.0.0:PORT` (Bun does this by default)
5. **No volumes needed** — App has zero local persistent state
6. **Secrets** — Sensitive env vars (`DATABASE_URL`) set via `fly secrets set`

### fly.io Machine Sizing
- **Recommended:** `shared-cpu-1x` with 512MB RAM — the app is stateless with no local database
- **The ZK key files (~18MB)** are in the container filesystem, not in memory
- **Neon connection is HTTPS** — minimal memory overhead per request
- **Cost:** ~$0.50/month for a 256MB shared VM on fly.io free tier

### WebSocket Considerations for fly.io
The server does NOT accept WebSocket connections. The `INDEXER_WS_URI` is used only by the *client-side* Midnight SDK for real-time indexer queries. The server-side indexer handler (`lib/api/indexer-handler.ts`) uses HTTPS only (`indexerPublicDataProvider`). This means:
- No WebSocket upgrade handling needed in the container
- No special fly.io configuration for WebSocket proxying
- The Indexer WebSocket endpoint is a config value passed to the browser, not used server-to-server

### Other Cloud Platforms
- **Railway:** Similar to fly.io, Docker-based deployment. `railway up` from Dockerfile.
- **Render:** Blueprint-based. Requires `render.yaml` and render-specific buildpack or Dockerfile.
- **Google Cloud Run:** Docker-based, request-based scaling. Requires `Dockerfile` and Cloud Run service config.

**Recommendation:** Start with fly.io for simplicity. The Dockerfile works for all platforms.

## Build Pipeline

### Docker Build Flow
```
1. Build stage (oven/bun:1.3.11)
   ├── COPY package.json bun.lock
   ├── bun install --frozen-lockfile        ← cached as separate layer
   ├── COPY .                                ← invalidate cache on any source change
   ├── ARG VITE_POLL_CONTRACT_ADDRESS
   ├── ENV VITE_POLL_CONTRACT_ADDRESS=$VITE_POLL_CONTRACT_ADDRESS
   └── RUN bun run build                     ← Vite build → dist/

2. Production stage (oven/bun:1.3.11-slim)
   ├── COPY package.json bun.lock
   ├── bun install --production --frozen-lockfile  ← only production deps
   ├── COPY --from=build /app/dist ./dist/
   ├── COPY public ./public/
   ├── COPY contracts/managed ./contracts/managed/
   ├── COPY server.ts ./
   ├── COPY lib ./lib/
   ├── ENV PORT=3000 NODE_ENV=production
   └── CMD ["bun", "run", "server.ts"]
```

### Estimated Image Sizes
| Component | Size |
|-----------|------|
| oven/bun:1.3.11-slim base | ~120MB (uncompressed) |
| Production node_modules | ~50MB (including Midnight SDK) |
| dist/ (frontend build) | ~32MB |
| public/zk-keys/ (ZK proving/verifying keys) | ~18MB |
| contracts/managed/ (compiled contract JS) | ~18MB |
| lib/ + server.ts | <1MB |
| **Total estimated** | **~240MB** |

### Build Time Estimates
| Step | Time |
|------|------|
| `bun install` (full) | ~30s |
| `vite build` | ~30s |
| `bun install --production` | ~15s |
| Total build | ~1-2 minutes |

## Potential Risks & Gotchas

### Risk 1: Midnight SDK WASM in Docker
**Severity:** LOW
**Details:** The Midnight SDK packages contain WASM modules (`@midnight-ntwrk/compact-runtime`, `@midnight-ntwrk/ledger-v8`). These are loaded in the **browser** only — the server-side code does NOT load WASM modules. The `indexerPublicDataProvider` and `FetchZkConfigProvider` used server-side are pure JavaScript. Contract WASM is only imported by client-side code.
**Mitigation:** No special Docker configuration needed for WASM. Vite already handles WASM bundling via `vite-plugin-wasm`.

### Risk 2: `level` Package Native Bindings
**Severity:** MEDIUM
**Details:** The `level` package (v8.x) uses `classic-level` which has C++ native bindings. If these are needed server-side (they appear NOT to be — `midnight-level-db/` is gitignored and used only locally by deploy scripts), they must compile in the Docker image. Using `oven/bun:1.3.11-slim` (glibc) should handle this.
**Current usage:** Checked `lib/` codebase — `level` is in `package.json` dependencies but NOT imported in any server runtime code. It's used by the deploy script (`scripts/deploy-poll.mjs`) which runs locally, not in the container. Safe to exclude from production deps via `bun install --production`.
**Mitigation:** Verify `level` is not needed at runtime. If not, it's a dev-only dependency and can be moved to `devDependencies`.

### Risk 3: `ws` Package
**Severity:** LOW
**Details:** The `ws` package is listed as a dependency. It provides WebSocket support. In Bun, `ws` works natively without native bindings (Bun implements the `ws` API). No compilation needed.
**Mitigation:** None needed — Bun handles `ws` natively.

### Risk 4: DATABASE_URL Module-Scope Crash
**Severity:** HIGH (if not handled)
**Details:** `lib/db/client.ts` reads `DATABASE_URL` at module scope and `throw new Error(...)` if it's missing. This means the entire server process crashes on import if the env var is unset.
**Mitigation:** Two options: (a) Always ensure `DATABASE_URL` is set (fly secrets), or (b) Refactor to lazy initialization. Option (a) is simpler and preferred for containerized deployment where env vars are always configured before startup.

### Risk 5: Zero-Downtime Deployments
**Severity:** LOW
**Details:** fly.io handles rolling deployments by default. Since the app is stateless (no local state, no WebSocket connections to preserve), zero-downtime is automatic: fly.io starts a new machine, health checks it, then drains the old one.
**Mitigation:** Add a health check endpoint (`/api/health`) to server.ts. fly.io will use this to verify the new instance before routing traffic.

### Risk 6: `contracts/managed/` Gitignore vs Docker Build Context
**Severity:** HIGH (if not addressed)
**Details:** The `contracts/managed/` directory is gitignored but needed at runtime by `server.ts` (via `import { Contract, ... } from "@/contracts/managed/contract"`). Similarly, `public/zk-keys/keys/` and `public/zk-keys/zkir/` are gitignored but needed in the container.
**Mitigation:** These files must be in the Docker build context. Since `.gitignore` and `.dockerignore` are separate files, this is fine — `.dockerignore` should NOT exclude these directories. The files exist locally (compiled by `bun run compile:contracts`), they're just not in git.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `oven/bun:1.3.11-slim` is the best production base image (glibc, smaller than debian) | Standard Stack | Alpine may work if native modules are not loaded server-side |
| A2 | `level` package is NOT needed at runtime (only used by deploy script) | Potential Risks | If wrong, need to ensure native bindings compile in container |
| A3 | fly.io free tier is sufficient for testing (256MB, shared CPU) | Cloud Deployment | May need paid tier for production traffic |
| A4 | Neon serverless works from fly.io without IP allowlisting | Database Considerations | Neon may need regional configuration for low latency |
| A5 | VITE_POLL_CONTRACT_ADDRESS can be baked at build time and also read at runtime | Environment Variables | If contract address changes, need rebuild + redeploy |
| A6 | No WebSocket connections are accepted by the server | WebSocket Considerations | If any future code adds WS server, fly.io config needed |

## Open Questions

1. **Should `level` be moved to devDependencies?**
   - What we know: `level` is in `dependencies` but not imported in any `server.ts`/`lib/` runtime code
   - What's unclear: Whether it's indirectly required by any Midnight SDK package at runtime
   - Recommendation: Check with `bun pm ls` in a production install. If not needed, move to devDependencies.

2. **Should the contract address be a build arg or runtime-only?**
   - What we know: Currently it's used both at build time (Vite) and runtime (process.env)
   - What's unclear: Whether the frontend can fetch it from an API endpoint instead of baking it into the build
   - Recommendation: Keep dual usage for now. Revisit if contract address changes frequently.

3. **Health check design?**
   - What we know: The app has `/api/indexer/block` which queries an external service
   - What's unclear: Whether this is too heavy for a health check endpoint
   - Recommendation: Add a dedicated `/api/health` that checks DB connectivity only. Use `/api/indexer/block` as a readiness check, not liveness.

4. **Docker layer caching strategy for ZK keys?**
   - What we know: ZK keys are ~18MB and rarely change
   - What's unclear: Whether separating them into a dedicated COPY layer improves build times
   - Recommendation: Yes, copy `public/zk-keys/` and `contracts/managed/` early in the Dockerfile for layer cache hits on code changes.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|---|---|---|---|---|
| Docker | Container build & run | ✓ | 29.4.0 | — |
| Bun runtime | Server execution | ✓ | 1.3.11 | — |
| Node.js | Alternative runtime (NOT used) | ✓ | 25.9.0 | NOT COMPATIBLE — server.ts uses Bun APIs |
| Neon Postgres | Database | ✓ | Remote | Must have DATABASE_URL |
| Midnight Indexer | On-chain data reads | ✓ | Remote | Must have INDEXER_URI |

**Missing dependencies with no fallback:**
- `fly` CLI — not installed. Required for `fly deploy`. Install with `curl -L https://fly.io/install.sh | sh`

**Missing dependencies with fallback:**
- None — all core dependencies are available or remote

## Validation Architecture

### Test Framework
| Property | Value |
|---|---|
| Framework | None currently detected (no test config files) |
| Config file | None |
| Quick run command | `docker build -t shadow-poll . && docker run -p 3000:3000 -e DATABASE_URL=... shadow-poll` |
| Full suite command | N/A (manual testing) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|---|---|---|---|---|
| DEPLOY-01 | Docker build succeeds | smoke | `docker build -t shadow-poll .` | ❌ Wave 0 |
| DEPLOY-02 | Container starts and serves on PORT | smoke | `docker run -p 3000:3000 -e DATABASE_URL=... shadow-poll && curl localhost:3000` | ❌ Wave 0 |
| DEPLOY-03 | API routes respond correctly | integration | `curl localhost:3000/api/indexer/block` | ❌ Wave 0 |
| DEPLOY-04 | Static assets serve (favicon, ZK keys) | integration | `curl localhost:3000/favicon.svg` | ❌ Wave 0 |
| DEPLOY-05 | SPA fallback works for client routes | integration | `curl localhost:3000/about` returns index.html | ❌ Wave 0 |
| DEPLOY-06 | fly.io deployment succeeds | manual | `fly deploy && fly status` | ❌ Wave 0 |
| DEPLOY-07 | Health check endpoint works | integration | `curl localhost:3000/api/health` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** Manual `docker build` + `docker run` verification
- **Per wave merge:** Full docker build + API smoke tests
- **Phase gate:** Local Docker container passes all smoke tests + fly.io deployment succeeds

### Wave 0 Gaps
- [ ] No test framework detected — add basic Docker smoke tests
- [ ] No health check endpoint exists — add `/api/health` to `server.ts`
- [ ] No `.dockerignore` — create to optimize build context
- [ ] No `fly.toml` — create for fly.io configuration

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---|---|---|
| V2 Authentication | no | No user auth — wallet-based identity only |
| V3 Session Management | no | No server-side sessions |
| V4 Access Control | no | No server-side authorization |
| V5 Input Validation | yes | Hono request validation on API routes |
| V6 Cryptography | yes | ZK proofs (handled by Midnight SDK, NOT by app) |
| V8 Data Protection | yes | No PII stored — Neon stores only poll metadata |
| V9 Logging | partial | Console logging only — no structured logging |
| V14 Configuration | yes | Environment variable management, secrets |

### Known Threat Patterns for Container Deployment

| Pattern | STRIDE | Standard Mitigation |
|---|---|---|
| Secrets in Docker image | Information disclosure | Use `fly secrets set` for DATABASE_URL; never put secrets in Dockerfile ENV |
| Exposed debug ports | Repudiation | Don't expose Bun's debug inspector port |
| Supply chain attack on base image | Tampering | Pin `oven/bun:1.3.11-slim` to specific digest; use `docker pull --verify` |
| Container escape | Elevation of privilege | Run as non-root user; fly.io handles this |
| Unencrypted data at rest (Neon) | Information disclosure | Neon handles encryption at rest; app stores no local data |

### Container Hardening Recommendations
1. **Run as non-root:** Add `USER bun` to Dockerfile (bun user exists in oven/bun images)
2. **No secrets in image:** All secrets via `fly secrets set` or runtime env vars
3. **Read-only filesystem where possible:** fly.io handles this
4. **Pin base image digest:** Use `oven/bun:1.3.11-slim@sha256:...` for reproducibility

## Sources

### Primary (HIGH confidence)
- Project source code — server.ts, lib/db/client.ts, lib/api/handlers, package.json
- oven/bun Docker Hub — verified available tags (1.3.11, 1.3.11-slim, 1.3.11-alpine)
- Docker 29.4.0 on local machine — verified available

### Secondary (MEDIUM confidence)
- Bun documentation on `import.meta.dir`, `Bun.file()`, `Bun.serve()` — verified from server.ts usage
- Neon serverless documentation — HTTPS-based, no persistent TCP connection needed
- fly.io deployment documentation — [ASSUMED] based on general knowledge

### Tertiary (LOW confidence)
- fly.io free tier specifications — verify current limits at fly.io/docs
- fly.io WebSocket proxy behavior — [ASSUMED] not needed since server doesn't accept WS connections

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — Bun Docker image verified on Docker Hub, all deps verified in package.json
- Architecture: HIGH — full source code analysis of server.ts, API handlers, and database client
- Pitfalls: HIGH — all pitfalls derived from actual code inspection
- Cloud deployment: MEDIUM — fly.io configuration is standard but not yet tested with this specific app
- Database: HIGH — Neon serverless is remote, HTTPS-only, well-understood pattern

**Research date:** 2026-04-09
**Valid until:** 2026-05-09 (30 days — stable stack, unlikely to change)