#!/bin/bash
set -e

# SFI Dashboard - Script de Déploiement Rapide
# Usage: sudo bash deploy.sh

if [[ $EUID -ne 0 ]]; then
   echo "❌ Exécutez avec sudo"
   exit 1
fi

cd /tmp

echo "🚀 Téléchargement et exécution du déploiement..."
echo ""

# Le script install-production.sh doit être dans /tmp
if [ ! -f "install-production.sh" ]; then
    echo "❌ install-production.sh introuvable dans /tmp"
    echo "Copie: scp deployed/install-production.sh user@172.27.28.14:/tmp/"
    exit 1
fi

bash install-production.sh
