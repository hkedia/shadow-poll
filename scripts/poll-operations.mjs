/**
 * Shadow Poll — Server-side poll operations.
 *
 * This script provides functions to create polls and cast votes using the
 * server-side wallet (MIDNIGHT_SEED). Used by API routes.
 *
 * Usage:
 *   import { createPoll, castVote } from './poll-operations.mjs';
 */

import { readFileSync, existsSync } from 'fs';
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
// Network configuration map (same as deploy-poll.mjs)
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
  throw new Error('MIDNIGHT_SEED environment variable is required');
}
if (!/^[0-9a-fA-F]{64}$/.test(MIDNIGHT_SEED)) {
  throw new Error('MIDNIGHT_SEED must be a 64-character hex string (32 bytes)');
}

// ---------------------------------------------------------------------------
// Contract paths
// ---------------------------------------------------------------------------
const ZK_CONFIG_PATH = resolve(PROJECT_ROOT, 'contracts', 'managed');
const CONTRACT_MODULE_PATH = resolve(ZK_CONFIG_PATH, 'contract', 'index.js');

if (!existsSync(CONTRACT_MODULE_PATH)) {
  throw new Error(`Compiled contract not found at ${CONTRACT_MODULE_PATH}`);
}

// ---------------------------------------------------------------------------
// Helpers (copied from deploy-poll.mjs)
// ---------------------------------------------------------------------------

function log(step, msg) {
  const ts = new Date().toISOString().slice(11, 19);
  const prefix = step ? `[${ts}] ${step}` : `[${ts}]`;
  console.log(`${prefix}  ${msg}`);
}

function signTransactionIntents(ledger, tx, signFn, proofMarker) {
  if (!tx.intents || tx.intents.size === 0) return;
  for (const segment of tx.intents.keys()) {
    const intent = tx.intents.get(segment);
    if (!intent) continue;
    const cloned = ledger.Intent.deserialize(
      'signature',
      proofMarker,
      'pre-binding',
      intent.serialize(),
    );
    const sigData = cloned.signatureData(segment);
    const signature = signFn(sigData);
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

async function createWalletAndMidnightProvider(ledger, Rx, ctx) {
  const state = await Rx.firstValueFrom(
    ctx.wallet.state().pipe(Rx.filter((s) => s.isSynced)),
  );
  return {
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
      signTransactionIntents(ledger, recipe.baseTransaction, signFn, 'proof');
      if (recipe.balancingTransaction) {
        signTransactionIntents(ledger, recipe.balancingTransaction, signFn, 'pre-proof');
      }
      return ctx.wallet.finalizeRecipe(recipe);
    },
    submitTx(tx) {
      return ctx.wallet.submitTransaction(tx);
    },
  };
}

// ---------------------------------------------------------------------------
// Wallet initialization (cached)
// ---------------------------------------------------------------------------
let cachedWallet = null;

async function initializeWallet() {
  if (cachedWallet) return cachedWallet;
  
  log('', `Initializing server wallet (${NET.label})...`);
  
  const { setNetworkId, getNetworkId } = await import('@midnight-ntwrk/midnight-js-network-id');
  setNetworkId(NET.networkId);
  
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
  hdWallet.hdWallet.clear();
  
  const shieldedSecretKeys = ledger.ZswapSecretKeys.fromSeed(derivedKeys[Roles.Zswap]);
  const dustSecretKey = ledger.DustSecretKey.fromSeed(derivedKeys[Roles.Dust]);
  const unshieldedKeystore = createKeystore(derivedKeys[Roles.NightExternal], getNetworkId());
  
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
      additionalFeeOverhead: BigInt(300000000000000),
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
  
  const Rx = await import('rxjs');
  
  // Sync wallet (with timeout)
  await Promise.race([
    Rx.firstValueFrom(
      wallet.state().pipe(
        Rx.throttleTime(10000),
        Rx.tap((s) => {
          if (!s.isSynced) {
            const dp = s.dust?.state?.progress;
            log('', `  Syncing... Dust: ${dp?.appliedIndex ?? '?'}/${dp?.highestRelevantWalletIndex ?? '?'}`);
          }
        }),
        Rx.filter((s) => s.isSynced),
      ),
    ),
    new Promise((resolve) => setTimeout(resolve, 30000)), // 30 second timeout
  ]);
  
  log('', 'Wallet synced');
  
  // Build providers
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
  
  const syncedState = await Rx.firstValueFrom(
    wallet.state().pipe(Rx.filter((s) => s.isSynced)),
  ).catch(() => null);
  
  const accountId = syncedState?.shielded?.coinPublicKey?.toHexString() ?? '';
  const storagePassword = `${Buffer.from(accountId, 'hex').toString('base64')}!`;
  
  const zkConfigProvider = new NodeZkConfigProvider(ZK_CONFIG_PATH);
  
  const walletAndMidnightProvider = await createWalletAndMidnightProvider(
    ledger,
    Rx,
    { wallet, shieldedSecretKeys, dustSecretKey, unshieldedKeystore },
  );
  
  const providers = {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: 'shadow-poll-server-state',
      accountId,
      privateStoragePasswordProvider: () => storagePassword,
    }),
    publicDataProvider: indexerPublicDataProvider(NET.indexerUri, NET.indexerWsUri),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(NET.proofServerUri, zkConfigProvider),
    walletProvider: walletAndMidnightProvider,
    midnightProvider: walletAndMidnightProvider,
  };
  
  // Get contract address
  let contractAddress = process.env.VITE_POLL_CONTRACT_ADDRESS ?? '';
  if (!contractAddress) {
    const deploymentPath = resolve(PROJECT_ROOT, 'deployment.json');
    if (existsSync(deploymentPath)) {
      const deployment = JSON.parse(readFileSync(deploymentPath, 'utf8'));
      contractAddress = deployment.contractAddress ?? '';
    }
  }
  if (!contractAddress) {
    throw new Error('No contract address found');
  }
  
  const secretKeyBytes = Buffer.from(MIDNIGHT_SEED, 'hex');
  
  cachedWallet = { wallet, providers, secretKeyBytes, accountId, contractAddress };
  return cachedWallet;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create a new poll on-chain.
 */
