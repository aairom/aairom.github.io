#!/usr/bin/env bash
# =============================================================================
# init-repo.sh — First-time GitHub Pages repository creation and deployment
#
# Run this ONCE from the project root to:
#   1. Initialise the local git repository (if not already done)
#   2. Create the public GitHub repository  aairom.github.io
#   3. Push all files and enable GitHub Pages
#   4. Print the live URL when the build is ready
#
# Prerequisites:
#   • git     — https://git-scm.com
#   • gh CLI  — https://cli.github.com   (run: gh auth login  before this script)
#   • curl    — pre-installed on macOS/Linux
#
# Usage:
#   chmod +x scripts/init-repo.sh
#   ./scripts/init-repo.sh
#
# Environment variables (optional overrides):
#   GITHUB_USER   — defaults to the authenticated gh CLI user
#   REPO_NAME     — defaults to "<GITHUB_USER>.github.io"
#   COMMIT_MSG    — defaults to "🚀 Initial personal website with live GitHub repositories"
# =============================================================================

set -euo pipefail

# ── Colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GRN='\033[0;32m'; YLW='\033[0;33m'
BLU='\033[0;34m'; CYN='\033[0;36m'; RST='\033[0m'

info()    { echo -e "${BLU}ℹ️  $*${RST}"; }
success() { echo -e "${GRN}✅  $*${RST}"; }
warn()    { echo -e "${YLW}⚠️  $*${RST}"; }
error()   { echo -e "${RED}❌  $*${RST}"; exit 1; }
step()    { echo -e "\n${CYN}── $* ${RST}"; }

# ── Resolve project root (parent of scripts/) ────────────────────────────────
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

echo ""
echo -e "${CYN}╔══════════════════════════════════════════════════════╗${RST}"
echo -e "${CYN}║  GitHub Pages — First-Time Setup                     ║${RST}"
echo -e "${CYN}╚══════════════════════════════════════════════════════╝${RST}"
echo ""

# ── 1. Check prerequisites ───────────────────────────────────────────────────
step "Checking prerequisites"

command -v git  &>/dev/null || error "git not found. Install from https://git-scm.com"
command -v gh   &>/dev/null || error "GitHub CLI (gh) not found. Install from https://cli.github.com  then run: gh auth login"
command -v curl &>/dev/null || error "curl not found. Install via your package manager."

# Verify gh is authenticated
if ! gh auth status &>/dev/null; then
    error "GitHub CLI not authenticated. Run: gh auth login"
fi

success "All prerequisites met"

# ── 2. Resolve username and repo name ────────────────────────────────────────
step "Resolving GitHub identity"

GITHUB_USER="${GITHUB_USER:-$(gh api user --jq '.login' 2>/dev/null)}"
[[ -z "$GITHUB_USER" ]] && error "Could not determine GitHub username. Set GITHUB_USER env var."

REPO_NAME="${REPO_NAME:-${GITHUB_USER}.github.io}"
COMMIT_MSG="${COMMIT_MSG:-"🚀 Initial personal website with live GitHub repositories"}"

info "GitHub user : $GITHUB_USER"
info "Repo name   : $REPO_NAME"
info "Project dir : $REPO_ROOT"

# ── 3. Initialise git (if not already a repo) ────────────────────────────────
step "Setting up local git repository"

if git rev-parse --git-dir &>/dev/null; then
    warn "Git already initialised — skipping git init"
else
    git init
    git branch -m main
    success "Initialised new git repository on branch 'main'"
fi

# Ensure we're on 'main'
CURRENT_BRANCH="$(git symbolic-ref --short HEAD 2>/dev/null || echo 'unknown')"
if [[ "$CURRENT_BRANCH" != "main" ]]; then
    git checkout -b main 2>/dev/null || git branch -m main
    info "Switched to branch 'main'"
fi

# ── 4. Configure git identity (if not already set) ───────────────────────────
step "Checking git identity"

GIT_NAME="$(git config user.name 2>/dev/null || true)"
GIT_EMAIL="$(git config user.email 2>/dev/null || true)"

if [[ -z "$GIT_NAME" ]]; then
    GH_NAME="$(gh api user --jq '.name // .login' 2>/dev/null || echo "$GITHUB_USER")"
    git config user.name "$GH_NAME"
    info "Set git user.name = $GH_NAME"
fi

if [[ -z "$GIT_EMAIL" ]]; then
    GH_EMAIL="$(gh api user --jq '.email // empty' 2>/dev/null || true)"
    if [[ -n "$GH_EMAIL" ]]; then
        git config user.email "$GH_EMAIL"
        info "Set git user.email = $GH_EMAIL"
    else
        # Use GitHub's no-reply address as a safe fallback
        NOREPLY_EMAIL="${GITHUB_USER}@users.noreply.github.com"
        git config user.email "$NOREPLY_EMAIL"
        info "Set git user.email = $NOREPLY_EMAIL (no-reply)"
    fi
