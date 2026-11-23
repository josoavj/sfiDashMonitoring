#!/usr/bin/env bash

# ============================================
# SFI Dashboard Monitoring - Frontend Only
# Démarre juste le frontend (dev server Vite)
# ============================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

cleanup() {
  echo -e "\n${YELLOW}⏹️  Arrêt du serveur frontend...${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  SFI Dashboard Monitoring - Frontend Only              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}\n"

# Check if backend is running (optional warning)
if ! nc -z localhost 3001 2>/dev/null; then
  echo -e "${YELLOW}⚠️  Le backend ne semble pas actif sur localhost:3001${NC}"
  echo -e "${YELLOW}   Lance ./local/start-backend-only.sh dans un autre terminal${NC}\n"
fi

# Install dependencies if missing
if [ ! -d "frontend/node_modules" ] && [ ! -d "node_modules" ]; then
  echo -e "${BLUE}📦 Installation des dépendances frontend...${NC}"
  npm install
  echo -e "${GREEN}✓ Dépendances installées${NC}\n"
fi

# Start frontend
echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}📍 Démarrage du Frontend - Mode LOCAL${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"

export VITE_API_URL="http://localhost:3001"
export VITE_BACKEND_WS_URL="ws://localhost:3001"

echo -e "${GREEN}✅ Configuration:${NC}"
echo -e "  🌐 Frontend:     http://localhost:5173"
echo -e "  📡 Backend API:  $VITE_API_URL"
echo -e "  🔌 WebSocket:    $VITE_BACKEND_WS_URL\n"

echo -e "${YELLOW}⏳ Lancement du serveur Vite...${NC}\n"

npm run dev --workspace=frontend -- --port 5173
