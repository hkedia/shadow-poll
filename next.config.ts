import type { NextConfig } from "next";

const MIDNIGHT_SDK_PACKAGES = [
  "@midnight-ntwrk/compact-js",
  "@midnight-ntwrk/ledger-v8",
  "@midnight-ntwrk/midnight-js-contracts",
  "@midnight-ntwrk/midnight-js-fetch-zk-config-provider",
  "@midnight-ntwrk/midnight-js-indexer-public-data-provider",
  "@midnight-ntwrk/midnight-js-network-id",
  "@midnight-ntwrk/midnight-js-types",
  "@midnight-ntwrk/midnight-js-utils",
  // Transitive dependencies that also fail browser bundling
  "isomorphic-ws",
  "@midnight-ntwrk/wallet-sdk-address-format",
];

const nextConfig: NextConfig = {
  // Required for Midnight SDK WASM packages — Next.js 16 top-level key
  serverExternalPackages: MIDNIGHT_SDK_PACKAGES,
  turbopack: {
    // Alias Midnight SDK packages to a stub on the client.
    // They are loaded via dynamic import() at runtime (after user clicks Connect),
    // never bundled into the initial client JS.
    resolveAlias: Object.fromEntries(
      MIDNIGHT_SDK_PACKAGES.map((pkg) => [
        pkg,
        "./lib/midnight-sdk-stub.ts",
      ])
    ),
  },
};

export default nextConfig;
