#!/bin/bash
# Test PLDB site locally using a pre-built artifact (no local rebuild needed)
# Usage: ./test-local.sh [--pr <number>] [--repo owner/repo] [--port number]
#
# Without --pr: downloads and serves the latest release from main
# With --pr:    downloads and serves the specified PR's artifact
#
# Requires: gh CLI authenticated, npx available

set -e

# Defaults
PORT=8080
PR_NUMBER=""

# Auto-detect repo from git remote (handles both HTTPS and SSH remotes)
REPO=$(git remote get-url origin 2>/dev/null \
    | sed 's|https://github.com/||' \
    | sed 's|git@github.com:||' \
    | sed 's|\.git$||' \
    || echo "")

# Parse arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        --pr)
            PR_NUMBER="$2"
            shift 2
            ;;
        --repo)
            REPO="$2"
            shift 2
            ;;
        --port)
            PORT="$2"
            shift 2
            ;;
        *)
            echo "Unknown argument: $1"
            echo "Usage: $0 [--pr <number>] [--repo owner/repo] [--port number]"
            echo "Example: $0"
            echo "Example: $0 --pr 9"
            echo "Example: $0 --repo Programming-Language-DataBase/pldb --pr 9"
            exit 1
            ;;
    esac
done

if [ -z "$REPO" ]; then
    echo "ERROR: Could not detect repo from git remote. Use --repo owner/repo"
    exit 1
fi

WORK_DIR=/tmp/pldb-local-test
mkdir -p "$WORK_DIR"

if [ -n "$PR_NUMBER" ]; then
    echo "=== Testing PR #${PR_NUMBER} from ${REPO} ==="
    PR_BRANCH=$(gh pr view "$PR_NUMBER" --repo "$REPO" --json headRefName --jq '.headRefName')
    echo ">>> PR branch: $PR_BRANCH"
    RUN_ID=$(gh run list --repo "$REPO" --branch "$PR_BRANCH" --event pull_request \
        --status success --limit 1 --json databaseId --jq '.[0].databaseId')
    if [ -z "$RUN_ID" ] || [ "$RUN_ID" = "null" ]; then
        echo "ERROR: No successful workflow run found for PR #${PR_NUMBER} (branch: $PR_BRANCH)"
        exit 1
    fi
    echo ">>> Run ID: $RUN_ID"
    DOWNLOAD_DIR="$WORK_DIR/pr-${PR_NUMBER}"
    rm -rf "$DOWNLOAD_DIR" && mkdir -p "$DOWNLOAD_DIR"
    gh run download "$RUN_ID" --repo "$REPO" --name "site-pr-${PR_NUMBER}" --dir "$DOWNLOAD_DIR"
    TARBALL="$DOWNLOAD_DIR/site.tar.gz"
else
    echo "=== Testing latest release from main (${REPO}) ==="
    DOWNLOAD_DIR="$WORK_DIR/latest"
    rm -rf "$DOWNLOAD_DIR" && mkdir -p "$DOWNLOAD_DIR"
    gh release download latest --repo "$REPO" --pattern "site.tar.gz" --dir "$DOWNLOAD_DIR"
    TARBALL="$DOWNLOAD_DIR/site.tar.gz"
fi

SERVE_DIR="$WORK_DIR/site"
rm -rf "$SERVE_DIR" && mkdir -p "$SERVE_DIR"
echo ">>> Extracting site..."
tar xzf "$TARBALL" -C "$SERVE_DIR"

echo ""
echo ">>> Starting server at http://localhost:${PORT}"
echo "    Press Ctrl+C to stop"
echo ""
npx serve "$SERVE_DIR" -l "$PORT"
