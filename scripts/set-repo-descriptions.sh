#!/usr/bin/env bash
# =============================================================================
# set-repo-descriptions.sh — Bulk-set GitHub repository descriptions via gh CLI
#
# Usage:
#   chmod +x scripts/set-repo-descriptions.sh
#
#   # Interactive — prompts for each repo that has no description
#   ./scripts/set-repo-descriptions.sh
#
#   # Generate a TSV template of repos missing descriptions (fill it in an editor)
#   ./scripts/set-repo-descriptions.sh --template > descriptions.tsv
#
#   # Apply descriptions from a filled-in TSV file (repo_name<TAB>description)
#   ./scripts/set-repo-descriptions.sh --file descriptions.tsv
#
#   # Dry-run — show what would be changed without making any API calls
#   ./scripts/set-repo-descriptions.sh --dry-run
#   ./scripts/set-repo-descriptions.sh --file descriptions.tsv --dry-run
#
# TSV format (tab-separated, one repo per line, no header):
#   GutenOCR-Test	OCR experiments using Gutenberg texts
#   doclingserve-bob	Docling document conversion server for IBM Bob
#
# Prerequisites:
#   gh CLI authenticated — run: gh auth login
# =============================================================================

set -euo pipefail

# ── Colours ──────────────────────────────────────────────────────────────────
GRN='\033[0;32m'; YLW='\033[0;33m'; BLU='\033[0;34m'
CYN='\033[0;36m'; GRY='\033[0;90m'; RST='\033[0m'

info()    { printf "${BLU}ℹ  %s${RST}\n" "$*"; }
success() { printf "${GRN}✔  %s${RST}\n" "$*"; }
warn()    { printf "${YLW}⚠  %s${RST}\n" "$*"; }
dim()     { printf "${GRY}   %s${RST}\n" "$*"; }

# ── Parse arguments ───────────────────────────────────────────────────────────
MODE="interactive"
INPUT_FILE=""
DRY_RUN=false

while [ $# -gt 0 ]; do
    case "$1" in
        --file)     MODE="batch"; INPUT_FILE="${2:-}"; shift 2 ;;
        --template) MODE="template"; shift ;;
        --dry-run)  DRY_RUN=true; shift ;;
        -h|--help)  sed -n '3,25p' "$0" | sed 's/^# \?//'; exit 0 ;;
        *) printf "Unknown option: %s\n" "$1"; exit 1 ;;
    esac
done

# ── Prerequisites ─────────────────────────────────────────────────────────────
command -v gh >/dev/null 2>&1 || { printf "❌  gh CLI not found. Install: https://cli.github.com\n"; exit 1; }
gh auth status >/dev/null 2>&1 || { printf "❌  gh not authenticated. Run: gh auth login\n"; exit 1; }

GITHUB_USER="$(gh api user --jq '.login')"

# ── Fetch all repos into a temp file (no pipes from the function) ─────────────
# Writes TSV lines "name<TAB>description" — description is empty string when null
# Uses a temp file so we never pipe fetch output through bash subshells (macOS
# bash 3.2 does not flush piped subshell stdout reliably).
ALL_REPOS_FILE="$(mktemp /tmp/all_repos.XXXXXX)"
MISSING_FILE="$(mktemp /tmp/missing_desc.XXXXXX)"
trap 'rm -f "$ALL_REPOS_FILE" "$MISSING_FILE"' EXIT

fetch_all_repos() {
    local page=1
    local out count
    # Clear the file first
    : > "$ALL_REPOS_FILE"
    while true; do
        out="$(gh api "/users/${GITHUB_USER}/repos?per_page=100&sort=updated&page=${page}" \
                --jq '.[] | [.name, (.description // "")] | @tsv' 2>/dev/null)"
        # No more repos — stop
        [ -z "$out" ] && break
        # Append to file directly (no pipe)
        printf '%s\n' "$out" >> "$ALL_REPOS_FILE"
        # Stop if this page had fewer than 100 entries
        count="$(printf '%s\n' "$out" | wc -l | tr -d ' ')"
        [ "$count" -lt 100 ] && break
        page=$(( page + 1 ))
    done
}

