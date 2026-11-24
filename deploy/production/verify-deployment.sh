#!/bin/bash

# ================================================
# SFI Dashboard Monitoring - Deployment Verification
# ================================================
# Vérifie que le déploiement est correct sur Ubuntu Server

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

FAILED=0
SUCCESS=0

check_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
        ((SUCCESS++))
    else
        echo -e "${RED}✗ $2${NC}"
        ((FAILED++))
    fi
}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Vérification du Déploiement${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 1. Vérifier que Node.js est installé
echo -e "${YELLOW}[Système]${NC}"
node --version > /dev/null 2>&1
check_result $? "Node.js installé"

npm --version > /dev/null 2>&1
check_result $? "npm installé"

nginx -v > /dev/null 2>&1
check_result $? "Nginx installé"

# 2. Vérifier le répertoire du projet
echo ""
echo -e "${YELLOW}[Répertoires]${NC}"
test -d /opt/sfiDashMonitoring
check_result $? "/opt/sfiDashMonitoring existe"

test -d /opt/sfiDashMonitoring/backend
check_result $? "Répertoire backend existe"

test -d /opt/sfiDashMonitoring/logs
check_result $? "Répertoire logs existe"

test -f /opt/sfiDashMonitoring/backend/.env
check_result $? "Fichier .env existe"

test -f /opt/sfiDashMonitoring/backend/certs/http_ca.crt
check_result $? "Certificat Elasticsearch existe"

# 3. Vérifier les fichiers de configuration
echo ""
echo -e "${YELLOW}[Configuration]${NC}"
test -f /etc/systemd/system/sfiDashMonitoring-backend.service
check_result $? "Service systemd backend configuré"

test -f /etc/nginx/nginx.conf
check_result $? "Configuration Nginx existe"

# 4. Vérifier les utilisateurs et permissions
echo ""
echo -e "${YELLOW}[Permissions]${NC}"
id sfi > /dev/null 2>&1
check_result $? "Utilisateur 'sfi' existe"

test -O /opt/sfiDashMonitoring/backend/.env
check_result $? ".env propriété de sfi"

# 5. Vérifier les services
echo ""
echo -e "${YELLOW}[Services]${NC}"
systemctl is-active --quiet sfiDashMonitoring-backend
check_result $? "Service backend est actif"

systemctl is-active --quiet nginx
check_result $? "Service Nginx est actif"

systemctl is-enabled --quiet sfiDashMonitoring-backend
check_result $? "Service backend activé au démarrage"

systemctl is-enabled --quiet nginx
check_result $? "Service Nginx activé au démarrage"

# 6. Vérifier les ports
echo ""
echo -e "${YELLOW}[Ports]${NC}"
netstat -tlnp 2>/dev/null | grep -q ":3001"
check_result $? "Port 3001 (Backend) écoute"

netstat -tlnp 2>/dev/null | grep -q ":80"
check_result $? "Port 80 (Nginx) écoute"

# 7. Vérifier la connectivité
echo ""
echo -e "${YELLOW}[Connectivité]${NC}"
curl -s http://localhost/health > /dev/null 2>&1
check_result $? "Frontend accessible (http://localhost)"

curl -s http://localhost:3001/api > /dev/null 2>&1
check_result $? "Backend API accessible"

# 8. Vérifier les variables d'environnement critiques
echo ""
echo -e "${YELLOW}[Variables d'environnement]${NC}"
grep -q "NODE_ENV=production" /opt/sfiDashMonitoring/backend/.env
check_result $? "NODE_ENV est défini à production"

grep -q "ES_NODE=" /opt/sfiDashMonitoring/backend/.env
check_result $? "ES_NODE est configuré"

grep -q "JWT_SECRET=" /opt/sfiDashMonitoring/backend/.env
check_result $? "JWT_SECRET est configuré"

# 9. Vérifier les logs (pas d'erreurs critiques)
echo ""
echo -e "${YELLOW}[Logs]${NC}"
ERROR_COUNT=$(journalctl -u sfiDashMonitoring-backend -n 100 2>/dev/null | grep -i "error" | wc -l)
if [ $ERROR_COUNT -eq 0 ]; then
    echo -e "${GREEN}✓ Pas d'erreurs récentes${NC}"
    ((SUCCESS++))
else
    echo -e "${YELLOW}⚠ $ERROR_COUNT erreurs détectées dans les logs${NC}"
fi

# 10. Vérifier la connectivité Elasticsearch
echo ""
echo -e "${YELLOW}[Elasticsearch]${NC}"
ES_CHECK=$(curl -s -k --user stgSFI:Police2405$ https://172.27.28.14:9200 2>/dev/null | grep -q "cluster_name" && echo "1" || echo "0")
if [ "$ES_CHECK" = "1" ]; then
    echo -e "${GREEN}✓ Connexion Elasticsearch réussie${NC}"
    ((SUCCESS++))
else
    echo -e "${YELLOW}⚠ Impossible de vérifier Elasticsearch${NC}"
fi

# ================================================
# Résumé
# ================================================
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Résumé de la Vérification${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Vérifications réussies: $SUCCESS${NC}"
echo -e "${RED}Vérifications échouées: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ Déploiement vérifié avec succès!${NC}"
    echo ""
    echo "Accès à l'application:"
    echo -e "${BLUE}http://172.27.28.14${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Des vérifications ont échoué.${NC}"
    echo ""
    echo "Points de vérification à faire:"
    echo "1. Vérifier les logs: sudo journalctl -u sfiDashMonitoring-backend -f"
    echo "2. Vérifier la configuration: nano /opt/sfiDashMonitoring/backend/.env"
    echo "3. Redémarrer les services: sudo systemctl restart sfiDashMonitoring-backend nginx"
    echo ""
    exit 1
fi
