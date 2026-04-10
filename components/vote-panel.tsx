import { useState } from "react";
import { useVoteMutation } from "@/lib/queries/use-vote-mutation";
import { useInviteVoteMutation } from "@/lib/queries/use-invite-vote-mutation";
import { useWalletContext } from "@/lib/midnight/wallet-context";
import { Spinner } from "@/components/ui/spinner";

interface VotePanelProps {
  options: string[];
  pollId: string;
  isExpired: boolean;
  isConnected: boolean;
  pollType: "public" | "invite_only";
}

/**
 * Radio option selection and vote button for poll detail page.
 * Reference: .design/view_poll/code.html — radio options section.
 */
export function VotePanel({ options, pollId, isExpired, isConnected, pollType }: VotePanelProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState("");
  const voteMutation = useVoteMutation();
  const inviteVoteMutation = useInviteVoteMutation();
  const { connect } = useWalletContext();

  const activeMutation = pollType === "invite_only" ? inviteVoteMutation : voteMutation;

  function handleVote() {
    if (selectedOption === null || isExpired || !isConnected) return;

    setSuccessMessage(null);

    if (pollType === "invite_only") {
      if (!inviteCode.trim()) return;
      inviteVoteMutation.mutate(
        { pollId, optionIndex: selectedOption, inviteCode: inviteCode.trim() },
        {
          onSuccess: () => {
            setSuccessMessage("Your anonymous vote has been cast!");
            setSelectedOption(null);
            setInviteCode("");
          },
        },
      );
    } else {
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
  }

  const isVoteDisabled =
    selectedOption === null
    || (pollType === "invite_only" && !inviteCode.trim())
    || activeMutation.isPending;

  return (
    <div className="space-y-4">
      {/* Invite code input — shown only for invite-only polls */}
      {pollType === "invite_only" && (
        <div className="bg-surface-container-low rounded-xl p-6 ring-1 ring-tertiary/20 space-y-3">
          <div className="flex items-center gap-2 text-tertiary font-semibold text-sm">
            <span className="material-symbols-outlined text-lg">vpn_key</span>
            Enter Your Invite Code
          </div>
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            placeholder="e.g., A3K9F2X7B1"
            maxLength={20}
            className="w-full bg-surface-container-highest border-none rounded-xl px-5 py-4 font-mono text-lg text-on-surface tracking-wider placeholder:text-outline focus:ring-1 focus:ring-tertiary/30 transition-all uppercase"
            disabled={isExpired}
          />
          <p className="text-xs text-on-surface-variant">
            Your code will be verified via zero-knowledge proof. No one can see which code you used.
          </p>
        </div>
      )}

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
          <span className="text-lg sm:text-xl font-semibold text-on-surface break-words">
            {option}
          </span>
        </label>
      ))}

      {/* Vote action area */}
      <div className="pt-4">
        {isExpired ? (
          <div className="flex items-center gap-3 text-on-surface-variant font-bold">
            <span className="material-symbols-outlined">lock</span>
            <span>Voting has ended for this poll</span>
          </div>
        ) : !isConnected ? (
          <div className="space-y-3">
            <p className="text-on-surface-variant">Connect your wallet to vote</p>
            <button
              type="button"
              onClick={connect}
              className="w-full sm:w-auto bg-gradient-to-br from-primary to-primary-container text-on-primary px-8 py-4 rounded-full font-bold text-lg flex items-center justify-center gap-3 active:scale-95 duration-200 shadow-lg"
            >
              <span className="material-symbols-outlined">wallet</span>
              Connect Wallet
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleVote}
            disabled={isVoteDisabled}
            className="w-full sm:w-auto bg-gradient-to-br from-primary to-primary-container text-on-primary px-10 py-5 rounded-full font-bold text-lg flex items-center justify-center gap-3 active:scale-95 duration-200 shadow-2xl shadow-primary/30 disabled:opacity-50 disabled:pointer-events-none transition-all"
          >
            {activeMutation.isPending ? (
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
        {activeMutation.isError && (() => {
          const msg = activeMutation.error?.message ?? "";
          let friendly: string;
          let isInfo = false;

          if (msg.includes("Already voted")) {
            friendly = "You have already voted on this poll.";
            isInfo = true;
          } else if (msg.includes("Invite code already used")) {
            friendly = "This invite code has already been used. Each code can only be used once.";
            isInfo = true;
          } else if (msg.includes("Invalid invite code")) {
            friendly = "This invite code is not valid for this poll.";
            isInfo = true;
          } else if (msg.includes("Poll has expired")) {
            friendly = "This poll has expired and no longer accepts votes.";
            isInfo = true;
          } else if (msg.includes("Poll not found")) {
            friendly = "This poll could not be found. It may have been removed.";
            isInfo = true;
          } else if (msg.includes("Invalid option index")) {
            friendly = "Invalid vote option. Please refresh the page and try again.";
            isInfo = false;
          } else if (msg.includes("Use cast_vote for public polls") || msg.includes("Use cast_invite_vote for invite-only polls")) {
            friendly = "Wrong vote method for this poll type. Please refresh the page and try again.";
            isInfo = false;
          } else if (msg.includes("Transaction submission error") || msg.includes("Operation failed")) {
            friendly = "Transaction failed to submit. Please try again — your wallet may need to be reconnected.";
            isInfo = false;
          } else {
            friendly = "Failed to cast vote. Please try again.";
            isInfo = false;
          }
          return (
            <p className="mt-4 text-error text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-base">{isInfo ? "info" : "error"}</span>
              {friendly}
            </p>
          );
        })()}

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
