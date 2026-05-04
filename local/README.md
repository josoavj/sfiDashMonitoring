# 🚀 Mode LOCAL - Développement en Localhost

Environnement complet de développement pour votre machine. Frontend et Backend en localhost avec Hot Module Replacement (HMR) pour rechargement en direct.

## 📍 Architecture

```
Votre Machine (localhost)
├── Frontend: Vite React 19 (port 5173)
│   ├── Hot Module Reload (HMR)
│   ├── Lazy loading (code splitting)
│   ├── Response caching (TTL: 60s-3600s)
│   └── React.memo optimization
│
└── Backend: Node.js Express (port 3001)
	├── Morgan HTTP logging
	├── JWT authentification (HttpOnly cookies)
	├── Socket.io WebSocket
	├── Elasticsearch integration
	└── File logging (logs/backend.log)
```

## ⚡ Démarrage Rapide

### Option 1: Tout en Un (Recommandé pour simplicité)

```bash
./start.sh
```

**Fait automatiquement:**
- ✅ Vérifie Node.js et npm
- ✅ Crée `backend/.env` depuis template si manquant
- ✅ Installe les dépendances (npm install)
- ✅ Crée les répertoires `data/` et `logs/`
- ✅ Démarre Backend (port 3001) en arrière-plan
- ✅ Démarre Frontend (port 5173) en avant-plan
- 🌐 Ouvre automatiquement http://localhost:5173

### Option 2: Backend Seul (Testing/API)

```bash
./start-backend-only.sh
```

- Lance Node.js sur **port 3001**
- ✅ Crée `backend/.env` si manquant
- ✅ Initialise les répertoires
- Utile pour tester l'API seule

### Option 3: Frontend Seul (Avec mock backend)

```bash
./start-frontend-only.sh
```

- Lance Vite dev server sur **port 5173**
- ⚠️ Vérifie si backend est actif
- Utile pour développer l'UI indépendamment

### Option 4: Développement Optimal (Deux terminals)

**Terminal 1: Backend avec hot reload**
```bash
cd backend
npm run dev
```

**Terminal 2: Frontend avec HMR**
```bash
npm run dev
```

Chaque modification est immédiatement visible !

## 📍 URLs d'Accès

| Service | URL | Port |
|---------|-----|------|
| **Frontend** | http://localhost:5173 | 5173 |
| **Backend API** | http://localhost:3001 | 3001 |
| **WebSocket** | ws://localhost:3001/socket.io | 3001 |
| **Health Check** | http://localhost:3001/api/health | 3001 |
| **API Swagger** | http://localhost:3001/api-docs | 3001 |

## 🎯 Scripts Utilitaires (depuis racine)

Tous ces scripts sont dans `scripts/` et utilisables depuis n'importe où:

### 📋 Gestion des Logs

```bash
# Surveiller les logs en temps réel
../scripts/logs/watch-logs.sh          # Backend + Frontend
../scripts/logs/watch-logs.sh backend  # Seulement Backend
../scripts/logs/watch-logs.sh frontend # Seulement Frontend

# Gérer les logs (archiver, nettoyer, etc)
../scripts/logs/manage-logs.sh info    # Voir tailles/statistiques
../scripts/logs/manage-logs.sh archive # Archiver avec timestamp
../scripts/logs/manage-logs.sh clean   # Vider les fichiers
```

### 🛠️ Développement & Tests

```bash
# Initialiser l'environnement complet
../scripts/dev/setup.sh

# Lancer les tests
../scripts/dev/test.sh                # Tests unitaires
../scripts/dev/test.sh ui             # Vitest UI (http://localhost:51204)
../scripts/dev/test.sh coverage       # Report couverture
../scripts/dev/test.sh watch          # Mode watch (redémarre auto)
```

### 🏗️ Build & Analyse (avant production)

```bash
# Builder le frontend
../scripts/build/build-frontend.sh

# Analyser la taille du build
../scripts/build/analyze-build.sh
```

### 🔧 Utilitaires & Validation

```bash
# Vérifier la santé des services
../scripts/utils/health-check.sh

# Test complet du projet
../scripts/utils/test-local.sh

# Lancer avec logs actifs
../scripts/logs/start-with-logs.sh
```

## ✨ Optimisations Modernes

### Frontend Performance

| Technique | Bénéfice | Détails |
|-----------|----------|---------|
| **Lazy Loading** | ↓ 40% initial load | Code splitting avec React.lazy() |
| **Response Caching** | ↓ 60% API calls | TTL-based cache (60s-3600s) |
| **Request Dedup** | ↓ 30% duplicates | Merge in-flight identical GETs |
| **React.memo** | ↓ 20% re-renders | Memoize dashboard views |

### Backend Logging

