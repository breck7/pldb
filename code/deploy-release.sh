#!/bin/bash
# Deploy a supplied build artifact, or download latest for the weekly fallback.
set -euo pipefail

exec 9>/root/pldb-deploy.lock
flock -w 600 9

INSTALL_DIR=/root/pldb
HEALTH_URL=${PLDB_HEALTH_URL:-http://127.0.0.1:3000/}
STAGING=$(mktemp -d /root/pldb-staging.XXXXXX)
BACKUP="$STAGING/previous"
SWAPPED=false
SUCCESS=false

cleanup() {
    local status=$?
    trap - EXIT
    if [ "$SWAPPED" = true ] && [ "$SUCCESS" = false ]; then
        echo 'Deployment failed; restoring the previous site.' >&2
        rm -rf "$INSTALL_DIR"
        if ! mv "$BACKUP" "$INSTALL_DIR"; then
            echo "Restore failed. Previous site retained at $BACKUP" >&2
            exit 1
        fi
        systemctl restart pldb || true
    fi
    rm -rf "$STAGING"
    exit "$status"
}
trap cleanup EXIT

if [ "$#" -gt 0 ]; then
    cp -- "$1" "$STAGING/site.tar.gz"
else
    REPO_BASE=$(cat /root/pldb-repo.conf)
    curl --fail --show-error --location --retry 3 \
        "$REPO_BASE/releases/download/latest/site.tar.gz" -o "$STAGING/site.tar.gz"
fi

mkdir "$STAGING/site"
tar xzf "$STAGING/site.tar.gz" -C "$STAGING/site"
test -s "$STAGING/site/index.html"
test -s "$STAGING/site/package.json"
cd "$STAGING/site"
npm install --quiet
cd /root

# Preserve the running installation until the replacement is ready.
mv "$INSTALL_DIR" "$BACKUP"
SWAPPED=true
mv "$STAGING/site" "$INSTALL_DIR"
systemctl restart pldb

for attempt in {1..12}; do
    if systemctl is-active --quiet pldb && \
        curl --fail --silent --max-time 5 "$HEALTH_URL" -o /dev/null; then
        SUCCESS=true
        echo 'PLDB deployment healthy.'
        exit 0
    fi
    sleep 5
done
echo 'PLDB failed its HTTP health check.' >&2
exit 1
