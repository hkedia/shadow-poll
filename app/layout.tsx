import type { Metadata } from "next";
import { Geist_Mono, Manrope, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { WalletProvider } from "@/lib/midnight/wallet-context";
import { WalletButton } from "@/components/wallet-button";
import { WalletOnboarding } from "@/components/wallet-onboarding";
import { QueryProvider } from "@/lib/queries/query-provider";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Shadow Poll",
  description:
    "Create secure, anonymous polls that prioritize privacy without sacrificing engagement.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${plusJakartaSans.variable} ${geistMono.variable} dark antialiased overflow-x-hidden`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden">
        <WalletProvider>
          <QueryProvider>
            <Header walletSlot={<WalletButton />} />
            <WalletOnboarding />
            <main className="flex-1 flex flex-col w-full pt-20 pb-8 md:pb-12 px-4 sm:px-6 md:px-8">
              <div className="max-w-7xl mx-auto w-full flex-1">{children}</div>
            </main>
            <Footer />
          </QueryProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
