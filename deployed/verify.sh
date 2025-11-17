#!/bin/bash

# 🧪 Script de vérification du déploiement
# Teste tous les composants du déploiement Systemd

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SERVER_IP="172.27.28.14"
BACKEND_PORT="3001"
FRONTEND_PORT="80"

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_ok() {
    echo -e "${GREEN}✓${NC} $1"
}

print_fail() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Compteurs
PASSED=0
FAILED=0
WARNINGS=0

test_item() {
    local name="$1"
    local cmd="$2"
    
    if eval "$cmd" > /dev/null 2>&1; then
        print_ok "$name"
        ((PASSED++))
        return 0
    else
        print_fail "$name"
        ((FAILED++))
        return 1
    fi
}

print_header "🧪 Vérification du Déploiement SFI Dashboard"

# ============ SERVICES ============
print_header "1️⃣ État des Services"

echo ""
print_info "Backend Service:"
if sudo systemctl is-active --quiet sfi-monitoring-backend; then
    print_ok "Service actif"
    ((PASSED++))
else
    print_fail "Service inactif"
    ((FAILED++))
fi

echo ""
print_info "Nginx Service:"
if sudo systemctl is-active --quiet nginx; then
    print_ok "Service actif"
    ((PASSED++))
else
    print_fail "Service inactif"
    ((FAILED++))
fi

echo ""
print_info "Elasticsearch Service:"
if sudo systemctl is-active --quiet elasticsearch 2>/dev/null; then
    print_ok "Service actif"
    ((PASSED++))
else
    print_warning "Elasticsearch inactive (vérifier si distant)"
    ((WARNINGS++))
fi

# ============ PORTS ============
print_header "2️⃣ Vérification des Ports"

echo ""
print_info "Port $BACKEND_PORT (Backend):"
if sudo netstat -tlnp 2>/dev/null | grep -q ":$BACKEND_PORT "; then
    print_ok "Backend écoute sur le port $BACKEND_PORT"
    ((PASSED++))
else
    print_fail "Backend n'écoute pas sur le port $BACKEND_PORT"
    ((FAILED++))
fi

echo ""
print_info "Port $FRONTEND_PORT (Nginx):"
if sudo netstat -tlnp 2>/dev/null | grep -q ":$FRONTEND_PORT "; then
    print_ok "Nginx écoute sur le port $FRONTEND_PORT"
    ((PASSED++))
else
    print_fail "Nginx n'écoute pas sur le port $FRONTEND_PORT"
    ((FAILED++))
fi

# ============ CONNECTIVITÉ ============
print_header "3️⃣ Tests de Connectivité"

echo ""
print_info "Backend Health Check (local):"
if curl -s http://127.0.0.1:3001/api/health > /dev/null 2>&1; then
    print_ok "Backend répond"
    ((PASSED++))
    # Afficher le health check
    echo "    Réponse:"
    curl -s http://127.0.0.1:3001/api/health | jq . 2>/dev/null | head -5 || curl -s http://127.0.0.1:3001/api/health | head -5
else
    print_fail "Backend ne répond pas"
    ((FAILED++))
fi

echo ""
print_info "Frontend (via Nginx):"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://$SERVER_IP)
if [ "$HTTP_CODE" = "200" ]; then
    print_ok "Frontend accessible (HTTP $HTTP_CODE)"
    ((PASSED++))
else
    print_fail "Frontend non accessible (HTTP $HTTP_CODE)"
    ((FAILED++))
fi

echo ""
print_info "WebSocket Connectivity:"
if curl -s -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" http://127.0.0.1:3001/ws 2>&1 | grep -q -i "websocket\|upgrade"; then
    print_ok "WebSocket disponible"
    ((PASSED++))
else
    print_warning "WebSocket peut nécessiter une requête valide"
    ((WARNINGS++))
fi

# ============ FICHIERS & PERMISSIONS ============
print_header "4️⃣ Vérification Fichiers et Permissions"

echo ""
APP_DIR="/opt/sfiDashMonitoring"

print_info "Application Directory:"
if [ -d "$APP_DIR" ]; then
    print_ok "Répertoire existe"
    ((PASSED++))
else
    print_fail "Répertoire n'existe pas: $APP_DIR"
    ((FAILED++))
fi

echo ""
print_info "Frontend Build (dist):"
if [ -d "$APP_DIR/dist" ]; then
    print_ok "Build frontend existe"
    FILE_COUNT=$(find $APP_DIR/dist -type f | wc -l)
    print_info "  Fichiers: $FILE_COUNT"
    ((PASSED++))
else
    print_fail "Build frontend non trouvé"
    ((FAILED++))
fi

echo ""
print_info "Backend Directory:"
if [ -d "$APP_DIR/backend" ]; then
    print_ok "Répertoire backend existe"
    ((PASSED++))
else
    print_fail "Répertoire backend n'existe pas"
    ((FAILED++))
fi

echo ""
print_info "Backend .env:"
if [ -f "$APP_DIR/backend/.env" ]; then
    print_ok "Fichier .env existe"
    ((PASSED++))
    # Vérifier les variables
    echo "    Variables configurées:"
    grep -E "NODE_ENV|PORT|ES_HOST|FRONTEND_URL" "$APP_DIR/backend/.env" | sed 's/^/      /'
else
    print_fail "Fichier .env n'existe pas"
    ((FAILED++))
fi

