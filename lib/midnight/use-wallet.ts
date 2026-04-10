import { useState, useEffect, useCallback } from "react";
import type { WalletState } from "./types";
import { assembleProviders } from "./providers";

function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Detects the 1am.xyz wallet by checking window.midnight['1am'] synchronously.
 * Returns immediately - no polling delay for better UX.
 * The wallet extension injects synchronously on page load, so immediate check is sufficient.
 *
 * @returns The wallet's InitialAPI, or null if not found
 */
function detectWallet(): Promise<unknown | null> {
  return new Promise((resolve) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wallet = (window as any)?.midnight?.["1am"];
    resolve(wallet || null);
  });
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    status: "idle",
    address: null,
    truncatedAddress: null,
    shieldedAddresses: null,
    providers: null,
    error: null,
  });

  const connectInternal = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (walletApi: any) => {
      setState((s) => ({ ...s, status: "connecting", error: null }));
      try {
        // Connect wallet on preview network — returns ConnectedAPI
        const enabledApi = await walletApi.connect("preview");

        // Get shielded addresses via the official 1am API
        // Returns { shieldedAddress, shieldedCoinPublicKey, shieldedEncryptionPublicKey }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const shieldedAddresses: any = await enabledApi.getShieldedAddresses();
        const address: string =
          typeof shieldedAddresses === "string"
            ? shieldedAddresses
            : shieldedAddresses?.shieldedAddress ?? "";

        if (!address) {
          throw new Error("No account address returned from wallet.");
        }

        // Assemble providers using the connected API
        const providers = await assembleProviders(enabledApi);

        setState({
          status: "connected",
          address,
          truncatedAddress: truncateAddress(address),
          shieldedAddresses: {
            shieldedAddress: shieldedAddresses?.shieldedAddress ?? address,
            shieldedCoinPublicKey: shieldedAddresses?.shieldedCoinPublicKey ?? "",
            shieldedEncryptionPublicKey: shieldedAddresses?.shieldedEncryptionPublicKey ?? "",
          },
          providers,
          error: null,
        });
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Could not connect to your wallet. Make sure 1am.xyz is unlocked and the Midnight Preview network is selected.";
        setState((s) => ({
          ...s,
          status: "error",
          error: message,
          shieldedAddresses: null,
          providers: null,
        }));
      }
    },
    []
  );

  // On mount, immediately resolve to "disconnected" so the header WalletButton
  // renders the Connect CTA without waiting for any polling timeout.
  useEffect(() => {
    if (typeof window === "undefined") return;
    setState((s) => ({ ...s, status: "disconnected" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // connect — triggered by user interaction
  const connect = useCallback(async () => {
    if (typeof window === "undefined") return;
    // Set connecting state immediately for better UX
    setState((s) => ({ ...s, status: "connecting", error: null }));
    const walletApi = await detectWallet();
    if (!walletApi) {
      setState((s) => ({ ...s, status: "not_detected" }));
      return;
    }
    await connectInternal(walletApi);
  }, [connectInternal]);

  // disconnect
  const disconnect = useCallback(() => {
    setState({
      status: "disconnected",
      address: null,
      truncatedAddress: null,
      shieldedAddresses: null,
      providers: null,
      error: null,
    });
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    isDetected: state.status !== "not_detected" && state.status !== "idle",
  };
}
