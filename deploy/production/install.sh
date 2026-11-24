#!/bin/bash

# 🚀 Script d'installation automatisée - SFI Dashboard
# Pour Ubuntu Server 20.04/22.04 LTS
# Configuration: Systemd + Node.js + Nginx + Elasticsearch local
# IP Serveur: 172.27.28.14

set -e  # Exit on error

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVER_IP="172.27.28.14"
APP_USER="sfi"
APP_DIR="/opt/sfiDashMonitoring"
BACKEND_PORT="3001"
FRONTEND_PORT="80"

# Fonctions utilitaires
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

# Vérifier si root
if [[ $EUID -ne 0 ]]; then
   print_error "Ce script doit être exécuté en tant que root (sudo)"
   exit 1
fi

print_header "Installation SFI Dashboard - Systemd"

# Étape 1 : Mise à jour système
print_header "Étape 1 : Mise à jour du système"
apt update
apt upgrade -y
print_step "Système à jour"

# Étape 2 : Installer les dépendances
print_header "Étape 2 : Installation des dépendances"

# Node.js
if ! command -v node &> /dev/null; then
    print_warning "Node.js non trouvé, installation..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
    print_step "Node.js installé ($(node --version))"
else
    print_step "Node.js déjà installé ($(node --version))"
fi

# Nginx
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
    print_step "Nginx installé"
else
    print_step "Nginx déjà installé"
fi

# git
if ! command -v git &> /dev/null; then
    apt install -y git
    print_step "Git installé"
else
    print_step "Git déjà installé"
fi

# curl
if ! command -v curl &> /dev/null; then
    apt install -y curl
    print_step "Curl installé"
fi

# Étape 3 : Créer l'utilisateur d'application
print_header "Étape 3 : Créer l'utilisateur d'application"

if id "$APP_USER" &>/dev/null; then
    print_step "Utilisateur $APP_USER existe déjà"
else
    useradd -m -s /bin/bash $APP_USER
    usermod -aG www-data $APP_USER
    print_step "Utilisateur $APP_USER créé"
fi

# Étape 4 : Préparer les répertoires
print_header "Étape 4 : Préparer les répertoires"

if [ -d "$APP_DIR" ]; then
    print_warning "Répertoire $APP_DIR existe déjà"
    read -p "Voulez-vous continuer ? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    mkdir -p $APP_DIR
fi

# Créer les sous-répertoires
mkdir -p $APP_DIR/{logs,data}
chown -R $APP_USER:$APP_USER $APP_DIR
print_step "Répertoires créés: $APP_DIR"

# Étape 5 : Copier/Cloner le projet
print_header "Étape 5 : Obtenir le code du projet"

if [ -d "$APP_DIR/.git" ]; then
    print_step "Dépôt Git existe déjà, mise à jour..."
    cd $APP_DIR
    sudo -u $APP_USER git pull origin update
