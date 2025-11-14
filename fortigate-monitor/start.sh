#!/bin/bash

# ============================================
#  Fortigate Monitor - Script de démarrage
# ============================================

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Banner
echo -e "${CYAN}"
cat << "EOF"
╔══════════════════════════════════════════════════════╗
║                                                      ║
║     ███████╗ ████████╗  ██████╗                     ║
║     ██╔════╝ ╚══██╔══╝ ██╔════╝                     ║
║     █████╗      ██║    ██║  ███╗                    ║
║     ██╔══╝      ██║    ██║   ██║                    ║
║     ██║         ██║    ╚██████╔╝                    ║
║     ╚═╝         ╚═╝     ╚═════╝                     ║
║                                                      ║
║           Fortigate Monitor Dashboard               ║
║                                                      ║
╚══════════════════════════════════════════════════════╝
EOF
echo -e "${NC}\n"

# Obtenir le répertoire du script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Fonction de nettoyage
cleanup() {
    echo -e "\n${YELLOW}⏹️  Arrêt gracieux des services...${NC}"

    if [ ! -z "$BACKEND_PID" ]; then
        kill -TERM $BACKEND_PID 2>/dev/null
        echo -e "${GREEN}  ✓ Backend arrêté${NC}"
    fi

    if [ ! -z "$FRONTEND_PID" ]; then
        kill -TERM $FRONTEND_PID 2>/dev/null
        echo -e "${GREEN}  ✓ Frontend arrêté${NC}"
    fi

    echo -e "\n${GREEN}👋 Au revoir !${NC}\n"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Vérifications préalables
echo -e "${BLUE}🔍 Vérifications préalables...${NC}\n"

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js n'est pas installé${NC}"
    exit 1
fi
echo -e "${GREEN}  ✓ Node.js: $(node --version)${NC}"

# Vérifier npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm n'est pas installé${NC}"
    exit 1
fi
echo -e "${GREEN}  ✓ npm: $(npm --version)${NC}"

# Vérifier la structure
if [ ! -d "back" ]; then
    echo -e "${RED}❌ Dossier 'back' introuvable${NC}"
    exit 1
fi
echo -e "${GREEN}  ✓ Dossier backend trouvé${NC}"

if [ ! -d "frontend" ]; then
    echo -e "${RED}❌ Dossier 'frontend' introuvable${NC}"
    exit 1
fi
echo -e "${GREEN}  ✓ Dossier frontend trouvé${NC}"

# Vérifier les dépendances
if [ ! -d "back/node_modules" ]; then
    echo -e "${YELLOW}  ⚠ Dépendances backend manquantes${NC}"
    echo -e "${BLUE}  📦 Installation en cours...${NC}"
    cd back && npm install && cd ..
fi
echo -e "${GREEN}  ✓ Dépendances backend OK${NC}"

if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}  ⚠ Dépendances frontend manquantes${NC}"
    echo -e "${BLUE}  📦 Installation en cours...${NC}"
    cd frontend && npm install && cd ..
fi
echo -e "${GREEN}  ✓ Dépendances frontend OK${NC}"

# Vérifier le fichier .env
if [ ! -f "back/.env" ]; then
    echo -e "${YELLOW}  ⚠ Fichier .env manquant${NC}"
    echo -e "${YELLOW}  📝 Veuillez créer back/.env avec votre configuration${NC}"
fi

# Vérifier le certificat SSL
if [ -f "back/.env" ]; then
    CERT_PATH=$(grep ES_CERT_PATH back/.env | cut -d '=' -f2)
    if [ ! -z "$CERT_PATH" ] && [ ! -f "back/$CERT_PATH" ]; then
        echo -e "${YELLOW}  ⚠ Certificat SSL non trouvé: back/$CERT_PATH${NC}"
    else
        echo -e "${GREEN}  ✓ Configuration SSL OK${NC}"
    fi
fi

echo ""

# Démarrer le backend
echo -e "${BLUE}📡 Démarrage du backend...${NC}"
cd back
node server.js > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Attendre que le backend soit prêt
sleep 3

if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${RED}❌ Le backend n'a pas démarré correctement${NC}"
    echo -e "${YELLOW}Consultez les logs: tail -f logs/backend.log${NC}"
    exit 1
fi
echo -e "${GREEN}  ✓ Backend démarré (PID: $BACKEND_PID)${NC}\n"

# Démarrer le frontend
echo -e "${BLUE}🌐 Démarrage du frontend...${NC}"
cd frontend
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

sleep 3

if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo -e "${RED}❌ Le frontend n'a pas démarré correctement${NC}"
    echo -e "${YELLOW}Consultez les logs: tail -f logs/frontend.log${NC}"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi
echo -e "${GREEN}  ✓ Frontend démarré (PID: $FRONTEND_PID)${NC}\n"

# Affichage final
echo -e "${GREEN}"
cat << "EOF"
╔══════════════════════════════════════════════════════╗
║                                                      ║
║         ✅ SERVICES DÉMARRÉS AVEC SUCCÈS !          ║
║                                                      ║
╠══════════════════════════════════════════════════════╣
║                                                      ║
║  📡 Backend API                                      ║
║     → http://localhost:3001                          ║
║     → http://localhost:3001/api/health               ║
║                                                      ║
║  🌐 Frontend Dashboard                               ║
║     → http://localhost:3000                          ║
║                                                      ║
║  🔌 WebSocket                                        ║
║     → ws://localhost:3001                            ║
║                                                      ║
╠══════════════════════════════════════════════════════╣
║                                                      ║
║  📋 Commandes utiles:                                ║
║     • Ctrl+C : Arrêter les services                  ║
║     • tail -f logs/backend.log : Logs backend        ║
║     • tail -f logs/frontend.log : Logs frontend      ║
║                                                      ║
╚══════════════════════════════════════════════════════╝
EOF
echo -e "${NC}\n"

# Créer le dossier logs s'il n'existe pas
mkdir -p logs

echo -e "${CYAN}📊 Monitoring actif... Appuyez sur Ctrl+C pour arrêter${NC}\n"

# Garder le script actif
wait