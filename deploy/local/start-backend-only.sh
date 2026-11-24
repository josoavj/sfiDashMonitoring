#!/usr/bin/env bash

# ============================================
# SFI Dashboard Monitoring - Backend Only
# Démarre juste le backend en développement
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

mkdir -p data logs

cleanup() {
  echo -e "\n${YELLOW}⏹️  Arrêt du serveur backend...${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  SFI Dashboard Monitoring - Backend Only               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}\n"

# Create necessary directories
mkdir -p data logs

# Setup backend .env if missing
if [ ! -f "backend/.env" ]; then
  echo -e "${YELLOW}⚠️  backend/.env manquant${NC}"
  if [ -f "backend/envDefault" ]; then
    cp backend/envDefault backend/.env
    echo -e "${GREEN}✓ Créé à partir de envDefault${NC}"
  fi
fi

# Install dependencies if missing
if [ ! -d "backend/node_modules" ]; then
  echo -e "${BLUE}📦 Installation des dépendances backend...${NC}"
  cd backend
  npm install
  cd "$PROJECT_ROOT"
  echo -e "${GREEN}✓ Dépendances installées${NC}\n"
fi

# Start backend
echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}📍 Démarrage du Backend - Mode LOCAL${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"

export HOST=0.0.0.0
export PORT=3001
export FRONTEND_URL="http://localhost:5173 http://127.0.0.1:5173"
export NODE_ENV=development

echo -e "${GREEN}✅ Configuration:${NC}"
echo -e "  🖥️  Host:         $HOST:$PORT"
echo -e "  🌐 Frontend URL: $FRONTEND_URL"
echo -e "  📊 Database:     SQLite (data/backend.sqlite)"
echo -e "  📝 Logs:         logs/backend.log\n"

echo -e "${YELLOW}⏳ Lancement du serveur...${NC}\n"

cd backend
node server.js
