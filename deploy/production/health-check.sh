#!/usr/bin/env bash

# ============================================
# Production Health Check
# Vérifie que les services fonctionnent
# ============================================

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Production Health Check - SFI Monitoring             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}\n"

# Get server IP from environment or ask user
SERVER_IP=${SERVER_IP:-$(hostname -I | awk '{print $1}')}

test_passed=0
test_failed=0

# Test Backend API
echo -e "${YELLOW}[TEST 1]${NC} Backend API - http://$SERVER_IP:3001\n"
if curl -s http://$SERVER_IP:3001 > /dev/null 2>&1; then
    echo -e "${GREEN}  ✓ Backend accessible${NC}"
    test_passed=$((test_passed + 1))
else
    echo -e "${RED}  ✗ Backend NON accessible${NC}"
    test_failed=$((test_failed + 1))
fi

# Test Frontend
echo -e "\n${YELLOW}[TEST 2]${NC} Frontend - http://$SERVER_IP\n"
if curl -s http://$SERVER_IP > /dev/null 2>&1; then
    echo -e "${GREEN}  ✓ Frontend accessible${NC}"
    test_passed=$((test_passed + 1))
else
    echo -e "${RED}  ✗ Frontend NON accessible${NC}"
    test_failed=$((test_failed + 1))
fi

# Test WebSocket
echo -e "\n${YELLOW}[TEST 3]${NC} WebSocket - ws://$SERVER_IP:3001/socket.io\n"
if timeout 3 bash -c "exec 3<>/dev/tcp/$SERVER_IP/3001; echo -e 'GET /socket.io HTTP/1.1\r\n\r\n' >&3" 2>/dev/null; then
    echo -e "${GREEN}  ✓ WebSocket port accessible${NC}"
    test_passed=$((test_passed + 1))
else
    echo -e "${RED}  ✗ WebSocket port NON accessible${NC}"
    test_failed=$((test_failed + 1))
fi

# Docker status (si disponible)
if command -v docker &>/dev/null; then
    echo -e "\n${YELLOW}[TEST 4]${NC} Docker Containers\n"
    if docker ps | grep -q sfi-monitoring; then
        echo -e "${GREEN}  ✓ Containers running${NC}"
        docker ps --filter "name=sfi-monitoring" --format "table {{.Names}}\t{{.Status}}"
        test_passed=$((test_passed + 1))
    else
        echo -e "${RED}  ✗ No sfi-monitoring containers running${NC}"
        test_failed=$((test_failed + 1))
    fi
fi

# Summary
echo -e "\n${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Résumé${NC}"
echo -e "${BLUE}╠════════════════════════════════════════════════════════╣${NC}"
echo -e "${BLUE}║  Tests réussis:  ${GREEN}$test_passed${BLUE}${NC}"
echo -e "${BLUE}║  Tests échoués:  ${RED}$test_failed${BLUE}${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}\n"

if [ $test_failed -eq 0 ]; then
    echo -e "${GREEN}✅ Tous les services sont fonctionnels${NC}\n"
    echo -e "${CYAN}URLs d'accès:${NC}"
    echo -e "  Frontend:  http://$SERVER_IP"
    echo -e "  Backend:   http://$SERVER_IP:3001"
    echo -e "  WebSocket: ws://$SERVER_IP:3001\n"
    exit 0
else
    echo -e "${YELLOW}⚠️  Certains tests ont échoué${NC}\n"
    echo -e "  Logs: docker-compose logs -f\n"
    exit 1
fi
