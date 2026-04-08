"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useVerifyProof } from "@/lib/queries/use-verify-proof";
import { useMetadata } from "@/lib/queries/use-metadata";
import { useWalletContext } from "@/lib/midnight/wallet-context";
import { Spinner } from "@/components/ui/spinner";

function VerifyContent() {
  const searchParams = useSearchParams();
  const pollId = searchParams.get("pollId") ?? "";
  const nullifier = searchParams.get("nullifier") ?? "";

  const { connect } = useWalletContext();
  const { isValid, isLoading, isError, error, needsWallet, refetch } = useVerifyProof(pollId, nullifier);
  const { data: metadataResponse } = useMetadata(pollId);

  // Missing params
  if (!pollId || !nullifier) {
    return (
      <div className="text-center py-20 max-w-md mx-auto">
        <span className="material-symbols-outlined text-error text-5xl mb-4 block">link_off</span>
        <h2 className="text-2xl font-headline font-bold text-on-surface mb-3">
          Invalid Verification Link
        </h2>
        <p className="text-on-surface-variant mb-8">
          This link is missing a poll ID or proof ID. Make sure you copied the full link.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-surface-container-high text-on-surface px-6 py-3 rounded-full font-semibold hover:bg-surface-container-highest transition-all"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Back to Polls
        </Link>
      </div>
    );
  }

  // Needs wallet
  if (needsWallet) {
    return (
      <div className="text-center py-20 max-w-md mx-auto">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-primary text-4xl">wallet</span>
        </div>
        <h2 className="text-2xl font-headline font-bold text-on-surface mb-3">
          Connect Wallet to Verify
        </h2>
        <p className="text-on-surface-variant mb-8">
          Verifying a participation proof requires reading from the Midnight blockchain.
          Connect your 1am.xyz wallet to proceed.
        </p>
        <button
          type="button"
          onClick={connect}
          className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-8 py-4 rounded-full font-bold text-lg flex items-center justify-center gap-3 mx-auto active:scale-95 transition-all shadow-lg"
        >
          <span className="material-symbols-outlined">wallet</span>
          Connect Wallet
        </button>
      </div>
    );
  }

  // Loading
  if (isLoading) {
    return (
      <div className="text-center py-20 max-w-md mx-auto">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Spinner size="lg" className="border-primary/30 border-t-primary" />
        </div>
        <p className="text-on-surface-variant text-lg">Verifying on Midnight blockchain...</p>
      </div>
    );
  }

  // Error
  if (isError) {
    return (
      <div className="text-center py-20 max-w-md mx-auto">
        <span className="material-symbols-outlined text-error text-5xl mb-4 block">error</span>
        <h2 className="text-2xl font-headline font-bold text-on-surface mb-3">
          Verification Failed
        </h2>
        <p className="text-on-surface-variant mb-8">
          {error?.message ?? "Unable to connect to the Midnight indexer."}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="bg-surface-container-high text-on-surface px-6 py-3 rounded-full font-semibold hover:bg-surface-container-highest transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  const pollTitle = metadataResponse?.metadata?.title ?? "Unknown Poll";

  // Verified
  if (isValid === true) {
    return (
      <div className="max-w-lg mx-auto py-10 space-y-8">
        {/* Status badge */}
        <div className="text-center">
          <div className="w-24 h-24 rounded-full bg-tertiary/10 flex items-center justify-center mx-auto mb-6 ring-2 ring-tertiary/30">
            <span className="material-symbols-outlined text-tertiary text-5xl">verified_user</span>
          </div>
          <h1 className="text-3xl font-headline font-extrabold text-on-surface mb-2">
            Participation Verified
          </h1>
          <p className="text-on-surface-variant">
            This proof is valid and recorded on the Midnight blockchain.
          </p>
        </div>

        {/* Proof details card */}
        <div className="bg-surface-container-low rounded-xl p-6 ring-1 ring-tertiary/20 space-y-4">
          <div className="flex justify-between items-start gap-4">
            <div className="text-sm text-on-surface-variant">Poll</div>
            <div className="text-sm font-semibold text-on-surface text-right break-words max-w-xs">
              {pollTitle}
            </div>
          </div>
          <div className="border-t border-outline-variant/10" />
          <div className="flex justify-between items-start gap-4">
            <div className="text-sm text-on-surface-variant">Poll ID</div>
            <div className="text-xs font-mono text-outline break-all">{pollId.slice(0, 16)}...</div>
          </div>
          <div className="border-t border-outline-variant/10" />
          <div className="flex justify-between items-start gap-4">
            <div className="text-sm text-on-surface-variant">Proof ID</div>
            <div className="text-xs font-mono text-outline break-all">{nullifier.slice(0, 16)}...</div>
          </div>
          <div className="border-t border-outline-variant/10" />
          <div className="flex justify-between items-start gap-4">
            <div className="text-sm text-on-surface-variant">Status</div>
            <div className="flex items-center gap-1.5 text-tertiary font-semibold text-sm">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              On-chain confirmed
            </div>
          </div>
        </div>

        {/* Privacy note */}
        <p className="text-xs text-on-surface-variant text-center italic">
          This proof confirms participation without revealing the voter&apos;s identity or chosen option.
        </p>

        <div className="text-center">
          <Link href={`/poll/${pollId}`} className="text-primary text-sm hover:underline">
            View Poll →
          </Link>
        </div>
      </div>
    );
  }

  // Invalid
  return (
    <div className="text-center py-20 max-w-md mx-auto">
      <div className="w-24 h-24 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-6">
        <span className="material-symbols-outlined text-error text-5xl">gpp_bad</span>
      </div>
      <h1 className="text-3xl font-headline font-extrabold text-on-surface mb-3">
        Invalid Proof
      </h1>
      <p className="text-on-surface-variant mb-4">
        This nullifier was not found in the on-chain vote records for this poll.
      </p>
      <p className="text-xs text-on-surface-variant mb-8">
        Poll: <span className="font-mono text-outline">{pollId.slice(0, 12)}...</span>
        {" "}· Nullifier: <span className="font-mono text-outline">{nullifier.slice(0, 12)}...</span>
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 bg-surface-container-high text-on-surface px-6 py-3 rounded-full font-semibold hover:bg-surface-container-highest transition-all"
      >
        <span className="material-symbols-outlined">arrow_back</span>
        Back to Polls
      </Link>
    </div>
  );
}

/** /verify page — third-party participation proof verification. Implements ZKPR-02. */
export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="text-center py-20">
        <Spinner size="lg" className="border-primary/30 border-t-primary mx-auto" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
