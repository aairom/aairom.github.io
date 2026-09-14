#!/usr/bin/env bash
# =============================================================================
# cleanup.sh — Remove temporary files and development artefacts
#
# Usage:   ./scripts/cleanup.sh
# =============================================================================

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

echo ""
echo "🧹  Personal Website — Cleanup"
echo "──────────────────────────────────────"

# Remove macOS metadata files
find . -name ".DS_Store" -not -path "./.git/*" -delete 2>/dev/null && echo "🗑   Removed .DS_Store files"

# Remove Python cache
find . -type d -name "__pycache__" -not -path "./.git/*" -exec rm -rf {} + 2>/dev/null && echo "🗑   Removed __pycache__ directories" || true

# Remove node_modules if accidentally created
if [ -d "node_modules" ]; then
    rm -rf node_modules
    echo "🗑   Removed node_modules/"
fi

# Remove .venv if present
if [ -d ".venv" ]; then
    rm -rf .venv
    echo "🗑   Removed .venv/"
fi

# Clear output directory content (keep the folder + .gitkeep)
if [ -d "output" ]; then
    find output/ -mindepth 1 -not -name ".gitkeep" -delete 2>/dev/null || true
    echo "🗑   Cleared output/ content"
fi

echo ""
echo "✅  Cleanup complete."
echo ""