export async function createPoll(params) {
  const { providers, secretKeyBytes, contractAddress } = await initializeWallet();
  
  const { CompiledContract } = await import('@midnight-ntwrk/compact-js');
  const { Contract } = await import('../contracts/managed/contract/index.js');
  const { createWitnesses } = await import('../lib/midnight/witness-impl.ts');
  
  // Get current block number
  const { getCurrentBlockNumber } = await import('../lib/midnight/witness-impl.ts');
  const blockNumber = await getCurrentBlockNumber(providers.publicDataProvider.indexerUri);
  
  const witnesses = createWitnesses(secretKeyBytes, blockNumber);
  
  const compiled = CompiledContract.make('poll-manager', Contract);
  const withWit = CompiledContract.withWitnesses(compiled, witnesses);
  const withAssets = CompiledContract.withCompiledFileAssets(withWit, ZK_CONFIG_PATH);
  
  const { findDeployedContract } = await import('@midnight-ntwrk/midnight-js-contracts');
  const contract = await findDeployedContract(providers, {
    compiledContract: withAssets,
    contractAddress,
  });
  
  const { PollType } = await import('../contracts/managed/contract/index.js');
  const pollTypeEnum = params.pollType === 1 ? PollType.invite_only : PollType.public_poll;
  
  const result = await contract.callTx.create_poll(
    params.metadataHash,
    BigInt(params.optionCount),
    pollTypeEnum,
    params.expirationBlock,
  );
  
  const pollIdBytes = result.private?.result ?? result.result ?? new Uint8Array(32);
  const pollId = Buffer.from(pollIdBytes).toString('hex');
  
  return { pollId, transactionId: result.txId };
}

/**
 * Cast a vote on-chain.
 */
export async function castVote(params) {
  const { providers, secretKeyBytes, contractAddress } = await initializeWallet();
  
  const { CompiledContract } = await import('@midnight-ntwrk/compact-js');
  const { Contract } = await import('../contracts/managed/contract/index.js');
  const { createWitnesses } = await import('../lib/midnight/witness-impl.ts');
  const { getCurrentBlockNumber } = await import('../lib/midnight/witness-impl.ts');
  const blockNumber = await getCurrentBlockNumber(providers.publicDataProvider.indexerUri);
  
  const witnesses = createWitnesses(secretKeyBytes, blockNumber);
  
  const compiled = CompiledContract.make('poll-manager', Contract);
  const withWit = CompiledContract.withWitnesses(compiled, witnesses);
  const withAssets = CompiledContract.withCompiledFileAssets(withWit, ZK_CONFIG_PATH);
  
  const { findDeployedContract } = await import('@midnight-ntwrk/midnight-js-contracts');
  const contract = await findDeployedContract(providers, {
    compiledContract: withAssets,
    contractAddress,
  });
  
  const pollIdBytes = Buffer.from(params.pollId, 'hex');
  await contract.callTx.cast_vote(pollIdBytes, BigInt(params.optionIndex));
  
  return { success: true };
}

/**
 * Fetch all polls from the indexer (simplified).
 */
export async function listPolls() {
  const { providers, contractAddress } = await initializeWallet();
  const state = await providers.publicDataProvider.queryContractState(contractAddress);
  if (!state) return [];
  // For now, return empty array. We'll need to parse ledger state.
  return [];
}