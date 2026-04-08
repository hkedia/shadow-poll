/**
 * SVG badge generator for Shadow Poll participation proofs.
 *
 * Pure utility — no React, no SDK imports, no external dependencies.
 * Generates a downloadable SVG string using Aether design tokens.
 *
 * Design decisions: D-61 (dual sharing format), D-63 (no QR code in v1)
 */

/** Parameters for generating a participation proof badge. */
export interface ProofBadgeParams {
  pollId: string;       // full hex poll ID
  nullifier: string;    // full hex nullifier
  pollTitle: string;    // human-readable poll title (truncated if long)
  verifyUrl: string;    // full /verify?pollId=...&nullifier=... URL
}

/**
 * Generates an SVG string for a participation proof badge.
 *
 * The badge uses the Aether design system color palette:
 * - Background: #0D0E14 (near-black navy)
 * - Primary: #A78BFA (lavender)
 * - Tertiary: #2DD4BF (turquoise)
 * - Text: #E2E8F0 / #94A3B8
 *
 * @returns SVG string that can be used as a Blob URL or data URI
 */
export function generateProofBadgeSvg({
  pollId,
  nullifier,
  pollTitle,
  verifyUrl,
}: ProofBadgeParams): string {
  const W = 400;
  const H = 220;
  const R = 12; // border radius

  // Truncate values for display
  const shortPollId = `${pollId.slice(0, 8)}...`;
  const shortNullifier = `${nullifier.slice(0, 8)}...`;
  const title = pollTitle.length > 36 ? `${pollTitle.slice(0, 36)}…` : pollTitle;
  // Truncate verify URL for display (show origin + path only, clip params)
  const displayUrl = verifyUrl.length > 46 ? `${verifyUrl.slice(0, 46)}…` : verifyUrl;

  // Escape XML special characters
  function esc(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0D0E14"/>
      <stop offset="100%" stop-color="#12131C"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" rx="${R}" fill="url(#bg)"/>

  <!-- Border -->
  <rect width="${W}" height="${H}" rx="${R}" fill="none" stroke="#A78BFA" stroke-opacity="0.4" stroke-width="1"/>

  <!-- Divider line (after header) -->
  <line x1="20" y1="48" x2="${W - 20}" y2="48" stroke="#A78BFA" stroke-opacity="0.2" stroke-width="1"/>

  <!-- Header: wordmark -->
  <text x="20" y="32" font-family="system-ui, sans-serif" font-size="15" font-weight="700" fill="#A78BFA">Shadow Poll</text>

  <!-- Header: verified badge -->
  <rect x="${W - 88}" y="16" width="70" height="22" rx="11" fill="#2DD4BF" fill-opacity="0.15"/>
  <text x="${W - 85}" y="31" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#2DD4BF">&#10003; verified</text>

  <!-- Participation Verified label -->
  <text x="20" y="74" font-family="system-ui, sans-serif" font-size="16" font-weight="700" fill="#E2E8F0">Participation Verified</text>

  <!-- Poll title -->
  <text x="20" y="96" font-family="system-ui, sans-serif" font-size="12" fill="#94A3B8">Poll: ${esc(title)}</text>

  <!-- Poll ID row -->
  <text x="20" y="122" font-family="system-ui, sans-serif" font-size="11" fill="#64748B">Poll ID</text>
  <text x="80" y="122" font-family="monospace, 'Courier New'" font-size="11" fill="#E2E8F0">${esc(shortPollId)}</text>

  <!-- Proof ID (nullifier) row -->
  <text x="20" y="140" font-family="system-ui, sans-serif" font-size="11" fill="#64748B">Proof ID</text>
  <text x="80" y="140" font-family="monospace, 'Courier New'" font-size="11" fill="#E2E8F0">${esc(shortNullifier)}</text>

  <!-- Divider before URL -->
  <line x1="20" y1="158" x2="${W - 20}" y2="158" stroke="#A78BFA" stroke-opacity="0.15" stroke-width="1"/>

  <!-- Verify URL -->
  <text x="20" y="178" font-family="monospace, 'Courier New'" font-size="10" fill="#A78BFA">${esc(displayUrl)}</text>

  <!-- Bottom tagline -->
  <text x="20" y="200" font-family="system-ui, sans-serif" font-size="10" fill="#475569">Anonymous voting on Midnight blockchain · zero-knowledge verified</text>
</svg>`;
}
