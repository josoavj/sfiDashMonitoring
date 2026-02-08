#!/usr/bin/env bash

# ============================================
# Setup Environment Variables - Phases 1 & 2
# Génère les secrets et configure .env
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
BACKEND_DIR="$PROJECT_ROOT/backend"
ENV_FILE="$BACKEND_DIR/.env"
ENV_TEMPLATE="$BACKEND_DIR/.env.template"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Environment Setup - Sécurité & Observabilité         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}\n"

# Check si .env exists
if [ -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}⚠️  Fichier .env existe déjà${NC}"
    read -p "Voulez-vous le régénérer? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}Annulé${NC}"
        exit 0
    fi
    cp "$ENV_FILE" "$ENV_FILE.backup.$(date +%s)"
    echo -e "${GREEN}✓ Backup créé: $ENV_FILE.backup*${NC}\n"
fi

# Check template
if [ ! -f "$ENV_TEMPLATE" ]; then
    echo -e "${RED}❌ Fichier template .env.template non trouvé${NC}"
    exit 1
fi

echo -e "${BLUE}🔐 Génération des secrets sécurisés...${NC}\n"

# Générer les secrets
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)

echo -e "${CYAN}  JWT_SECRET          : ${JWT_SECRET:0:20}...${NC}"
echo -e "${CYAN}  JWT_REFRESH_SECRET  : ${JWT_REFRESH_SECRET:0:20}...${NC}"
echo -e "${CYAN}  SESSION_SECRET      : ${SESSION_SECRET:0:20}...${NC}\n"

# Déterminer l'environnement
echo -e "${BLUE}Environnement de déploiement?${NC}"
echo "1) development (localhost)"
echo "2) production (avec HTTPS)"
read -p "Choisir (1-2): " env_choice

case $env_choice in
    1)
        NODE_ENV="development"
        SESSION_COOKIE_SECURE="false"
        SESSION_COOKIE_SAMESITE="lax"
        FRONTEND_URL="http://localhost:3000"
        ES_SSL_VERIFY="false"
        echo -e "${GREEN}✓ Configuration développement${NC}\n"
        ;;
    2)
        NODE_ENV="production"
        SESSION_COOKIE_SECURE="true"
        SESSION_COOKIE_SAMESITE="strict"
        read -p "URL frontend (ex: https://dashboard.example.com): " FRONTEND_URL
        read -p "Elasticsearch SSL verify? (true/false) [true]: " ES_SSL_VERIFY
        ES_SSL_VERIFY=${ES_SSL_VERIFY:-true}
        echo -e "${GREEN}✓ Configuration production${NC}\n"
        ;;
    *)
        echo -e "${RED}Choix invalide${NC}"
        exit 1
        ;;
esac

