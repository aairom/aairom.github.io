#!/usr/bin/env bash
# =============================================================================
# push-profile-readme.sh
# Pushes profile-readme/README.md to the aairom/aairom-profile GitHub repo.
# Run from anywhere — the script always operates from the repo root.
# =============================================================================

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKTREE_PATH="/tmp/aairom-profile"
REMOTE_NAME="profile"
REMOTE_URL="git@github.com:aairom/aairom-profile.git"
SOURCE_README="${REPO_ROOT}/profile-readme/README.md"

echo "==> Using repo root: ${REPO_ROOT}"

# ── Guard: source README must exist ─────────────────────────────────────────
if [[ ! -f "${SOURCE_README}" ]]; then
  echo "ERROR: ${SOURCE_README} not found. Aborting." >&2
  exit 1
fi

cd "${REPO_ROOT}"

# ── Step 1: Create an orphan worktree ────────────────────────────────────────
echo "==> [1/5] Creating orphan worktree at ${WORKTREE_PATH} ..."
# Remove any leftover worktree from a previous failed run
if [[ -d "${WORKTREE_PATH}" ]]; then
  git worktree remove --force "${WORKTREE_PATH}" 2>/dev/null || rm -rf "${WORKTREE_PATH}"
fi
git branch -D profile-branch 2>/dev/null || true
git worktree add --orphan -b profile-branch "${WORKTREE_PATH}"

# ── Step 2: Copy the README ───────────────────────────────────────────────────
echo "==> [2/5] Copying README.md ..."
cp "${SOURCE_README}" "${WORKTREE_PATH}/README.md"

# ── Step 3: Commit ────────────────────────────────────────────────────────────
echo "==> [3/5] Committing ..."
cd "${WORKTREE_PATH}"
git add README.md
git commit -m "feat: add GitHub profile README"

# ── Step 4: Add remote (if not already present) and push ─────────────────────
echo "==> [4/5] Pushing to ${REMOTE_URL} ..."
if ! git remote get-url "${REMOTE_NAME}" &>/dev/null; then
  git remote add "${REMOTE_NAME}" "${REMOTE_URL}"
fi
git push "${REMOTE_NAME}" profile-branch:main

# ── Step 5: Clean up ─────────────────────────────────────────────────────────
echo "==> [5/5] Cleaning up worktree ..."
cd "${REPO_ROOT}"
git worktree remove "${WORKTREE_PATH}"
git branch -D profile-branch

echo ""
echo "✅  Done! README pushed to ${REMOTE_URL}"
echo "    Next step: rename the repo to 'aairom' at"
echo "    https://github.com/aairom/aairom-profile/settings"
