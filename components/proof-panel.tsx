import { useState } from "react";
import { useParticipationProof } from "@/lib/queries/use-participation-proof";
import { generateProofBadgeSvg } from "@/lib/midnight/proof-badge";
import { Spinner } from "@/components/ui/spinner";

interface ProofPanelProps {
  pollId: string;
  pollTitle: string;
}

/**
 * Proof sharing panel for poll participants.
 *
 * Shown on the Poll Detail page after voting. Derives and verifies the user's
 * participation proof against on-chain state, then offers a share URL and
 * a downloadable SVG badge.
 *
 * Implements: ZKPR-01 (proof generation), ZKPR-03 (sharing via link + badge)
 */
export function ProofPanel({ pollId, pollTitle }: ProofPanelProps) {
  const { hasVoted, nullifier, proofUrl, isLoading, isError } = useParticipationProof(pollId);
  const [copied, setCopied] = useState(false);

  function handleCopyLink() {
    if (!proofUrl) return;
    navigator.clipboard.writeText(proofUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleDownloadBadge() {
    if (!proofUrl || !nullifier) return;
    const svgString = generateProofBadgeSvg({
      pollId,
      nullifier,
      pollTitle,
      verifyUrl: proofUrl,
    });
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shadow-poll-proof-${pollId.slice(0, 8)}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-surface-container-low rounded-xl p-6 ring-1 ring-primary/20 flex items-center gap-3 text-on-surface-variant text-sm">
        <Spinner size="sm" className="border-primary/30 border-t-primary" />
        Checking participation proof...
      </div>
    );
  }

  // Error state — fail silently (proof is optional UX, not critical)
  if (isError) return null;

  // Not voted — show a gentle prompt
  if (!hasVoted) {
    return (
      <div className="bg-surface-container-low rounded-xl p-6 ring-1 ring-outline-variant/10">
        <div className="flex items-center gap-3 text-on-surface-variant text-sm">
          <span className="material-symbols-outlined text-lg text-outline">shield_person</span>
          <span>Vote on this poll to generate a participation proof.</span>
        </div>
      </div>
    );
  }

  // Voted — render proof sharing UI
  return (
    <div className="bg-surface-container-low rounded-xl p-6 ring-1 ring-primary/20 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-primary text-xl">shield_person</span>
        </div>
        <div>
          <h4 className="font-headline font-bold text-primary text-base">
            Participation Verified
          </h4>
          <p className="text-xs text-on-surface-variant">
            Your vote is recorded on-chain. Share your proof anonymously.
          </p>
        </div>
      </div>

      {/* Proof URL display */}
      <div className="bg-surface-container-highest rounded-lg px-4 py-3 font-mono text-xs text-on-surface-variant break-all select-all">
        {proofUrl}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleCopyLink}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-primary/40 text-primary text-sm font-semibold hover:bg-primary/10 transition-all"
        >
          <span className="material-symbols-outlined text-base">
            {copied ? "check_circle" : "content_copy"}
          </span>
          {copied ? "Copied!" : "Copy Link"}
        </button>

        <button
          type="button"
          onClick={handleDownloadBadge}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-primary/40 text-primary text-sm font-semibold hover:bg-primary/10 transition-all"
        >
          <span className="material-symbols-outlined text-base">download</span>
          Download Badge
        </button>
      </div>

      {/* Nullifier info */}
      <p className="text-xs text-on-surface-variant italic">
        Proof ID: <span className="font-mono text-outline">{nullifier?.slice(0, 16)}...</span>
        {" "}— This identifier proves participation without revealing your vote.
      </p>
    </div>
  );
}
