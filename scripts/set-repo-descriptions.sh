#!/usr/bin/env bash
# =============================================================================
# set-repo-descriptions.sh — Bulk-set GitHub repository descriptions via gh CLI
#
# The GitHub API returns `"description": null` for repos where no description
# has been set. This script lets you update them in two ways:
#
#   MODE 1 — Interactive  (default)
#     Lists every repo with a missing or empty description and prompts you
#     to type one. Press Enter to skip a repo.
#
#   MODE 2 — Batch file
#     Reads a TSV file (repo_name<TAB>description) and applies them all.
#     Generate the template first, fill it in, then run with --file.
#
# Usage:
#   chmod +x scripts/set-repo-descriptions.sh
#
#   # Interactive mode — prompts for each repo missing a description
#   ./scripts/set-repo-descriptions.sh
#
#   # Generate a TSV template of all repos missing descriptions
#   ./scripts/set-repo-descriptions.sh --template > descriptions.tsv
#
#   # Apply descriptions from a filled-in TSV file
#   ./scripts/set-repo-descriptions.sh --file descriptions.tsv
#
#   # Dry-run (show what would be changed, make no API calls)
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

info()    { echo -e "${BLU}ℹ  $*${RST}"; }
success() { echo -e "${GRN}✔  $*${RST}"; }
warn()    { echo -e "${YLW}⚠  $*${RST}"; }
dim()     { echo -e "${GRY}   $*${RST}"; }

# ── Parse arguments ───────────────────────────────────────────────────────────
MODE="interactive"       # interactive | batch | template
INPUT_FILE=""
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --file)      MODE="batch"; INPUT_FILE="${2:-}"; shift 2 ;;
        --template)  MODE="template"; shift ;;
        --dry-run)   DRY_RUN=true; shift ;;
        -h|--help)
            sed -n '3,40p' "$0" | sed 's/^# \?//'
            exit 0 ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
done

# ── Prerequisites ─────────────────────────────────────────────────────────────
command -v gh &>/dev/null || { echo "❌  gh CLI not found. Install: https://cli.github.com"; exit 1; }
gh auth status &>/dev/null || { echo "❌  gh not authenticated. Run: gh auth login"; exit 1; }

GITHUB_USER="$(gh api user --jq '.login')"

# ── Fetch all repos with their current descriptions ──────────────────────────
fetch_repos() {
    # Returns JSON array with only name + description fields
    gh api "/users/${GITHUB_USER}/repos?per_page=100&sort=updated" \
        --paginate \
        --jq '.[] | [.name, (.description // "")] | @tsv' 2>/dev/null
}

# ── Apply a single description via the API ────────────────────────────────────
apply_description() {
    local repo="$1"
    local desc="$2"

    if $DRY_RUN; then
        warn "[DRY-RUN] Would set ${GITHUB_USER}/${repo}: \"${desc}\""
        return
    fi

    gh api "repos/${GITHUB_USER}/${repo}" \
        --method PATCH \
        --field description="$desc" \
        --jq '.name' &>/dev/null

    success "Updated ${GITHUB_USER}/${repo}"
    dim "  → \"${desc}\""
}

# ── TEMPLATE MODE ─────────────────────────────────────────────────────────────
if [[ "$MODE" == "template" ]]; then
    fetch_repos | while IFS=$'\t' read -r name desc; do
        if [[ -z "$desc" ]]; then
            # Print repo name + empty column ready to fill in
            printf '%s\t\n' "$name"
        fi
    done
    exit 0
fi

# ── BATCH MODE ────────────────────────────────────────────────────────────────
if [[ "$MODE" == "batch" ]]; then
    [[ -z "$INPUT_FILE" ]] && { echo "❌  --file requires a path. E.g.: --file descriptions.tsv"; exit 1; }
    [[ -f "$INPUT_FILE" ]] || { echo "❌  File not found: $INPUT_FILE"; exit 1; }

    echo ""
    echo -e "${CYN}── Batch update from: $INPUT_FILE ${RST}"
    $DRY_RUN && warn "DRY-RUN mode — no changes will be made"
    echo ""

    COUNT=0
    SKIPPED=0

    while IFS=$'\t' read -r repo desc || [[ -n "$repo" ]]; do
        # Skip blank lines and comment lines
        [[ -z "$repo" || "$repo" == \#* ]] && continue

        desc="${desc:-}"
        # Trim trailing whitespace
        desc="${desc%"${desc##*[![:space:]]}"}"

        if [[ -z "$desc" ]]; then
            dim "Skipped ${repo} (no description provided)"
            SKIPPED=$(( SKIPPED + 1 ))
            continue
        fi

        apply_description "$repo" "$desc"
        COUNT=$(( COUNT + 1 ))

    done < "$INPUT_FILE"

    echo ""
    success "Done — ${COUNT} repo(s) updated, ${SKIPPED} skipped"
    echo ""
    exit 0
fi

# ── INTERACTIVE MODE ──────────────────────────────────────────────────────────
echo ""
echo -e "${CYN}╔══════════════════════════════════════════════════════╗${RST}"
echo -e "${CYN}║  GitHub Repo Descriptions — Interactive Editor       ║${RST}"
echo -e "${CYN}╚══════════════════════════════════════════════════════╝${RST}"
echo ""
info "Fetching repositories for @${GITHUB_USER}…"
echo ""
$DRY_RUN && warn "DRY-RUN mode — no changes will be made"
echo ""

# Collect repos missing descriptions into a temp file
# (avoids mapfile / process-substitution issues on macOS bash 3.2)
TMPFILE="$(mktemp /tmp/repos_missing_desc.XXXXXX)"
trap 'rm -f "$TMPFILE"' EXIT

fetch_repos | while IFS=$'\t' read -r name desc; do
    [[ -z "$desc" ]] && echo "$name"
done > "$TMPFILE"

TOTAL="$(wc -l < "$TMPFILE" | tr -d ' ')"

if [[ "$TOTAL" -eq 0 ]]; then
    success "All repositories already have descriptions — nothing to do!"
    exit 0
fi

info "${TOTAL} repositories have no description."
echo -e "${GRY}  Press Enter to skip a repo.${RST}"
echo ""

COUNT=0
IDX=0

# Read repo names from the temp file; use /dev/tty for interactive prompts
while IFS= read -r repo; do
    IDX=$(( IDX + 1 ))
    printf "${CYN}[%d/%d]${RST} ${BLU}%s${RST}\n" "$IDX" "$TOTAL" "$repo"
    printf "      Description (Enter to skip): "

    # Read from the terminal directly (stdin is the file, not the keyboard)
    if read -r desc < /dev/tty 2>/dev/null; then
        # Trim trailing whitespace (bash 3.2 compatible)
        desc="$(echo "$desc" | sed 's/[[:space:]]*$//')"
        if [[ -n "$desc" ]]; then
            apply_description "$repo" "$desc"
            COUNT=$(( COUNT + 1 ))
        else
            dim "Skipped"
        fi
    else
        dim "Skipped (non-interactive)"
    fi
    echo ""
done < "$TMPFILE"

echo ""
success "Done — ${COUNT} of ${TOTAL} repositories updated."
echo ""
info "Tip: run this again any time to fill in newly created repos."
info "Or edit descriptions at: https://github.com/${GITHUB_USER}?tab=repositories"
echo ""
