# Shadow Poll — Contract Deployment Guide

Deploy the Shadow Poll smart contract to the Midnight Preview network using a locally-running proof server (no API key required).

## Prerequisites

| Requirement | Notes |
|-------------|-------|
| Docker Desktop or Docker Engine | For running the local proof server |
| Bun 1.3+ | `bun --version` |
| Funded wallet seed phrase | 64-char hex; wallet needs tNight for DUST generation |
| Compiled contract artifacts | Run `bun run compile:contracts` if not present |

### Get a funded wallet seed

1. Generate a seed:
   ```sh
   node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex') + '\n')"
   ```
2. Visit the Midnight faucet and fund the wallet's shielded address:
   - Preview: https://faucet.preview.midnight.network
   - The script will print your shielded address if the balance is zero

---

## Deployment Steps

### Step 1 — Start the local proof server

```sh
# Start in the background
docker compose -f scripts/proof-server.yml up -d

# Verify it's healthy (may take 20-30s to initialize)
docker compose -f scripts/proof-server.yml ps

# Follow logs if needed
docker compose -f scripts/proof-server.yml logs -f proof-server
```

The proof server listens on `http://127.0.0.1:6300` and requires no authentication.

> **Image version:** `midnightntwrk/proof-server:8.0.3` — matches `@midnight-ntwrk/ledger-v8@8.0.3`  
> Update both together if you upgrade the SDK.

---

### Step 2 — Set environment variables

Add to `.env.local` (never commit this file):

```sh
# 64-character hex seed phrase (32 bytes)
MIDNIGHT_SEED=your_64_char_hex_seed_here

# Network target: "preview" (default) | "preprod" | "undeployed" (local)
MIDNIGHT_NETWORK=preview
```

Or export directly:
```sh
export MIDNIGHT_SEED=your_64_char_hex_seed_here
export MIDNIGHT_NETWORK=preview
```

---

### Step 3 — Install dependencies

```sh
bun install
```

---

### Step 4 — Compile the contract (if not already compiled)

```sh
bun run compile:contracts
```

This produces the compiled artifacts in `contracts/managed/` (ZK keys, circuit IR, JS module).

---

### Step 5 — Run the deploy script

```sh
bun run deploy
```

Or directly:
```sh
node scripts/deploy-poll.mjs
```

**What happens:**

1. **Network setup** — Sets the Midnight network ID
2. **Contract load** — Reads compiled artifacts from `contracts/managed/`
3. **Key derivation** — Derives HD wallet keys from `MIDNIGHT_SEED`
4. **Wallet init** — Initializes WalletFacade and connects to the network
5. **Sync** — Waits for wallet to sync with the chain (30–90 seconds)
6. **DUST** — Registers NIGHT UTXOs for DUST generation if needed; waits for DUST balance (2–5 minutes on first deploy)
7. **Providers** — Sets up SDK providers pointing at the local proof server
8. **Deploy** — Sends the deployment transaction; proof server generates ZK proof (1–5 minutes)
9. **Save** — Writes `deployment.json` with the contract address

---

### Step 6 — Configure the app

After successful deployment:

```sh
# deployment.json contains:
# { "contractAddress": "...", "network": "preprod", ... }
cat deployment.json
```

Add the contract address to your environment:

```sh
# In .env.local:
NEXT_PUBLIC_POLL_CONTRACT_ADDRESS=<contractAddress from deployment.json>
```

Then restart the dev server:

```sh
bun run dev
```

For production (Vercel or other), add `NEXT_PUBLIC_POLL_CONTRACT_ADDRESS` as an environment variable in your hosting dashboard.

---

## Network Reference

| `MIDNIGHT_NETWORK` | Indexer | Node |
|--------------------|---------|------|
| `preview` (default) | `indexer.preview.midnight.network` | `rpc.preview.midnight.network` |
| `preprod` | `indexer.preprod.midnight.network` | `rpc.preprod.midnight.network` |
| `mainnet` | `indexer.midnight.network` | `rpc.midnight.network` |
| `undeployed` | `localhost:8088` | `localhost:9944` |

---

## Troubleshooting

### DUST wait time is very long (>10 minutes)

DUST generation on Preview typically takes 2–5 minutes after registering. If it takes longer:
- Check that the proof server is still running: `docker compose -f scripts/proof-server.yml ps`
- Check the proof server logs for errors: `docker compose -f scripts/proof-server.yml logs proof-server`
- The wallet's NIGHT UTXOs must be available (not pending); check the wallet state

### "Proof server unreachable" error

```sh
# Check Docker is running
docker ps

# Restart the proof server
docker compose -f scripts/proof-server.yml down
docker compose -f scripts/proof-server.yml up -d

# Test manually
curl http://127.0.0.1:6300/health
```

### "No unregistered NIGHT UTXOs" error

Your wallet has no funded tNight tokens. Fund it from the faucet:
- https://faucet.preview.midnight.network

The wallet's shielded address is derived from `MIDNIGHT_SEED`. Run the script once — if balance is 0, it will print the address and exit.

### "HDWallet.fromSeed failed" error

- Ensure `MIDNIGHT_SEED` is exactly 64 hex characters (32 bytes)
- No spaces, no `0x` prefix

### Wallet sync takes too long

The initial sync scans the chain from genesis. On Preview this normally takes 30–90 seconds. If it times out:
- Check your internet connection can reach `indexer.preview.midnight.network`
- Try again — the indexer may be temporarily slow

### "Cannot find module" errors

Run `bun install` to install the new SDK packages added to `package.json`.

### Port 6300 already in use

```sh
# Find what's using it
lsof -i :6300

# Or change the host port in proof-server.yml:
ports:
  - "127.0.0.1:6301:6300"
# Then update .env.local:
# (The deploy script uses 6300 by default — edit NETWORK_CONFIGS in deploy-poll.mjs if you change this)
```

---

## Re-deploying

Each run of `bun run deploy` deploys a **new contract instance**. Update `NEXT_PUBLIC_POLL_CONTRACT_ADDRESS` with the new address after each deploy. Old contracts remain on-chain but the app will ignore them.

---

## Stopping the proof server

```sh
docker compose -f scripts/proof-server.yml down
```
