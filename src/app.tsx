import { Routes, Route } from "react-router";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { WalletProvider } from "@/lib/midnight/wallet-context";
import { WalletButton } from "@/components/wallet-button";
import { WalletOnboarding } from "@/components/wallet-onboarding";
import { QueryProvider } from "@/lib/queries/query-provider";
import { ScrollToTop } from "@/components/scroll-to-top";
import { lazy, Suspense } from "react";

const Home = lazy(() => import("@/src/routes/home"));
const ActivePolls = lazy(() => import("@/src/routes/active-polls"));
const ClosedPolls = lazy(() => import("@/src/routes/closed-polls"));
const Create = lazy(() => import("@/src/routes/create"));
const PollDetail = lazy(() => import("@/src/routes/poll-detail"));
const Verify = lazy(() => import("@/src/routes/verify"));
const About = lazy(() => import("@/src/routes/about"));
const Privacy = lazy(() => import("@/src/routes/privacy"));
const Community = lazy(() => import("@/src/routes/community"));

export function App() {
  return (
    <WalletProvider>
      <QueryProvider>
        <ScrollToTop />
        <WalletOnboarding />
        <div className="flex flex-col min-h-screen">
          <Header walletSlot={<WalletButton />} />
          <main className="flex-1 flex flex-col w-full pt-20 pb-8 md:pb-12 px-4 sm:px-6 md:px-8">
            <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
              <Suspense fallback={<div className="flex-1" />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/active" element={<ActivePolls />} />
                  <Route path="/closed" element={<ClosedPolls />} />
                  <Route path="/create" element={<Create />} />
                  <Route path="/poll/:id" element={<PollDetail />} />
                  <Route path="/verify" element={<Verify />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/community" element={<Community />} />
                </Routes>
              </Suspense>
            </div>
          </main>
          <Footer />
        </div>
      </QueryProvider>
    </WalletProvider>
  );
}
