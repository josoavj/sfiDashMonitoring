#!/bin/bash

# Script pour vérifier la santé des services
# Utilisation: ./scripts/utils/health-check.sh

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🏥 Health Check - SFI Dashboard${NC}"
echo "=================================================="
echo ""

# Vérifications
CHECKS_PASSED=0
CHECKS_FAILED=0

# 1. Vérifier le backend
echo -n "Backend (port 3001)... "
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ OK${NC}"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}❌ FAILED${NC}"
    ((CHECKS_FAILED++))
fi

# 2. Vérifier le frontend
echo -n "Frontend (port 5173)... "
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ OK${NC}"
    ((CHECKS_PASSED++))
else
    echo -e "${YELLOW}⚠️  Not Running${NC}"
    ((CHECKS_FAILED++))
fi

# 3. Vérifier les logs
echo -n "Logs directory... "
if [ -d "logs" ]; then
    echo -e "${GREEN}✅ OK${NC}"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}❌ MISSING${NC}"
    ((CHECKS_FAILED++))
fi

# 4. Vérifier backend.log
echo -n "Backend logs... "
if [ -f "logs/backend.log" ]; then
    SIZE=$(du -h logs/backend.log | cut -f1)
    LINES=$(wc -l < logs/backend.log)
    echo -e "${GREEN}✅ OK${NC} ($LINES lines, $SIZE)"
    ((CHECKS_PASSED++))
else
    echo -e "${YELLOW}⚠️  Not created yet${NC}"
fi

# 5. Vérifier frontend.log
echo -n "Frontend logs... "
if [ -f "logs/frontend.log" ]; then
    SIZE=$(du -h logs/frontend.log | cut -f1)
    LINES=$(wc -l < logs/frontend.log)
    echo -e "${GREEN}✅ OK${NC} ($LINES lines, $SIZE)"
    ((CHECKS_PASSED++))
else
    echo -e "${YELLOW}⚠️  Not created yet${NC}"
fi

# 6. Vérifier Node.js
echo -n "Node.js... "
if command -v node &> /dev/null; then
    VERSION=$(node --version)
    echo -e "${GREEN}✅ $VERSION${NC}"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}❌ NOT INSTALLED${NC}"
    ((CHECKS_FAILED++))
fi

# 7. Vérifier npm
echo -n "npm... "
if command -v npm &> /dev/null; then
    VERSION=$(npm --version)
    echo -e "${GREEN}✅ $VERSION${NC}"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}❌ NOT INSTALLED${NC}"
    ((CHECKS_FAILED++))
fi

echo ""
echo "=================================================="
echo -e "${BLUE}Summary:${NC}"
echo -e "  Passed: ${GREEN}$CHECKS_PASSED${NC}"
echo -e "  Failed: ${RED}$CHECKS_FAILED${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
else
    echo -e "${YELLOW}⚠️  Some checks failed or services are not running${NC}"
fi
