#!/usr/bin/env bash

# ================================================
# Test Localhost Configuration
# Vérifie que tous les services localhost fonctionnent
# ================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Test Local Configuration - SFI Monitoring             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}\n"

test_passed=0
test_failed=0

# Test Backend
echo -e "${YELLOW}[TEST 1]${NC} Backend sur http://localhost:3001"
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo -e "${GREEN}  ✓ Backend accessible${NC}"
    test_passed=$((test_passed + 1))
else
    echo -e "${RED}  ✗ Backend NON accessible${NC}"
    test_failed=$((test_failed + 1))
fi

# Test Frontend
echo -e "\n${YELLOW}[TEST 2]${NC} Frontend sur http://localhost:5173"
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}  ✓ Frontend accessible${NC}"
    test_passed=$((test_passed + 1))
else
    echo -e "${RED}  ✗ Frontend NON accessible${NC}"
    test_failed=$((test_failed + 1))
fi

# Test API
echo -e "\n${YELLOW}[TEST 3]${NC} API Backend - /api/top-sources"
api_response=$(curl -s http://localhost:3001/api/top-sources 2>&1)
if [[ $api_response == *"error"* ]] || [ -z "$api_response" ]; then
    echo -e "${YELLOW}  ⚠ API non disponible (authentification requise ou backend démarrage)${NC}"
    test_failed=$((test_failed + 1))
else
    echo -e "${GREEN}  ✓ API réactive${NC}"
    test_passed=$((test_passed + 1))
fi

# Test Ports
echo -e "\n${YELLOW}[TEST 4]${NC} Vérifier les ports en écoute"
if lsof -i :3001 > /dev/null 2>&1; then
    pid=$(lsof -i :3001 | tail -1 | awk '{print $2}')
    echo -e "${GREEN}  ✓ Port 3001 en écoute (PID: $pid)${NC}"
    test_passed=$((test_passed + 1))
else
    echo -e "${RED}  ✗ Port 3001 NOT en écoute${NC}"
    test_failed=$((test_failed + 1))
fi

if lsof -i :5173 > /dev/null 2>&1; then
    pid=$(lsof -i :5173 | tail -1 | awk '{print $2}')
    echo -e "${GREEN}  ✓ Port 5173 en écoute (PID: $pid)${NC}"
    test_passed=$((test_passed + 1))
else
    echo -e "${RED}  ✗ Port 5173 NOT en écoute${NC}"
    test_failed=$((test_failed + 1))
fi

# Résumé
echo -e "\n${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Résumé${NC}"
echo -e "${BLUE}╠════════════════════════════════════════════════════════╣${NC}"
echo -e "${BLUE}║  Tests réussis:  ${GREEN}$test_passed${BLUE}${NC}"
echo -e "${BLUE}║  Tests échoués:  ${RED}$test_failed${BLUE}${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}\n"

if [ $test_failed -eq 0 ]; then
    echo -e "${GREEN}✅ Configuration OK${NC}\n"
    exit 0
else
    echo -e "${YELLOW}⚠️  Certains tests ont échoué${NC}\n"
    echo -e "  Lancer: $SCRIPT_DIR/start.sh\n"
    exit 1
fi
