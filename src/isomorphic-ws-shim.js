/**
 * Shim for isomorphic-ws/browser.js
 *
 * The original browser.js exports `ws` as default (the WebSocket constructor itself),
 * but the Midnight SDK expects `{ WebSocket }` as a named export from the ws module.
 * This shim re-exports the WebSocket as a named export.
 */
const ws = typeof WebSocket !== 'undefined' ? WebSocket : null;
export const WebSocket = ws;
export default ws;