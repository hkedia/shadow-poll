#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Shadow Poll — Compact Contract Compilation Pipeline
# =============================================================================
# Usage: bash contracts/scripts/compile.sh [--skip-zk]
#
# Compiles the Compact smart contract and copies ZK keys to public/zk-keys/.
# Use --skip-zk to skip ZK key generation (faster, for syntax checking only).
# =============================================================================

# Resolve repo root (script lives in contracts/scripts/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Configuration
CONTRACT_SRC="contracts/src/poll.compact"
MANAGED_DIR="contracts/managed"
ZK_KEYS_DIR="public/zk-keys"
COMPACT_VERSION="+0.30.0"

# Optional --skip-zk flag
SKIP_ZK_FLAG=""
if [[ "${1:-}" == "--skip-zk" ]]; then
  SKIP_ZK_FLAG="--skip-zk"
  echo "⚡ Skipping ZK key generation (syntax check only)..."
fi

echo "🔨 Compiling Compact contract..."
echo "   Source:  $CONTRACT_SRC"
echo "   Output:  $MANAGED_DIR"
echo "   Version: $COMPACT_VERSION"
echo ""

# Clean previous output
rm -rf "$REPO_ROOT/$MANAGED_DIR"
mkdir -p "$REPO_ROOT/$MANAGED_DIR"
mkdir -p "$REPO_ROOT/$ZK_KEYS_DIR"

# Run compilation
cd "$REPO_ROOT"
compact compile $COMPACT_VERSION $SKIP_ZK_FLAG "$CONTRACT_SRC" "$MANAGED_DIR"

echo ""
echo "✅ Compilation successful!"
echo ""

# Copy ZK key files to public directory in the structure FetchZkConfigProvider expects:
#   public/zk-keys/keys/{circuitId}.prover
#   public/zk-keys/keys/{circuitId}.verifier
#   public/zk-keys/zkir/{circuitId}.bzkir
KEY_COUNT=0
if [[ -z "$SKIP_ZK_FLAG" ]]; then
  mkdir -p "$REPO_ROOT/$ZK_KEYS_DIR/keys"
  mkdir -p "$REPO_ROOT/$ZK_KEYS_DIR/zkir"

  # Copy prover/verifier keys from managed/keys/ → public/zk-keys/keys/
  if [[ -d "$REPO_ROOT/$MANAGED_DIR/keys" ]]; then
    while IFS= read -r -d '' file; do
      cp "$file" "$REPO_ROOT/$ZK_KEYS_DIR/keys/"
      echo "   Copied: $(basename "$file") → $ZK_KEYS_DIR/keys/"
      KEY_COUNT=$((KEY_COUNT + 1))
    done < <(find "$REPO_ROOT/$MANAGED_DIR/keys" \( -name "*.prover" -o -name "*.verifier" \) -print0 2>/dev/null || true)
  fi

  # Copy .bzkir files from managed/zkir/ → public/zk-keys/zkir/
  if [[ -d "$REPO_ROOT/$MANAGED_DIR/zkir" ]]; then
    while IFS= read -r -d '' file; do
      cp "$file" "$REPO_ROOT/$ZK_KEYS_DIR/zkir/"
      echo "   Copied: $(basename "$file") → $ZK_KEYS_DIR/zkir/"
      KEY_COUNT=$((KEY_COUNT + 1))
    done < <(find "$REPO_ROOT/$MANAGED_DIR/zkir" -name "*.bzkir" -print0 2>/dev/null || true)
  fi

  if [[ $KEY_COUNT -eq 0 ]]; then
    echo "ℹ️  No ZK key files found in $MANAGED_DIR/keys/ or $MANAGED_DIR/zkir/."
    echo "   This is expected when using --skip-zk."
  else
    echo ""
    echo "📦 Copied $KEY_COUNT ZK artifact(s) to $ZK_KEYS_DIR/{keys,zkir}/"
  fi
else
  echo "ℹ️  ZK key generation was skipped. Run without --skip-zk for full compilation."
fi

echo ""
echo "📂 Compiled artifacts:"
find "$REPO_ROOT/$MANAGED_DIR" -type f | while read -r f; do
  echo "   $(echo "$f" | sed "s|$REPO_ROOT/||")"
done

echo ""
echo "🎉 Done!"
