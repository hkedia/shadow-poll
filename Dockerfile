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