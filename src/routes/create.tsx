import { CreatePollForm } from "@/components/create-poll-form";
import { WalletOnboarding } from "@/components/wallet-onboarding";

export default function CreatePollPage() {
  return (
    <div className="max-w-4xl mx-auto w-full">
      {/* Show the blocking wallet onboarding modal on this page */}
      <WalletOnboarding requiresWallet />
      <WalletOnboarding requiresWallet />
      {/* Hero header */}
      <div className="pt-8 md:pt-12 mb-12 text-left md:text-center md:max-w-2xl md:mx-auto">
        <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-4 text-on-surface text-balance">
          Forge Your{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-tertiary">
            Voice
          </span>
        </h1>
        <p className="text-on-surface-variant font-body text-base sm:text-lg">
          Create secure, anonymous polls that prioritize privacy without sacrificing
          engagement. Simple enough for anyone, secure enough for everyone.
        </p>
      </div>
      <CreatePollForm />
    </div>
  );
}
