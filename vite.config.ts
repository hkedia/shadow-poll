import { defineConfig, createLogger } from "vite";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { nodePolyfills } from "vite-plugin-node-polyfills";

const logger = createLogger();
const originalWarnOnce = logger.warnOnce.bind(logger);
logger.warnOnce = (msg, options) => {
  if (msg.includes("points to missing source files")) return;
  originalWarnOnce(msg, options);
};

export default defineConfig({
  customLogger: logger,
  plugins: [
    wasm(),
    react(),
    tailwindcss(),
    nodePolyfills({
      include: ["buffer", "process", "events"],
      globals: {
        Buffer: true,
        process: true,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  build: {
    target: "esnext",
    chunkSizeWarningLimit: 12000,
  },
  optimizeDeps: {
    exclude: [
      "@midnight-ntwrk/compact-js",
      "@midnight-ntwrk/ledger-v8",
      "@midnight-ntwrk/compact-runtime",
      "@midnight-ntwrk/onchain-runtime-v3",
    ],
    include: [
      // CJS packages used by excluded Midnight SDK modules — must be
      // pre-bundled so Vite wraps them with proper ESM default exports.
      "object-inspect",
    ],
  },
  server: {
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
});
