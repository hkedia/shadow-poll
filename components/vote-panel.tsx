"use client";

import { useState } from "react";
import { useVoteMutation } from "@/lib/queries/use-vote-mutation";
import { useWalletContext } from "@/lib/midnight/wallet-context";
import { Spinner } from "@/components/ui/spinner";

interface VotePanelProps {
  options: string[];
  pollId: string;
  isExpired: boolean;
  isConnected: boolean;
}

/**
 * Radio option selection and vote button for poll detail page.
 * Reference: .design/view_poll/code.html — radio options section.
 */
export function VotePanel({ options, pollId, isExpired, isConnected }: VotePanelProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const voteMutation = useVoteMutation();
  const { connect } = useWalletContext();

  function handleVote() {
    if (selectedOption === null || isExpired || !isConnected) return;

    setSuccessMessage(null);
    voteMutation.mutate(
      { pollId, optionIndex: selectedOption },
      {
        onSuccess: () => {
          setSuccessMessage("Your anonymous vote has been cast!");
          setSelectedOption(null);
        },
      },
    );
  }

  return (
    <div className="space-y-4">
      {/* Radio options */}
      {options.map((option, index) => (
        <label
          key={index}
          className={`group relative flex items-center p-6 rounded-xl cursor-pointer transition-all duration-300 ring-1 ${
            selectedOption === index
              ? "bg-surface-container-highest ring-primary/30"
              : "bg-surface-container-high hover:bg-surface-container-highest ring-outline-variant/10 hover:ring-primary/20"
          } ${isExpired ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          <input
            type="radio"
            name="poll-option"
            className="hidden"
            checked={selectedOption === index}
            onChange={() => {
              if (!isExpired) setSelectedOption(index);
            }}
            disabled={isExpired}
          />
          {/* Custom radio circle */}
          <div
            className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center mr-6 shrink-0 ${
              selectedOption === index
                ? "border-primary bg-primary"
                : "border-outline-variant"
            }`}
          >
            {selectedOption === index && (
              <div className="w-2 h-2 rounded-full bg-on-primary" />
            )}
          </div>
          <span className="text-xl font-semibold text-on-surface">{option}</span>
        </label>
      ))}

      {/* Vote action area */}
      <div className="pt-4">
        {isExpired ? (
          <div className="flex items-center gap-3 text-error font-bold">
            <span className="material-symbols-outlined">timer_off</span>
            <span>This poll has expired</span>
          </div>
        ) : !isConnected ? (
          <div className="space-y-3">
            <p className="text-on-surface-variant">Connect your wallet to vote</p>
            <button
              type="button"
              onClick={connect}
              className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-8 py-4 rounded-full font-bold text-lg flex items-center gap-3 active:scale-95 duration-200 shadow-lg"
            >
              <span className="material-symbols-outlined">wallet</span>
              Connect Wallet
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleVote}
            disabled={selectedOption === null || voteMutation.isPending}
            className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-10 py-5 rounded-full font-bold text-lg flex items-center gap-3 active:scale-95 duration-200 shadow-2xl shadow-primary/30 disabled:opacity-50 disabled:pointer-events-none transition-all"
          >
            {voteMutation.isPending ? (
              <>
                <Spinner size="sm" className="border-on-primary/30 border-t-on-primary" />
                Casting Vote...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">shield_person</span>
                Anonymous Vote
              </>
            )}
          </button>
        )}

        {/* Success message */}
        {successMessage && (
          <div className="mt-4 flex items-center gap-2 text-tertiary font-semibold">
            <span className="material-symbols-outlined">check_circle</span>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error message */}
        {voteMutation.isError && (
          <p className="mt-4 text-error text-sm">
            {voteMutation.error?.message ?? "Failed to cast vote"}
          </p>
        )}

        {!isExpired && isConnected && (
          <p className="mt-4 text-sm text-on-surface-variant italic">
            Voting requires a Midnight wallet connection. Your vote is anonymous and
            cryptographically verified.
          </p>
        )}
      </div>
    </div>
  );
}
