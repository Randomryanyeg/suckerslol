#!/bin/bash
# 🜃 PØGHØST-777 🗡️ LAUNCHER

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "\n${PURPLE}👹🔥 DEMON LAUNCHER ACTIVATED 👹🔥${NC}"
echo -e "${CYAN}>> Purging existing parasitic instances on ports 3000 & 3005...${NC}"

# Kill any processes hanging on those ports
fuser -k 3000/tcp > /dev/null 2>&1
fuser -k 3005/tcp > /dev/null 2>&1
killall cloudflared > /dev/null 2>&1

sleep 1
echo -e "${YELLOW}>> Network arteries cleared.${NC}"

# 1. Environment Check
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ CRITICAL: package.json missing.${NC}"
    exit 1
fi

echo -e "${BLUE}>> Synchronizing dependencies...${NC}"
if command -v composer &> /dev/null; then
    if [ -f "server/composer.json" ]; then
        cd server && composer install --quiet && cd ..
    fi
fi

if [ ! -d "node_modules" ]; then
    npm install --silent > /dev/null 2>&1
fi

# 2. Build Sequence
echo -e "${BLUE}>> Compiling UI architecture...${NC}"
npm run build > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build array assembled.${NC}"
else
    echo -e "${RED}❌ Build sequence failed. Run 'npm run build' manually to inspect errors.${NC}"
    exit 1
fi

# 3. Execution & Global Exposure
echo -e "${CYAN}>> Igniting Dual Runtime Sequence...${NC}"

# Start Python API logic if available
if command -v python3 &> /dev/null && [ -f "server/main.py" ]; then
    echo -e "${PURPLE}🐍 Booting Python Sec-Core on Port 3005...${NC}"
    python3 server/main.py --port 3005 > python_core.log 2>&1 &
    PY_PID=$!
else
    echo -e "${YELLOW}⚠️ Python3 not found or main.py missing. Skipping Python core.${NC}"
    PY_PID=""
fi

echo -e "${GREEN}🚀 Booting Primary Node Core on Port 3000...${NC}"
npm start > node_core.log 2>&1 &
SERVER_PID=$!

trap "echo -e '\n${RED}⚠️ Termination signal received. Killing Cores...${NC}'; kill $SERVER_PID $PY_PID 2>/dev/null; killall cloudflared 2>/dev/null; exit 0" SIGINT SIGTERM

echo -e "${YELLOW}⏳ Linking deep systems to Cloudflare network... (Please wait ~5s)${NC}"

# Start the tunnel in the background to log
rm -f cloudflared.log
npx -y cloudflared tunnel --url http://localhost:3000 > cloudflared.log 2>&1 &
CF_PID=$!

# Extract link smoothly
MAX_RETRIES=20
COUNT=0
URL=""

while [ $COUNT -lt $MAX_RETRIES ]; do
    if grep -q "trycloudflare.com" cloudflared.log; then
        URL=$(grep -o 'https://[^ ]*\.trycloudflare\.com' cloudflared.log | head -n 1)
        break
    fi
    sleep 1
    ((COUNT++))
done

if [ ! -z "$URL" ]; then
    echo -e "\n${PURPLE}=================================================================${NC}"
    echo -e "${RED}             👹🔥 🜃 PØGHØST-777 🗡️ BROADCAST LIVE 🔥👹         ${NC}"
    echo -e "${PURPLE}=================================================================${NC}"
    echo -e "${CYAN}🔗 GHOST NODE PROXY : ${GREEN}$URL${NC}"
    echo -e "${CYAN}💻 LOCAL VORTEX     : ${YELLOW}http://localhost:3000${NC}"
    if [ ! -z "$PY_PID" ]; then
         echo -e "${CYAN}🐍 PYTHON SEC-CORE  : ${YELLOW}http://localhost:3005${NC}"
    fi
    echo -e "${PURPLE}=================================================================${NC}"
    echo "TUNNEL_URL=$URL" > server/.env_tunnel
    echo -e "${NC}Monitoring cores. Logs written to node_core.log & python_core.log.${NC}"
    echo -e "${NC}Press Ctrl+C to terminate the demon process.${NC}"
    wait $CF_PID
else
    echo -e "${RED}❌ FAILED TO SECURE CLOUDFLARE TUNNEL.${NC}"
    echo "Check cloudflared.log for specific outage data."
    kill $SERVER_PID $PY_PID 2>/dev/null
fi
