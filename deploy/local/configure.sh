#!/usr/bin/env bash

# ================================================
# Configure Local Setup
# Initialise la configuration pour localhost
# ================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Configuration Local Setup - SFI Monitoring            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}\n"

# Step 1: Setup .env.local
echo -e "${YELLOW}[STEP 1]${NC} Configuration Frontend - .env.local\n"

if [ -f ".env.local" ]; then
    echo -e "${YELLOW}  .env.local existe déjà${NC}"
    read -p "  Overwrite? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}  ✓ Skipped${NC}\n"
    else
        cp "$SCRIPT_DIR/.env.local" .env.local
        echo -e "${GREEN}  ✓ .env.local mis à jour${NC}\n"
    fi
else
    cp "$SCRIPT_DIR/.env.local" .env.local
    echo -e "${GREEN}  ✓ .env.local créé${NC}\n"
fi

# Step 2: Verify backend/.env
echo -e "${YELLOW}[STEP 2]${NC} Configuration Backend\n"

if [ ! -f "backend/.env" ]; then
    if [ -f "backend/envDefault" ]; then
        cp backend/envDefault backend/.env
        echo -e "${GREEN}  ✓ backend/.env créé${NC}\n"
    else
        echo -e "${RED}  ✗ backend/envDefault non trouvé${NC}\n"
        exit 1
    fi
else
    echo -e "${GREEN}  ✓ backend/.env existe${NC}\n"
fi

# Update FRONTEND_URL
if ! grep -q "FRONTEND_URL=.*localhost:5173" backend/.env; then
    sed -i 's|^FRONTEND_URL=.*|FRONTEND_URL=http://localhost:3000 http://localhost:5173|' backend/.env
    echo -e "${GREEN}  ✓ FRONTEND_URL mis à jour${NC}\n"
fi

# Step 3: Check Node.js
echo -e "${YELLOW}[STEP 3]${NC} Vérifier les prérequis\n"

if ! command -v node &>/dev/null; then
    echo -e "${RED}  ✗ Node.js non installé${NC}"
    exit 1
fi
echo -e "${GREEN}  ✓ Node.js: $(node --version)${NC}"

if ! command -v npm &>/dev/null; then
    echo -e "${RED}  ✗ npm non installé${NC}"
    exit 1
fi
echo -e "${GREEN}  ✓ npm: $(npm --version)\n${NC}"

# Step 4: Install dependencies
echo -e "${YELLOW}[STEP 4]${NC} Installation des dépendances\n"

if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}  📦 Installation frontend...${NC}"
    npm install --no-save > /dev/null 2>&1
    echo -e "${GREEN}  ✓ Frontend OK${NC}"
else
    echo -e "${GREEN}  ✓ Frontend dépendances OK${NC}"
fi

if [ ! -d "backend/node_modules" ]; then
    echo -e "${BLUE}  📦 Installation backend...${NC}"
    (cd backend && npm install --no-save > /dev/null 2>&1)
    echo -e "${GREEN}  ✓ Backend OK${NC}"
else
    echo -e "${GREEN}  ✓ Backend dépendances OK${NC}"
fi
echo

# Summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  ✅ Configuration complète!                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${CYAN}🚀 Démarrage:${NC}"
echo -e "  $SCRIPT_DIR/start.sh\n"

echo -e "${CYAN}🧪 Test:${NC}"
echo -e "  $SCRIPT_DIR/test.sh\n"
