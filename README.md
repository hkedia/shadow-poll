# Shadow Poll

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Midnight Preview Network](https://img.shields.io/badge/Network-Midnight%20Preview-8B5CF6)](https://docs.midnight.network)
[![Bun Runtime](https://img.shields.io/badge/Runtime-Bun-f9f1e1?style=flat&logo=bun&logoColor=f9f1e1)](https://bun.sh)

**Anonymous polling on Midnight blockchain**

Shadow Poll is a confidential polling application built on the Midnight blockchain. Vote anonymously with cryptographic guarantees — no one can link a voter to their choice, but anyone can verify a vote was legitimately cast.

## Architecture

```mermaid
graph TB
    User["👤 User Browser<br/>(React App)"] --> Wallet["🔐 1am.xyz Wallet<br/>(ZK Proof Generation)"]
    User --> API["⚡ API Server<br/>(Hono/Bun)"]
    User --> Blockchain["⛓️ Midnight Blockchain<br/>(Compact Contracts)"]
    API --> Neon["🗄️ Neon Postgres<br/>(Metadata Storage)"]
    Wallet --> Blockchain
    Blockchain --> Neon

    style User fill:#1e1b4b,color:#fff,stroke:#6366f1
    style Wallet fill:#312e81,color:#fff,stroke:#818cf8
    style API fill:#1e1b4b,color:#fff,stroke:#6366f1
    style Blockchain fill:#312e81,color:#fff,stroke:#818cf8
    style Neon fill:#1e1b4b,color:#fff,stroke:#6366f1
```

### Data Flow

1. **Poll Creation**: User creates a poll via the React UI → Wallet generates ZK proof → Contract stores poll on Midnight blockchain → Metadata (title, description hash) stored in Neon Postgres
2. **Voting**: User casts vote → Wallet generates ZK proof → Contract records vote on-chain → Nullifier prevents duplicate voting
3. **Verification**: Anyone can verify a vote was cast by checking the blockchain ledger — no identity is revealed

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19 + React Router 7 + TanStack Query + Vite 8 |
| **Styling** | Tailwind CSS 4 (`@theme inline` tokens, dark mode) |
| **Icons** | Material Symbols Outlined |
| **Fonts** | Manrope + Plus Jakarta Sans |
| **API** | Hono on Bun (`server.ts` → `Bun.serve({ fetch: app.fetch })`) |
| **Database** | Neon Postgres (serverless, HTTP-based driver) |
| **Blockchain** | Midnight SDK (`compact-js`, `ledger-v8`, `midnight-js-contracts`) |
| **Wallet** | 1am.xyz (Midnight Preview network only) |
| **Testing** | Vitest + @testing-library/react |

## Project Structure

```
shadow-poll/
├── src/                          # React frontend
│   ├── app.tsx                   # Root component, router, provider tree
│   ├── main.tsx                  # Entry point
│   ├── routes/                   # Page components (kebab-case files)
│   │   ├── home.tsx              # Landing page
│   │   ├── create.tsx            # Poll creation page
│   │   ├── poll-detail.tsx       # Individual poll page
│   │   ├── verify.tsx            # Vote verification page
│   │   ├── stats.tsx             # Global statistics page
│   │   ├── active-polls.tsx      # List of active polls
│   │   ├── closed-polls.tsx      # List of closed polls
│   │   ├── trending.tsx          # Trending polls
│   │   ├── about.tsx             # About the project
│   │   ├── community.tsx         # Community page
│   │   └── privacy.tsx           # Privacy policy
│   ├── components/               # Reusable UI components
│   ├── hooks/                     # Custom React hooks
│   └── lib/                      # Frontend utilities
├── lib/                          # Backend/shared libraries
│   ├── midnight/                 # Contract service, wallet provider, ZK proofs
│   │   ├── contract-service.ts   # Blockchain interaction layer
│   │   ├── contract-types.ts     # TypeScript types for contracts
│   │   ├── providers.ts          # Midnight SDK providers
│   │   ├── indexer.ts            # Blockchain indexer client
│   │   ├── indexer-client.ts     # Indexer HTTP client
│   │   ├── ledger-utils.ts       # Ledger utilities
│   │   ├── invite-codes.ts       # Invite code utilities
│   │   ├── metadata-store.ts     # Metadata storage utilities
│   │   ├── proof-badge.ts        # ZK proof badge generation
│   │   ├── types.ts              # Shared types
│   │   ├── use-wallet.ts         # Wallet hook
│   │   └── witness-impl.ts       # Witness implementation
│   ├── api/                      # Hono route handlers
│   │   ├── routes.ts             # Route definitions
│   │   ├── health-handler.ts     # Health check endpoint
│   │   ├── polls-handler.ts      # Polls API handler
│   │   ├── metadata-handler.ts   # Metadata API handler
│   │   └── indexer-handler.ts   # Indexer proxy handler
│   ├── db/                       # Neon Postgres client + migrations
│   │   ├── client.ts             # Database client
│   │   └── migrations.ts         # Schema migrations
│   ├── queries/                  # TanStack Query hooks
│   │   ├── use-poll.ts           # Poll data hook
│   │   ├── use-polls.ts          # Polls list hook
│   │   ├── use-metadata.ts       # Metadata hook
│   │   ├── use-poll-tallies.ts   # Poll tallies hook
│   │   ├── use-vote-mutation.ts  # Vote mutation hook
│   │   ├── use-create-poll.ts    # Poll creation hook
│   │   ├── use-invite-vote-mutation.ts  # Invite vote mutation
│   │   ├── use-add-invite-codes.ts      # Add invite codes hook
│   │   ├── use-verify-proof.ts   # Proof verification hook
│   │   ├── use-participation-proof.ts   # Participation proof hook
│   │   └── query-client.ts       # Query client setup
│   └── utils.ts                  # Shared utilities
├── contracts/                    # Midnight Compact smart contracts
│   ├── src/                      # Source contracts (.compact files)
│   │   └── poll.compact          # Poll Manager contract
│   ├── scripts/                  # Deployment scripts
│   │   └── compile.sh            # Contract compilation script
│   └── managed/                  # Compiled artifacts (auto-generated)
│       ├── contract/             # Contract JS bindings
│       ├── keys/                 # Prover/verifier keys
│       └── zkir/                 # ZKIR definitions
├── tests/                        # Test utilities and test files
│   ├── api/                      # API handler tests
│   │   ├── health-handler.test.ts
│   │   ├── polls-handler.test.ts
│   │   ├── metadata-handler.test.ts
│   │   └── indexer-handler.test.ts
│   ├── queries/                  # Query hook tests
│   │   ├── use-poll.test.ts
│   │   ├── use-polls.test.ts
│   │   ├── use-metadata.test.ts
│   │   ├── use-vote-mutation.test.ts
│   │   └── use-create-poll.test.ts
│   ├── midnight/                 # Midnight integration tests
│   │   ├── contract-service.test.ts
│   │   ├── invite-codes.test.ts
│   │   ├── ledger-utils.test.ts
│   │   └── witness-impl.test.ts
│   ├── lib/                      # Test helpers (if needed)
│   ├── setup.ts                  # Vitest setup
│   └── test-utils.ts             # Shared test utilities
├── scripts/                      # Utility scripts
│   ├── deploy-poll.mjs           # Contract deployment script
│   └── print-address.mjs         # Print deployed contract address
├── server.ts                     # Hono API server entry point
├── vite.config.ts               # Vite bundler configuration
├── vitest.config.ts             # Vitest test configuration
├── deployment.json               # Contract deployment addresses
├── Dockerfile                    # Docker container definition
├── docker-compose.yml            # Docker Compose setup
├── package.json                  # Dependencies and scripts
└── tsconfig.json                 # TypeScript configuration
```

## Prerequisites

Before running Shadow Poll, ensure you have:

- **Bun 1.0+** — Package manager and runtime (`curl -fsSL https://bun.sh/install | bash`)
- **Node.js 20+** — For certain tooling (managed by Bun mostly)
- **Docker** — Optional, for containerized development
- **Midnight 1am.xyz wallet** — Browser extension for Midnight Preview network

## Local Setup

### 1. Clone the Repository

```bash
git clone https://github.com/hkedia/shadow-poll.git
cd shadow-poll
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Environment Variables

Create a `.env.local` file in the project root:

```bash
DATABASE_URL=postgresql://user:password@host/database
```

> **Note:** The `DATABASE_URL` is the only required environment variable. It follows the standard Postgres connection string format and works with Neon, Supabase, or a local Postgres instance.

### 4. Start the API Server

```bash
bun run dev:api
```

The API server starts on **port 3001** by default.

### 5. Start the Frontend

```bash
bun run dev
```

The frontend dev server starts on **port 5173**.

### 6. Open in Browser

Navigate to [http://localhost:5173](http://localhost:5173) to use Shadow Poll.

## Testing

Shadow Poll uses **Vitest** as the test runner with **@testing-library/react** for component tests.

### Run All Tests

```bash
bun test
# or
bun run test
```

### Watch Mode

Run tests in watch mode for development:

```bash
bun run test:watch
```

### Test Structure

- All tests live in the top-level `tests/` folder
- `tests/api/` — API handler tests
- `tests/queries/` — TanStack Query hook tests
- `tests/midnight/` — Midnight SDK integration tests
- `tests/lib/` — Shared test utilities (if needed)
- `tests/setup.ts` — Vitest configuration and globals
- `tests/test-utils.ts` — Common test helpers

### Testing Libraries

| Library | Purpose |
|---------|---------|
| **Vitest** | Test runner with built-in coverage |
| **@testing-library/react** | React component testing |
| **@testing-library/jest-dom** | DOM matchers (toBeInTheDocument, etc.) |
| **@testing-library/user-event** | Simulating user interactions |

## Contract Compilation & Deployment

### Compile Contracts

```bash
bun run compile:contracts
```

This runs `contracts/scripts/compile.sh` which compiles the Compact contract source (`contracts/src/poll.compact`) into JavaScript bindings, prover/verifier keys, and ZKIR definitions in `contracts/managed/`.

### Deploy to Preview Network

```bash
bun run deploy
```

This runs `scripts/deploy-poll.mjs` to deploy the compiled contract to Midnight Preview network. The deployment address is saved to `deployment.json`.

### Print Contract Address

```bash
bun run wallet:address
```

## Key Commands Reference

| Command | Description |
|---------|-------------|
| `bun install` | Install all dependencies |
| `bun run dev` | Start Vite dev server (port 5173) |
| `bun run dev:api` | Start API server (port 3001) |
| `bun run dev:all` | Start both servers concurrently |
| `bun run build` | Production build |
| `bun run serve` | Production API server |
| `bun run lint` | ESLint check |
| `bun test` | Run all tests |
| `bun run test:watch` | Run tests in watch mode |
| `bun run compile:contracts` | Compile Compact contracts |
| `bun run deploy` | Deploy to Midnight Preview |

## Privacy & Security

Shadow Poll is designed with privacy as a core principle:

- **No PII stored** — All votes are anonymous via Zero-Knowledge proofs
- **State-changing on-chain** — All vote operations execute via Midnight confidential contracts
- **Metadata contains no PII** — Off-chain metadata (title, description) stored in Neon Postgres contains no personally identifiable information
- **Invite codes hashed on-chain** — Plain-text codes never leave the client; only SHA-256 hashes are stored
- **Nullifier-based duplicate prevention** — Each wallet can only vote once per poll, without revealing identity

## Midnight Blockchain Reference

### Network

**Midnight Preview (testnet) only.** Production deployment on Midnight mainnet is not yet supported.

### Contract Architecture

The **Poll Manager** contract handles all poll operations:

- **Poll Creation** — `create_poll` circuit creates public or invite-only polls
- **Vote Casting** — `cast_vote` (public) and `cast_invite_vote` (invite-only) circuits record votes with ZK proofs
- **Invite Codes** — `add_invite_codes` circuit adds invite codes to invite-only polls
- **Duplicate Prevention** — Nullifier map `vote_nullifiers: Map<Bytes<32>, Boolean>` keyed by `hash(poll_id, voter_sk)` prevents double voting
- **Public Tallies** — All poll tallies are publicly readable from the ledger

### Circuit Parameters

All circuit verification parameters (prover/verifier keys, circuit info) are disclosed on-chain via the `disclose()` function, enabling anyone to verify ZK proof validity without revealing voter identity.

## Docker Development

Shadow Poll includes Docker support for containerized development and testing.

### Build Image

```bash
docker build -t shadow-poll .
```

### Run with Docker Compose

```bash
docker-compose up
```

### Environment in Docker

The Docker setup handles `DATABASE_URL` via environment variable injection. Ensure your `.env.local` is properly configured before building.

## License

MIT License — see [LICENSE](LICENSE) for details.

## Resources

- [Midnight Documentation](https://docs.midnight.network)
- [Compact Language Reference](https://docs.midnight.network/compact)
- [1am.xyz Wallet](https://1am.xyz)
- [Neon Postgres](https://neon.tech)
- [Midnight SDK Guide](../.agents/skills/midnight-sdk-guide/SKILL.md)
- [Midnight Deploy Guide](../.agents/skills/midnight-deploy/SKILL.md)
