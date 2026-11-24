#!/bin/bash

# 🔄 Script de mise à jour du déploiement
# Met à jour le code et redémarre les services

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
APP_DIR="/opt/sfiDashMonitoring"
APP_USER="sfiapp"
BRANCH="${1:-update}"  # Par défaut: branch 'update'

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_step() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Vérifier root
if [[ $EUID -ne 0 ]]; then
    print_error "Ce script doit être exécuté en tant que root (sudo)"
    exit 1
fi

print_header "🔄 Mise à Jour SFI Dashboard"

echo "Branche cible: $BRANCH"
echo ""

# Étape 1 : Arrêter les services
print_header "Étape 1 : Arrêter les services"

print_warning "Arrêt du backend..."
sudo systemctl stop sfi-monitoring-backend
print_step "Backend arrêté"

echo ""

# Étape 2 : Récupérer les changements
print_header "Étape 2 : Récupérer le code mis à jour"

cd $APP_DIR

print_warning "Git pull de la branche '$BRANCH'..."
sudo -u $APP_USER git fetch origin $BRANCH
sudo -u $APP_USER git checkout $BRANCH
sudo -u $APP_USER git pull origin $BRANCH

print_step "Code mis à jour"

# Étape 3 : Installer/mettre à jour les dépendances
print_header "Étape 3 : Mettre à jour les dépendances"

echo ""
print_warning "Frontend..."
sudo -u $APP_USER npm install --production
print_step "Frontend dépendances OK"

echo ""
print_warning "Backend..."
cd backend
sudo -u $APP_USER npm install --production
cd ..
print_step "Backend dépendances OK"

# Étape 4 : Build frontend
print_header "Étape 4 : Rebuild du frontend"

print_warning "Building..."
sudo -u $APP_USER npm run build
print_step "Build OK"

# Étape 5 : Redémarrer les services
print_header "Étape 5 : Redémarrer les services"

echo ""
print_warning "Redémarrage backend..."
sudo systemctl start sfi-monitoring-backend
sleep 2

if sudo systemctl is-active --quiet sfi-monitoring-backend; then
    print_step "Backend redémarré ✓"
else
    print_error "Erreur au redémarrage du backend!"
    echo ""
    echo "Logs:"
    journalctl -u sfi-monitoring-backend -n 20
    exit 1
fi

echo ""
print_warning "Recharging Nginx..."
sudo systemctl reload nginx
print_step "Nginx reloadé"

# Étape 6 : Vérifier
print_header "Étape 6 : Vérification"

echo ""
sleep 2

print_warning "Test backend..."
if curl -s http://127.0.0.1:3001/api/health > /dev/null; then
    print_step "Backend répond ✓"
else
    print_error "Backend ne répond pas"
    exit 1
fi

echo ""
print_warning "Test frontend..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1)
if [ "$HTTP_CODE" = "200" ]; then
    print_step "Frontend accessible (HTTP $HTTP_CODE) ✓"
else
    print_error "Frontend retourne HTTP $HTTP_CODE"
    exit 1
fi

# Résumé
print_header "✅ Mise à Jour Complète"

echo ""
echo "✓ Code mis à jour (branche: $BRANCH)"
echo "✓ Dépendances installées"
echo "✓ Frontend rebuild"
echo "✓ Services redémarrés"
echo ""

# Afficher les derniers logs
print_header "Derniers Logs"

echo ""
echo "Backend (dernières 10 lignes):"
echo "---"
journalctl -u sfi-monitoring-backend -n 10 --no-pager
echo "---"

echo ""
echo "✅ Application mise à jour et redémarrée!"
echo ""
echo "Consulter les logs:"
echo "  sudo journalctl -u sfi-monitoring-backend -f"
