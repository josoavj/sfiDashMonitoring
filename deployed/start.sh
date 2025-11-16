#!/usr/bin/env bash

# ============================================
# Production Deployment Start
# Ubuntu Server sans interface graphique
# Frontend accessible depuis le réseau
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
cd "$PROJECT_ROOT"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  SFI Dashboard Monitoring - Production Deployment      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}\n"

# Check if running with docker-compose
if command -v docker-compose &>/dev/null; then
    echo -e "${BLUE}🐳 Déploiement avec Docker Compose${NC}\n"
    cd deployed
    
    # Read IP from .env.production or use default
    SERVER_IP=${SERVER_IP:-192.168.1.100}
    
    echo -e "${CYAN}  Adresse réseau: $SERVER_IP${NC}"
    echo -e "${CYAN}  Frontend:     http://$SERVER_IP${NC}"
    echo -e "${CYAN}  Backend API:  http://$SERVER_IP:3001${NC}"
    echo -e "${CYAN}  WebSocket:    ws://$SERVER_IP:3001${NC}\n"
    
    echo -e "${BLUE}  Démarrage Docker Compose...${NC}\n"
    docker-compose up -d
    
    echo -e "${GREEN}✅ Services déployés${NC}\n"
    echo -e "  Logs: docker-compose logs -f"
    echo -e "  Status: docker-compose ps\n"
    exit 0
fi

# Alternative: Systemd deployment (si Docker non disponible)
if systemctl --version &>/dev/null; then
    echo -e "${BLUE}🔧 Déploiement avec Systemd${NC}\n"
    echo -e "${YELLOW}  À configurer manuellement:${NC}"
    echo -e "    1. Copier sfiDashMonitoring-backend.service vers /etc/systemd/system/"
    echo -e "    2. Copier sfiDashMonitoring-frontend.service vers /etc/systemd/system/"
    echo -e "    3. systemctl daemon-reload"
    echo -e "    4. systemctl start sfiDashMonitoring-backend"
    echo -e "    5. systemctl start sfiDashMonitoring-frontend\n"
    exit 1
fi

echo -e "${RED}❌ Docker et Systemd non disponibles${NC}\n"
exit 1
