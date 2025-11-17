#!/bin/bash
set -e

# ================================================
# SFI Dashboard Monitoring - Production Installation Script
# ================================================
# Déploiement sur Ubuntu Server 20.04/22.04 LTS
# Configuration: Systemd + Node.js + Nginx + Local Services
# IP Serveur: 172.27.28.14

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}SFI Dashboard Monitoring - Installation${NC}"
echo -e "${BLUE}========================================${NC}"

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}Ce script doit être exécuté en tant que root${NC}"
   exit 1
fi

# ================================================
# 1. Update system packages
# ================================================
echo -e "${YELLOW}[1/10] Mise à jour des paquets système...${NC}"
apt update && apt upgrade -y

# ================================================
# 2. Install Node.js 18+
# ================================================
echo -e "${YELLOW}[2/10] Installation de Node.js...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
else
    echo -e "${GREEN}Node.js déjà installé: $(node --version)${NC}"
fi

# ================================================
# 3. Install Nginx
# ================================================
echo -e "${YELLOW}[3/10] Installation de Nginx...${NC}"
apt install -y nginx
systemctl enable nginx

# ================================================
# 4. Install Git (pour cloner le projet)
# ================================================
echo -e "${YELLOW}[4/10] Installation de Git...${NC}"
apt install -y git

# ================================================
# 5. Create application user
# ================================================
echo -e "${YELLOW}[5/10] Création de l'utilisateur d'application...${NC}"
if ! id -u sfi > /dev/null 2>&1; then
    useradd -m -s /bin/bash sfi
    echo -e "${GREEN}✓ Utilisateur 'sfi' créé${NC}"
else
    echo -e "${GREEN}Utilisateur 'sfi' existe déjà${NC}"
fi

# Add sfi to necessary groups and make sudoer
usermod -aG www-data sfi
usermod -aG sudo sfi

# Allow sfi to run sudo without password (for apt, etc)
echo "sfi ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/sfi
chmod 440 /etc/sudoers.d/sfi

# ================================================
# 6. Create application directories
# ================================================
echo -e "${YELLOW}[6/10] Création des répertoires d'application...${NC}"
mkdir -p /opt/sfiDashMonitoring
mkdir -p /opt/sfiDashMonitoring/logs
chown -R sfi:sfi /opt/sfiDashMonitoring
chmod 755 /opt/sfiDashMonitoring
chmod 755 /opt/sfiDashMonitoring/logs

# ================================================
# 7. Clone/Copy project
# ================================================
echo -e "${YELLOW}[7/10] Préparation du projet...${NC}"

# If project is already in /opt, skip cloning
if [ -f "/opt/sfiDashMonitoring/package.json" ]; then
    echo -e "${GREEN}Projet trouvé dans /opt/sfiDashMonitoring${NC}"
else
    echo -e "${YELLOW}Entrez le chemin du projet source (ex: /home/user/sfiDashMonitoring):${NC}"
    read -p "Chemin: " PROJECT_PATH
    
    if [ -d "$PROJECT_PATH" ]; then
        cp -r "$PROJECT_PATH"/* /opt/sfiDashMonitoring/
        echo -e "${GREEN}✓ Projet copié${NC}"
    else
        echo -e "${RED}Chemin du projet invalide${NC}"
        exit 1
    fi
fi

chown -R sfi:sfi /opt/sfiDashMonitoring

# ================================================
# 8. Install dependencies
# ================================================
echo -e "${YELLOW}[8/10] Installation des dépendances...${NC}"

# Backend dependencies
echo "Installation des dépendances backend..."
cd /opt/sfiDashMonitoring/backend
sudo -u sfi npm install --production

# Frontend dependencies et build
echo "Installation et build du frontend..."
cd /opt/sfiDashMonitoring
sudo -u sfi npm install
sudo -u sfi npm run build

# Vérifier que le build a réussi
if [ ! -d "/opt/sfiDashMonitoring/dist" ]; then
    echo -e "${RED}❌ Erreur: Frontend build a échoué${NC}"
    exit 1
fi

# Copy build output to Nginx
mkdir -p /usr/share/nginx/html
rm -rf /usr/share/nginx/html/*
cp -r /opt/sfiDashMonitoring/dist/* /usr/share/nginx/html/
chown -R nginx:nginx /usr/share/nginx/html

# ================================================
# 9. Configure Nginx
# ================================================
echo -e "${YELLOW}[9/10] Configuration de Nginx...${NC}"
cp /opt/sfiDashMonitoring/deployed/nginx.conf /etc/nginx/nginx.conf

# Test Nginx configuration
nginx -t
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Configuration Nginx valide${NC}"
    systemctl restart nginx
else
    echo -e "${RED}❌ Erreur dans la configuration Nginx${NC}"
    exit 1
fi

# ================================================
# 10. Setup Systemd services
# ================================================
echo -e "${YELLOW}[10/10] Configuration des services Systemd...${NC}"

# Backend service
cp /opt/sfiDashMonitoring/deployed/sfiDashMonitoring-backend.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable sfiDashMonitoring-backend.service

# Start le service
systemctl start sfiDashMonitoring-backend
sleep 2

# Vérifier que le backend a démarré
if ! systemctl is-active --quiet sfiDashMonitoring-backend; then
    echo -e "${RED}❌ Erreur: Backend n'a pas pu démarrer${NC}"
    echo "Logs:"
    journalctl -u sfiDashMonitoring-backend -n 20
    exit 1
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Installation réussie!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "⏭️  Étapes finales:"
echo ""
echo "1. Configurer les secrets JWT:"
echo "   sudo nano /opt/sfiDashMonitoring/backend/.env"
echo "   Générer: openssl rand -base64 32"
echo ""
echo "2. Redémarrer le backend:"
echo "   sudo systemctl restart sfiDashMonitoring-backend"
echo ""
echo "3. Accéder à l'application:"
echo "   http://172.27.28.14"
echo ""
echo "4. Vérifier les logs:"
echo "   sudo journalctl -u sfiDashMonitoring-backend -f"
echo ""
