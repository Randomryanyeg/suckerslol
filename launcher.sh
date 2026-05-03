#!/bin/bash

# ──────────────────────────────────────────────────────────────────────────────
# SHΔDØW CORE // HYBRID DEPLOYMENT ORCHESTRATOR V99
# ──────────────────────────────────────────────────────────────────────────────

# ANSI colors for mission status
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
BOLD='\033[1m'

clear
echo -e "${BOLD}${CYAN}
   ██████╗██╗  ██╗ █████╗ ██████╗  ██████╗ ██╗    ██╗
  ██╔════╝██║  ██║██╔══██╗██╔══██╗██╔═══██╗██║    ██║
  ╚█████╗ ███████║███████║██║  ██║██║   ██║██║ █╗ ██║
   ╚═══██╗██╔══██║██╔══██║██║  ██║██║   ██║██║███╗██║
  ██████╔╝██║  ██║██║  ██║██████╔╝╚██████╔╝╚███╔███╔╝
  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝  ╚═════╝  ╚══╝╚══╝ 
               CORE // V99 Calibrated
${NC}"

# 1. SYSTEM PRIVILEGES
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}❌ ABORT: Root privileges required for system synchronization.${NC}"
   exit 1
fi

# 2. DEPENDENCY MATRIX
echo -e "${BOLD}${YELLOW}[1/4] Synchronizing Dependency Matrix...${NC}"
apt-get update -qq
apt-get install -y -qq php-cli php-cgi php-curl php-json php-mbstring openssl nodejs npm curl git zip unzip > /dev/null

# Install Cloudflared
if ! command -v cloudflared &> /dev/null; then
    echo -e "${YELLOW}Installing Cloudflared...${NC}"
    curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
    dpkg -i cloudflared.deb > /dev/null
    rm cloudflared.deb
fi

# Composer check
if ! command -v composer &> /dev/null; then
    echo -e "${YELLOW}Installing Composer...${NC}"
    curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer > /dev/null
fi

echo -e "${GREEN}✓ Matrix synchronized.${NC}"

# 3. ENVIRONMENT CALIBRATION
echo -e "${BOLD}${YELLOW}[2/4] Calibrating Signal Relay...${NC}"

# Allow override via args: ./launcher.sh <APP_URL> <WEBROOT_URL>
IP_ADDR=$(curl -s ifconfig.me)
if [ -z "$IP_ADDR" ]; then
    IP_ADDR=$(hostname -I | awk '{print $1}')
fi

DEFAULT_APP_URL="https://your-app.trycloudflare.com"
DEFAULT_WEBROOT_URL="https://your-sim.trycloudflare.com"

APP_URL=${1:-$DEFAULT_APP_URL}
WEBROOT_URL=${2:-$DEFAULT_WEBROOT_URL}

# Fix PHP execution parity
ln -sf /usr/bin/php8.2 /usr/bin/php 2>/dev/null || true

cat <<EOF > .env
# SHΔDØW CORE // HYBRID CALIBRATED ENV
PORT=3000
NODE_ENV=development
APP_URL=$APP_URL
WEBROOT_URL=$WEBROOT_URL
PHP_ENGINE_PORT=8080
AUTH_TOKEN=projectsarah
EOF

# Sync webroot settings (Simulation Layer Source of Truth)
if [ -f "server/data/global_settings.json" ]; then
    # FORCING: The PHP Simulation Layer MUST consider the WEBROOT_URL as its 'app_url' 
    # to generate correct Interac links in its local context.
    sed -i "s|\"app_url\": \".*\"|\"app_url\": \"$WEBROOT_URL\"|g" server/data/global_settings.json
    
    # We still track the other one for the OS Layer reference in Admin
    if grep -q "webroot_url" server/data/global_settings.json; then
        sed -i "s|\"webroot_url\": \".*\"|\"webroot_url\": \"$WEBROOT_URL\"|g" server/data/global_settings.json
    else
        # Insert after app_url
        sed -i "s|\"app_url\": \"$WEBROOT_URL\"|\"app_url\": \"$WEBROOT_URL\",\n      \"webroot_url\": \"$WEBROOT_URL\"|g" server/data/global_settings.json
    fi
    
    echo -e "${GREEN}✓ Simulation relay synchronized.${NC}"
    echo -e "  - Simulation UI:  $WEBROOT_URL (Propagated to JSON app_url)"
    echo -e "  - Bank UI:        $APP_URL (Propagated to Node OS)"
