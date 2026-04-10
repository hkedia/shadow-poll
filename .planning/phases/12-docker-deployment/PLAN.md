# Phase: Docker Deployment

## Phase Overview

**Goal:** Package the Shadow Poll app as a Docker container, add a health check endpoint, and prepare it for deployment to fly.io or similar cloud platforms. The app must build as a Docker image, start correctly, serve traffic, and pass health checks locally before any cloud deployment.

**Depends on:** Phase 8 (Vite migration — current server.ts + build pipeline), Phase 11 (Hono API migration — current route structure)

**Status:** Ready to execute

---

## Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| DEPLOY-01 | Add `/api/health` endpoint that checks Neon DB connectivity and returns `{status, timestamp}` | Must-have |
| DEPLOY-02 | Create `.dockerignore` that excludes `node_modules`, `.git`, `.env*`, `.planning`, `midnight-level-db`, `dist` but does NOT exclude `public/zk-keys/` or `contracts/managed/` | Must-have |
| DEPLOY-03 | Create multi-stage `Dockerfile`: build stage with `oven/bun:1.3.1`, production stage with `oven/bun:1.3.11-slim`, run as non-root `USER bun` | Must-have |
| DEPLOY-04 | Create `docker-compose.yml` for local container testing with health check on `/api/health` | Must-have |
| DEPLOY-05 | Create `fly.toml` for fly.io deployment with HTTP service, health check, and build args for `VITE_POLL_CONTRACT_ADDRESS` | Must-have |
| DEPLOY-06 | Verify Docker build succeeds and container starts, responds to health check locally | Must-have |
| DEPLOY-07 | `VITE_POLL_CONTRACT_ADDRESS` handled as both Docker build arg (for Vite frontend) and runtime env var (for server-side) | Must-have |
| DEPLOY-08 | Container runs as non-root `bun` user (security hardening) | Must-have |

---

## Success Criteria

When this phase is complete, ALL of the following must be TRUE:

1. `docker build -t shadow-poll .` succeeds without errors
2. Container starts and responds on the configured port (default 3000)
3. `GET /api/health` returns `200` with `{"status":"healthy","timestamp":"..."}` when DB is reachable
4. `GET /api/health` returns `503` with `{"status":"degraded","timestamp":"..."}` when DB is unreachable
5. `GET /api/health` returns `503` with `{"status":"degraded","timestamp":"..."}` when `DATABASE_URL` is missing
6. The Docker image does NOT contain `node_modules`, `.git`, `.env*`, or `.planning`
7. The Docker image DOES contain `public/zk-keys/` and `contracts/managed/` directories
8. The container process runs as the `bun` user (not root)
9. `docker compose up` successfully builds and starts the app locally
10. `fly.toml` is valid for deployment to fly.io (app name is placeholder, rest is production-ready)

---

## Execution Plan

### Wave 1: Health Endpoint + Docker Configuration

These tasks are independent — the health endpoint code and Docker config can be created in parallel, though the Dockerfile references the health endpoint route at build time.

---

#### Task 1: Add `/api/health` endpoint

**ID:** DEPLOY-01
**Description:** Create a health check route in the Hono API that probes Neon DB connectivity and returns a structured status response. This endpoint is used by Docker health checks, fly.io HTTP checks, and operational monitoring.

**Files to create/modify:**
- `lib/api/health-handler.ts` — new file
- `lib/api/routes.ts` — mount the health sub-router

**Implementation:**

Create `lib/api/health-handler.ts`:
```typescript
import { Hono } from "hono";

export const healthRoutes = new Hono();

healthRoutes.get("/api/health", async (c) => {
  try {
    const { sql } = await import("@/lib/db/client");
    await sql`SELECT 1`;
    return c.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
    });
  } catch {
    return c.json(
      { status: "degraded", timestamp: new Date().toISOString() },
      503,
    );
  }
});
```