# ── Apply a single description ────────────────────────────────────────────────
apply_description() {
    local repo="$1" desc="$2"
    if $DRY_RUN; then
        warn "[DRY-RUN] Would set ${GITHUB_USER}/${repo}: \"${desc}\""
        return
    fi
    gh api "repos/${GITHUB_USER}/${repo}" \
        --method PATCH \
        --field description="$desc" \
        --jq '.name' >/dev/null 2>&1
    success "Updated ${GITHUB_USER}/${repo}"
    dim "→ \"${desc}\""
}

# ── TEMPLATE MODE ─────────────────────────────────────────────────────────────
if [ "$MODE" = "template" ]; then
    fetch_all_repos
    while IFS=$(printf '\t') read -r name desc; do
        [ -z "$desc" ] && printf '%s\t\n' "$name"
    done < "$ALL_REPOS_FILE"
    exit 0
fi

# ── BATCH MODE ────────────────────────────────────────────────────────────────
if [ "$MODE" = "batch" ]; then
    [ -z "$INPUT_FILE" ] && { printf "❌  --file requires a path.\n"; exit 1; }
    [ -f "$INPUT_FILE" ] || { printf "❌  File not found: %s\n" "$INPUT_FILE"; exit 1; }

    printf "\n${CYN}── Batch update from: %s ${RST}\n\n" "$INPUT_FILE"
    $DRY_RUN && warn "DRY-RUN mode — no changes will be made"

    COUNT=0; SKIPPED=0

    while IFS=$(printf '\t') read -r repo desc || [ -n "$repo" ]; do
        [ -z "$repo" ] && continue
        case "$repo" in \#*) continue ;; esac
        desc="$(printf '%s' "${desc:-}" | sed 's/[[:space:]]*$//')"
        if [ -z "$desc" ]; then
            dim "Skipped ${repo} (no description provided)"
            SKIPPED=$(( SKIPPED + 1 ))
            continue
        fi
        apply_description "$repo" "$desc"
        COUNT=$(( COUNT + 1 ))
    done < "$INPUT_FILE"

    printf "\n"
    success "Done — ${COUNT} repo(s) updated, ${SKIPPED} skipped"
    printf "\n"
    exit 0
fi

# ── INTERACTIVE MODE ──────────────────────────────────────────────────────────
printf "\n${CYN}╔══════════════════════════════════════════════════════╗${RST}\n"
printf   "${CYN}║  GitHub Repo Descriptions — Interactive Editor       ║${RST}\n"
printf   "${CYN}╚══════════════════════════════════════════════════════╝${RST}\n\n"

info "Fetching repositories for @${GITHUB_USER}…"
fetch_all_repos

# Build the missing-descriptions file from the already-fetched data
: > "$MISSING_FILE"
while IFS=$(printf '\t') read -r name desc; do
    [ -z "$desc" ] && printf '%s\n' "$name" >> "$MISSING_FILE"
done < "$ALL_REPOS_FILE"

TOTAL="$(wc -l < "$MISSING_FILE" | tr -d ' ')"

if [ "$TOTAL" -eq 0 ]; then
    printf "\n"
    success "All repositories already have descriptions — nothing to do!"
    exit 0
fi

printf "\n"
$DRY_RUN && warn "DRY-RUN mode — no changes will be made"
info "${TOTAL} repositories have no description."
printf "${GRY}   Press Enter to skip a repo.${RST}\n\n"

COUNT=0; IDX=0

while IFS= read -r repo; do
    IDX=$(( IDX + 1 ))
    printf "${CYN}[%d/%d]${RST} ${BLU}%s${RST}\n" "$IDX" "$TOTAL" "$repo"
    printf "      Description (Enter to skip): "

    # Read from /dev/tty so keyboard input works while stdin is the file
    if read -r desc < /dev/tty 2>/dev/null; then
        desc="$(printf '%s' "$desc" | sed 's/[[:space:]]*$//')"
        if [ -n "$desc" ]; then
            apply_description "$repo" "$desc"
            COUNT=$(( COUNT + 1 ))
        else
            dim "Skipped"
        fi
    else
        dim "Skipped (non-interactive terminal)"
    fi
    printf "\n"
done < "$MISSING_FILE"

printf "\n"
success "Done — ${COUNT} of ${TOTAL} repositories updated."
printf "\n"
info "Tip: run again any time to fill in newly created repos."
info "Or edit directly at: https://github.com/${GITHUB_USER}?tab=repositories"
printf "\n"
