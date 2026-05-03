#!/bin/bash
# SHΔDØW CORE // DUAL URL ORCHESTRATOR

# Mission Calibration
APP_URL=${1:-"https://your-app.trycloudflare.com"}
WEBROOT_URL=${2:-"https://your-sim.trycloudflare.com"}

echo "🚀 Calibrating Dual URL Environment..."
echo "🔗 App URL:     $APP_URL"
echo "🔗 Webroot URL: $WEBROOT_URL"

# Sync to .env
cat <<EOF > .env
# SHΔDØW CORE // HYBRID CALIBRATED ENV
PORT=3000
NODE_ENV=development
APP_URL=$APP_URL
WEBROOT_URL=$WEBROOT_URL
PHP_ENGINE_PORT=8080
AUTH_TOKEN=projectsarah
EOF

echo "✓ .env updated."

# Pulse check on launcher
if [ -f "launcher.sh" ]; then
    bash launcher.sh "$APP_URL" "$WEBROOT_URL"
else
    npx tsx server.ts
fi
