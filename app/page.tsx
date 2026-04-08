"use client";

import { useWalletContext } from "@/lib/midnight/wallet-context";
import { HeroSection } from "@/components/hero-section";
import { InstallPrompt } from "@/components/install-prompt";

export default function HomePage() {
  const { status } = useWalletContext();

  // When 1am.xyz is not installed, show the full-page install prompt (WALL-06)
  if (status === "not_detected") {
    return <InstallPrompt />;
  }

  return <HeroSection />;
}
