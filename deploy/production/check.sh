#!/bin/bash

# Vérification complète du déploiement

echo "🔍 Vérification du déploiement SFI Dashboard..."
echo ""

ERRORS=0
WARNINGS=0

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

check() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        ((ERRORS++))
    fi
}

warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((WARNINGS++))
}

# ======== SYSTÈME ========
echo -e "${YELLOW}[SYSTÈME]${NC}"
command -v node &>/dev/null
check $? "Node.js installé ($(node --version))"

command -v npm &>/dev/null
check $? "npm installé"

command -v nginx &>/dev/null
check $? "Nginx installé"

# ======== UTILISATEUR ========
echo ""
echo -e "${YELLOW}[UTILISATEUR]${NC}"
id sfi &>/dev/null
check $? "Utilisateur 'sfi' existe"

sudo -u sfi -n true 2>/dev/null
check $? "Utilisateur 'sfi' peut exécuter sudo sans password"

# ======== RÉPERTOIRES ========
echo ""
echo -e "${YELLOW}[RÉPERTOIRES]${NC}"
test -d /opt/sfiDashMonitoring
check $? "/opt/sfiDashMonitoring existe"

test -f /opt/sfiDashMonitoring/backend/.env
check $? "Backend .env configuré"

test -f /opt/sfiDashMonitoring/backend/server.js
check $? "Backend server.js existe"

test -f /opt/sfiDashMonitoring/vite.config.js
check $? "Frontend vite.config.js existe"

test -d /opt/sfiDashMonitoring/dist
check $? "Frontend compilé (dist/)"

test -f /opt/sfiDashMonitoring/backend/certs/http_ca.crt
check $? "Certificat Elasticsearch existe"

# ======== CONFIGURATION ========
echo ""
echo -e "${YELLOW}[CONFIGURATION]${NC}"
grep -q "NODE_ENV=production" /opt/sfiDashMonitoring/backend/.env
check $? "NODE_ENV=production"

grep -q "PORT=3001" /opt/sfiDashMonitoring/backend/.env
check $? "PORT=3001"

grep -q "ES_NODE=" /opt/sfiDashMonitoring/backend/.env
check $? "ES_NODE configuré"

# ======== SERVICES ========
echo ""
echo -e "${YELLOW}[SERVICES]${NC}"
sudo systemctl is-enabled --quiet sfiDashMonitoring-backend
check $? "Service backend activé au démarrage"

sudo systemctl is-active --quiet sfiDashMonitoring-backend
check $? "Service backend en cours d'exécution"

sudo systemctl is-active --quiet nginx
check $? "Nginx en cours d'exécution"

# ======== PORTS ========
echo ""
echo -e "${YELLOW}[PORTS]${NC}"
sudo netstat -tlnp 2>/dev/null | grep -q ":80 " || sudo ss -tlnp 2>/dev/null | grep -q ":80 "
check $? "Port 80 (Nginx) écoute"

sudo netstat -tlnp 2>/dev/null | grep -q ":3001 " || sudo ss -tlnp 2>/dev/null | grep -q ":3001 "
check $? "Port 3001 (Backend) écoute"

# ======== CONNECTIVITÉ ========
echo ""
echo -e "${YELLOW}[CONNECTIVITÉ]${NC}"
curl -s http://localhost/health >/dev/null 2>&1 || curl -s http://localhost >/dev/null 2>&1
check $? "Frontend accessible (localhost)"

curl -s http://localhost:3001/ >/dev/null 2>&1 || curl -s http://localhost:3001/api >/dev/null 2>&1
check $? "Backend accessible (localhost:3001)"

# Elasticsearch
ES_CHECK=$(curl -s -k --user stgSFI:Police2405$ https://172.27.28.14:9200 2>/dev/null | grep -q "cluster_name" && echo "0" || echo "1")
if [ "$ES_CHECK" = "0" ]; then
    echo -e "${GREEN}✅ Elasticsearch accessible${NC}"
else
    warn "Elasticsearch peut ne pas être accessible (verificar les identifiants)"
fi

# ======== LOGS ========
echo ""
echo -e "${YELLOW}[LOGS]${NC}"
LOG_ERRORS=$(sudo journalctl -u sfiDashMonitoring-backend -n 50 2>/dev/null | grep -i "error" | wc -l)
if [ $LOG_ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ Pas d'erreurs récentes${NC}"
else
    warn "$LOG_ERRORS erreurs détectées dans les logs récents"
fi

# ======== RÉSUMÉ ========
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ DÉPLOIEMENT OK - Prêt à l'emploi!${NC}"
    echo ""
    echo "Accès: http://172.27.28.14"
    echo ""
    exit 0
else
    echo -e "${RED}❌ $ERRORS ERREUR(S) DÉTECTÉE(S)${NC}"
    echo ""
    if [ $WARNINGS -gt 0 ]; then
        echo "Avertissements: $WARNINGS"
    fi
    echo ""
    echo "Pour déboguer:"
    echo "  sudo journalctl -u sfiDashMonitoring-backend -f"
    echo ""
    exit 1
fi