Key design decisions:
- **Dynamic import** for `@/lib/db/client` — if `DATABASE_URL` is unset, the module-level `throw` in `client.ts` is caught gracefully rather than crashing the health endpoint
- **`SELECT 1`** — minimal query that verifies DB connectivity without reading any table
- **Degraded status** on failure — fly.io and Docker treat non-200 as unhealthy, which is correct behavior
- **Timestamp** — helps distinguish stale cached responses from live ones

Mount in `lib/api/routes.ts` by adding:
```typescript
import { healthRoutes } from "./health-handler";
// ... existing imports
apiRoutes.route("/", healthRoutes);
```

The health route must be mounted alongside other routes (before the catch-all static/SPA handlers in `server.ts`). Since `routes.ts` is imported by `server.ts` and mounted early, the `/api/health` route will be registered correctly.

**Verification:**
1. `DATABASE_URL` set: `curl http://localhost:3000/api/health` → `200 {"status":"healthy","timestamp":"..."}`
2. `DATABASE_URL` unset: server starts (import is dynamic), endpoint returns `503 {"status":"degraded","timestamp":"..."}`
3. `bun run build` succeeds with no TypeScript errors
4. `bun run dev:api` starts and `/api/health` responds correctly

---

#### Task 2: Create `.dockerignore` and multi-stage `Dockerfile`

**ID:** DEPLOY-02, DEPLOY-03, DEPLOY-07, DEPLOY-08
**Description:** Create the Docker build configuration files. The `.dockerignore` minimizes build context size while ensuring gitignored runtime essentials (`public/zk-keys/`, `contracts/managed/`) are included. The `Dockerfile` uses a multi-stage build pattern: full Bun image for building the Vite frontend, slim Bun image for the production runtime.

**Files to create:**
- `.dockerignore` — new file
- `Dockerfile` — new file

**`.dockerignore` implementation:**

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
CLAUDE.md
opencode.jsonc
```

Critical: `public/zk-keys/` and `contracts/managed/` are NOT excluded — they are gitignored but must be in the Docker build context (ZK proving keys ~18MB, contract artifacts needed by server.ts at runtime).

**`Dockerfile` implementation:**

```dockerfile
# Stage 1: Build the frontend with Vite
FROM oven/bun:1.3.11 AS build

WORKDIR /app

