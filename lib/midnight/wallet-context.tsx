import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useWallet } from "./use-wallet";
import type { WalletContextValue } from "./types";

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const wallet = useWallet();
  return (
    <WalletContext.Provider value={wallet}>{children}</WalletContext.Provider>
  );
}

export function useWalletContext(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWalletContext must be used within a WalletProvider");
  }
  return ctx;
}

/**
 * Drop this component inside any page or layout that requires wallet access.
 *
 * It triggers the 1am.xyz detection polling loop and silently reconnects the
 * wallet if the user previously authorized the site — but only on the pages
 * that render this component (/create and /poll/[id]).
 *
 * All other pages skip detection entirely, so the 5-second polling loop never
 * runs on the home page, /stats, /verify, /community, /about, etc.
 *
 * Example usage (inside a page component or route layout):
 *
 *   import { WalletAutoConnect } from "@/lib/midnight/wallet-context";
 *
 *   export default function CreatePollPage() {
 *     return (
 *       <>
 *         <WalletAutoConnect />
 *         ...page content...
 *       </>
 *     );
 *   }
 */
export function WalletAutoConnect() {
  const { status, triggerAutoConnect } = useWalletContext();

  useEffect(() => {
    // Only trigger when we're in the initial "disconnected" state set by useWallet.
    // This prevents re-running if the user has already connected or is connecting.
    if (status !== "disconnected" && status !== "idle") return;
    triggerAutoConnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Renders nothing — side-effect only.
  return null;
}