else
    print_warning "Dépôt Git non trouvé"
    read -p "Chemin vers le projet local (ex: /home/shadowcraft/Projets/sfiDashMonitoring): " PROJECT_PATH
    
    if [ -d "$PROJECT_PATH" ]; then
        print_step "Copie depuis $PROJECT_PATH..."
        cp -r $PROJECT_PATH/* $APP_DIR/
        cp -r $PROJECT_PATH/.* $APP_DIR/ 2>/dev/null || true
    else
        print_error "Chemin invalide: $PROJECT_PATH"
        exit 1
    fi
fi

chown -R $APP_USER:$APP_USER $APP_DIR
print_step "Code du projet prêt"

# Étape 6 : Installer les dépendances Node
print_header "Étape 6 : Installation des dépendances Node.js"

cd $APP_DIR

print_warning "Installation frontend..."
sudo -u $APP_USER npm install --production
print_step "Frontend dépendances installées"

print_warning "Installation backend..."
cd backend
sudo -u $APP_USER npm install --production
cd ..
print_step "Backend dépendances installées"

# Étape 7 : Build frontend
print_header "Étape 7 : Build du frontend"
sudo -u $APP_USER npm run build
print_step "Frontend buildé"

# Étape 8 : Configurer les variables d'environnement
print_header "Étape 8 : Configuration Backend"

BACKEND_ENV="$APP_DIR/backend/.env"

if [ -f "$BACKEND_ENV" ]; then
    print_warning "Fichier .env existe déjà"
    print_warning "Contenu actuel:"
    cat "$BACKEND_ENV"
    read -p "Voulez-vous le remplacer ? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_step ".env conservé"
    else
        create_env=1
    fi
else
    create_env=1
fi

if [ "$create_env" = "1" ]; then
    cat > "$BACKEND_ENV" << EOF
# SFI Dashboard - Backend Configuration
NODE_ENV=production
PORT=$BACKEND_PORT
HOST=127.0.0.1

# Elasticsearch
ES_HOST=http://localhost:9200
ES_INDEX=filebeat-*

# Frontend URL
FRONTEND_URL=http://$SERVER_IP

# Logs
LOG_LEVEL=info
EOF
    chown $APP_USER:$APP_USER "$BACKEND_ENV"
    chmod 600 "$BACKEND_ENV"
    print_step ".env backend créé"
fi

# Étape 9 : Configurer Nginx
print_header "Étape 9 : Configuration Nginx"

cat > /etc/nginx/sites-available/sfi-monitoring << 'EOF'
# SFI Dashboard - Nginx Configuration
# Frontend + Reverse Proxy pour Backend API

server {
    listen 3002;
    server_name 172.27.28.14;

    root /opt/sfiDashMonitoring/dist;
    index index.html;

    # Assets statiques - Cache long
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # API - Reverse Proxy vers Backend
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /ws {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }

    # SPA Fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Deny dotfiles
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
EOF

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/sfi-monitoring /etc/nginx/sites-enabled/

# Tester config Nginx
if nginx -t 2>/dev/null; then
    print_step "Configuration Nginx valide"
else
    print_error "Erreur dans la configuration Nginx!"
    nginx -t
    exit 1
fi

# Étape 10 : Créer les services Systemd
print_header "Étape 10 : Création des services Systemd"

cat > /etc/systemd/system/sfi-monitoring-backend.service << EOF
[Unit]
Description=SFI Dashboard - Backend API
After=network.target elasticsearch.service
Wants=elasticsearch.service

[Service]
Type=simple
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$APP_DIR/backend

# Environnement
Environment="NODE_ENV=production"
Environment="PORT=$BACKEND_PORT"
Environment="HOST=127.0.0.1"
Environment="ES_HOST=http://localhost:9200"
Environment="ES_INDEX=filebeat-*"
Environment="FRONTEND_URL=http://$SERVER_IP"
Environment="LOG_LEVEL=info"

# Démarrage
ExecStart=/usr/bin/node $APP_DIR/backend/server.js

# Redémarrage
Restart=always
RestartSec=10
StartLimitInterval=600
StartLimitBurst=3

# Logs
StandardOutput=journal
StandardError=journal
SyslogIdentifier=sfi-backend

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
print_step "Service backend créé"

# Étape 11 : Activer les services au démarrage
print_header "Étape 11 : Activation des services"

systemctl enable sfi-monitoring-backend
systemctl enable nginx
print_step "Services activés au démarrage"

# Étape 12 : Démarrer les services
print_header "Étape 12 : Démarrage des services"

systemctl restart nginx
systemctl start sfi-monitoring-backend

sleep 2

# Vérifier les services
if systemctl is-active --quiet sfi-monitoring-backend; then
    print_step "Service backend actif"
else
    print_error "Service backend n'a pas pu démarrer"
    journalctl -u sfi-monitoring-backend -n 20
    exit 1
fi

if systemctl is-active --quiet nginx; then
    print_step "Service Nginx actif"
else
    print_error "Service Nginx n'a pas pu démarrer"
    exit 1
fi

# Étape 13 : Configurer le Firewall
print_header "Étape 13 : Configuration Firewall (UFW)"

if command -v ufw &> /dev/null; then
    read -p "Voulez-vous configurer UFW ? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ufw --force enable
        ufw allow 22/tcp    # SSH
        ufw allow 80/tcp    # HTTP
        ufw allow 443/tcp   # HTTPS (futur)
        ufw deny 3001/tcp   # Backend local
        ufw deny 9200/tcp   # Elasticsearch local
        print_step "Firewall configuré"
    fi
fi

# Résumé final
print_header "Installation Terminée! ✅"

echo -e "${GREEN}"
echo "Configuration:"
echo "  IP Serveur: $SERVER_IP"
echo "  Backend Port: $BACKEND_PORT"
echo "  Frontend Port: $FRONTEND_PORT"
echo "  App Directory: $APP_DIR"
echo "  App User: $APP_USER"
echo ""
echo "Accès:"
echo "  Frontend: http://$SERVER_IP"
echo "  Backend API: http://$SERVER_IP/api (via Nginx)"
echo "  Backend Direct: http://127.0.0.1:$BACKEND_PORT (local only)"
echo ""
echo "Commandes utiles:"
echo "  Statut: sudo systemctl status sfi-monitoring-backend"
echo "  Logs: sudo journalctl -u sfi-monitoring-backend -f"
echo "  Redémarrer: sudo systemctl restart sfi-monitoring-backend"
echo "  Arrêter: sudo systemctl stop sfi-monitoring-backend"
echo ""
echo "Prochaines étapes:"
echo "  1. Vérifier les logs: sudo journalctl -u sfi-monitoring-backend -f"
echo "  2. Tester: curl http://$SERVER_IP"
echo "  3. Consulter les logs Elasticsearch si erreurs"
echo -e "${NC}"

print_header "Tests rapides"

echo ""
echo "1. Test Backend (local):"
if curl -s http://127.0.0.1:3001/api/health > /dev/null 2>&1; then
    print_step "Backend répond ✓"
else
    print_warning "Backend ne répond pas (peut être normal si démarrage récent)"
fi

echo ""
echo "2. Test Frontend (via Nginx):"
if curl -s -o /dev/null -w "%{http_code}" http://$SERVER_IP | grep -q "200"; then
    print_step "Frontend accessible ✓"
else
    print_warning "Frontend pas encore accessible (peut être normal si construction en cours)"
fi

echo ""
echo "Logs en temps réel:"
echo "  sudo journalctl -u sfi-monitoring-backend -f"

# Étape 13 : Rendre les fichiers exécutables pour l'utilisateur sfi
print_header "Étape 13 : Configuration des permissions pour $APP_USER"

# Rendre les fichiers de déploiement exécutables
chmod +x $APP_DIR/deployed/*.sh
chown $APP_USER:$APP_USER $APP_DIR/deployed/*.sh

# Permissions pour les répertoires
find $APP_DIR -type d -exec chmod u+rwx,g+rx {} \;

# Permissions pour les scripts backend
find $APP_DIR/backend -name "*.sh" -exec chmod +x {} \;

print_step "Fichiers exécutables configurés pour $APP_USER"

