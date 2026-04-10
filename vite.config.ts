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
  if (msg.includes("esbuild") && msg.includes("vite-plugin-node-polyfills")) return;
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
      // Redirect isomorphic-ws to our shim that exports WebSocket as a named export.
      // The SDK does `ws.WebSocket` but isomorphic-ws/browser.js exports the
      // WebSocket constructor as default (not as a named export).
      "isomorphic-ws": path.resolve(__dirname, "src/isomorphic-ws-shim.js"),
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
      // Use our shim instead of pre-bundling isomorphic-ws
      "isomorphic-ws",
    ],
    include: [
      // CJS packages used by excluded Midnight SDK modules — must be
      // pre-bundled so Vite wraps them with proper ESM default exports.
      "object-inspect",
    ],
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        // Suppress noisy error messages when API server is not running
        // This is common in dev when running only the frontend
        configure: (proxy, _options) => {
          proxy.on("error", (err, _req, _res) => {
            // Only log connection refused errors once per minute to avoid spam
            if ((err as NodeJS.ErrnoException).code === "ECONNREFUSED") {
              // Silent fail - the user knows the API isn't running
              return;
            }
            // Log other errors normally
            console.warn(`[vite-proxy] ${err.message}`);
          });
        },
      },
    },
  },
});
