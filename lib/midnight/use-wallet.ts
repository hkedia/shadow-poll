"use client";

import { useState, useEffect, useCallback } from "react";
import type { WalletState } from "./types";
import { assembleProviders } from "./providers";

const AUTO_CONNECT_KEY = "shadowpoll:autoconnect";

function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    status: "idle",
    address: null,
    truncatedAddress: null,
    providers: null,
    error: null,
  });

  const getWalletApi = useCallback(() => {
    if (typeof window === "undefined") return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (window as any)?.midnight?.["1am"] ?? null;
  }, []);

  const connectInternal = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (api: any) => {
      setState((s) => ({ ...s, status: "connecting", error: null }));
      try {
        // Enable wallet (triggers user approval in extension)
        await api.enable();

        // Get wallet address
        const accounts = await api.getAccounts();
        const address: string =
          accounts?.[0]?.address ??
          accounts?.[0] ??
          "";

        if (!address) {
          throw new Error("No account address returned from wallet.");
        }

        // Assemble providers (WALL-05)
        const providers = await assembleProviders(api);

        // Persist auto-connect flag (WALL-07)
        localStorage.setItem(AUTO_CONNECT_KEY, "true");

        setState({
          status: "connected",
          address,
          truncatedAddress: truncateAddress(address),
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
          providers: null,
        }));
      }
    },
    []
  );

  // Detect wallet on mount and handle auto-reconnect (WALL-01, WALL-07)
  useEffect(() => {
    const detect = async () => {
      const api = getWalletApi();
      if (!api) {
        setState((s) => ({ ...s, status: "not_detected" }));
        return;
      }
      // Wallet extension is present
      const shouldAutoConnect =
        localStorage.getItem(AUTO_CONNECT_KEY) === "true";
      if (shouldAutoConnect) {
        await connectInternal(api);
      } else {
        setState((s) => ({ ...s, status: "disconnected" }));
      }
    };
    detect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // WALL-02: connect
  const connect = useCallback(async () => {
    const api = getWalletApi();
    if (!api) {
      setState((s) => ({ ...s, status: "not_detected" }));
      return;
    }
    await connectInternal(api);
  }, [getWalletApi, connectInternal]);

  // WALL-03: disconnect
  const disconnect = useCallback(() => {
    localStorage.removeItem(AUTO_CONNECT_KEY);
    setState({
      status: "disconnected",
      address: null,
      truncatedAddress: null,
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
