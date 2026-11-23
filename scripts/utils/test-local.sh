#!/bin/bash

# Test local du frontend et backend avant déploiement

echo "🧪 Test local du frontend et backend..."
echo ""

PROJECT_DIR="/home/shadowcraft/Projets/sfiDashMonitoring"
ERRORS=0

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        ((ERRORS++))
    fi
}

# ======== FRONTEND ========
echo -e "${YELLOW}[FRONTEND]${NC}"

# Vérifier package.json
test -f "$PROJECT_DIR/package.json"
test_result $? "package.json existe"

# Vérifier vite.config.js
test -f "$PROJECT_DIR/vite.config.js"
test_result $? "vite.config.js existe"

# Vérifier que npm existe
command -v npm &>/dev/null
test_result $? "npm installé"

# Lister les dépendances frontend critiques
echo ""
echo "Vérification des dépendances frontend:"
if [ -f "$PROJECT_DIR/package.json" ]; then
    grep -q "react" "$PROJECT_DIR/package.json" && echo -e "${GREEN}  ✅ React${NC}" || echo -e "${RED}  ❌ React manquant${NC}"
    grep -q "vite" "$PROJECT_DIR/package.json" && echo -e "${GREEN}  ✅ Vite${NC}" || echo -e "${RED}  ❌ Vite manquant${NC}"
    grep -q "socket.io-client" "$PROJECT_DIR/package.json" && echo -e "${GREEN}  ✅ Socket.io${NC}" || echo -e "${RED}  ❌ Socket.io manquant${NC}"
fi

# ======== BACKEND ========
echo ""
echo -e "${YELLOW}[BACKEND]${NC}"

# Vérifier package.json backend
test -f "$PROJECT_DIR/backend/package.json"
test_result $? "Backend package.json existe"

# Vérifier server.js
test -f "$PROJECT_DIR/backend/server.js" || test -f "$PROJECT_DIR/backend/src/server.js"
test_result $? "Backend server.js existe"

# Vérifier .env
test -f "$PROJECT_DIR/backend/.env"
test_result $? "Backend .env existe"

# Vérifier Elasticsearch certificate
test -f "$PROJECT_DIR/backend/certs/http_ca.crt"
test_result $? "Certificat Elasticsearch existe"

echo ""
echo "Vérification des dépendances backend:"
if [ -f "$PROJECT_DIR/backend/package.json" ]; then
    grep -q "express" "$PROJECT_DIR/backend/package.json" && echo -e "${GREEN}  ✅ Express${NC}" || echo -e "${RED}  ❌ Express manquant${NC}"
    grep -q "socket.io" "$PROJECT_DIR/backend/package.json" && echo -e "${GREEN}  ✅ Socket.io${NC}" || echo -e "${RED}  ❌ Socket.io manquant${NC}"
    grep -q "@elastic/elasticsearch" "$PROJECT_DIR/backend/package.json" && echo -e "${GREEN}  ✅ Elasticsearch client${NC}" || echo -e "${RED}  ❌ Elasticsearch client manquant${NC}"
    grep -q "sequelize" "$PROJECT_DIR/backend/package.json" && echo -e "${GREEN}  ✅ Sequelize${NC}" || echo -e "${RED}  ❌ Sequelize manquant${NC}"
fi

# ======== CONFIGURATION ========
echo ""
echo -e "${YELLOW}[CONFIGURATION]${NC}"

# Vérifier .env backend
if [ -f "$PROJECT_DIR/backend/.env" ]; then
    grep -q "ES_NODE" "$PROJECT_DIR/backend/.env" && echo -e "${GREEN}✅ ES_NODE configuré${NC}" || echo -e "${RED}❌ ES_NODE manquant${NC}"
    grep -q "NODE_ENV" "$PROJECT_DIR/backend/.env" && echo -e "${GREEN}✅ NODE_ENV configuré${NC}" || echo -e "${RED}❌ NODE_ENV manquant${NC}"
    grep -q "PORT" "$PROJECT_DIR/backend/.env" && echo -e "${GREEN}✅ PORT configuré${NC}" || echo -e "${RED}❌ PORT manquant${NC}"
    grep -q "FRONTEND_URL" "$PROJECT_DIR/backend/.env" && echo -e "${GREEN}✅ FRONTEND_URL configuré${NC}" || echo -e "${RED}❌ FRONTEND_URL manquant${NC}"
    grep -q "JWT_SECRET" "$PROJECT_DIR/backend/.env" && echo -e "${GREEN}✅ JWT_SECRET configuré${NC}" || echo -e "${RED}❌ JWT_SECRET manquant${NC}"
fi

# ======== SOURCE CODE ========
echo ""
echo -e "${YELLOW}[SOURCE CODE]${NC}"

test -d "$PROJECT_DIR/frontend/src"
test_result $? "Répertoire frontend/src/ existe"

test -d "$PROJECT_DIR/backend/src"
test_result $? "Répertoire backend/src/ existe"

test -f "$PROJECT_DIR/frontend/src/App.jsx"
test_result $? "App.jsx existe dans frontend/src/"

# ======== RÉSUMÉ ========
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ TOUS LES TESTS PASSENT${NC}"
    echo ""
    echo "Prêt pour le déploiement!"
    echo ""
    echo "Prochaines étapes:"
    echo "1. scp deployed/install-production.sh user@172.27.28.14:/tmp/"
    echo "2. ssh user@172.27.28.14"
    echo "3. sudo bash /tmp/install-production.sh"
    echo ""
    exit 0
else
    echo -e "${RED}❌ $ERRORS PROBLÈME(S) DÉTECTÉ(S)${NC}"
    echo ""
    echo "Vérifiez la configuration avant le déploiement."
    echo ""
    exit 1
fi
