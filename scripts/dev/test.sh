#!/bin/bash

# Script pour lancer les tests
# Utilisation: ./scripts/dev/test.sh [option]
# Options:
#   unit     : Tests unitaires (défaut)
#   ui       : Interface Vitest
#   coverage : Report de couverture
#   watch    : Mode watch (redémarrage automatique)

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

OPTION="${1:-unit}"

echo -e "${BLUE}🧪 Running Tests${NC}"
echo "=================================================="
echo ""

case "$OPTION" in
    unit)
        echo -e "${BLUE}Running unit tests...${NC}"
        npm test
        ;;
    ui)
        echo -e "${BLUE}Starting Vitest UI...${NC}"
        echo "📊 UI available at: http://localhost:51204/__vitest__/"
        npm run test:ui
        ;;
    coverage)
        echo -e "${BLUE}Generating coverage report...${NC}"
        npm run test:coverage
        if [ -d "coverage" ]; then
            echo -e "${GREEN}✅ Coverage report generated${NC}"
            echo "📁 Location: coverage/"
            if command -v xdg-open &> /dev/null; then
                xdg-open coverage/index.html
            fi
        fi
        ;;
    watch)
        echo -e "${BLUE}Starting test watch mode...${NC}"
        npm test -- --watch
        ;;
    *)
        echo -e "${YELLOW}Usage: ./scripts/dev/test.sh [option]${NC}"
        echo ""
        echo "Options:"
        echo "  unit     - Run unit tests (default)"
        echo "  ui       - Start Vitest UI"
        echo "  coverage - Generate coverage report"
        echo "  watch    - Run in watch mode"
        ;;
esac
