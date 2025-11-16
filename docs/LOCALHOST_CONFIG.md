# 🚀 Configuration Localhost - SFI Dashboard Monitoring

## Vue d'ensemble

Ce projet est configuré pour fonctionner en **mode local** sur votre machine. Tous les services (Frontend et Backend) sont accessibles via `localhost` avec des **fallbacks automatiques** intégrés.

## 📍 URLs d'accès

| Service | URL | Port |
|---------|-----|------|
| **Frontend** | http://localhost:5173 | 5173 |
| **Backend API** | http://localhost:3001 | 3001 |
| **WebSocket** | ws://localhost:3001/socket.io | 3001 |

## ⚡ Démarrage rapide

### Option 1: Utiliser le script `start.sh` (Recommandé)

```bash
./start.sh
```

Le script :
- ✅ Vérifie les dépendances (Node.js, npm)
- ✅ Installe les packages manquants
- ✅ Lance le backend sur localhost:3001
- ✅ Lance le frontend sur localhost:5173
- ✅ Configure automatiquement les URLs pour localhost
- ✅ Affiche les logs en temps réel

**Arrêter les services:** Appuyez sur `Ctrl+C`

### Option 2: Utiliser npm scripts

```bash
# Terminal 1 - Backend
npm run backend

# Terminal 2 - Frontend
npm run frontend

# OU en parallèle
npm run start:all
```

## 🔧 Configuration

### Frontend (`.env.local`)

Le fichier `.env.local` configure le frontend avec des fallbacks automatiques :

```env
VITE_API_URL=http://localhost:3001
VITE_BACKEND_WS_URL=ws://localhost:3001
```

**Fonctionnement des fallbacks :**
- Si `VITE_API_URL` n'est pas accessible → utilise `http://localhost:3001`
- Si `VITE_BACKEND_WS_URL` n'est pas accessible → utilise `ws://localhost:3001`
- Code avec fallbacks intégré dans :
  - `src/context/AuthContext.jsx`
  - `src/context/WebsocketContext.jsx`
  - `src/components/ProfilePage.jsx`
  - `src/components/AlertesPage.jsx`
  - `src/components/ReportsPage.jsx`

### Backend (`backend/.env`)

Configuration du backend avec support multiples URLs :

```properties
PORT=3001
HOST=0.0.0.0
FRONTEND_URL=http://localhost:3000 http://localhost:5173
NODE_ENV=development
```

**Fonctionnement CORS :**
- Le backend accepte les connexions CORS de :
  - `http://localhost:3000`
  - `http://localhost:5173`
  - `http://127.0.0.1:3000`
  - `http://127.0.0.1:5173`

### Vite Config (`vite.config.js`)

Le serveur Vite est configuré avec :
- **Host** : `0.0.0.0` → Écoute sur toutes les interfaces
- **Port** : `5173` (strictPort=false, passera au 5174 si occupé)
- **HMR** : WebSocket sur `localhost:5173`
- **Proxy** : Redirection vers backend pour `/api` et `/socket.io`

## 🌍 Accès via IPv4

Les services sont aussi accessibles via l'IPv4 `127.0.0.1` :
- Frontend: http://127.0.0.1:5173
- Backend: http://127.0.0.1:3001
- WebSocket: ws://127.0.0.1:3001/socket.io

## 📋 Logs

Les logs sont enregistrés dans le dossier `logs/` :

```bash
# Voir les logs en temps réel
tail -f logs/backend.log   # Logs du backend
tail -f logs/frontend.log  # Logs du frontend
tail -f logs/*.log         # Tous les logs

# Nettoyer les anciens logs
rm logs/*.log
```

## 🔌 Vérifier la connectivité

### Tester le Backend

```bash
# Curl
curl http://localhost:3001/api/health

# Ou depuis le frontend (dans console)
fetch('http://localhost:3001/api/top-sources')
  .then(r => r.json())
  .then(console.log)
```

### Tester le WebSocket

```javascript
// Dans la console du navigateur
const io = await import('socket.io-client');
const socket = io('ws://localhost:3001', { transports: ['websocket'] });
socket.on('connect', () => console.log('Connected!'));
socket.on('error', (err) => console.error(err));
```

## 🆘 Dépannage

### Le backend ne démarre pas

```bash
# Vérifier que le port 3001 est libre
lsof -i :3001

# Si occupé, libérer le port
kill -9 <PID>

# Ou utiliser un autre port
PORT=3002 npm run backend
```

### Le frontend ne démarre pas

```bash
# Vérifier que le port 5173 est libre
lsof -i :5173

# Si occupé, le script utilisera 5174
PORT=5174 npm run frontend
```

### Les modules ne se trouvent pas

```bash
# Réinstaller les dépendances
npm install
cd backend && npm install && cd ..

# Ou
npm run setup
```

### Les connexions WebSocket échouent

1. Vérifier que le backend est en cours d'exécution :
   ```bash
   curl http://localhost:3001
   ```

2. Vérifier les logs du backend :
   ```bash
   tail -f logs/backend.log
   ```

3. Vérifier les logs du navigateur (F12 → Console)

## 📦 Variables d'environnement

### Surcharger les ports

```bash
# Frontend sur port personnalisé
FRONTEND_PORT=8000 npm run dev

# Backend sur port personnalisé
PORT=4000 npm run backend

# Les deux
BACKEND_PORT=4000 FRONTEND_PORT=8000 ./start.sh
```

### Mode production

```bash
NODE_ENV=production ./start.sh

# Ou
NODE_ENV=production npm run backend
NODE_ENV=production npm run dev
```

## 🎯 Cas d'usage courants

### Démarrage simple (tous les services)

```bash
./start.sh
# Accès: http://localhost:5173
```

### Développement avec rechargement automatique

```bash
npm run start:all
# Le frontend recharge automatiquement (HMR actif)
```

### Tests API uniquement

```bash
npm run backend
# Le backend tourne sur http://localhost:3001
```

### Développement frontend sans backend

```bash
npm run frontend
# Frontend sur http://localhost:5173
# (fallback à localhost:3001 si backend indisponible)
```

## 🔐 Notes de sécurité

- **Développement local uniquement** : Cette configuration est pour le développement
- **Pas de HTTPS en local** : Les certificats SSL ne sont pas nécessaires pour localhost
- **CORS permissif** : localhost:3000 et localhost:5173 sont autorisés
- **Credentials activés** : WebSocket inclut les cookies/tokens

## 📚 Fichiers clés

| Fichier | Rôle | Fallback |
|---------|------|----------|
| `.env.local` | Config frontend | hardcodé dans les fichiers `.jsx` |
| `backend/.env` | Config backend | défaut FRONTEND_URL et CORS |
| `vite.config.js` | Config Vite | hardcodé en défaut |
| `start.sh` | Script de démarrage | npm scripts en fallback |
| `package.json` | Scripts npm | fallback pour démarrage manuel |

## ✅ Checklist avant déploiement

- [ ] Frontend accessible sur http://localhost:5173
- [ ] Backend accessible sur http://localhost:3001
- [ ] WebSocket connecté et fonctionnel
- [ ] Elasticsearch connecté (backend logs)
- [ ] Base de données connectée (backend logs)
- [ ] Pas d'erreurs CORS en console
- [ ] Pas d'erreurs WebSocket en console
- [ ] Tous les modules chargent correctement
- [ ] Authentification fonctionne
- [ ] Pages load sans erreurs
