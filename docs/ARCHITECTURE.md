# 📁 Architecture et Structure des Dossiers

## Vue d'ensemble

Le projet utilise une **architecture à deux modes** pour permettre flexibilité et adaptation :

1. **Mode LOCAL** - Développement sur votre machine (localhost)
2. **Mode DEPLOYED** - Production sur serveur Ubuntu avec accès réseau

---

## 📂 Structure complète

```
sfiDashMonitoring/
│
├── 📁 local/                              ← MODE LOCAL (Développement)
│   ├── .env.local                         Configuration frontend localhost
│   ├── start.sh                           ← Démarrer services locaux
│   ├── test.sh                            Tester configuration
│   ├── configure.sh                       Initialiser configuration
│   ├── test-websocket.sh                  Tester WebSocket
│   └── README.md                          Documentation LOCAL
│
├── 📁 deployed/                           ← MODE DEPLOYED (Production)
│   ├── .env.example                       Template env réseau
│   ├── .env.production                    Variables de production
│   ├── docker-compose.yml                 Orchestration Docker
│   ├── Dockerfile.backend                 Image Docker backend
│   ├── Dockerfile.frontend                Image Docker frontend
│   ├── nginx.conf                         Configuration Nginx (proxy + statique)
│   ├── start.sh                           ← Démarrer avec Docker
│   ├── health-check.sh                    Vérifier santé services
│   ├── sfiDashMonitoring-backend.service   ← Systemd (alternative Docker)
│   ├── sfiDashMonitoring-frontend.service  ← Systemd (alternative Docker)
│   └── README.md                          Documentation DEPLOYED
│
├── 📁 backend/                            ← CODE BACKEND (Partagé)
│   ├── src/
│   │   ├── server.js                      Point d'entrée
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── databases/
│   ├── .env                               Configuration production
│   ├── envDefault                         Template env
│   └── package.json
│
├── 📁 src/                                ← CODE FRONTEND (Partagé)
│   ├── components/
│   │   ├── AlertesPage.jsx
│   │   ├── ReportsPage.jsx
│   │   ├── ProfilePage.jsx
│   │   ├── SettingsPage.jsx
│   │   ├── DataVisualization.jsx
│   │   └── dashboard-elements/
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   ├── WebsocketContext.jsx
│   │   └── NavContext.jsx
│   ├── App.jsx
│   └── main.jsx
│
├── 📁 public/                             ← Assets statiques (Partagé)
├── 📁 logs/                               ← Dossier logs (local)
│
├── 📄 README.md                           ← Guide principal (ce fichier)
├── 📄 LOCALHOST_CONFIG.md                 Configuration localhost détaillée
├── 📄 README-LOCAL.md                     Quick start LOCAL
├── 📄 ARCHITECTURE.md                     Ce fichier
│
├── 📄 package.json                        Dépendances frontend (Partagé)
├── 📄 vite.config.js                      Config Vite (Partagé)
├── 📄 eslint.config.js                    Config ESLint
├── 📄 index.html                          Entry HTML
│
└── 📄 .env.local                          ← AUTO-GÉNÉRÉS (ne pas commiter)
    📄 .env.example
    📄 .git
    📄 node_modules/
    📄 dist/

```

---

## 🔄 Flux de développement

### Workflow LOCAL (Jour à jour)

```
📝 Faire des modifications
    ↓
🧪 Tester localement: local/start.sh
    ↓
✅ Valider: local/test.sh
    ↓
📦 Git commit (Racine)
    ↓
🚀 Déployer: deployed/start.sh
```

### Workflow DEPLOYED (Mise en production)

```
🏗 Build Docker: docker-compose build
    ↓
🚀 Lancer: docker-compose up -d
    ↓
🧪 Vérifier: ./health-check.sh
    ↓
📡 Accessible réseau: http://IP:80
```

---

## 🔌 Communication

### Mode LOCAL

```
┌─────────────────┐
│   Navigateur    │
│  localhost:5173 │  (Vite HMR actif)
└────────┬────────┘
         │ fetch/ws
         ↓
┌────────────────────┐
│ Backend Localhost  │
│  localhost:3001    │
└────────────────────┘
```

### Mode DEPLOYED

