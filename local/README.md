# 🚀 Scripts de Démarrage - SFI Dashboard Monitoring

Mode LOCAL pour développement sur votre machine avec localhost.

## ⚡ Démarrage Rapide

### Option 1: Tout en Un (Backend + Frontend)
```bash
./start.sh
```
- Lance les 2 services automatiquement
- Crée les répertoires et fichiers manquants
- Installe les dépendances si nécessaire
- Ouvre: **http://localhost:5173**

### Option 2: Backend Seul
```bash
./start-backend-only.sh
```
- Lance juste le serveur Node.js sur port **3001**
- ✅ Crée `backend/.env` si manquant
- ✅ Crée le répertoire `data/` pour SQLite
- ✅ Initialise la base de données

### Option 3: Frontend Seul
```bash
./start-frontend-only.sh
```
- Lance juste Vite dev server sur port **5173**
- ✅ Vérifie si le backend est actif
- Lance à http://localhost:5173

## 📍 URLs d'Accès

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3001 |
| WebSocket | ws://localhost:3001/socket.io |
| Health Check | http://localhost:3001/api/health |

## � Workflow Recommandé

### Développement Rapide (Temps de réaction optimal)
```bash
# Terminal 1: Backend (redémarre automatiquement avec nodemon)
cd backend && npm run dev

# Terminal 2: Frontend (recompile en temps réel)
npm run dev -- --port 5173
```

### Développement Simplifié
```bash
# Tout dans un terminal
./start.sh
```

## ✅ Initialisation Automatique

Tous les scripts font automatiquement :

| Action | Détails |
|--------|---------|
| 📁 Répertoires | Crée `data/` et `logs/` |
| 🔧 Configuration | Crée `backend/.env` depuis `envDefault` |
| 📦 Dépendances | `npm install` si `node_modules/` manquant |
| 💾 Base de données | SQLite créée automatiquement |
| 📝 Models | Sequelize sync() crée les tables |

## 🛠️ Autres Scripts

```bash
./configure.sh          # Configurer (première utilisation)
./test.sh               # Tester la configuration
./test-websocket.sh     # Tester WebSocket
```

## 📋 Logs

```bash
tail -f ../logs/backend.log    # Logs backend
tail -f ../logs/frontend.log   # Logs frontend
```

## 🆘 Aide

```bash
lsof -i :3001           # Vérifier backend port
lsof -i :5173           # Vérifier frontend port
```

## 📚 Documentation complète

Voir `../LOCALHOST_CONFIG.md`