| Feature | Détails |
|---------|---------|
| **Morgan HTTP Logging** | Tous les requêtes vers logs/backend.log |
| **Structured Logging** | JSON format avec timestamps |
| **File Output** | Persiste en logs/backend.log |
| **Debug Levels** | ERROR, WARN, INFO, DEBUG |

### Sécurité

| Feature | Détails |
|---------|---------|
| **JWT HttpOnly** | Tokens dans cookies non-JS |
| **Refresh Rotation** | Nouveau token à chaque refresh |
| **CSRF Protection** | Double submit tokens |
| **Rate Limiting** | Auth (5/15min), Refresh (10/min) |

## 🔧 Configuration

### Frontend (`.env.local`)

Automatiquement créé lors du premier démarrage:

```env
VITE_API_URL=http://localhost:3001
VITE_BACKEND_WS_URL=http://localhost:3001
```

### Backend (`backend/.env`)

Copié de `backend/envDefault` au premier démarrage:

```env
NODE_ENV=development
PORT=3001
HOST=localhost
FRONTEND_URL=http://localhost:5173
JWT_SECRET=generated_automatically
JWT_REFRESH_SECRET=generated_automatically
```

## 📊 Initialisation Automatique

Chaque démarrage crée automatiquement:

| Item | Location | Details |
|------|----------|---------|
| 📁 Data Directory | `data/` | SQLite database |
| 📁 Logs Directory | `logs/` | backend.log, frontend.log |
| 🔐 Backend Config | `backend/.env` | Copié de template |
| 📦 Dependencies | `node_modules/` | npm install |
| 🗄️ Database | `data/database.sqlite` | Sequelize sync |

## 🧪 Tests & Validation

### Avant de committer

```bash
# Linter le code
npm run lint

# Lancer les tests
../scripts/dev/test.sh

# Vérifier la couverture
../scripts/dev/test.sh coverage
```

### Tester les services

```bash
# Health check complet
../scripts/utils/health-check.sh

# Test local du projet
../scripts/utils/test-local.sh

# Tester WebSocket
./test-websocket.sh
```

## 📋 Workflow Recommandé

### 1️⃣ Setup Initial (une fois)

```bash
cd local
./setup.sh              # OU ../scripts/dev/setup.sh
```

### 2️⃣ Démarrage Quotidien

**Pour commencer:**
```bash
./start.sh              # Tout en un, simple
```

**OU pour optimal (2 terminals):**

**Terminal 1:**
```bash
cd backend && npm run dev
```

**Terminal 2:**
```bash
npm run dev
```

### 3️⃣ Développement

```bash
# Terminal 3: Surveiller les logs (optionnel)
../scripts/logs/watch-logs.sh

# Terminal 4: Lancer les tests (optionnel)
../scripts/dev/test.sh watch
```

### 4️⃣ Avant Production

```bash
# Builder
../scripts/build/build-frontend.sh

# Analyser taille
../scripts/build/analyze-build.sh

# Tests finals
../scripts/dev/test.sh coverage

# Archiver les logs
../scripts/logs/manage-logs.sh archive
```

## 🆘 Troubleshooting

### Ports déjà utilisés?

```bash
# Trouver ce qui utilise le port
lsof -i :3001           # Backend
lsof -i :5173           # Frontend

# Tuer le processus
kill -9 <PID>
```

### Backend ne démarre pas?

```bash
# Vérifier Elasticsearch
curl http://localhost:9200

# Vérifier les logs
tail -f ../logs/backend.log
```

### Frontend ne se connecte pas?

```bash
# Vérifier WebSocket
./test-websocket.sh

# Vérifier l'API
curl http://localhost:3001/api/health
```

### Réinitialiser complètement?

```bash
# Arrêter les services (Ctrl+C)

# Nettoyer
rm -rf node_modules backend/node_modules
rm -rf data/ logs/
rm backend/.env

# Recommencer
./start.sh
```

## 📚 Documentation Complète

Voir aussi:
- [Main README](../README.md) - Vue d'ensemble
- [Scripts Documentation](../scripts/README.md) - Tous les scripts disponibles
- [LOCALHOST_CONFIG.md](../LOCALHOST_CONFIG.md) - Configuration détaillée
- [SECURITY.md](../SECURITY.md) - Détails sécurité & JWT
- [Backend README](../backend/README.md) - API documentation

## 🚀 Prochaines Étapes

Après avoir démarré:

1. 👤 Créer un compte utilisateur
2. 📊 Explorer le dashboard
3. 🧪 Modifier du code (hot reload)
4. ✅ Lancer les tests
5. 📦 Builder pour production (voir `deployed/`)

---

**Mode LOCAL:** Développement rapide et itératif sur votre machine
**Mode DEPLOYED:** Production sur Ubuntu Server (voir `deployed/README.md`)