fi

# 4. PULSE VERIFICATION
echo -e "${BOLD}${YELLOW}[3/4] Verifying Service Pulses...${NC}"
if [ -d "node_modules" ]; then
    echo -e "  - node_modules detected. Running fast verified install..."
    npm install --silent || (echo -e "${RED}x Dependency corruption detected. Rebuilding matrix...${NC}" && rm -rf node_modules package-lock.json && npm install)
else
    echo -e "  - Bootstrapping node_modules..."
    npm install
fi
(cd server && composer install --quiet)
echo -e "${GREEN}✓ All pulses verified.${NC}"

# 5. EXECUTION LAYER
echo -e "${BOLD}${YELLOW}[4/4] Engaging Shadow Core...${NC}"

# Expand tunnels into background right before node
if command -v cloudflared &> /dev/null; then
    echo -e "${YELLOW}Deploying Global Cloudflare Tunnels...${NC}"
    
    # Start app tunnel on port 3000
    cloudflared tunnel --url http://localhost:3000 > app_tunnel.log 2>&1 &
    APP_TUNNEL_PID=$!
    
    # Start webroot tunnel on port 8080
    cloudflared tunnel --url http://localhost:8080 > webroot_tunnel.log 2>&1 &
    WEBROOT_TUNNEL_PID=$!
    
    echo -e "Waiting for tunnels to establish (10s)..."
    sleep 10
    
    # Extract URLs
    LIVE_APP_URL=$(grep -oE "https://[a-zA-Z0-9.-]+\.trycloudflare\.com" app_tunnel.log | head -n 1)
    LIVE_WEBROOT_URL=$(grep -oE "https://[a-zA-Z0-9.-]+\.trycloudflare\.com" webroot_tunnel.log | head -n 1)
    
    if [ ! -z "$LIVE_APP_URL" ] && [ ! -z "$LIVE_WEBROOT_URL" ]; then
         APP_URL=$LIVE_APP_URL
         WEBROOT_URL=$LIVE_WEBROOT_URL
         echo -e "Global Tunnels Active!"
         
         # Update env with real domains
         sed -i "s|APP_URL=.*|APP_URL=$APP_URL|g" .env
         sed -i "s|WEBROOT_URL=.*|WEBROOT_URL=$WEBROOT_URL|g" .env
         
         # Update settings files
         sed -i "s|\"app_url\": \".*\"|\"app_url\": \"$WEBROOT_URL\"|g" server/data/global_settings.json
         sed -i "s|\"webroot_url\": \".*\"|\"webroot_url\": \"$WEBROOT_URL\"|g" server/data/global_settings.json
    else
         echo -e "${RED}Failed to generate Cloudflare tunnels. Using mock domains.${NC}"
    fi
fi

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}SYSTEM ONLINE${NC}"
echo -e "Main OS:     ${GREEN}$APP_URL${NC}"
echo -e "Interac SIM: ${GREEN}$WEBROOT_URL${NC}"
echo -e "PHP Engine:  ${GREEN}Localhost:8080${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Auto-launch with PM2 if present, else use npx
if command -v pm2 &> /dev/null; then
    pm2 stop all &> /dev/null
    pm2 start npx --name "SHADOW_CORE" -- tsx server.ts
    pm2 log SHADOW_CORE
else
    npx tsx server.ts
fi
