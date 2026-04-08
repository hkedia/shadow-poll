import { Routes, Route } from "react-router";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { WalletProvider } from "@/lib/midnight/wallet-context";
import { WalletButton } from "@/components/wallet-button";
import { QueryProvider } from "@/lib/queries/query-provider";
import { lazy, Suspense } from "react";

const Home = lazy(() => import("@/src/routes/home"));
const Create = lazy(() => import("@/src/routes/create"));
const PollDetail = lazy(() => import("@/src/routes/poll-detail"));
const Stats = lazy(() => import("@/src/routes/stats"));
const Verify = lazy(() => import("@/src/routes/verify"));
const Deploy = lazy(() => import("@/src/routes/deploy"));
const About = lazy(() => import("@/src/routes/about"));
const Privacy = lazy(() => import("@/src/routes/privacy"));
const Community = lazy(() => import("@/src/routes/community"));

export function App() {
  return (
    <WalletProvider>
      <QueryProvider>
        <Header walletSlot={<WalletButton />} />
        <main className="flex-1 flex flex-col w-full pt-20 pb-8 md:pb-12 px-4 sm:px-6 md:px-8">
          <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
            <Suspense fallback={<div className="flex-1" />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/create" element={<Create />} />
                <Route path="/poll/:id" element={<PollDetail />} />
                <Route path="/stats" element={<Stats />} />
                <Route path="/verify" element={<Verify />} />
                <Route path="/deploy" element={<Deploy />} />
                <Route path="/about" element={<About />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/community" element={<Community />} />
              </Routes>
            </Suspense>
          </div>
        </main>
        <Footer />
      </QueryProvider>
    </WalletProvider>
  );
}
