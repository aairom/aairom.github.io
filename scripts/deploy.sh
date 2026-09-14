#!/usr/bin/env bash
# =============================================================================
# deploy.sh — Stage, commit, and push website changes to GitHub Pages
#
# Usage:   ./scripts/deploy.sh "Your commit message"
# Example: ./scripts/deploy.sh "Update portfolio section"
# =============================================================================

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

COMMIT_MSG="${1:-"Update website content"}"

echo ""
echo "🚀  GitHub Pages — Deploy"
echo "──────────────────────────────────────"

# Check we're inside a git repo
if ! git rev-parse --git-dir &>/dev/null; then
    echo "❌  Not a git repository. Run: git init"
    exit 1
fi

# Show what's changed
echo "📋  Changed files:"
git status --short
echo ""

# Stage all changes
git add .

# Only commit if there's something to commit
if git diff --cached --quiet; then
    echo "ℹ️   Nothing to commit — working tree is clean."
    exit 0
fi

# Commit
git commit -m "$COMMIT_MSG"

# Push to main (adjust branch name if yours is 'master')
BRANCH="$(git symbolic-ref --short HEAD)"
echo ""
echo "📤  Pushing to origin/$BRANCH ..."
git push origin "$BRANCH"

echo ""
echo "✅  Deployed! GitHub Pages will rebuild in ~60 seconds."
echo "🔗  Visit: https://$(git remote get-url origin | sed 's/.*github.com[:/]\(.*\)\.git/\1/' | sed 's|.*/||; s|.*:||').github.io"
echo ""
