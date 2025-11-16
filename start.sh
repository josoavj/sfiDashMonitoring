#!/usr/bin/env bash

# ============================================
# SFI Dashboard Monitoring - Démarrage universel
# Détecte le mode et lance le script approprié
# ============================================

RED='[0;31m'
GREEN='[0;32m'
BLUE='[0;34m'
YELLOW='[1;33m'
CYAN='[0;36m'
NC='[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  SFI Dashboard Monitoring - Démarrage Universel        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}
"

# Déterminer le mode
MODE=${1:-""}

if [ -z "$MODE" ]; then
    echo -e "${CYAN}Choisissez le mode de démarrage:${NC}
"
    echo -e "  ${GREEN}1${NC}) local   - Développement (localhost seulement)"
    echo -e "  ${GREEN}2${NC}) deploy  - Réseau/Serveur Ubuntu
"
    
    read -p "Entrez votre choix (1 ou 2): " MODE
    echo
fi

case "$MODE" in
    1|local)
        echo -e "${BLUE}🚀 Démarrage MODE LOCAL${NC}
"
        exec "$SCRIPT_DIR/local/start.sh"
        ;;
    2|deploy|deployed)
        echo -e "${BLUE}🌐 Démarrage MODE DEPLOYED${NC}
"
        exec "$SCRIPT_DIR/deployed/start.sh"
        ;;
    *)
        echo -e "${RED}❌ Mode invalide: $MODE${NC}"
        echo -e "${YELLOW}Utilisation: ./start.sh [local|deploy]${NC}"
        exit 1
        ;;
esac
