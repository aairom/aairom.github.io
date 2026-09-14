#!/usr/bin/env bash
# =============================================================================
# start.sh — Launch the personal website locally for development preview
#
# Usage:   ./scripts/start.sh [port]
# Default port: 8080  (avoids macOS AirDrop conflict on port 5000)
# =============================================================================

set -euo pipefail

PORT="${1:-8080}"
SITE_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo ""
echo "🌐  Personal Website — Local Preview"
echo "──────────────────────────────────────"
echo "📁  Root : $SITE_ROOT"
echo "🔗  URL  : http://localhost:${PORT}"
echo "🛑  Stop : Ctrl+C"
echo ""

cd "$SITE_ROOT"

# Prefer Python 3, fall back to Python 2
if command -v python3 &>/dev/null; then
    python3 -m http.server "$PORT"
elif command -v python &>/dev/null; then
    python -m SimpleHTTPServer "$PORT"
else
    echo "❌  Python not found. Install Python 3 from https://python.org"
    exit 1
fi
