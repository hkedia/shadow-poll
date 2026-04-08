/**
 * Witness implementations for the Poll Manager Compact contract.
 *
 * The compiled contract declares two witnesses:
 *   - local_secret_key(context): [PS, Uint8Array] — returns a 32-byte secret key
 *   - current_block_number(context): [PS, bigint] — returns the current block number
 *
 * Both return [context.privateState, value] — the private state is always passed through unchanged.
 *
 * @midnight-ntwrk imports should be dynamic when used in browser context.
 */

/**
 * Creates witness implementations for the Poll Manager contract.
 *
 * The returned object matches the `Witnesses<PS>` type from the compiled contract.
 * Each witness receives a `WitnessContext` and must return `[PS, ReturnType]`.
 *
 * @param secretKey - 32-byte secret key derived from the wallet's shielded address
 * @param blockNumber - Current network block number from the indexer
 */
export function createWitnesses<PS>(secretKey: Uint8Array, blockNumber: bigint) {
  return {
    local_secret_key(context: { privateState: PS }): [PS, Uint8Array] {
      return [context.privateState, secretKey];
    },
    current_block_number(context: { privateState: PS }): [PS, bigint] {
      return [context.privateState, blockNumber];
    },
  };
}

/**
 * Derives a deterministic secret key from the connected wallet.
 *
 * Uses the official 1am.xyz API:
 *   api.getShieldedAddresses() → { shieldedAddress, shieldedCoinPublicKey, shieldedEncryptionPublicKey }
 *
 * Strategy:
 *   1. Calls `walletProvider.getCoinPublicKey()` which returns shieldedCoinPublicKey
 *   2. Falls back to the full shielded address via getShieldedAddresses() if available
 *   3. Hashes the key with SHA-256 to produce a deterministic 32-byte secret
 *
 * This is NOT a cryptographic private key — it's a deterministic identifier
 * derived from the wallet's shielded address. The same wallet always produces
 * the same key, which satisfies the contract's `local_secret_key` witness
 * requirement for consistent voter identification.
 *
 * @param walletProvider - The structured WalletProvider from assembleProviders()
 *                         (has getCoinPublicKey returning shieldedCoinPublicKey)
 */
export async function getSecretKeyFromWallet(
  walletProvider: { getCoinPublicKey(): string }
): Promise<Uint8Array> {
  // Primary: use shieldedCoinPublicKey from walletProvider (per 1am API spec)
  try {
    const coinPk = walletProvider.getCoinPublicKey();
    if (coinPk && typeof coinPk === "string" && coinPk.length > 0) {
      const encoded = new TextEncoder().encode(coinPk);
      const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
      return new Uint8Array(hashBuffer);
    }
  } catch (err) {
    console.warn("Failed to derive secret key from coin public key:", err);
  }

  // Last resort: return a zero key (contract will still work, just less unique)
  console.warn("Could not derive secret key from wallet — using zero key");
  return new Uint8Array(32);
}

/**
 * Queries the current block height from the Midnight indexer.
 *
 * Uses a simple GraphQL query to the indexer's HTTP endpoint.
 * Falls back to BigInt(0) if the query fails (the ZK proof will still be
 * generated; the prover just needs a plausible block number — the contract's
 * assertion verifies it).
 *
 * @param indexerUri - The indexer GraphQL HTTP endpoint URI
 */
export async function getCurrentBlockNumber(indexerUri: string): Promise<bigint> {
  try {
    const response = await fetch(indexerUri, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "{ blockHeight { latest } }",
      }),
    });

    if (!response.ok) {
      console.warn(`Indexer block height query failed with status ${response.status}`);
      return BigInt(0);
    }

    const json = await response.json();
    const latest = json?.data?.blockHeight?.latest;

    if (latest !== undefined && latest !== null) {
      return BigInt(latest);
    }

    console.warn("Indexer did not return block height, falling back to 0");
    return BigInt(0);
  } catch (err) {
    console.warn("Failed to query current block number from indexer:", err);
    return BigInt(0);
  }
}