fi

success "Git identity: $(git config user.name) <$(git config user.email)>"

# ── 5. Exclude .bob/ from git ────────────────────────────────────────────────
step "Ensuring .bob/ is excluded from git"

if ! grep -qx ".bob/" .gitignore 2>/dev/null; then
    echo ".bob/" >> .gitignore
    info "Added .bob/ to .gitignore"
fi

# Unstage .bob/ if it was accidentally staged
if git ls-files --cached .bob/ | grep -q .; then
    git rm -r --cached .bob/ &>/dev/null
    info "Removed .bob/ from git index"
fi

# ── 6. Stage and commit ───────────────────────────────────────────────────────
step "Staging and committing files"

git add .

# Show what will be committed
echo ""
echo "📋  Files to commit:"
git status --short
echo ""

if git diff --cached --quiet; then
    warn "Nothing to commit — all files already tracked"
else
    git commit -m "$COMMIT_MSG"
    success "Committed: \"$COMMIT_MSG\""
fi

# ── 7. Create GitHub repository ──────────────────────────────────────────────
step "Creating GitHub repository"

# Check if remote 'origin' already exists
if git remote get-url origin &>/dev/null; then
    warn "Remote 'origin' already set: $(git remote get-url origin)"
    info "Skipping repo creation — pushing to existing remote"
else
    # Check if the repo exists on GitHub already
    if gh repo view "${GITHUB_USER}/${REPO_NAME}" &>/dev/null 2>&1; then
        warn "Repository ${GITHUB_USER}/${REPO_NAME} already exists on GitHub"
        git remote add origin "https://github.com/${GITHUB_USER}/${REPO_NAME}.git"
        info "Added existing repo as remote origin"
    else
        # Create the public repo and set it as remote (do NOT push yet — we'll do it explicitly)
        gh repo create "${REPO_NAME}" \
            --public \
            --description "Personal website hosted on GitHub Pages" \
            --source=. \
            --remote=origin
        success "Created https://github.com/${GITHUB_USER}/${REPO_NAME}"
    fi
fi

# ── 8. Push to GitHub ────────────────────────────────────────────────────────
step "Pushing to GitHub"

git push --set-upstream origin main
success "Pushed to origin/main"

# ── 9. Verify / enable GitHub Pages ─────────────────────────────────────────
step "Verifying GitHub Pages"

PAGES_STATUS="$(gh api "repos/${GITHUB_USER}/${REPO_NAME}/pages" --jq '.status' 2>/dev/null || echo 'not_found')"

if [[ "$PAGES_STATUS" == "not_found" ]]; then
    info "Enabling GitHub Pages (branch: main, path: /)"
    gh api "repos/${GITHUB_USER}/${REPO_NAME}/pages" \
        --method POST \
        --field source='{"branch":"main","path":"/"}' \
        &>/dev/null || warn "Could not enable Pages via API — enable manually in Settings → Pages"
fi

# ── 10. Wait for build and confirm ───────────────────────────────────────────
step "Waiting for GitHub Pages build"

LIVE_URL="https://${REPO_NAME}"
MAX_WAIT=120   # seconds
INTERVAL=10
ELAPSED=0

echo -n "   Building"
while [[ $ELAPSED -lt $MAX_WAIT ]]; do
    STATUS="$(gh api "repos/${GITHUB_USER}/${REPO_NAME}/pages" --jq '.status' 2>/dev/null || echo 'unknown')"
    if [[ "$STATUS" == "built" ]]; then
        echo ""
        break
    fi
    echo -n "."
    sleep $INTERVAL
    ELAPSED=$(( ELAPSED + INTERVAL ))
done
echo ""

# HTTP check
HTTP_CODE="$(curl -sI "$LIVE_URL" | head -1 | awk '{print $2}')"

echo ""
echo -e "${GRN}╔══════════════════════════════════════════════════════╗${RST}"
echo -e "${GRN}║                                                      ║${RST}"
echo -e "${GRN}║  🎉  Your site is LIVE!                              ║${RST}"
echo -e "${GRN}║                                                      ║${RST}"
printf  "${GRN}║  🔗  %-47s ║${RST}\n" "$LIVE_URL"
printf  "${GRN}║  📦  Repo: %-40s ║${RST}\n" "github.com/${GITHUB_USER}/${REPO_NAME}"
printf  "${GRN}║  🌐  HTTP status: %-33s ║${RST}\n" "${HTTP_CODE:-checking...}"
echo -e "${GRN}║                                                      ║${RST}"
echo -e "${GRN}╚══════════════════════════════════════════════════════╝${RST}"
echo ""
echo -e "  Next update: ${CYN}./scripts/deploy.sh \"Your update message\"${RST}"
echo ""
