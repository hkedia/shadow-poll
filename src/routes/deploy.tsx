import { useState } from "react";
import { useWalletContext } from "@/lib/midnight/wallet-context";
import {
  deployPollContract,
  getContractAddress,
} from "@/lib/midnight/contract-service";
import {
  getSecretKeyFromWallet,
  getCurrentBlockNumber,
} from "@/lib/midnight/witness-impl";

type DeployStatus =
  | { phase: "idle" }
  | { phase: "proving"; message: string }
  | { phase: "done"; address: string; txHash: string }
  | { phase: "error"; message: string };

export default function DeployPage() {
  const { status, providers } = useWalletContext();
  const [deployStatus, setDeployStatus] = useState<DeployStatus>({ phase: "idle" });
  const [copied, setCopied] = useState(false);

  const existingAddress = getContractAddress();
  const isConnected = status === "connected" && providers !== null;

  async function handleDeploy() {
    if (!providers) return;

    setDeployStatus({ phase: "proving", message: "Getting secret key from wallet..." });

    try {
      const secretKey = await getSecretKeyFromWallet(providers.walletProvider);
      setDeployStatus({ phase: "proving", message: "Fetching current block number..." });

      const blockNumber = await getCurrentBlockNumber(
        providers.indexerConfig.indexerUri,
      );
      setDeployStatus({
        phase: "proving",
        message:
          "Deploying contract — proving ZK circuits via ProofStation. This takes 30-120 seconds...",
      });

      const deployed = await deployPollContract(providers, secretKey, blockNumber);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const contractAddress = (deployed as any).deployTxData?.public?.contractAddress
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ?? (deployed as any).contractAddress
        ?? "unknown";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const txHash = (deployed as any).deployTxData?.public?.txHash ?? "";

      setDeployStatus({ phase: "done", address: contractAddress, txHash });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setDeployStatus({ phase: "error", message });
    }
  }

  async function copyAddress(address: string) {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-2xl mx-auto w-full py-8">
      {/* Header */}
      <div className="mb-10">
        <h1 className="font-headline text-3xl sm:text-4xl font-extrabold tracking-tight mb-3 text-on-surface">
          Deploy{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-tertiary">
            Contract
          </span>
        </h1>
        <p className="text-on-surface-variant font-body text-sm sm:text-base">
          One-time setup. Deploys the Poll Manager smart contract to Midnight Preview
          network. Requires the 1am.xyz wallet to prove and submit the transaction.
        </p>
      </div>

      {/* Existing contract warning */}
      {existingAddress && (
        <div
          className="mb-6 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4"
          role="alert"
        >
          <p className="text-sm font-medium text-yellow-300 mb-1">
            Contract already configured
          </p>
          <p className="text-xs text-yellow-200/70 font-mono break-all">
            {existingAddress}
          </p>
          <p className="text-xs text-yellow-200/50 mt-2">
            Deploying again will create a separate contract instance. Only do this if
            you want to start fresh.
          </p>
        </div>
      )}

      {/* Main card */}
      <div className="rounded-2xl border border-surface-variant/30 bg-surface p-6 space-y-6">

        {/* Wallet status */}
        <div className="flex items-center gap-3">
          <span
            className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${
              isConnected ? "bg-green-400" : "bg-surface-variant"
            }`}
          />
          <span className="text-sm text-on-surface-variant">
            {isConnected
              ? "Wallet connected — ready to deploy"
              : status === "connecting"
                ? "Connecting wallet..."
                : "Connect the 1am.xyz wallet first"}
          </span>
        </div>

        {/* Step list */}
        <ol className="space-y-3 text-sm text-on-surface-variant list-none">
          {[
            "ZK proofs for all 4 circuits are generated via ProofStation (~30-120s each)",
            "Transaction is balanced (ProofStation sponsors dust fees — 0 NIGHT cost to you)",
            "Contract is submitted to Midnight Preview chain",
            "Contract address is displayed — copy it to VITE_POLL_CONTRACT_ADDRESS",
          ].map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>

        {/* Deploy button */}
        {deployStatus.phase === "idle" && (
          <button
            onClick={handleDeploy}
            disabled={!isConnected}
            className="w-full rounded-xl bg-gradient-to-r from-primary to-tertiary px-6 py-3 font-headline font-bold text-sm text-background transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
          >
            Deploy Poll Manager Contract
          </button>
        )}

        {/* Proving state */}
        {deployStatus.phase === "proving" && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-on-surface-variant">
              <svg
                className="animate-spin h-4 w-4 flex-shrink-0 text-primary"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <span>{deployStatus.message}</span>
            </div>
            <p className="text-xs text-on-surface-variant/50">
              Do not close this tab. ZK proof generation takes 1-3 minutes total.
            </p>
          </div>
        )}

        {/* Success state */}
        {deployStatus.phase === "done" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
              <span className="material-symbols-outlined text-base">check_circle</span>
              Contract deployed successfully
            </div>

            <div className="rounded-xl bg-background/60 border border-surface-variant/30 p-4 space-y-3">
              <div>
                <p className="text-xs text-on-surface-variant/60 mb-1 font-medium uppercase tracking-wider">
                  Contract Address
                </p>
                <p className="font-mono text-sm text-on-surface break-all">
                  {deployStatus.address}
                </p>
              </div>
              {deployStatus.txHash && (
                <div>
                  <p className="text-xs text-on-surface-variant/60 mb-1 font-medium uppercase tracking-wider">
                    Tx Hash
                  </p>
                  <p className="font-mono text-xs text-on-surface-variant break-all">
                    {deployStatus.txHash}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => copyAddress(deployStatus.address)}
              className="w-full rounded-xl border border-primary/40 px-6 py-3 font-headline font-bold text-sm text-primary transition-colors hover:bg-primary/10"
            >
              {copied ? "Copied!" : "Copy Contract Address"}
            </button>

            <div className="rounded-xl border border-surface-variant/30 bg-background/40 p-4 text-xs text-on-surface-variant space-y-2">
              <p className="font-medium text-on-surface">Next steps:</p>
              <p>
                1. Add this to{" "}
                <code className="text-primary bg-primary/10 px-1 rounded">.env.local</code>:
              </p>
              <code className="block font-mono bg-background rounded-lg px-3 py-2 text-on-surface break-all">
                VITE_POLL_CONTRACT_ADDRESS={deployStatus.address}
              </code>
              <p>2. Restart the dev server: <code className="text-primary bg-primary/10 px-1 rounded">bun run dev</code></p>
              <p>3. For production: add to Environment Variables and redeploy.</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {deployStatus.phase === "error" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-red-400 text-sm font-medium">
              <span className="material-symbols-outlined text-base">error</span>
              Deployment failed
            </div>
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4">
              <p className="text-xs font-mono text-red-300 break-all whitespace-pre-wrap">
                {deployStatus.message}
              </p>
            </div>
            <button
              onClick={() => setDeployStatus({ phase: "idle" })}
              className="w-full rounded-xl border border-surface-variant/30 px-6 py-3 font-headline font-bold text-sm text-on-surface-variant transition-colors hover:bg-surface-variant/20"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Footer note */}
      <p className="mt-6 text-xs text-on-surface-variant/40 text-center">
        This page is for admin use only. Remove or protect it before sharing the app publicly.
      </p>
    </div>
  );
}
