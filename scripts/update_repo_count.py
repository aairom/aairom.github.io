#!/usr/bin/env python3
"""
update_repo_count.py

Fetches the current public repository count for a GitHub user via the
GitHub REST API and updates the shields.io badge URL in the profile README.

Usage:
    python3 scripts/update_repo_count.py

Environment variables (optional):
    GITHUB_TOKEN  — A personal access token or the Actions GITHUB_TOKEN.
                    Not required, but avoids unauthenticated rate limits
                    (60 req/h) when set.
"""

import os
import re
import sys
import json
import urllib.request
import urllib.error

# ---------------------------------------------------------------------------
# Configuration — change GITHUB_USER if the script is reused for another profile
# ---------------------------------------------------------------------------
GITHUB_USER = "aairom"
README_PATH = os.path.join(os.path.dirname(__file__), "..", "profile-readme", "README.md")

# Shields.io badge pattern to match (captures the count group for replacement)
# Matches:  https://img.shields.io/badge/Public%20repos-<NUMBER>-58a6ff?...
BADGE_PATTERN = re.compile(
    r"(https://img\.shields\.io/badge/Public%20repos-)(\d+)(-58a6ff\?style=flat-square&logo=github)"
)


def fetch_public_repo_count(user: str) -> int:
    """Query the GitHub Users API and return the public_repos count."""
    url = f"https://api.github.com/users/{user}"
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "update-repo-count-script",
    }
    token = os.environ.get("GITHUB_TOKEN", "")
    if token:
        headers["Authorization"] = f"Bearer {token}"

    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        print(f"[ERROR] GitHub API returned HTTP {exc.code}: {exc.reason}", file=sys.stderr)
        sys.exit(1)
    except urllib.error.URLError as exc:
        print(f"[ERROR] Network error reaching GitHub API: {exc.reason}", file=sys.stderr)
        sys.exit(1)

    count = data.get("public_repos")
    if count is None:
        print("[ERROR] Unexpected API response — 'public_repos' field missing.", file=sys.stderr)
        print(f"        Response keys: {list(data.keys())}", file=sys.stderr)
        sys.exit(1)

    return int(count)


def update_readme(path: str, count: int) -> bool:
    """
    Read the README, replace the badge count, and write it back.
    Returns True if the file was changed, False if the count was already correct.
    """
    readme_path = os.path.abspath(path)

    try:
        with open(readme_path, "r", encoding="utf-8") as fh:
            original = fh.read()
    except OSError as exc:
        print(f"[ERROR] Cannot read {readme_path}: {exc}", file=sys.stderr)
        sys.exit(1)

    match = BADGE_PATTERN.search(original)
    if not match:
        print(
            f"[ERROR] Badge pattern not found in {readme_path}.\n"
            "        Expected a URL matching:\n"
            "        https://img.shields.io/badge/Public%20repos-<N>-58a6ff?style=flat-square&logo=github",
            file=sys.stderr,
        )
        sys.exit(1)

    current_count = int(match.group(2))
    if current_count == count:
        print(f"[INFO] Badge already shows {count} — no update needed.")
        return False

    updated = BADGE_PATTERN.sub(
        lambda m: f"{m.group(1)}{count}{m.group(3)}",
        original,
    )

    try:
        with open(readme_path, "w", encoding="utf-8") as fh:
            fh.write(updated)
    except OSError as exc:
        print(f"[ERROR] Cannot write {readme_path}: {exc}", file=sys.stderr)
        sys.exit(1)

    print(f"[INFO] Badge updated: {current_count} → {count}")
    return True


def main() -> None:
    print(f"[INFO] Fetching public repo count for GitHub user '{GITHUB_USER}'…")
    count = fetch_public_repo_count(GITHUB_USER)
    print(f"[INFO] Public repos: {count}")

    changed = update_readme(README_PATH, count)
    # Exit code 0 regardless — the workflow decides whether to commit
    sys.exit(0)


if __name__ == "__main__":
    main()
