#!/usr/bin/env bash

# Test WebSocket from browser console

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Test WebSocket Connection - SFI Monitoring           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${YELLOW}Instructions:${NC}\n"
echo -e "1. Ouvre le navigateur: http://localhost:5173"
echo -e "2. Ouvre la console (F12 → Console)"
echo -e "3. Copie et exécute le code:\n"

cat << 'EOF'
const { io } = await import('socket.io-client');
const socket = io('ws://localhost:3001', { transports: ['websocket'] });
socket.on('connect', () => console.log('✅ Connecté!'));
socket.on('error', (e) => console.error('❌ Erreur:', e));
setTimeout(() => socket.disconnect(), 10000);
EOF

echo -e "\n${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  État du serveur${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}\n"

if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo -e "${GREEN}  ✓ Backend en écoute${NC}\n"
else
    echo -e "${RED}  ✗ Backend non accessible${NC}"
    echo -e "${YELLOW}  Lancer: ./start.sh${NC}\n"
    exit 1
fi
