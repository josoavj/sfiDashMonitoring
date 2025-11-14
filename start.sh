#!/usr/bin/env bash

# ============================================
# sfiDashMonitoring - Script de démarrage
# Démarre le backend et le frontend, collecte logs
# ============================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

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

echo -e "${BLUE}🔍 Vérifications préalables...${NC}\n"

if ! command -v node &>/dev/null; then
  echo -e "${RED}❌ Node.js n'est pas installé${NC}"
  exit 1
fi
echo -e "${GREEN}  ✓ Node.js: $(node --version)${NC}"

if ! command -v npm &>/dev/null; then
  echo -e "${RED}❌ npm n'est pas installé${NC}"
  exit 1
fi
echo -e "${GREEN}  ✓ npm: $(npm --version)${NC}"

if [ ! -d "backend" ]; then
  echo -e "${RED}❌ Dossier 'backend' introuvable${NC}"
  exit 1
fi
echo -e "${GREEN}  ✓ Dossier backend trouvé${NC}"

if [ ! -d "frontend" ]; then
  echo -e "${RED}❌ Dossier 'frontend' introuvable${NC}"
  exit 1
fi
echo -e "${GREEN}  ✓ Dossier frontend trouvé${NC}"

# Install dependencies if missing
if [ ! -d "backend/node_modules" ]; then
  echo -e "${YELLOW}  ⚠ Dépendances backend manquantes${NC}"
  echo -e "${BLUE}  📦 Installation en cours (backend)...${NC}"
  (cd backend && npm install)
fi
echo -e "${GREEN}  ✓ Dépendances backend OK${NC}"

if [ ! -d "frontend/node_modules" ]; then
  echo -e "${YELLOW}  ⚠ Dépendances frontend manquantes${NC}"
  echo -e "${BLUE}  📦 Installation en cours (frontend)...${NC}"
  (cd frontend && npm install)
fi
echo -e "${GREEN}  ✓ Dépendances frontend OK${NC}\n"

# Check .env
if [ ! -f "backend/.env" ]; then
  echo -e "${YELLOW}  ⚠ Fichier backend/.env manquant${NC}"
  echo -e "${YELLOW}  📝 Copiez backend/envDefault vers backend/.env et adaptez les valeurs${NC}\n"
fi

echo -e "${BLUE}📡 Démarrage du backend...${NC}"
cd backend
NODE_ENV=development nohup node server.js > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd "$SCRIPT_DIR"

sleep 2
if ! kill -0 $BACKEND_PID 2>/dev/null; then
  echo -e "${RED}❌ Le backend n'a pas démarré correctement${NC}"
  echo -e "${YELLOW}Consultez les logs: tail -f logs/backend.log${NC}"
  exit 1
fi
echo -e "${GREEN}  ✓ Backend démarré (PID: $BACKEND_PID)${NC}\n"

echo -e "${BLUE}🌐 Démarrage du frontend...${NC}"
cd frontend
nohup npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd "$SCRIPT_DIR"

sleep 2
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
  echo -e "${RED}❌ Le frontend n'a pas démarré correctement${NC}"
  echo -e "${YELLOW}Consultez les logs: tail -f logs/frontend.log${NC}"
  kill $BACKEND_PID 2>/dev/null || true
  exit 1
fi
echo -e "${GREEN}  ✓ Frontend démarré (PID: $FRONTEND_PID)${NC}\n"

echo -e "${GREEN}  Services démarrés avec succès. Logs: logs/backend.log, logs/frontend.log${NC}\n"

echo -e "${CYAN}📊 Monitoring actif... Appuyez sur Ctrl+C pour arrêter${NC}\n"

wait
