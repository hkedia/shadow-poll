/**
 * Shadow Poll — Print Wallet Address
 *
 * Derives and prints the shielded and unshielded wallet addresses from
 * MIDNIGHT_SEED without connecting to any network. Use this to get your
 * address for funding from the faucet before deploying.
 *
 * Usage:
 *   node scripts/print-address.mjs
 *   # or
 *   bun run wallet:address
 *
 * Required env vars:
 *   MIDNIGHT_SEED — 64-char hex seed phrase
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Buffer } from 'buffer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..');

// Load .env.local
const envPath = resolve(PROJECT_ROOT, '.env.local');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

const MIDNIGHT_SEED = process.env.MIDNIGHT_SEED;
if (!MIDNIGHT_SEED) {
  console.error('❌  MIDNIGHT_SEED is not set. Add it to .env.local or export it.');
  process.exit(1);
}
if (!/^[0-9a-fA-F]{64}$/.test(MIDNIGHT_SEED)) {
  console.error('❌  MIDNIGHT_SEED must be a 64-character hex string (32 bytes).');
  process.exit(1);
}

const NETWORK = (process.env.MIDNIGHT_NETWORK ?? 'preview').toLowerCase();

const { setNetworkId } = await import('@midnight-ntwrk/midnight-js-network-id');
setNetworkId(NETWORK === 'undeployed' ? 'undeployed' : NETWORK);

const ledger = await import('@midnight-ntwrk/ledger-v8');
const { HDWallet, Roles } = await import('@midnight-ntwrk/wallet-sdk-hd');
const { createKeystore } = await import('@midnight-ntwrk/wallet-sdk-unshielded-wallet');
const { bech32m } = await import('@scure/base');

const hdWallet = HDWallet.fromSeed(Buffer.from(MIDNIGHT_SEED, 'hex'));
if (hdWallet.type !== 'seedOk') {
  console.error(`❌  HDWallet.fromSeed failed: ${hdWallet.type}`);
  process.exit(1);
}

const derivedResult = hdWallet.hdWallet
  .selectAccount(0)
  .selectRoles([Roles.Zswap, Roles.NightExternal, Roles.Dust])
  .deriveKeysAt(0);

if (derivedResult.type !== 'keysDerived') {
  console.error(`❌  Key derivation failed: ${derivedResult.type}`);
  process.exit(1);
}

const derivedKeys = derivedResult.keys;
hdWallet.hdWallet.clear();

const shieldedSecretKeys = ledger.ZswapSecretKeys.fromSeed(derivedKeys[Roles.Zswap]);
const unshieldedKeystore = createKeystore(derivedKeys[Roles.NightExternal], NETWORK);

// Encode unshielded address as bech32m (mn_addr_<network>1... format accepted by faucet)
// IMPORTANT: the address is derived from the public key via ledger.addressFromKey(),
// NOT the raw public key bytes directly.
const addrHex = ledger.addressFromKey(unshieldedKeystore.getPublicKey());
const addrBytes = Buffer.from(addrHex, 'hex');
const addrHrp = `mn_addr_${NETWORK}`;
const unshieldedAddress = bech32m.encode(addrHrp, bech32m.toWords(addrBytes), 1000);

// Encode shielded address as bech32m (mn_shield-addr_<network>1... format used by 1am wallet)
const cpkBytes = Buffer.from(shieldedSecretKeys.coinPublicKey, 'hex');
const epkBytes = Buffer.from(shieldedSecretKeys.encryptionPublicKey, 'hex');
const shieldHrp = `mn_shield-addr_${NETWORK}`;
const shieldedAddress = bech32m.encode(shieldHrp, bech32m.toWords(Buffer.concat([cpkBytes, epkBytes])), 1000);

console.log('');
console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║              Shadow Poll — Wallet Addresses              ║');
console.log('╚══════════════════════════════════════════════════════════╝');
console.log('');
console.log(`  Network:     ${NETWORK}`);
console.log('');
console.log('  Unshielded address (use this for the faucet):');
console.log(`  ${unshieldedAddress}`);
console.log('');
console.log('  Shielded address:');
console.log(`  ${shieldedAddress}`);
console.log('');
console.log('  Faucet: https://faucet.preview.midnight.network');
console.log('');
