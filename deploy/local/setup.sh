#!/usr/bin/env bash

# ============================================
# SFI Dashboard Monitoring - Setup Initial
# Configure l'environnement de développement
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

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  SFI Dashboard Monitoring - Setup Initial              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}\n"

# Check Node.js and npm
echo -e "${CYAN}🔍 Vérifications...${NC}"
if ! command -v node &>/dev/null; then
  echo -e "${RED}❌ Node.js n'est pas installé${NC}"
  echo -e "   Installez Node.js depuis https://nodejs.org/${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Node.js: $(node --version)${NC}"

if ! command -v npm &>/dev/null; then
  echo -e "${RED}❌ npm n'est pas installé${NC}"
  exit 1
fi
echo -e "${GREEN}✓ npm: $(npm --version)${NC}\n"

# Create directories
echo -e "${CYAN}📁 Création des répertoires...${NC}"
mkdir -p "$PROJECT_ROOT/data"
mkdir -p "$PROJECT_ROOT/logs"
mkdir -p "$PROJECT_ROOT/backend/certs"
echo -e "${GREEN}✓ Répertoires créés${NC}\n"

# Setup backend .env
echo -e "${CYAN}🔧 Configuration backend...${NC}"
if [ ! -f "$PROJECT_ROOT/backend/.env" ]; then
  if [ -f "$PROJECT_ROOT/backend/envDefault" ]; then
    cp "$PROJECT_ROOT/backend/envDefault" "$PROJECT_ROOT/backend/.env"
    echo -e "${GREEN}✓ Créé backend/.env${NC}"
  else
    echo -e "${RED}❌ envDefault non trouvé${NC}"
    exit 1
  fi
else
  echo -e "${YELLOW}⚠ backend/.env existe déjà (non modifié)${NC}"
fi

# Install backend dependencies
if [ ! -d "$PROJECT_ROOT/backend/node_modules" ]; then
  echo -e "${CYAN}📦 Installation dépendances backend...${NC}"
  cd "$PROJECT_ROOT/backend"
  npm install
  cd "$PROJECT_ROOT"
  echo -e "${GREEN}✓ Dépendances backend installées${NC}\n"
else
  echo -e "${YELLOW}⚠ Dépendances backend déjà installées${NC}\n"
fi

# Install frontend dependencies
if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
  echo -e "${CYAN}📦 Installation dépendances frontend...${NC}"
  cd "$PROJECT_ROOT"
  npm install
  echo -e "${GREEN}✓ Dépendances frontend installées${NC}\n"
else
  echo -e "${YELLOW}⚠ Dépendances frontend déjà installées${NC}\n"
fi

# Build frontend
echo -e "${CYAN}🔨 Build frontend...${NC}"
cd "$PROJECT_ROOT"
npm run build
echo -e "${GREEN}✓ Frontend compilé${NC}\n"

# Summary
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ Setup Terminé avec Succès                          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${CYAN}🚀 Prêt à démarrer!${NC}\n"

echo -e "${YELLOW}Options de démarrage:${NC}"
echo -e "  1️⃣  Tout en un (backend + frontend):"
echo -e "      ${GREEN}./start.sh${NC} ou ${GREEN}./local/start.sh${NC}\n"

echo -e "  2️⃣  Backend seul:"
echo -e "      ${GREEN}./local/start-backend-only.sh${NC}\n"

echo -e "  3️⃣  Frontend seul:"
echo -e "      ${GREEN}./local/start-frontend-only.sh${NC}\n"

echo -e "${CYAN}📖 Documentation:${NC}"
echo -e "  Voir ${GREEN}./local/README.md${NC} pour plus de détails\n"

echo -e "${YELLOW}ℹ️  Configuration requise:${NC}"
echo -e "  1. Mettez à jour ${GREEN}backend/.env${NC} avec:"
echo -e "     - Credentials Elasticsearch (ES_NODE, ES_USERNAME, ES_PASSWORD)"
echo -e "     - JWT secrets sécurisés (optionnel en dev)"
echo -e "     - URLs frontend si différent de localhost:5173\n"

echo -e "${YELLOW}🔐 En production:${NC}"
echo -e "  - Changez JWT_SECRET et JWT_REFRESH_SECRET"
echo -e "  - Utilisez une base de données PostgreSQL/MariaDB"
echo -e "  - Configurez les certificats SSL/TLS\n"
