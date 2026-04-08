"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreatePoll } from "@/lib/queries/use-create-poll";
import { validatePollMetadata } from "@/lib/midnight/metadata-store";
import { Spinner } from "@/components/ui/spinner";

/** Approximate blocks per day on Midnight Preview (~20 sec/block). */
const BLOCKS_PER_DAY = BigInt(4320);

/** Duration options for poll expiration. */
const DURATION_OPTIONS = [
  { label: "1 day", days: 1 },
  { label: "3 days", days: 3 },
  { label: "7 days", days: 7 },
  { label: "14 days", days: 14 },
  { label: "30 days", days: 30 },
] as const;

/**
 * Poll creation form component.
 * Handles the full creation flow: validation, on-chain transaction, metadata storage.
 * Reference: .design/create_poll/code.html
 */
export function CreatePollForm() {
  const router = useRouter();
  const createPollMutation = useCreatePoll();

  const [title, setTitle] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [selectedDuration, setSelectedDuration] = useState(7);
  const [validationError, setValidationError] = useState<string | null>(null);

  const isSubmitting = createPollMutation.isPending;

  const canAddOption = options.length < 10;
  const canRemoveOption = options.length > 2;

  function handleOptionChange(index: number, value: string) {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
    setValidationError(null);
  }

  function handleAddOption() {
    if (canAddOption) {
      setOptions([...options, ""]);
    }
  }

  function handleRemoveOption(index: number) {
    if (canRemoveOption) {
      setOptions(options.filter((_, i) => i !== index));
    }
  }

  async function handleSubmit() {
    // Client-side validation (T-04-09 mitigation)
    const trimmedTitle = title.trim();
    const trimmedOptions = options.map((o) => o.trim()).filter(Boolean);

    const error = validatePollMetadata({
      title: trimmedTitle,
      description: "",
      options: trimmedOptions,
    });

    if (error) {
      setValidationError(error);
      return;
    }

    if (trimmedOptions.length < 2) {
      setValidationError("At least 2 non-empty options are required");
      return;
    }

    setValidationError(null);

    createPollMutation.mutate(
      {
        title: trimmedTitle,
        description: "",
        options: trimmedOptions,
        expirationBlocks: BigInt(selectedDuration) * BLOCKS_PER_DAY,
        pollType: "public",
      },
      {
        onSuccess: (result) => {
          router.push(`/poll/${result.pollId}`);
        },
      },
    );
  }

  const isPublishDisabled =
    isSubmitting || title.trim().length === 0 || options.filter((o) => o.trim()).length < 2;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      {/* Left Column: Question and Options */}
      <div className="md:col-span-8 space-y-6">
        {/* Question Card */}
        <div className="bg-surface-container-low rounded-xl p-8">
          <label className="block font-headline font-bold text-primary mb-4 tracking-wide uppercase text-xs">
            Primary Question
          </label>
          <textarea
            className="w-full bg-surface-container-highest border-none rounded-xl p-5 text-xl font-body text-on-surface placeholder:text-outline focus:ring-1 focus:ring-primary/20 transition-all resize-none"
            placeholder="What would you like to ask the world?"
            rows={2}
            maxLength={200}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setValidationError(null);
            }}
          />
          <div className="text-xs text-on-surface-variant mt-2 text-right">
            {title.length}/200
          </div>
        </div>

        {/* Options Card */}
        <div className="bg-surface-container-low rounded-xl p-8">
          <div className="flex justify-between items-center mb-6">
            <label className="font-headline font-bold text-primary tracking-wide uppercase text-xs">
              Poll Options
            </label>
            <span className="text-on-surface-variant text-xs font-medium">
              Add up to 10 options
            </span>
          </div>

          <div className="space-y-4">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex-grow">
                  <input
                    type="text"
                    className="w-full bg-surface-container-highest border-none rounded-xl px-5 py-4 font-body text-on-surface focus:ring-1 focus:ring-primary/20 transition-all"
                    placeholder={`Option ${index + 1}`}
                    maxLength={200}
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                  />
                </div>
                {canRemoveOption && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(index)}
                    className="text-on-surface-variant hover:text-error transition-colors p-2"
                    aria-label={`Remove option ${index + 1}`}
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                )}
              </div>
            ))}

            {/* Add option button */}
            {canAddOption && (
              <button
                type="button"
                onClick={handleAddOption}
                className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-outline-variant/30 rounded-xl text-on-surface-variant font-body hover:bg-surface-container-high hover:border-primary/50 transition-all group"
              >
                <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">
                  add_circle
                </span>
                <span>Add another option</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Settings and Publish */}
      <div className="md:col-span-4 space-y-6">
        {/* Duration Settings Card */}
        <div className="bg-surface-container-low rounded-xl p-8">
          <h3 className="font-headline font-bold text-primary mb-6 tracking-wide uppercase text-xs">
            Poll Duration
          </h3>

          <div className="space-y-3">
            {DURATION_OPTIONS.map((opt) => (
              <button
                key={opt.days}
                type="button"
                onClick={() => setSelectedDuration(opt.days)}
                className={`w-full px-5 py-3 rounded-lg font-semibold text-sm transition-all ${
                  selectedDuration === opt.days
                    ? "bg-surface-container-high text-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* ZK trust info box */}
          <div className="mt-8 p-4 bg-tertiary/10 rounded-lg flex gap-3">
            <span className="material-symbols-outlined text-tertiary text-lg shrink-0">
              shield
            </span>
            <p className="text-[10px] leading-relaxed text-tertiary/90 font-medium">
              Your poll is secured by Zero-Knowledge proofs. Your identity is never
              stored or shared.
            </p>
          </div>
        </div>

        {/* Publish Card */}
        <div className="bg-surface-container-low rounded-xl p-8 relative overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/20 blur-[60px] rounded-full" />

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPublishDisabled}
            className="w-full relative z-10 bg-gradient-to-br from-primary to-primary-container text-on-primary font-headline font-extrabold text-lg py-5 rounded-full shadow-[0px_8px_32px_rgba(176,170,255,0.3)] active:scale-95 hover:shadow-[0px_12px_48px_rgba(176,170,255,0.4)] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isSubmitting ? (
              <>
                <Spinner size="sm" className="border-on-primary/30 border-t-on-primary" />
                Publishing...
              </>
            ) : (
              <>
                <span>Publish Poll</span>
                <span className="material-symbols-outlined">send</span>
              </>
            )}
          </button>

          {/* Validation error */}
          {validationError && (
            <p className="text-error text-sm mt-4 text-center">{validationError}</p>
          )}

          {/* Mutation error */}
          {createPollMutation.isError && (
            <p className="text-error text-sm mt-4 text-center">
              {createPollMutation.error?.message ?? "Failed to create poll"}
            </p>
          )}

          <p className="text-center text-on-surface-variant text-[11px] mt-4 font-body px-4 relative z-10">
            By publishing, you agree to the community guidelines and decentralized terms.
          </p>
        </div>
      </div>
    </div>
  );
}
