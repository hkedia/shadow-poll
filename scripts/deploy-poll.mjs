/**
 * Shadow Poll — Node ESM Contract Deployment Script
 *
 * Deploys the Poll Manager Compact contract to a Midnight network using a local
 * proof server (Docker) for ZK proving. No API key required — run proof-server
 * locally via: docker compose -f scripts/proof-server.yml up -d
 *
 * Usage:
 *   bun run deploy
 *   # or
 *   node scripts/deploy-poll.mjs
 *
 * Required env vars:
 *   MIDNIGHT_SEED    — 64-char hex seed phrase for the deployer wallet
 *
 * Optional env vars:
 *   MIDNIGHT_NETWORK — "undeployed" (local) | "preview" | "preprod" (default: "preview")
 *
 * Output:
 *   deployment.json  — { contractAddress, network, deployedAt, blockHeight }
 *   The contract address is read from deployment.json by the app.
 */

import { readFileSync, existsSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Buffer } from 'buffer';
import { WebSocket } from 'ws';
import { bech32m } from '@scure/base';

// Polyfill WebSocket for Midnight SDK (requires globalThis.WebSocket)
globalThis.WebSocket = WebSocket;

// ---------------------------------------------------------------------------
// Resolve project root (works whether run from project root or scripts/)
// ---------------------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Load .env.local (Bun/Node scripts don't auto-load it)
// ---------------------------------------------------------------------------
const envPath = resolve(PROJECT_ROOT, '.env.local');
if (existsSync(envPath)) {
  const lines = readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

// ---------------------------------------------------------------------------
// Network configuration map
// ---------------------------------------------------------------------------
const NETWORK_CONFIGS = {
  undeployed: {
    networkId: 'undeployed',
    indexerUri: 'http://localhost:8088/api/v3/graphql',
    indexerWsUri: 'ws://localhost:8088/api/v3/graphql/ws',
    nodeUri: 'http://localhost:9944',
    proofServerUri: 'http://127.0.0.1:6300',
    label: 'Local (undeployed)',
  },
  preview: {
    networkId: 'preview',
    indexerUri: 'https://indexer.preview.midnight.network/api/v3/graphql',
    indexerWsUri: 'wss://indexer.preview.midnight.network/api/v3/graphql/ws',
    nodeUri: 'https://rpc.preview.midnight.network',
    proofServerUri: 'http://127.0.0.1:6300',
    label: 'Preview (testnet)',
  },
  preprod: {
    networkId: 'preprod',
    indexerUri: 'https://indexer.preprod.midnight.network/api/v3/graphql',
    indexerWsUri: 'wss://indexer.preprod.midnight.network/api/v3/graphql/ws',
    nodeUri: 'https://rpc.preprod.midnight.network',
    proofServerUri: 'http://127.0.0.1:6300',
    label: 'Preprod',
  },
  mainnet: {
    networkId: 'mainnet',
    indexerUri: 'https://indexer.midnight.network/api/v3/graphql',
    indexerWsUri: 'wss://indexer.midnight.network/api/v3/graphql/ws',
    nodeUri: 'https://rpc.midnight.network',
    proofServerUri: 'http://127.0.0.1:6300',
    label: 'Mainnet',
  },
};

// ---------------------------------------------------------------------------
// Resolve active config
// ---------------------------------------------------------------------------
const NETWORK_KEY = (process.env.MIDNIGHT_NETWORK ?? 'preview').toLowerCase();
if (!NETWORK_CONFIGS[NETWORK_KEY]) {
  console.error(`Unknown MIDNIGHT_NETWORK="${NETWORK_KEY}". Valid values: ${Object.keys(NETWORK_CONFIGS).join(', ')}`);
  process.exit(1);
}
const NET = NETWORK_CONFIGS[NETWORK_KEY];

// ---------------------------------------------------------------------------
// Validate required env vars
// ---------------------------------------------------------------------------
const MIDNIGHT_SEED = process.env.MIDNIGHT_SEED;
if (!MIDNIGHT_SEED) {
  console.error([
    '',
    '❌  MIDNIGHT_SEED is not set.',
    '',
    '    Add it to .env.local:',
    '      MIDNIGHT_SEED=<64-char hex seed>',
    '',
    '    Or export it:',
    '      export MIDNIGHT_SEED=<64-char hex seed>',
    '',
    '    To generate a new seed (save it — you need DUST on it to deploy):',
    '      node -e "process.stdout.write(require(\'crypto\').randomBytes(32).toString(\'hex\') + \'\\n\')"',
    '',
  ].join('\n'));
  process.exit(1);
}

if (!/^[0-9a-fA-F]{64}$/.test(MIDNIGHT_SEED)) {
  console.error('❌  MIDNIGHT_SEED must be a 64-character hex string (32 bytes).');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Contract paths
// ---------------------------------------------------------------------------
const ZK_CONFIG_PATH = resolve(PROJECT_ROOT, 'contracts', 'managed');
const CONTRACT_MODULE_PATH = resolve(ZK_CONFIG_PATH, 'contract', 'index.js');

if (!existsSync(CONTRACT_MODULE_PATH)) {
  console.error([
    '',
    '❌  Compiled contract not found at:',
    `    ${CONTRACT_MODULE_PATH}`,
    '',
    '    Run first:  bun run compile:contracts',
    '',
  ].join('\n'));
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Logs with a progress prefix and timestamp. */
function log(step, msg) {
  const ts = new Date().toISOString().slice(11, 19); // HH:MM:SS
  const prefix = step ? `[${ts}] ${step}` : `[${ts}]`;
  console.log(`${prefix}  ${msg}`);
}

/**
 * Derives HD wallet keys from the hex seed.
 * Uses the official Midnight HD key derivation path.
 */
function deriveKeysFromSeed(seed) {
  const { HDWallet, Roles } = require_esm_sync('wallet-sdk-hd');
  const hdWallet = HDWallet.fromSeed(Buffer.from(seed, 'hex'));
  if (hdWallet.type !== 'seedOk') throw new Error(`HDWallet.fromSeed failed: ${hdWallet.type}`);
  const result = hdWallet.hdWallet
    .selectAccount(0)
    .selectRoles([Roles.Zswap, Roles.NightExternal, Roles.Dust])
    .deriveKeysAt(0);
  if (result.type !== 'keysDerived') throw new Error(`Key derivation failed: ${result.type}`);
  hdWallet.hdWallet.clear();
  return { keys: result.keys, Roles };
}

/** Encodes the unshielded wallet address as a bech32m mn_addr_<network>1... address for use with the faucet.
 *  IMPORTANT: the address is derived from the public key via ledger.addressFromKey(),
 *  NOT the raw public key bytes directly. */
function encodeUnshieldedAddress(unshieldedKeystore, networkId, ledgerModule) {
  const addrHex = ledgerModule.addressFromKey(unshieldedKeystore.getPublicKey());
  const addrBytes = Buffer.from(addrHex, 'hex');
  return bech32m.encode(`mn_addr_${networkId}`, bech32m.toWords(addrBytes), 1000);
}

/** Encodes shielded secret keys as a bech32m mn_shield-addr_<network>1... address. */
function encodeShieldedAddress(zswapSecretKeys, networkId) {
  const cpkBytes = Buffer.from(zswapSecretKeys.coinPublicKey, 'hex');
  const epkBytes = Buffer.from(zswapSecretKeys.encryptionPublicKey, 'hex');
  return bech32m.encode(`mn_shield-addr_${networkId}`, bech32m.toWords(Buffer.concat([cpkBytes, epkBytes])), 1000);
}

/**
 * signTransactionIntents — SDK 4.x workaround.
 *
 * The wallet SDK returns transaction intents with kind='pre-proof' after
 * balanceTx. The SDK's internal signing step requires kind='proof'. This
 * patches the kind field by re-deserializing with the correct proof marker
 * before signing. Required for both the baseTransaction and balancingTransaction.
 *
 * See: Debanjannnn/Midnight-Fix — deploy.mjs
 */
function signTransactionIntents(ledger, tx, signFn, proofMarker) {
  if (!tx.intents || tx.intents.size === 0) return;
  for (const segment of tx.intents.keys()) {
    const intent = tx.intents.get(segment);
    if (!intent) continue;
    // Re-deserialize with the correct proof marker to fix the kind field
    const cloned = ledger.Intent.deserialize(
      'signature',
      proofMarker,
      'pre-binding',
      intent.serialize(),
    );
    const sigData = cloned.signatureData(segment);
    const signature = signFn(sigData);
    // Attach signatures to unshielded offers if present
    if (cloned.fallibleUnshieldedOffer) {
      const sigs = cloned.fallibleUnshieldedOffer.inputs.map(
        (_, i) => cloned.fallibleUnshieldedOffer.signatures.at(i) ?? signature,
      );
      cloned.fallibleUnshieldedOffer = cloned.fallibleUnshieldedOffer.addSignatures(sigs);
    }
    if (cloned.guaranteedUnshieldedOffer) {
      const sigs = cloned.guaranteedUnshieldedOffer.inputs.map(
        (_, i) => cloned.guaranteedUnshieldedOffer.signatures.at(i) ?? signature,
      );
      cloned.guaranteedUnshieldedOffer = cloned.guaranteedUnshieldedOffer.addSignatures(sigs);
    }
    tx.intents.set(segment, cloned);
  }
}

/**
 * Creates the WalletProvider + MidnightProvider combo required by the SDK.
 *
 * The walletProvider.balanceTx:
 *   1. Calls wallet.balanceUnboundTransaction() to add DUST fees
 *   2. Applies the signTransactionIntents workaround on both tx parts
 *   3. Finalizes the recipe and returns the balanced tx
 *
 * The midnightProvider.submitTx calls wallet.submitTransaction directly.
 */
async function createWalletAndMidnightProvider(ledger, Rx, ctx) {
  const state = await Rx.firstValueFrom(
    ctx.wallet.state().pipe(Rx.filter((s) => s.isSynced)),
  );

  return {
    // WalletProvider API
    getCoinPublicKey() {
      return state.shielded.coinPublicKey.toHexString();
    },
    getEncryptionPublicKey() {
      return state.shielded.encryptionPublicKey.toHexString();
    },
    async balanceTx(tx, ttl) {
      const recipe = await ctx.wallet.balanceUnboundTransaction(
        tx,
        {
          shieldedSecretKeys: ctx.shieldedSecretKeys,
          dustSecretKey: ctx.dustSecretKey,
        },
        { ttl: ttl ?? new Date(Date.now() + 30 * 60 * 1000) },
      );
      const signFn = (payload) => ctx.unshieldedKeystore.signData(payload);
      // Apply signTransactionIntents workaround for SDK 4.x
      signTransactionIntents(ledger, recipe.baseTransaction, signFn, 'proof');
      if (recipe.balancingTransaction) {
        signTransactionIntents(ledger, recipe.balancingTransaction, signFn, 'pre-proof');
      }
      return ctx.wallet.finalizeRecipe(recipe);
    },
    // MidnightProvider API (combined on same object)
    submitTx(tx) {
      return ctx.wallet.submitTransaction(tx);
    },
  };
}

// ---------------------------------------------------------------------------
// Main deployment function
// ---------------------------------------------------------------------------
async function deploy() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║           Shadow Poll — Contract Deployment              ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');
  log('', `Network:      ${NET.label} (${NET.networkId})`);
  log('', `Indexer:      ${NET.indexerUri}`);
  log('', `Proof server: ${NET.proofServerUri}`);
  log('', `ZK keys:      ${ZK_CONFIG_PATH}`);
  console.log('');

  // ── Step 1: Set network ID ──────────────────────────────────────────────
  log('1/8', 'Setting network ID...');
  const { setNetworkId, getNetworkId } = await import('@midnight-ntwrk/midnight-js-network-id');
  setNetworkId(NET.networkId);
  log('1/8', `Network ID set to "${getNetworkId()}"`);

  // ── Step 2: Derive keys from seed ───────────────────────────────────────
  log('2/8', 'Deriving HD wallet keys from seed...');
  const ledger = await import('@midnight-ntwrk/ledger-v8');
  const { WalletFacade } = await import('@midnight-ntwrk/wallet-sdk-facade');
  const { DustWallet } = await import('@midnight-ntwrk/wallet-sdk-dust-wallet');
  const { HDWallet, Roles } = await import('@midnight-ntwrk/wallet-sdk-hd');
  const { ShieldedWallet } = await import('@midnight-ntwrk/wallet-sdk-shielded');
  const {
    createKeystore,
    InMemoryTransactionHistoryStorage,
    PublicKey,
    UnshieldedWallet,
  } = await import('@midnight-ntwrk/wallet-sdk-unshielded-wallet');

  const hdWallet = HDWallet.fromSeed(Buffer.from(MIDNIGHT_SEED, 'hex'));
  if (hdWallet.type !== 'seedOk') {
    throw new Error(`HDWallet.fromSeed failed with type: "${hdWallet.type}"`);
  }
  const derivedResult = hdWallet.hdWallet
    .selectAccount(0)
    .selectRoles([Roles.Zswap, Roles.NightExternal, Roles.Dust])
    .deriveKeysAt(0);
  if (derivedResult.type !== 'keysDerived') {
    throw new Error(`Key derivation failed with type: "${derivedResult.type}"`);
  }
  const derivedKeys = derivedResult.keys;
  hdWallet.hdWallet.clear(); // wipe HD wallet from memory

  const shieldedSecretKeys = ledger.ZswapSecretKeys.fromSeed(derivedKeys[Roles.Zswap]);
  const dustSecretKey = ledger.DustSecretKey.fromSeed(derivedKeys[Roles.Dust]);
  const unshieldedKeystore = createKeystore(derivedKeys[Roles.NightExternal], getNetworkId());

  log('2/8', 'Keys derived successfully');

  // ── Step 3: Load compiled contract with witnesses ──────────────────────
  log('3/8', 'Loading compiled contract...');
  const { CompiledContract } = await import('@midnight-ntwrk/compact-js');
  const contractModule = await import(CONTRACT_MODULE_PATH);

  // The contract declares two witness functions that must be provided:
  //   witness local_secret_key(): Bytes<32>
  //   witness current_block_number(): Uint<64>
  // Each witness receives a witnessContext and returns [nextPrivateState, result].
  const secretKeyBytes = Buffer.from(MIDNIGHT_SEED, 'hex'); // 32-byte seed as the secret key
  const witnesses = {
    local_secret_key(witnessContext) {
      // Return [updatedPrivateState, result] — private state is unchanged
      return [witnessContext.privateState, secretKeyBytes];
    },
    current_block_number(witnessContext) {
      // Estimate: use current Unix time / 20s block time as a rough block number.
      // This is only used for expiry/TTL calculations in the contract.
      const estimatedBlock = BigInt(Math.floor(Date.now() / 20_000));
      return [witnessContext.privateState, estimatedBlock];
    },
  };

  const compiledContract = CompiledContract.make('poll', contractModule.Contract).pipe(
    // Provide actual witness implementations (not vacant — contract requires them)
    CompiledContract.withWitnesses(witnesses),
    // Point to compiled ZK keys + zkir artifacts
    CompiledContract.withCompiledFileAssets(ZK_CONFIG_PATH),
  );
  log('3/8', 'Contract loaded (circuits: create_poll, cast_vote, cast_invite_vote, add_invite_codes)');

  // ── Step 4: Initialize wallet ───────────────────────────────────────────
  log('4/8', 'Initializing wallet (this connects to the indexer)...');

  const walletConfig = {
    networkId: getNetworkId(),
    indexerClientConnection: {
      indexerHttpUrl: NET.indexerUri,
      indexerWsUrl: NET.indexerWsUri,
    },
    provingServerUrl: new URL(NET.proofServerUri),
    relayURL: new URL(NET.nodeUri.replace(/^http/, 'ws').replace(/^https/, 'wss')),
    txHistoryStorage: new InMemoryTransactionHistoryStorage(),
    costParameters: {
      additionalFeeOverhead: 300_000_000_000_000n,
      feeBlocksMargin: 5,
    },
  };

  const wallet = await WalletFacade.init({
    configuration: walletConfig,
    shielded: (cfg) => ShieldedWallet(cfg).startWithSecretKeys(shieldedSecretKeys),
    unshielded: (cfg) =>
      UnshieldedWallet(cfg).startWithPublicKey(PublicKey.fromKeyStore(unshieldedKeystore)),
    dust: (cfg) =>
      DustWallet(cfg).startWithSecretKey(
        dustSecretKey,
        ledger.LedgerParameters.initialParameters().dust,
      ),
  });
  await wallet.start(shieldedSecretKeys, dustSecretKey);
  log('4/8', 'Wallet started');

  // ── Step 5: Sync wallet ─────────────────────────────────────────────────
  log('5/8', 'Syncing wallet with the network (may take 3-5 minutes for dust wallet)...');
  const Rx = await import('rxjs');

  await Rx.firstValueFrom(
    wallet.state().pipe(
      Rx.throttleTime(10000),
      Rx.tap((s) => {
        if (!s.isSynced) {
          const dp = s.dust?.state?.progress;
          log('5/8', `  Syncing... Dust: ${dp?.appliedIndex ?? '?'}/${dp?.highestRelevantWalletIndex ?? '?'}`);
        }
      }),
      Rx.filter((s) => s.isSynced),
    ),
  );
  log('5/8', 'Wallet synced ✓');

  // Check NIGHT balance via the UnshieldedWalletState.balances getter
  const syncedState = await Rx.firstValueFrom(
    wallet.state().pipe(Rx.filter((s) => s.isSynced)),
  );
  const nightBalance = syncedState.unshielded.balances[ledger.unshieldedToken().raw] ?? 0n;
  log('5/8', `NIGHT balance: ${nightBalance.toLocaleString()} tNight`);

  if (nightBalance === 0n) {
    console.warn('');
    console.warn('⚠️  WARNING: NIGHT balance is 0. You need tNight to register for DUST.');
    console.warn('   Get testnet tokens from: https://faucet.preview.midnight.network');
    console.warn(`   Unshielded address (use for faucet): ${encodeUnshieldedAddress(unshieldedKeystore, NET.networkId, ledger)}`);
    console.warn('');
  }

  // ── Step 6: Register for DUST and wait ─────────────────────────────────
  log('6/8', 'Checking DUST balance...');

  const hasDust = (() => {
    try {
      return syncedState.dust.availableCoins?.length > 0 ||
        syncedState.dust.balance(new Date()) > 0n;
    } catch { return false; }
  })();

  if (!hasDust) {
    log('6/8', 'No DUST found — registering NIGHT UTXOs for DUST generation...');

    const nightUtxos = syncedState.unshielded.availableCoins ?? [];

    if (nightUtxos.length === 0) {
      console.error([
        '',
        '❌  No NIGHT UTXOs available for DUST generation.',
        '',
        '    You need funded NIGHT tokens in the wallet to generate DUST.',
        '    Get testnet tokens: https://faucet.preview.midnight.network',
        '',
        '    Wallet unshielded address (use for faucet):',
        `      ${encodeUnshieldedAddress(unshieldedKeystore, NET.networkId, ledger)}`,
        '',
      ].join('\n'));
      await wallet.stop();
      process.exit(1);
    }

    log('6/8', `Registering ${nightUtxos.length} NIGHT UTXO(s)...`);
    const recipe = await wallet.registerNightUtxosForDustGeneration(
      nightUtxos,
      unshieldedKeystore.getPublicKey(),
      (p) => unshieldedKeystore.signData(p),
    );
    const finalized = await wallet.finalizeRecipe(recipe);
    await wallet.submitTransaction(finalized);
    log('6/8', 'Registration submitted. Waiting for DUST to generate (2–5 minutes)...');

    await Rx.firstValueFrom(
      wallet.state().pipe(
        Rx.throttleTime(10_000),
        Rx.tap((s) => {
          try {
            const dustBal = s.dust.balance(new Date());
            log('6/8', `  Waiting for DUST... current: ${dustBal.toLocaleString()}`);
          } catch {
            log('6/8', '  Waiting for DUST...');
          }
        }),
        Rx.filter((s) => {
          try {
            return s.isSynced && s.dust.balance(new Date()) > 0n;
          } catch { return false; }
        }),
      ),
    );
  }

  const finalState = await Rx.firstValueFrom(
    wallet.state().pipe(Rx.filter((s) => s.isSynced)),
  );
  let dustBalance = 0n;
  try { dustBalance = finalState.dust.balance(new Date()); } catch { /* ignore */ }
  log('6/8', `DUST balance: ${dustBalance.toLocaleString()} ✓`);

  // ── Step 7: Build providers ─────────────────────────────────────────────
  log('7/8', 'Building SDK providers...');

  const { levelPrivateStateProvider } = await import(
    '@midnight-ntwrk/midnight-js-level-private-state-provider'
  );
  const { indexerPublicDataProvider } = await import(
    '@midnight-ntwrk/midnight-js-indexer-public-data-provider'
  );
  const { httpClientProofProvider } = await import(
    '@midnight-ntwrk/midnight-js-http-client-proof-provider'
  );
  const { NodeZkConfigProvider } = await import(
    '@midnight-ntwrk/midnight-js-node-zk-config-provider'
  );

  // Verify proof server is reachable before attempting to deploy
  log('7/8', `Checking proof server at ${NET.proofServerUri}...`);
  try {
    const healthResp = await fetch(`${NET.proofServerUri}/health`, {
      signal: AbortSignal.timeout(5000),
    }).catch(() => null);
    if (!healthResp?.ok) {
      // Some proof servers don't have /health — try the root
      const rootResp = await fetch(NET.proofServerUri, {
        signal: AbortSignal.timeout(5000),
      }).catch(() => null);
      if (!rootResp) {
        throw new Error('Proof server unreachable');
      }
    }
    log('7/8', 'Proof server reachable ✓');
  } catch {
    console.error([
      '',
      `❌  Cannot reach proof server at ${NET.proofServerUri}`,
      '',
      '    Start it first:',
      '      docker compose -f scripts/proof-server.yml up -d',
      '',
      '    Then re-run this script.',
      '',
    ].join('\n'));
    await wallet.stop();
    process.exit(1);
  }

  // Wallet provider doubles as midnight provider (same object, per official pattern)
  const walletAndMidnightProvider = await createWalletAndMidnightProvider(
    ledger,
    Rx,
    { wallet, shieldedSecretKeys, dustSecretKey, unshieldedKeystore },
  );

  const accountId = walletAndMidnightProvider.getCoinPublicKey();
  // Derive a deterministic storage password from the coin public key
  const storagePassword = `${Buffer.from(accountId, 'hex').toString('base64')}!`;

  const zkConfigProvider = new NodeZkConfigProvider(ZK_CONFIG_PATH);

  const providers = {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: 'shadow-poll-deploy-state',
      accountId,
      privateStoragePasswordProvider: () => storagePassword,
    }),
    publicDataProvider: indexerPublicDataProvider(NET.indexerUri, NET.indexerWsUri),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(NET.proofServerUri, zkConfigProvider),
    walletProvider: walletAndMidnightProvider,
    midnightProvider: walletAndMidnightProvider,
  };

  log('7/8', 'All providers ready ✓');

  // ── Step 8: Deploy! ─────────────────────────────────────────────────────
  log('8/8', 'Deploying contract (ZK proving — expect 1–5 minutes)...');
  log('8/8', 'Progress depends on proof server speed. Be patient.');
  console.log('');

  const { deployContract } = await import('@midnight-ntwrk/midnight-js-contracts');

  const deployed = await deployContract(providers, {
    compiledContract,
    privateStateId: 'shadow-poll-private',
    initialPrivateState: {},
    args: [],
  });

  const contractAddress = deployed.deployTxData.public.contractAddress;
  const blockHeight =
    deployed.deployTxData.public.blockHeight ??
    deployed.deployTxData.public.block?.height ??
    null;

  // ── Save deployment.json ────────────────────────────────────────────────
  const deploymentData = {
    contractAddress,
    network: NET.networkId,
    deployedAt: new Date().toISOString(),
    blockHeight: blockHeight?.toString() ?? null,
    indexerUri: NET.indexerUri,
  };

  const outputPath = resolve(PROJECT_ROOT, 'deployment.json');
  writeFileSync(outputPath, JSON.stringify(deploymentData, null, 2) + '\n');

  // ── Print summary ───────────────────────────────────────────────────────
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║             CONTRACT DEPLOYED SUCCESSFULLY               ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`  Contract address:  ${contractAddress}`);
  console.log(`  Network:           ${NET.networkId}`);
  if (blockHeight !== null) console.log(`  Block height:      ${blockHeight}`);
  console.log(`  Saved to:          deployment.json`);
  console.log('');
  console.log('  Next steps:');
  console.log('  ─────────────────────────────────────────────────────────');
  console.log('  1. The contract address has been saved to deployment.json');
  console.log('  2. Restart dev server:  bun run dev');
  console.log('  3. For production: deployment.json is bundled at build time');
  console.log('');

  await wallet.stop();
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------
deploy().catch((err) => {
  console.error('');
  console.error('╔══════════════════════════════════════════════════════════╗');
  console.error('║                    DEPLOYMENT FAILED                     ║');
  console.error('╚══════════════════════════════════════════════════════════╝');
  console.error('');
  console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
  if (err instanceof Error && err.stack) {
    console.error('');
    console.error('Stack trace:');
    console.error(err.stack);
  }
  console.error('');
  console.error('Common causes:');
  console.error('  • Proof server not running → docker compose -f scripts/proof-server.yml up -d');
  console.error('  • No DUST balance → fund wallet with tNight from faucet.preview.midnight.network');
  console.error('  • Network unreachable → check MIDNIGHT_NETWORK env var');
  console.error('  • Invalid seed → ensure MIDNIGHT_SEED is 64 hex chars');
  console.error('');
  process.exit(1);
});