```
┌──────────────────────────┐
│  Autre machine réseau    │
│   IP:192.168.1.100       │
└────────┬─────────────────┘
         │ HTTP port 80
         ↓
┌──────────────────────────────────┐
│  Nginx (Frontend + Proxy)        │
│  - Serve dist/ files              │
│  - Proxy /api → backend:3001      │
│  - Proxy /socket.io → backend:3001│
└────────┬──────────────────────────┘
         │
         ↓
┌──────────────────────────┐
│  Backend Container       │
│  localhost:3001 (interne)│
└──────────────────────────┘
```

---

## 📊 Comparaison LOCAL vs DEPLOYED

| Aspect | LOCAL | DEPLOYED |
|--------|-------|----------|
| **Frontend** | Vite Dev Server | Nginx (optimisé) |
| **Backend** | Node direct | Docker container |
| **HMR** | ✅ Activé | ❌ Non-pertinent |
| **Réseau** | localhost uniquement | Accessible réseau |
| **SSL/TLS** | Non | ✅ Supporté (nginx) |
| **Performance** | Développement | Production-ready |
| **Démarrage** | `local/start.sh` | `deployed/start.sh` |
| **Logs** | stdout/fichiers | Docker logs |
| **Redémarrage** | `Ctrl+C` + relancer | `docker-compose restart` |

---

## 🔑 Variables d'environnement

### Frontend

**LOCAL** (`.env.local`):
```
VITE_API_URL=http://localhost:3001
VITE_BACKEND_WS_URL=ws://localhost:3001
```

**DEPLOYED** (`deployed/.env.production`):
```
VITE_API_URL=http://192.168.1.100:3001
VITE_BACKEND_WS_URL=ws://192.168.1.100:3001
```

### Backend

**LOCAL** & **DEPLOYED** (`backend/.env`):
```
PORT=3001
HOST=0.0.0.0 (pour accepter réseau)
FRONTEND_URL=http://localhost:3000 http://localhost:5173
NODE_ENV=development|production
```

---

## 🛠 Outils & Commandes

### Setup initial

```bash
# Configuration locale
cd local && ./configure.sh

# Configuration déploiement
cd deployed && ./start.sh
```

### Développement

```bash
# Démarrer services
cd local && ./start.sh

# Tester
cd local && ./test.sh

# Logs
tail -f logs/backend.log
tail -f logs/frontend.log
```

### Production

```bash
# Build images
cd deployed && docker-compose build

# Démarrer
cd deployed && docker-compose up -d

# Status
docker-compose ps

# Logs
docker-compose logs -f

# Santé
./health-check.sh
```

---

## ♻️ Fichiers Partagés vs Spécifiques

### Partagés (Modifiables depuis racine)

- `backend/` - Code backend complet
- `src/` - Code React complet
- `public/` - Assets
- `package.json` - Dépendances
- `vite.config.js` - Config Vite

### Spécifiques LOCAL

- `local/.env.local` - Variables localhost
- `local/start.sh` - Script démarrage localhost
- `local/test.sh` - Tests localhost

### Spécifiques DEPLOYED

- `deployed/.env.production` - Variables réseau
- `deployed/docker-compose.yml` - Orchestration
- `deployed/Dockerfile.backend` - Image backend
- `deployed/Dockerfile.frontend` - Image frontend
- `deployed/nginx.conf` - Configuration proxy
- `deployed/start.sh` - Script démarrage Docker
- `deployed/*.service` - Systemd units

---

## 🔐 Sécurité

### LOCAL

- ✅ Localhost uniquement (secure par défaut)
- ❌ Pas de SSL (non-nécessaire)
- ✅ CORS restreint à localhost

### DEPLOYED

- ✅ Nginx reverse proxy
- ✅ SSL/TLS support (commenté)
- ✅ Rate limiting (nginx)
- ✅ CORS configurable
- ✅ Isolé par réseau

---

## 📈 Scalabilité

### LOCAL (Single machine)

```
Frontend (5173) ←→ Backend (3001) ←→ Elasticsearch
```

### DEPLOYED (Multiple services)

```
Internet
    ↓
Nginx (80/443) - Load balance, SSL, static files
    ↓
Backend (3001) - Can be multiple instances
    ↓
Elasticsearch
Database (Sequelize)
```

Future: Ajouter Redis cache, multiple backend instances avec load balancer.

---

## 📚 Références

- `README.md` - Guide principal
- `LOCALHOST_CONFIG.md` - Config localhost détaillée
- `Deployment.md` - Guide avancé
- `local/README.md` - Quick start LOCAL
- `deployed/README.md` - Quick start DEPLOYED

---

**Maintenance:** Cette architecture à deux modes facilite développement et déploiement tout en partageant 100% du code.