# Configuration Elasticsearch
echo -e "${BLUE}Configuration Elasticsearch${NC}"
read -p "ES_NODE [https://172.27.28.14:9200]: " ES_NODE
ES_NODE=${ES_NODE:-https://172.27.28.14:9200}

read -p "ES_USERNAME [elastic]: " ES_USERNAME
ES_USERNAME=${ES_USERNAME:-elastic}

read -sp "ES_PASSWORD: " ES_PASSWORD
echo

read -p "ES_INDEX [filebeat-*]: " ES_INDEX
ES_INDEX=${ES_INDEX:-filebeat-*}

echo -e "${GREEN}✓ Elasticsearch configuré${NC}\n"

# Générer .env
echo -e "${BLUE}Génération du fichier .env...${NC}\n"

cat > "$ENV_FILE" << EOF
# ============================================
# Configuration générée automatiquement
# Date: $(date)
# ============================================

# ==========================================
# PHASE 1 - Sécurité Critique
# ==========================================
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
SESSION_SECRET=$SESSION_SECRET

JWT_EXPIRATION=3600
REFRESH_TOKEN_EXPIRATION=604800

# ==========================================
# PHASE 2 - Observabilité
# ==========================================
METRICS_ENABLED=true
METRICS_PORT=3001

# ==========================================
# Configuration de base
# ==========================================
PORT=3001
HOST=0.0.0.0
NODE_ENV=$NODE_ENV
FRONTEND_URL=$FRONTEND_URL

# Session
SESSION_MAX_AGE=604800000
SESSION_COOKIE_SECURE=$SESSION_COOKIE_SECURE
SESSION_COOKIE_HTTPONLY=true
SESSION_COOKIE_SAMESITE=$SESSION_COOKIE_SAMESITE

# ==========================================
# Elasticsearch
# ==========================================
ES_NODE=$ES_NODE
ES_USERNAME=$ES_USERNAME
ES_PASSWORD=$ES_PASSWORD
ES_INDEX=$ES_INDEX
ES_CERT_PATH=./certs/http_ca.crt
ES_SSL_VERIFY=$ES_SSL_VERIFY
ES_TIMEOUT=30000

# ==========================================
# Database
# ==========================================
DB_TYPE=sqlite
DB_NAME=sfi_dashboard_dev
DB_STORAGE=./data/database.sqlite

# ==========================================
# Logging
# ==========================================
LOG_LEVEL=info
LOG_FORMAT=combined
LOG_FILE=./logs/server.log

# ==========================================
# Authentication
# ==========================================
MAX_SESSIONS_PER_USER=5
MIN_PASSWORD_LENGTH=8
PASSWORD_REQUIRE_NUMBERS=true
PASSWORD_REQUIRE_SPECIAL=false

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_WINDOW=1
AUTH_RATE_LIMIT_MAX=5
REFRESH_RATE_LIMIT_MAX=10

# ==========================================
# CORS
# ==========================================
CORS_ORIGIN=$FRONTEND_URL
CORS_CREDENTIALS=true
CORS_METHODS=GET,POST,PUT,DELETE,PATCH,OPTIONS
CORS_HEADERS=Content-Type,Authorization,X-CSRF-Token

# ==========================================
# API Documentation
# ==========================================
SWAGGER_ENABLED=true
SWAGGER_PATH=/api/docs

# ==========================================
# Security
# ==========================================
ENABLE_HELMET=true
ENABLE_HPP=true

# ==========================================
# Développement
# ==========================================
SOCKET_IO_DEBUG=false
LOG_RESPONSES=false
EOF

chmod 600 "$ENV_FILE"
echo -e "${GREEN}✓ Fichier .env créé avec permissions 600${NC}\n"

# Vérifier les certificats Elasticsearch
if [ ! -f "$BACKEND_DIR/certs/http_ca.crt" ]; then
    echo -e "${YELLOW}⚠️  Certificat ES non trouvé: $BACKEND_DIR/certs/http_ca.crt${NC}"
    echo -e "${CYAN}   Pour l'obtenir: curl --cacert /path/to/ca.crt ...${NC}"
    echo -e "${CYAN}   Ou modifier ES_CERT_PATH dans .env${NC}\n"
fi

# Summary
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Configuration terminée${NC}\n"
echo -e "Fichier: ${CYAN}$ENV_FILE${NC}"
echo -e "Permissions: ${CYAN}600 (lecture/écriture owner seulement)${NC}"
echo -e "Environnement: ${CYAN}$NODE_ENV${NC}\n"

if [ "$NODE_ENV" = "production" ]; then
    echo -e "${YELLOW}⚠️  LISTE DE VÉRIFICATION PRODUCTION:${NC}"
    echo -e "  ${CYAN}☐${NC} HTTPS/SSL configuré"
    echo -e "  ${CYAN}☐${NC} Certificats installés"
    echo -e "  ${CYAN}☐${NC} Database backup effectué"
    echo -e "  ${CYAN}☐${NC} Elasticsearch vérifiée"
    echo -e "  ${CYAN}☐${NC} NODE_ENV=production confirmé"
    echo -e "  ${CYAN}☐${NC} Firewall règles mises à jour"
    echo -e "  ${CYAN}☐${NC} Monitoring Prometheus actif\n"
fi

echo -e "${BLUE}Prochaines étapes:${NC}"
echo -e "  1. ${CYAN}Vérifier les valeurs dans .env:${NC}"
echo -e "     ${CYAN}cat $ENV_FILE | grep -E 'ES_|JWT_|SESSION_'${NC}"
echo -e "  2. ${CYAN}Démarrer le backend:${NC}"
echo -e "     ${CYAN}cd backend && npm start${NC}"
echo -e "  3. ${CYAN}Vérifier les métriques:${NC}"
echo -e "     ${CYAN}curl http://localhost:3001/metrics${NC}\n"

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
