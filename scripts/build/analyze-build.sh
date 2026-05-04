#!/bin/bash

# Script pour analyser la taille du build
# Utilisation: ./scripts/build/analyze-build.sh

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📊 Build Size Analysis${NC}"
echo "=================================================="
echo ""

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ dist/ directory not found${NC}"
    echo "Please run './scripts/build/build-frontend.sh' first"
    exit 1
fi

# Taille totale du build
TOTAL_SIZE=$(du -sh dist | cut -f1)
TOTAL_SIZE_BYTES=$(du -s dist | cut -f1)

echo -e "${YELLOW}📁 Total Build Size:${NC} ${GREEN}$TOTAL_SIZE${NC}"
echo ""

# Détails des fichiers
echo -e "${YELLOW}📄 Files Breakdown:${NC}"
du -sh dist/* | sort -rh | head -10
echo ""

# Gzip size (estimation)
echo -e "${YELLOW}🗜️  Gzip Estimates:${NC}"
echo ""

find dist -type f -name "*.js" -o -name "*.css" | while read file; do
    ORIGINAL=$(du -h "$file" | cut -f1)
    GZIP_SIZE=$(gzip -c "$file" | du -h | cut -f1)
    FILENAME=$(basename "$file")
    printf "  %-50s %-15s -> ${GREEN}%-15s${NC}\n" "$FILENAME" "$ORIGINAL" "$GZIP_SIZE"
done

echo ""
echo "=================================================="

# Warn si trop gros
if [ $TOTAL_SIZE_BYTES -gt 524288000 ]; then  # 500MB
    echo -e "${RED}⚠️  Build is very large (> 500MB)${NC}"
elif [ $TOTAL_SIZE_BYTES -gt 104857600 ]; then  # 100MB
    echo -e "${YELLOW}⚠️  Build is large (> 100MB)${NC}"
else
    echo -e "${GREEN}✅ Build size is reasonable${NC}"
fi

echo ""
echo -e "${BLUE}💡 Tips:${NC}"
echo "  • Use npm run analyze to see bundle composition"
echo "  • Check for unused dependencies in package.json"
echo "  • Enable gzip compression in production"
