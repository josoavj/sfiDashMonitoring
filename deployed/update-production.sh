#!/bin/bash

# ================================================
# Update Deployment Script
# ================================================
# Met à jour le code en production, recompile et redémarre les services

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Mise à Jour du Déploiement${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Vérifier que le script est exécuté avec les bons droits
if [ ! -w /opt/sfiDashMonitoring ]; then
    echo -e "${RED}Erreur: Vous n'avez pas les permissions pour /opt/sfiDashMonitoring${NC}"
    echo "Exécutez avec sudo"
    exit 1
fi

# Chemin du projet
PROJECT_PATH="/opt/sfiDashMonitoring"

# 1. Arrêter le service backend
echo -e "${YELLOW}[1/6] Arrêt du service backend...${NC}"
sudo systemctl stop sfiDashMonitoring-backend || true
sleep 2
echo -e "${GREEN}✓ Service backend arrêté${NC}"

# 2. Mettre à jour le code
echo ""
echo -e "${YELLOW}[2/6] Mise à jour du code...${NC}"

# Option A: Git pull (si le projet est en Git)
if [ -d "$PROJECT_PATH/.git" ]; then
    cd "$PROJECT_PATH"
    sudo -u sfi git pull origin main || git pull origin main
    echo -e "${GREEN}✓ Code mis à jour depuis Git${NC}"
else
    # Option B: Attendre une copie manuelle
    echo -e "${YELLOW}Attendez la mise à jour du code par copie...${NC}"
    read -p "Appuyez sur ENTRÉE une fois que le code est à jour..."
fi

# 3. Installer/mettre à jour les dépendances backend
echo ""
echo -e "${YELLOW}[3/6] Mise à jour des dépendances backend...${NC}"
cd "$PROJECT_PATH/backend"
sudo -u sfi npm install --production
echo -e "${GREEN}✓ Dépendances backend mises à jour${NC}"

# 4. Mettre à jour les dépendances frontend et compiler
echo ""
echo -e "${YELLOW}[4/6] Mise à jour et compilation du frontend...${NC}"
cd "$PROJECT_PATH"
sudo -u sfi npm install
sudo -u sfi npm run build
echo -e "${GREEN}✓ Frontend compilé${NC}"

# 5. Déployer les fichiers frontend
echo ""
echo -e "${YELLOW}[5/6] Déploiement des fichiers frontend...${NC}"
sudo rm -rf /usr/share/nginx/html/*
sudo cp -r "$PROJECT_PATH/dist"/* /usr/share/nginx/html/
sudo chown -R nginx:nginx /usr/share/nginx/html
echo -e "${GREEN}✓ Fichiers frontend déployés${NC}"

# 6. Redémarrer les services
echo ""
echo -e "${YELLOW}[6/6] Redémarrage des services...${NC}"
sudo systemctl start sfiDashMonitoring-backend
sleep 2
sudo systemctl reload nginx
echo -e "${GREEN}✓ Services redémarrés${NC}"

# Vérification finale
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Vérification Finale${NC}"
echo -e "${BLUE}========================================${NC}"

if sudo systemctl is-active --quiet sfiDashMonitoring-backend; then
    echo -e "${GREEN}✓ Service backend est actif${NC}"
else
    echo -e "${RED}✗ Erreur: Service backend n'est pas actif${NC}"
    echo "Consultez les logs: sudo journalctl -u sfiDashMonitoring-backend -f"
    exit 1
fi

if sudo systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✓ Service Nginx est actif${NC}"
else
    echo -e "${RED}✗ Erreur: Service Nginx n'est pas actif${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✓ Mise à jour terminée avec succès!${NC}"
echo ""
echo "L'application est accessible à: http://172.27.28.14"
echo ""
echo "Pour vérifier les logs:"
echo "  sudo journalctl -u sfiDashMonitoring-backend -f"
