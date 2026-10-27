#!/bin/bash
# Setup and run PLDB server on Ubuntu droplet
# Usage: ./setup-pldb.sh <ip-address> <repo-url>
#
# This script:
# 1. Installs Node.js 24.x if not present
# 2. Downloads pre-built site from GitHub Releases
# 3. Installs serve for hosting
# 4. Creates a systemd service for automatic startup on reboot
# 5. Starts the server and verifies it is accessible

set -e  # Exit on error

# Check for required arguments
if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: $0 <ip-address> <repo-url>"
    echo "Example: $0 159.65.99.188 https://github.com/kaby76/pldb.git"
    exit 1
fi

IP_ADDRESS="$1"
REPO_URL="$2"
REMOTE_HOST="root@${IP_ADDRESS}"
INSTALL_DIR="/root/pldb"
PORT=80

echo "=== PLDB Server Setup Script ==="
echo "Target: $REMOTE_HOST"
echo "Repository: $REPO_URL"
echo ""

# Run commands on the remote server
ssh -o StrictHostKeyChecking=no "$REMOTE_HOST" bash -s -- "$REPO_URL" << 'ENDSSH'
set -e

REPO_URL="$1"
export DEBIAN_FRONTEND=noninteractive

if [ -f /etc/systemd/system/pldb.service.d/https.conf ]; then
    echo 'HTTPS is configured. Use /root/pldb-update.sh for deployments; this bootstrap script requires port 80.' >&2
    exit 1
fi

echo ">>> Updating package lists..."
apt-get update -qq

echo ">>> Installing prerequisites..."
apt-get install -y -qq curl

# Install Node.js if needed
echo ">>> Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "    Installing Node.js 24.x..."
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt-get install -y -qq nodejs
fi

echo ">>> Node.js version: $(node --version)"
echo ">>> npm version: $(npm --version)"

# Stop existing PLDB service if running
echo ">>> Stopping existing PLDB service (if any)..."
systemctl stop pldb 2>/dev/null || true

