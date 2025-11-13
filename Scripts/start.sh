#!/bin/bash

echo "🚀 Démarrage du monitoring Fortigate..."
echo ""

# Fonction pour nettoyer à la sortie
cleanup() {
    echo ""
    echo "⏹️  Arrêt des services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Démarrer le backend
echo "📡 Démarrage du backend..."
cd back
node server.js &
BACKEND_PID=$!

# Attendre que le backend soit prêt
sleep 3

# Démarrer le frontend (adapter selon votre structure)
echo "🌐 Démarrage du frontend..."
if [ -d "frontend" ]; then
    # Structure recommandée: frontend/ au même niveau que back/
    cd ../frontend
elif [ -d "back/frontend" ]; then
    # Structure actuelle: frontend/ dans back/
    cd frontend
else
    echo "❌ Dossier frontend non trouvé !"
    kill $BACKEND_PID
    exit 1
fi

npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Services démarrés !"
echo "   Backend:  http://localhost:3001"
echo "   Frontend: http://localhost:3000"
echo ""
echo "Appuyez sur Ctrl+C pour arrêter"

# Garder le script actif
wait