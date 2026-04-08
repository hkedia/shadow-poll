import type { NextConfig } from "next";

// Packages that are WASM-based or have deep Node.js dependencies and cannot
// be bundled by Turbopack for the client. These are stubbed in the client bundle
// and loaded via dynamic import() at runtime through the stub bypass.
const TURBOPACK_STUBBED_PACKAGES = [
  // WASM runtimes — never run in client bundle
  "@midnight-ntwrk/compact-js",
  "@midnight-ntwrk/ledger-v8",
  "@midnight-ntwrk/compact-runtime",
  "@midnight-ntwrk/onchain-runtime-v3",
  "@midnight-ntwrk/platform-js",
  // SDK JS packages that depend on WASM runtimes
  "@midnight-ntwrk/midnight-js-contracts",
  "@midnight-ntwrk/midnight-js-network-id",
  "@midnight-ntwrk/midnight-js-types",
  "@midnight-ntwrk/midnight-js-utils",
  "@midnight-ntwrk/wallet-sdk-address-format",
  // Browser-compatible packages whose transitive deps (ledger-v8, compact-runtime)
  // are still stubbed — so the packages themselves must also be stubbed
  "@midnight-ntwrk/midnight-js-fetch-zk-config-provider",
  "@midnight-ntwrk/midnight-js-indexer-public-data-provider",
  // Node.js-only transitive deps
  "isomorphic-ws",
  "ws",
];

const nextConfig: NextConfig = {
  serverExternalPackages: TURBOPACK_STUBBED_PACKAGES,
  turbopack: {
    resolveAlias: Object.fromEntries(
      TURBOPACK_STUBBED_PACKAGES.map((pkg) => [pkg, "./lib/midnight-sdk-stub.ts"])
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