# Serve a maintenance page while we deploy
echo ">>> Setting up maintenance page on port 80..."
MAINTENANCE_DIR=$(mktemp -d)
cat > "$MAINTENANCE_DIR/index.html" << 'MAINTEOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PLDB - Maintenance</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background-color: #f5f5f5;
      color: #333;
    }
    .container { text-align: center; padding: 2rem; }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    p { font-size: 1.2rem; color: #666; }
    .spinner {
      margin: 2rem auto;
      width: 40px;
      height: 40px;
      border: 4px solid #ddd;
      border-top-color: #333;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
  <meta http-equiv="refresh" content="10">
</head>
<body>
  <div class="container">
    <h1>PLDB</h1>
    <div class="spinner"></div>
    <p>Down for maintenance. This page will refresh automatically.</p>
  </div>
</body>
</html>
MAINTEOF
npx serve "$MAINTENANCE_DIR" -l 80 --single &
MAINT_PID=$!
echo "    Maintenance server running (PID $MAINT_PID)"

# Download pre-built site from GitHub Releases
echo ">>> Downloading pre-built site..."
INSTALL_DIR="/root/pldb"
RELEASE_URL="${REPO_URL%.git}/releases/download/latest/site.tar.gz"
echo "    Release URL: $RELEASE_URL"

if [ -d "$INSTALL_DIR" ]; then
    echo "    Removing existing installation..."
    rm -rf "$INSTALL_DIR"
fi
mkdir -p "$INSTALL_DIR"

curl -fSL "$RELEASE_URL" -o /tmp/site.tar.gz
echo ">>> Extracting site..."
tar xzf /tmp/site.tar.gz -C "$INSTALL_DIR"
rm /tmp/site.tar.gz

cd "$INSTALL_DIR"

echo ">>> Installing serve..."
npm install

# Stop maintenance server and all its child processes, then clean up
echo ">>> Stopping maintenance server..."
kill -- -$MAINT_PID 2>/dev/null || kill $MAINT_PID 2>/dev/null || true
# Also kill any serve process still on port 80
fuser -k 80/tcp 2>/dev/null || true
sleep 1
rm -rf "$MAINTENANCE_DIR"

# Create systemd service for automatic startup on reboot
echo ">>> Creating systemd service..."
cat > /etc/systemd/system/pldb.service << 'SERVICEEOF'
[Unit]
Description=PLDB Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/pldb
ExecStart=/usr/bin/npx serve . -l 80
Restart=on-failure
RestartSec=10
StandardOutput=append:/root/pldb-server.log
StandardError=append:/root/pldb-server.log

[Install]
WantedBy=multi-user.target
SERVICEEOF

# Enable and start the service
echo ">>> Enabling and starting PLDB service..."
systemctl daemon-reload
systemctl enable pldb
systemctl restart pldb

# Wait for server to start
echo ">>> Waiting for server to start..."
MAX_RETRIES=12
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    sleep 5
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:80 | grep -q "200"; then
        echo "    Server responding on localhost:80"
        break
    fi
    echo "    Waiting... (attempt $((RETRY_COUNT + 1))/$MAX_RETRIES)"
    RETRY_COUNT=$((RETRY_COUNT + 1))
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "ERROR: Server did not respond after $MAX_RETRIES attempts"
    echo ">>> Service status:"
    systemctl status pldb --no-pager
    echo ">>> Server log:"
    tail -50 /root/pldb-server.log
    exit 1
fi

# Open firewall port if ufw is active
if ufw status | grep -q "Status: active"; then
    echo ">>> Opening firewall port 80..."
    ufw allow 80/tcp
fi

echo ""
echo "=== Server Status ==="
systemctl status pldb --no-pager | head -10
echo ""
echo "Log file: /root/pldb-server.log"
echo ""
echo "Service commands:"
echo "  View status: systemctl status pldb"
echo "  View logs:   journalctl -u pldb -f"
echo "  Restart:     systemctl restart pldb"
echo "  Stop:        systemctl stop pldb"

# Save HTTPS release base URL for the weekly updater (normalize away any git@ or .git suffix)
echo ">>> Saving release URL for weekly updater..."
HTTPS_BASE=$(echo "$REPO_URL" | sed 's|git@github.com:|https://github.com/|; s|\.git$||')
echo "$HTTPS_BASE" > /root/pldb-repo.conf

# Write the weekly update script
echo ">>> Installing weekly update script..."
cat > /root/pldb-update.sh << 'UPDATEEOF'
#!/bin/bash
# Use the deployed updater so improvements arrive with each release.
set -euo pipefail
# Fresh HTTP-only installations use port 80 until HTTPS is configured.
if [ ! -f /etc/systemd/system/pldb.service.d/https.conf ]; then
    export PLDB_HEALTH_URL=http://127.0.0.1:80/
fi
exec bash /root/pldb/code/deploy-release.sh
UPDATEEOF
chmod +x /root/pldb-update.sh
echo "    Update script installed at /root/pldb-update.sh"

# Install weekly cron job (Monday 09:00 UTC)
echo ">>> Installing weekly cron job..."
( crontab -l 2>/dev/null | grep -v 'pldb-update' || true; echo '0 9 * * 1 /root/pldb-update.sh >> /root/pldb-update.log 2>&1' ) | crontab -
echo "    Cron job installed: runs every Monday at 09:00 UTC"

ENDSSH

echo ""
echo "=== Setup Complete ==="
echo ""
echo ">>> Testing external access..."
sleep 2
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://${IP_ADDRESS}")
if [ "$HTTP_STATUS" = "200" ]; then
    echo "SUCCESS: Server is accessible at http://${IP_ADDRESS}"
    echo ""
    echo ">>> Fetching page title..."
    curl -s "http://${IP_ADDRESS}" | grep -oP '(?<=<title>).*(?=</title>)' | head -1
else
    echo "WARNING: Server returned HTTP $HTTP_STATUS"
    echo "The server may still be starting up. Try: curl http://${IP_ADDRESS}"
fi