# Install dependencies first (layer caching)
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy all source code (including gitignored runtime essentials:
# public/zk-keys/ and contracts/managed/)
COPY . .

# Build arg for Vite env vars baked into frontend at build time
ARG VITE_POLL_CONTRACT_ADDRESS=""
ENV VITE_POLL_CONTRACT_ADDRESS=$VITE_POLL_CONTRACT_ADDRESS

# Build frontend
RUN bun run build

# Stage 2: Production image
FROM oven/bun:1.3.11-slim AS production

WORKDIR /app

# Install production dependencies only
COPY package.json bun.lock ./
RUN bun install --production --frozen-lockfile

# Copy built frontend from build stage
COPY --from=build /app/dist ./dist/

# Copy static assets (favicon, logo, ZK proving/verifying keys)
COPY public ./public/

# Copy compiled contract artifacts (needed by server.ts at runtime)
COPY contracts/managed ./contracts/managed/

# Copy server code
COPY server.ts ./
COPY lib ./lib/

# Run as non-root user for security
USER bun

# Environment defaults (overridden at runtime)
ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000

CMD ["bun", "run", "server.ts"]
```

Key design decisions:
- **Multi-stage build** — build tools and dev dependencies stay in the build stage; production image is minimal (~240MB estimated)
- **`oven/bun:1.3.11-slim`** — glibc-based, compatible with native modules like `classic-level` if needed; NOT alpine (musl incompatibility risk per research)
- **`USER bun`** — non-root container execution (security hardening per ASVS V14)
- **Dependency layer caching** — `package.json` + `bun.lock` copied before source code; dependency install only reruns when deps change
- **`contracts/managed/` and `public/zk-keys/`** — gitignored but included in build context via `.dockerignore` whitelist; these are required at runtime by `server.ts` imports and ZK key serving
- **`VITE_POLL_CONTRACT_ADDRESS` as build arg** — passed at build time for Vite's `import.meta.env` substitution AND available at runtime via environment variable for server-side code
- **No `VOLUME`** — app is stateless; Neon handles all persistent data
- **` COPY public`** and **`COPY contracts/managed`** — these directories exist locally (compiled by `bun run compile:contracts`) and must be in the build context

**Verification:**
1. `docker build -t shadow-poll .` succeeds (requires `public/zk-keys/` and `contracts/managed/` to exist locally — run `bun run compile:contracts` first if needed)
2. `docker run --rm -p 3000:3000 -e DATABASE_URL=postgresql://... shadow-poll` starts the server
3. Verify image is minimal: `docker images shadow-poll` shows reasonable size
4. Verify non-root user: `docker exec <container> whoami` returns `bun`
5. Verify build context excludes unnecessary files: `docker exec <container> ls /app` shows no `.git`, `.planning`, etc.

---

### Wave 2: Local Testing + Cloud Configuration

Depends on Wave 1 being complete (Dockerfile and health endpoint must exist).

---

#### Task 3: Create `docker-compose.yml` and `fly.toml`

**ID:** DEPLOY-04, DEPLOY-05
**Description:** Create Docker Compose config for local container testing (with health check) and fly.io deployment configuration (with HTTP service, build args, and health checks).

**Files to create:**
- `docker-compose.yml` — new file
- `fly.toml` — new file

**`docker-compose.yml` implementation:**

```yaml
# docker-compose.yml — Local development/testing only
# Usage: DATABASE_URL=postgres://... VITE_POLL_CONTRACT_ADDRESS=0x... docker compose up --build

services:
  shadow-poll:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        VITE_POLL_CONTRACT_ADDRESS: ${VITE_POLL_CONTRACT_ADDRESS:-}
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL:?DATABASE_URL is required}
      - VITE_POLL_CONTRACT_ADDRESS=${VITE_POLL_CONTRACT_ADDRESS:-}
      - INDEXER_URI=https://indexer.preview.midnight.network/api/v3/graphql
      - INDEXER_WS_URI=wss://indexer.preview.midnight.network/api/v3/graphql/ws
    healthcheck:
      test: ["CMD", "bun", "-e", "fetch('http://localhost:3000/api/health').then(r=>Bun.exit(r.status===200?0:1)).catch(()=>Bun.exit(1))"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
```

Key decisions:
- **`DATABASE_URL` is required** — `:?` syntax causes docker compose to error if not set, matching the server's fail-fast behavior
- **`VITE_POLL_CONTRACT_ADDRESS`** — defaults to empty; set via environment for both build arg and runtime
- **Health check uses `bun -e`** — no need to install `curl` in the slim image; `bun` can make HTTP requests natively
- **Indexer URIs** — default to Midnight Preview network (matches current server defaults)

**`fly.toml` implementation:**

```toml
# fly.toml — Shadow Poll deployment to fly.io
# Deploy with: fly deploy
# Set secrets: fly secrets set DATABASE_URL=postgres://... VITE_POLL_CONTRACT_ADDRESS=0x...

app = "shadow-poll"
primary_region = "lhr"

[build]
  dockerfile = "Dockerfile"

[build.args]
  VITE_POLL_CONTRACT_ADDRESS = ""

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
  path = "/api/health"
  timeout = "5s"
```

Key decisions:
- **`app = "shadow-poll"`** — placeholder; user must set via `fly apps create` or change this value
- **`primary_region = "lhr"`** — London, close to Neon EU region for low latency
- **`[build.args]`** — `VITE_POLL_CONTRACT_ADDRESS` defaults to empty; set the actual value via `fly deploy --build-arg VITE_POLL_CONTRACT_ADDRESS=0x...`
- **Secrets via `fly secrets set`** — `DATABASE_URL` and `VITE_POLL_CONTRACT_ADDRESS` (runtime value) must be set as fly secrets, NOT in fly.toml
- **Health check on `/api/health`** — uses the endpoint created in Task 1; fly.io will route traffic only to healthy instances
- **`min_machines_running = 0`** — scale to zero when idle (cost-saving for testnet)
- **No volumes** — app is entirely stateless; Neon handles all persistence

**Verification:**
1. `docker compose config` parses without errors
2. `fly validate` (or visual inspection) confirms fly.toml structure is valid
3. `fly.toml` references the Dockerfile and `/api/health` health check endpoint

---

#### Task 4: Verify Docker build and local container test

**ID:** DEPLOY-06
**Description:** Build the Docker image, start a local container, and verify all endpoints work correctly. This is a manual verification checkpoint — automated tests don't exist for Docker builds yet.

**Type:** Verification checkpoint (human-verify recommended, but automated where possible)

**Steps to verify:**

1. **Prerequisites check** — ensure `public/zk-keys/keys/` and `contracts/managed/contract/` exist locally. If not, run `bun run compile:contracts` first.

2. **Build the image:**
   ```bash
   docker build -t shadow-poll \
     --build-arg VITE_POLL_CONTRACT_ADDRESS="$VITE_POLL_CONTRACT_ADDRESS" \
     .
   ```

3. **Start a container:**
   ```bash
   docker run -d --name shadow-poll-test \
     -p 3000:3000 \
     -e DATABASE_URL="$DATABASE_URL" \
     -e VITE_POLL_CONTRACT_ADDRESS="$VITE_POLL_CONTRACT_ADDRESS" \
     shadow-poll
   ```

4. **Verify health endpoint:**
   ```bash
   curl http://localhost:3000/api/health
   # Expected: {"status":"healthy","timestamp":"..."} with HTTP 200
   ```

5. **Verify existing API still works:**
   ```bash
   curl http://localhost:3000/api/indexer/block
   curl http://localhost:3000/api/polls/metadata
   ```

6. **Verify static serving (SPA):**
   ```bash
   curl -s http://localhost:3000/ | head -5
   # Expected: HTML content from dist/index.html
   curl -I http://localhost:3000/zk-keys/keys/poll.prover
   # Expected: 200 with CORS headers
   ```

7. **Verify non-root user:**
   ```bash
   docker exec shadow-poll-test whoami
   # Expected: bun
   ```

8. **Verify image cleanliness:**
   ```bash
   docker exec shadow-poll-test ls /app
   # Should NOT contain: .git, .planning, .env*, midnight-level-db
   # Should contain: dist, public, contracts/managed, lib, server.ts
   ```

9. **Test docker-compose:**
   ```bash
   DATABASE_URL="$DATABASE_URL" VITE_POLL_CONTRACT_ADDRESS="$VITE_POLL_CONTRACT_ADDRESS" docker compose up --build -d
   sleep 10
   curl http://localhost:3000/api/health
   docker compose down
   ```

10. **Test degraded state (no DATABASE_URL):**
    ```bash
    docker run --rm -p 3001:3000 shadow-poll
    # Server will crash on startup because DATABASE_URL is required at module scope
    # This is correct fail-fast behavior
    ```

11. **Clean up:**
    ```bash
    docker rm -f shadow-poll-test 2>/dev/null; docker rmi shadow-poll
    ```

**Expected outcomes:**
- Docker image builds successfully in under 5 minutes
- Container starts and serves traffic on port 3000
- Health endpoint returns 200 (healthy DB) or 503 (unreachable DB)
- Non-root user `bun` confirmed
- No sensitive files or dev dependencies in the image
- All existing API endpoints function correctly inside the container

---

## Dependency Graph

```
Task 1 (health endpoint) ──┐
                           ├──► Task 4 (verify)
Task 2 (Dockerfile) ───────┤
                           │
Task 3 (compose + fly) ────┘
```

- **Task 1** (health endpoint) — no dependencies, modifies `lib/api/`
- **Task 2** (.dockerignore + Dockerfile) — no dependencies, creates root-level files
- **Task 3** (docker-compose + fly.toml) — depends on Dockerfile existing (references it), but can be created in parallel with Tasks 1-2
- **Task 4** (verification) — depends on all previous tasks being complete

---

## Threat Model

### Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Internet → Container | Untrusted input via HTTP requests |
| Container → Neon DB | Authenticated connection over HTTPS (DATABASE_URL contains credentials) |
| Container → Midnight Indexer | Public HTTPS endpoint |
| Docker build context → Image | Build args may contain contract address (non-secret for testnet) |

### STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation |
|-----------|----------|-----------|-------------|-----------|
| T-DEPLOY-01 | Information Disclosure | Docker image | Mitigate | Never put `DATABASE_URL` or other secrets in Dockerfile ENV or image layers; use runtime env vars via `fly secrets set` or `docker run -e` |
| T-DEPLOY-02 | Elevation of Privilege | Container | Mitigate | Run as `USER bun` (non-root); fly.io also provides isolation |
| T-DEPLOY-03 | Tampering | Docker image supply chain | Accept | Pin `oven/bun:1.3.11-slim` but not to SHA digest for now; improving reproducibility is a future enhancement |
| T-DEPLOY-04 | Information Disclosure | Health endpoint | Accept | `/api/health` returns minimal data (status + timestamp); no PII or internal details exposed |
| T-DEPLOY-05 | Repudiation | Container logs | Accept | No structured logging in scope; `console.log` startup message is sufficient for v1 |

---

## Decision Coverage Matrix

| Decision ID | Plan Wave | Task | Full/Partial | Notes |
|-------------|-----------|------|--------------|-------|
| DEPLOY-01 | Wave 1 | Task 1 | Full | Health endpoint with DB check |
| DEPLOY-02 | Wave 1 | Task 2 | Full | .dockerignore excludes dev files, includes runtime essentials |
| DEPLOY-03 | Wave 1 | Task 2 | Full | Multi-stage Dockerfile with oven/bun images |
| DEPLOY-04 | Wave 2 | Task 3 | Full | docker-compose with health check using `bun -e` |
| DEPLOY-05 | Wave 2 | Task 3 | Full | fly.toml with HTTP service checks on /api/health |
| DEPLOY-06 | Wave 2 | Task 4 | Full | Manual verification checklist |
| DEPLOY-07 | Wave 1 | Task 2 | Full | VITE_POLL_CONTRACT_ADDRESS as ARG + ENV in Dockerfile |
| DEPLOY-08 | Wave 2 | Task 2 | Full | USER bun in production stage |

---

## Notes

- **`contracts/managed/` and `public/zk-keys/`** are gitignored but must exist locally before `docker build`. Run `bun run compile:contracts` to generate them if missing. The `.dockerignore` deliberately does NOT exclude these directories.
- **`DATABASE_URL`** crashes the server at import time if missing — this is desired fail-fast behavior. The health endpoint uses a dynamic import to catch this gracefully and return 503.
- **`VITE_POLL_CONTRACT_ADDRESS`** serves dual purposes: build-time (Vite bakes it into frontend JS) and runtime (server.ts reads it from `process.env`). The Dockerfile handles this via `ARG` + `ENV` for the build stage, and runtime env vars supply the server-side value.
- **fly.io secrets** — `DATABASE_URL` and `VITE_POLL_CONTRACT_ADDRESS` must be set via `fly secrets set`, not in `fly.toml`. The `[env]` section only contains non-secret config.
- **`app = "shadow-poll"`** in `fly.toml` is a placeholder and must be changed to the actual app name before deploying.