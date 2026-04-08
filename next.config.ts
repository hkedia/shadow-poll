import type { NextConfig } from "next";

// All Midnight SDK packages + transitive deps that cannot be bundled by Turbopack.
// This includes WASM packages, Node.js-only packages (ws, isomorphic-ws),
// and packages that transitively depend on them (wallet-sdk-address-format → ledger-v8).
const MIDNIGHT_EXTERNAL_PACKAGES = [
  // WASM runtimes
  "@midnight-ntwrk/compact-js",
  "@midnight-ntwrk/ledger-v8",
  "@midnight-ntwrk/compact-runtime",
  "@midnight-ntwrk/onchain-runtime-v3",
  "@midnight-ntwrk/platform-js",
  // SDK JS packages (use Node.js APIs or transitively depend on WASM)
  "@midnight-ntwrk/midnight-js-contracts",
  "@midnight-ntwrk/midnight-js-fetch-zk-config-provider",
  "@midnight-ntwrk/midnight-js-indexer-public-data-provider",
  "@midnight-ntwrk/midnight-js-network-id",
  "@midnight-ntwrk/midnight-js-types",
  "@midnight-ntwrk/midnight-js-utils",
  "@midnight-ntwrk/wallet-sdk-address-format",
  // Node.js-only transitive deps
  "isomorphic-ws",
  "ws",
];

const nextConfig: NextConfig = {
  serverExternalPackages: MIDNIGHT_EXTERNAL_PACKAGES,
  turbopack: {
    resolveAlias: Object.fromEntries(
      MIDNIGHT_EXTERNAL_PACKAGES.map((pkg) => [pkg, "./lib/midnight-sdk-stub.ts"])
    ),
  },
  async headers() {
    return [
      {
        source: "/zk-keys/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
