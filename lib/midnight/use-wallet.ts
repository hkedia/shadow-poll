import { useState, useEffect, useCallback } from "react";
import type { WalletState } from "./types";
import { assembleProviders } from "./providers";

const AUTO_CONNECT_KEY = "shadowpoll:autoconnect";

function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Detects the 1am.xyz wallet using the official polling pattern from 1am.xyz/ai.txt.
 * Polls window.midnight['1am'] with up to 50 attempts × 100ms = 5 seconds total.
 * This handles the race condition where the extension injects after the page loads.
 *
 * @returns The wallet's InitialAPI, or null if not found within the timeout
 */
function detectWallet(): Promise<unknown | null> {
  return new Promise((resolve) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wallet = (window as any)?.midnight?.["1am"];
    if (wallet) {
      resolve(wallet);
      return;
    }
    let attempts = 0;
    const interval = setInterval(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = (window as any)?.midnight?.["1am"];
      if (w) {
        clearInterval(interval);
        resolve(w);
      } else if (++attempts > 50) {
        clearInterval(interval);
        resolve(null);
      }
    }, 100);
  });
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    status: "idle",
    isAutoConnecting: false,
    address: null,
    truncatedAddress: null,
    shieldedAddresses: null,
    providers: null,
    error: null,
  });

  const connectInternal = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (walletApi: any, isAutoConnect = false) => {
      setState((s) => ({ ...s, status: "connecting", isAutoConnecting: isAutoConnect, error: null }));
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

        // Persist auto-connect flag
        localStorage.setItem(AUTO_CONNECT_KEY, "true");

        setState({
          status: "connected",
          isAutoConnecting: false,
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
          isAutoConnecting: false,
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
  // Auto-detection and silent reconnect are intentionally NOT run globally —
  // only pages that require wallet interaction (/create, /poll/[id]) trigger
  // those flows by calling triggerAutoConnect() from WalletAutoConnect.
  useEffect(() => {
    if (typeof window === "undefined") return;
    setState((s) => ({ ...s, status: "disconnected" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * triggerAutoConnect — called by WalletAutoConnect on wallet-required pages.
   *
   * Runs the full 1am.xyz detection polling loop (up to 5 s) and silently
   * reconnects if the user previously authorized this site. On pages that don't
   * call this, the wallet stays in "disconnected" and no polling ever starts.
   */
  const triggerAutoConnect = useCallback(async () => {
    if (typeof window === "undefined") return;
    const walletApi = await detectWallet();
    if (!walletApi) {
      setState((s) => ({ ...s, status: "not_detected" }));
      return;
    }
    const shouldAutoConnect = localStorage.getItem(AUTO_CONNECT_KEY) === "true";
    if (shouldAutoConnect) {
      await connectInternal(walletApi, true);
    } else {
      setState((s) => ({ ...s, status: "disconnected" }));
    }
  }, [connectInternal]);

  // connect — triggered by user interaction (works on all pages)
  const connect = useCallback(async () => {
    if (typeof window === "undefined") return;
    const walletApi = await detectWallet();
    if (!walletApi) {
      setState((s) => ({ ...s, status: "not_detected" }));
      return;
    }
    await connectInternal(walletApi);
  }, [connectInternal]);

  // disconnect
  const disconnect = useCallback(() => {
    localStorage.removeItem(AUTO_CONNECT_KEY);
    setState({
      status: "disconnected",
      isAutoConnecting: false,
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
    triggerAutoConnect,
    isDetected: state.status !== "not_detected" && state.status !== "idle",
  };
}
