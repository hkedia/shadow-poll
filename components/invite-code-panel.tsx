import { useState } from "react";
import { formatCodesForCopy, formatCodesForCSV } from "@/lib/midnight/invite-codes";
import type { InviteCode } from "@/lib/midnight/invite-codes";

interface InviteCodePanelProps {
  codes: InviteCode[];
  pollId: string;
  pollTitle: string;
  onDone: () => void;
}

/**
 * Displays generated invite codes after an invite-only poll creation.
 * Provides Copy All, Download CSV, and single-code copy functionality.
 * Warning: codes are stored in localStorage only — cannot be recovered after clearing.
 */
export function InviteCodePanel({ codes, pollId, pollTitle, onDone }: InviteCodePanelProps) {
  const [copied, setCopied] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  async function handleCopyAll() {
    const text = formatCodesForCopy(codes);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDownloadCSV() {
    const csv = formatCodesForCSV(codes, pollTitle);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shadow-poll-${pollId.slice(0, 8)}-codes.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleCopySingle(code: string, index: number) {
    await navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  }

  return (
    <div className="space-y-8">
      {/* Success header */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-tertiary/10 flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-tertiary text-4xl">check_circle</span>
        </div>
        <h2 className="text-3xl font-headline font-extrabold text-on-surface">
          Poll Created Successfully!
        </h2>
        <p className="text-on-surface-variant max-w-md mx-auto">
          Share these invite codes with your voters. Each code allows one person to cast an anonymous vote.
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex justify-center gap-4">
        <button
          type="button"
          onClick={handleCopyAll}
          className="bg-surface-container-high text-on-surface px-6 py-3 rounded-full font-semibold flex items-center gap-2 hover:bg-surface-container-highest transition-all"
        >
          <span className="material-symbols-outlined text-base">content_copy</span>
          {copied ? "Copied!" : "Copy All"}
        </button>
        <button
          type="button"
          onClick={handleDownloadCSV}
          className="bg-surface-container-high text-tertiary px-6 py-3 rounded-full font-semibold flex items-center gap-2 hover:bg-surface-container-highest transition-all"
        >
          <span className="material-symbols-outlined text-base">download</span>
          Download CSV
        </button>
      </div>

      {/* Code grid */}
      <div className="bg-surface-container-low rounded-xl p-6 max-h-96 overflow-y-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {codes.map((code, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleCopySingle(code.code, i)}
              className="bg-surface-container-highest rounded-lg px-4 py-3 font-mono text-sm text-on-surface text-center tracking-wider cursor-pointer hover:bg-surface-container-high transition-colors"
              title="Click to copy"
            >
              {copiedIndex === i ? (
                <span className="text-tertiary">Copied!</span>
              ) : (
                code.code
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Warning */}
      <div className="bg-error/10 rounded-lg p-4 flex gap-3 items-start">
        <span className="material-symbols-outlined text-error shrink-0">warning</span>
        <p className="text-sm text-error/90">
          Save these codes now! They cannot be recovered later. Each code can only be used once.
        </p>
      </div>

      {/* Navigate to poll button */}
      <div className="text-center">
        <button
          type="button"
          onClick={onDone}
          className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-10 py-4 rounded-full font-bold text-lg inline-flex items-center gap-3 active:scale-95 duration-200 shadow-2xl shadow-primary/30 hover:shadow-[0px_12px_48px_rgba(176,170,255,0.4)] transition-all"
        >
          <span>View Your Poll</span>
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