echo ""
print_info "Permissions:"
OWNER=$(ls -ld $APP_DIR | awk '{print $3":"$4}')
if [[ "$OWNER" == *"sfiapp"* ]]; then
    print_ok "Permissions correctes ($OWNER)"
    ((PASSED++))
else
    print_warning "Propriétaire: $OWNER (devrait être sfiapp)"
    ((WARNINGS++))
fi

# ============ LOGS ============
print_header "5️⃣ Vérification des Logs"

echo ""
print_info "Logs Backend (dernières lignes):"
echo "---"
sudo journalctl -u sfi-monitoring-backend -n 10 --no-pager | tail -5
echo "---"

echo ""
print_info "Erreurs Backend récentes:"
ERROR_COUNT=$(sudo journalctl -u sfi-monitoring-backend --since "1 hour ago" | grep -i "error\|fail" | wc -l)
if [ "$ERROR_COUNT" -eq 0 ]; then
    print_ok "Aucune erreur détectée (dernière heure)"
    ((PASSED++))
else
    print_warning "$ERROR_COUNT ligne(s) d'erreur détectée(s)"
    ((WARNINGS++))
    sudo journalctl -u sfi-monitoring-backend --since "1 hour ago" | grep -i "error\|fail" | tail -3
fi

# ============ ELASTICSEARCH ============
print_header "6️⃣ Vérification Elasticsearch"

echo ""
print_info "Elasticsearch Health:"
if curl -s http://localhost:9200/_cluster/health > /dev/null 2>&1; then
    CLUSTER_STATUS=$(curl -s http://localhost:9200/_cluster/health | jq -r '.status' 2>/dev/null || echo "unknown")
    print_ok "Elasticsearch répond (Status: $CLUSTER_STATUS)"
    ((PASSED++))
    
    echo ""
    print_info "Indices disponibles:"
    curl -s http://localhost:9200/_cat/indices?format=json 2>/dev/null | jq '.[].index' 2>/dev/null | head -5 || echo "  Impossible de récupérer les indices"
else
    print_fail "Elasticsearch ne répond pas"
    ((FAILED++))
fi

# ============ NGINX ============
print_header "7️⃣ Vérification Nginx"

echo ""
print_info "Nginx Configuration Test:"
if sudo nginx -t > /dev/null 2>&1; then
    print_ok "Configuration valide"
    ((PASSED++))
else
    print_fail "Erreur dans la configuration Nginx"
    ((FAILED++))
    sudo nginx -t
fi

echo ""
print_info "Nginx Sites Enabled:"
if [ -L /etc/nginx/sites-enabled/sfi-monitoring ]; then
    print_ok "Virtual host activé"
    ((PASSED++))
else
    print_fail "Virtual host non activé"
    ((FAILED++))
fi

# ============ UPTIME & PERFORMANCE ============
print_header "8️⃣ Uptime et Performance"

echo ""
print_info "Backend Uptime:"
UPTIME=$(sudo systemctl show -p ActiveEnterTimestamp sfi-monitoring-backend | cut -d= -f2-)
if [ ! -z "$UPTIME" ]; then
    print_ok "Démarré: $UPTIME"
    ((PASSED++))
fi

echo ""
print_info "Utilisation ressources (Backend):"
PID=$(pgrep -f "node.*backend/server.js" | head -1)
if [ ! -z "$PID" ]; then
    PS_OUTPUT=$(ps aux | grep $PID | grep -v grep)
    echo "  $PS_OUTPUT" | awk '{print "    CPU: "$3"% | MEM: "$4"%"}'
else
    print_warning "Processus backend non trouvé"
fi

# ============ RÉSUMÉ FINAL ============
print_header "📊 Résumé"

TOTAL=$((PASSED + FAILED + WARNINGS))
echo ""
echo "Tests réussis:     ${GREEN}$PASSED${NC}"
echo "Tests échoués:     ${RED}$FAILED${NC}"
echo "Avertissements:    ${YELLOW}$WARNINGS${NC}"
echo "Total:             $TOTAL"

echo ""
if [ "$FAILED" -eq 0 ]; then
    print_ok "✅ Déploiement vérifié avec succès!"
    EXIT_CODE=0
else
    print_fail "❌ Certains tests ont échoué"
    EXIT_CODE=1
fi

# ============ RECOMMANDATIONS ============
if [ "$FAILED" -gt 0 ] || [ "$WARNINGS" -gt 0 ]; then
    print_header "💡 Actions Recommandées"
    
    if [ "$FAILED" -gt 0 ]; then
        echo ""
        echo "Pour les tests échoués:"
        echo "  1. Consulter les logs: sudo journalctl -u sfi-monitoring-backend -f"
        echo "  2. Vérifier Elasticsearch: curl http://localhost:9200"
        echo "  3. Redémarrer le service: sudo systemctl restart sfi-monitoring-backend"
    fi
    
    if [ "$WARNINGS" -gt 0 ]; then
        echo ""
        echo "Pour les avertissements:"
        echo "  1. Consulter la documentation"
        echo "  2. Vérifier les services distants si applicable"
    fi
fi

echo ""
print_header "🔍 Liens Utiles"

echo ""
echo "Frontend:    http://$SERVER_IP"
echo "Backend:     http://$SERVER_IP/api"
echo "Health:      http://$SERVER_IP/api/health"
echo ""
echo "Logs Backend:"
echo "  sudo journalctl -u sfi-monitoring-backend -f"
echo ""
echo "Redémarrer services:"
echo "  sudo systemctl restart sfi-monitoring-backend nginx"
echo ""

exit $EXIT_CODE
