# Stage 1: Build the frontend with Vite
FROM oven/bun:1.3.11 AS build

WORKDIR /app

# Install dependencies first (layer caching)
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy all source code including compiled contract artifacts
# NOTE: contracts/managed/ and public/zk-keys/ must be compiled locally first:
#   bun run compile:contracts
COPY . .

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
COPY --from=build /app/public ./public/

# Copy deployment.json (contract address from deploy script)
COPY deployment.json ./

# Copy compiled contract artifacts (needed by server.ts at runtime)
COPY --from=build /app/contracts/managed ./contracts/managed/

# Copy server code and path alias config
COPY server.ts ./
COPY lib ./lib/
COPY tsconfig.json ./

# Run as non-root user for security
USER bun

# Environment defaults (overridden at runtime)
ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000

CMD ["bun", "run", "server.ts"]
