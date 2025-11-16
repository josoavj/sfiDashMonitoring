#!/usr/bin/env bash

# ============================================
# sfiDashMonitoring - Local Development Start
# Démarre le backend et le frontend en localhost
# =============================================

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

mkdir -p logs

cleanup() {
  echo -e "\n${YELLOW}⏹️  Arrêt gracieux des services...${NC}"
  if [ -n "${BACKEND_PID:-}" ]; then
    kill -TERM $BACKEND_PID 2>/dev/null || true
    echo -e "${GREEN}  ✓ Backend arrêté${NC}"
  fi
  if [ -n "${FRONTEND_PID:-}" ]; then
    kill -TERM $FRONTEND_PID 2>/dev/null || true
    echo -e "${GREEN}  ✓ Frontend arrêté${NC}"
  fi
  echo -e "\n${GREEN}👋 Au revoir !${NC}\n"
  exit 0
}

trap cleanup SIGINT SIGTERM

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  SFI Dashboard Monitoring - Local Development          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${BLUE}🔍 Vérifications préalables...${NC}\n"

# Check Node.js
if ! command -v node &>/dev/null; then
  echo -e "${RED}❌ Node.js n'est pas installé${NC}"
  exit 1
fi
echo -e "${GREEN}  ✓ Node.js: $(node --version)${NC}"

# Check npm
if ! command -v npm &>/dev/null; then
  echo -e "${RED}❌ npm n'est pas installé${NC}"
  exit 1
fi
echo -e "${GREEN}  ✓ npm: $(npm --version)${NC}"

# Check backend directory
if [ ! -d "backend" ]; then
  echo -e "${RED}❌ Dossier 'backend' introuvable${NC}"
  exit 1
fi
echo -e "${GREEN}  ✓ Dossier backend trouvé${NC}"

# Check frontend
if [ ! -f "package.json" ] || [ ! -d "src" ]; then
  echo -e "${RED}❌ Frontend non détecté${NC}"
  exit 1
fi
echo -e "${GREEN}  ✓ Frontend trouvé${NC}\n"

# Create necessary directories
echo -e "${BLUE}📁 Création des répertoires...${NC}"
mkdir -p data
mkdir -p logs
echo -e "${GREEN}  ✓ Répertoires créés${NC}\n"

# Setup backend .env if missing
if [ ! -f "backend/.env" ]; then
  echo -e "${YELLOW}  ⚠ backend/.env manquant${NC}"
  if [ -f "backend/envDefault" ]; then
    cp backend/envDefault backend/.env
    echo -e "${GREEN}  ✓ Créé à partir de envDefault${NC}"
  fi
fi

# Install backend dependencies if missing
if [ ! -d "backend/node_modules" ]; then
  echo -e "${YELLOW}  ⚠ Dépendances backend manquantes${NC}"
  echo -e "${BLUE}  📦 Installation en cours...${NC}"
  (cd backend && npm install)
fi
echo -e "${GREEN}  ✓ Dépendances backend OK${NC}"

# Install frontend dependencies if missing
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}  ⚠ Dépendances frontend manquantes${NC}"
  echo -e "${BLUE}  📦 Installation en cours...${NC}"
  npm install
fi
echo -e "${GREEN}  ✓ Dépendances frontend OK${NC}\n"

# Ports configuration
BACKEND_PORT=${BACKEND_PORT:-3001}
FRONTEND_PORT=${FRONTEND_PORT:-5173}

echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}📍 Configuration - Mode LOCAL (Localhost)${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
echo -e "  Backend:   http://localhost:${BACKEND_PORT}"
echo -e "  Frontend:  http://localhost:${FRONTEND_PORT}"
echo -e "  WebSocket: ws://localhost:${BACKEND_PORT}/socket.io"
echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}\n"

# ============================================
# Démarrage du Backend
# ============================================
echo -e "${BLUE}🚀 Démarrage du Backend...${NC}"
cd backend

export HOST=0.0.0.0
export PORT=$BACKEND_PORT
export FRONTEND_URL="http://localhost:${FRONTEND_PORT} http://127.0.0.1:${FRONTEND_PORT}"
export NODE_ENV=development

echo -e "${CYAN}  Configuration:${NC}"
echo -e "    PORT: $PORT"
echo -e "    FRONTEND_URL: $FRONTEND_URL"

npm start > "$PROJECT_ROOT/logs/backend.log" 2>&1 &
BACKEND_PID=$!

cd "$PROJECT_ROOT"

echo -e "${YELLOW}  ⏳ Attente du démarrage du backend...${NC}"
sleep 3

if ! kill -0 $BACKEND_PID 2>/dev/null; then
  echo -e "${RED}❌ Le backend n'a pas démarré correctement${NC}"
  echo -e "${YELLOW}  Logs: logs/backend.log${NC}"
  cat logs/backend.log
  exit 1
fi
echo -e "${GREEN}  ✓ Backend démarré (PID: $BACKEND_PID)${NC}\n"

# ============================================
# Démarrage du Frontend
# ============================================
echo -e "${BLUE}🌐 Démarrage du Frontend...${NC}"

export VITE_API_URL="http://localhost:${BACKEND_PORT}"
export VITE_BACKEND_WS_URL="ws://localhost:${BACKEND_PORT}"

echo -e "${CYAN}  Configuration:${NC}"
echo -e "    VITE_API_URL: $VITE_API_URL"
echo -e "    VITE_BACKEND_WS_URL: $VITE_BACKEND_WS_URL"

npm run dev -- --port $FRONTEND_PORT > "logs/frontend.log" 2>&1 &
FRONTEND_PID=$!

echo -e "${YELLOW}  ⏳ Attente du démarrage du frontend...${NC}"
sleep 3

if ! kill -0 $FRONTEND_PID 2>/dev/null; then
  echo -e "${RED}❌ Le frontend n'a pas démarré correctement${NC}"
  echo -e "${YELLOW}  Logs: logs/frontend.log${NC}"
  cat logs/frontend.log
  kill $BACKEND_PID 2>/dev/null || true
  exit 1
fi
echo -e "${GREEN}  ✓ Frontend démarré (PID: $FRONTEND_PID)${NC}\n"

# ============================================
# Services running
# ============================================
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ Services démarrés avec succès                       ║${NC}"
echo -e "${GREEN}╠════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  🌐 Frontend:  http://localhost:${FRONTEND_PORT}${NC}"
echo -e "${GREEN}║  📡 Backend:   http://localhost:${BACKEND_PORT}${NC}"
echo -e "${GREEN}║  🔌 WebSocket: ws://localhost:${BACKEND_PORT}/socket.io${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${CYAN}📊 Mode LOCAL - Appuyez sur Ctrl+C pour arrêter${NC}\n"

echo -e "${YELLOW}📋 Logs:${NC}"
echo -e "  Backend:  tail -f logs/backend.log"
echo -e "  Frontend: tail -f logs/frontend.log\n"

wait
