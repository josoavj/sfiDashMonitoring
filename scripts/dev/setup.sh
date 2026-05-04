#!/bin/bash

# Script pour initialiser l'environnement de développement
# Utilisation: ./scripts/dev/setup.sh

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Development Environment Setup${NC}"
echo "=================================================="
echo ""

# 1. Vérifier Node.js
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"
echo -n "Node.js... "
if command -v node &> /dev/null; then
    VERSION=$(node --version)
    echo -e "${GREEN}$VERSION${NC}"
else
    echo -e "${RED}NOT INSTALLED${NC}"
    echo "Please install Node.js >= 18"
    exit 1
fi

# 2. Vérifier npm
echo -n "npm... "
if command -v npm &> /dev/null; then
    VERSION=$(npm --version)
    echo -e "${GREEN}$VERSION${NC}"
else
    echo -e "${RED}NOT INSTALLED${NC}"
    exit 1
fi

echo ""

# 3. Installer frontend dependencies
echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install frontend dependencies${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
echo ""

# 4. Installer backend dependencies
echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
cd backend
npm install
cd ..

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install backend dependencies${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Backend dependencies installed${NC}"
echo ""

# 5. Vérifier .env files
echo -e "${YELLOW}🔧 Checking environment files...${NC}"

# Frontend .env
if [ ! -f ".env.local" ]; then
    echo "Creating .env.local..."
    cat > .env.local << 'EOF'
VITE_API_URL=http://localhost:3001
VITE_BACKEND_WS_URL=http://localhost:3001
EOF
    echo -e "${GREEN}✅ .env.local created${NC}"
else
    echo -e "${GREEN}✅ .env.local exists${NC}"
fi

# Backend .env
if [ ! -f "backend/.env" ]; then
    echo "Creating backend/.env..."
    cp backend/envDefault backend/.env
    echo -e "${YELLOW}⚠️  backend/.env created from template${NC}"
    echo -e "${YELLOW}   Please edit it with your Elasticsearch credentials${NC}"
else
    echo -e "${GREEN}✅ backend/.env exists${NC}"
fi

echo ""
echo "=================================================="
echo -e "${GREEN}✅ Setup completed!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Edit backend/.env with your Elasticsearch settings"
echo "  2. Run './start.sh' to start the development servers"
echo "  3. Or use './scripts/logs/start-with-logs.sh' for logging"
echo ""
