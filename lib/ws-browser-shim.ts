/**
 * Browser shim for 'isomorphic-ws' and 'ws'.
 *
 * Turbopack cannot bundle the Node.js 'ws' package in the client bundle.
 * This shim re-exports the browser's native WebSocket so that packages
 * like @midnight-ntwrk/midnight-js-indexer-public-data-provider work
 * correctly in the browser without the Node.js 'ws' dependency.
 *
 * Aliased in next.config.ts turbopack.resolveAlias for both 'ws' and 'isomorphic-ws'.
 */

// Native browser WebSocket — available in all modern browsers and Next.js edge runtime.
const WebSocket = globalThis.WebSocket;

export { WebSocket };
export default { WebSocket };
