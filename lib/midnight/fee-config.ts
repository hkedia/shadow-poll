/**
 * Poll creation fee configuration for Shadow Poll.
 *
 * POLL_CREATION_FEE: Number of NIGHT tokens required to create a poll.
 * Change this constant to update the fee without touching business logic.
 *
 * getFeeTokenId: Returns the correct token type string for the given network.
 * On Preview and preprod: "tNIGHT" (testnet token)
 * On mainnet: "NIGHT" (production token)
 *
 * The token ID string must match what the Midnight runtime expects as the
 * shielded token denomination. The contract uses pad(32, tokenId) to produce
 * a Bytes<32> token identifier in the Compact receive() call.
 */

/** Number of NIGHT / tNIGHT tokens required to create a poll. */
export const POLL_CREATION_FEE: bigint = BigInt(5);

/** Preview testnet network ID as returned by the 1am wallet api.getConfiguration(). */
export const PREVIEW_NETWORK_ID = "preview";

/** Preprod network ID. */
export const PREPROD_NETWORK_ID = "preprod";

/** Mainnet network ID. */
export const MAINNET_NETWORK_ID = "mainnet";

/**
 * Returns the canonical token denomination string for the given network.
 *
 * On testnet networks (preview, preprod): "tNIGHT"
 * On mainnet: "NIGHT"
 *
 * This string is used both in UI display ("5 tNIGHT") and as the token ID
 * passed to the Compact contract's receive() call (via pad(32, tokenId)).
 *
 * @param networkId - The networkId from wallet api.getConfiguration()
 */
export function getFeeTokenId(networkId: string): string {
  if (networkId === MAINNET_NETWORK_ID) {
    return "NIGHT";
  }
  // Preview, preprod, and any unknown testnet network → tNIGHT
  return "tNIGHT";
}

/**
 * Returns a human-readable fee description for the given network.
 * Used by the UI fee banner.
 *
 * @example "Creating this poll costs 5 tNIGHT"
 */
export function getFeeBannerText(networkId: string): string {
  const tokenId = getFeeTokenId(networkId);
  return `Creating this poll costs ${POLL_CREATION_FEE.toString()} ${tokenId}`;
}

/**
 * Returns the insufficient balance error message for the given network.
 *
 * @example "Insufficient tNIGHT balance. You need 5 tNIGHT to create a poll."
 */
export function getInsufficientBalanceMessage(networkId: string): string {
  const tokenId = getFeeTokenId(networkId);
  return `Insufficient ${tokenId} balance. You need ${POLL_CREATION_FEE.toString()} ${tokenId} to create a poll.`;
}
