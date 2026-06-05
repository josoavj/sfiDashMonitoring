# 🚀 SFI Dashboard Monitoring

**Plateforme de monitoring des données Fortigate depuis Elasticsearch**

> ✨ **Statut** : Production Ready - Sécurité renforcée, Tests & Monitoring

## 📋 Stack Technique

| Composant | Technologie | Version |
|-----------|-------------|---------|
| **Frontend** | React 19 + Vite | 19.1.1 |
| **UI Framework** | Material-UI (MUI) | 7.3.1 |
| **Backend** | Node.js + Express | 5.1.0 |
| **Base de données** | Elasticsearch | 8.x |
| **Real-time** | Socket.io | 4.8.1 |
| **Auth** | JWT + HttpOnly Cookies | Sécurisé |
| **Tests** | Vitest + React Testing Library | V8 |
| **Monitoring** | Prometheus | Optional |

---

## 🔒 Sécurité

### ✨ Améliorations sécurité

- ✅ **JWT HttpOnly Cookies** - Tokens non accessibles via JavaScript
- ✅ **Refresh Token Rotation** - Nouveau token à chaque refresh
- ✅ **Token Hashing** - Refresh tokens hachés en BD (pas en clair)
- ✅ **CORS Strict** - Origins whitelist, SameSite=Strict
- ✅ **Helmet Security Headers** - Protection contre XSS, Clickjacking
- ✅ **Rate Limiting** - Auth (5/15min), Refresh (10/min)
- ✅ **CSRF Protection** - Double submit tokens
- ✅ **Vulnérabilités npm fixées** - 0 vulnérabilités

### 🔐 Authentification

```javascript
// ✅ Login → Access Token (JWT 15m) + Refresh Token (HttpOnly cookie)
POST /auth/signin
→ { accessToken, user }
+ Cookie: refreshToken (HttpOnly, Secure, SameSite=Strict)

// ✅ Refresh automatique avant expiration
POST /auth/refresh (credentials: 'include')
→ Nouveau Access Token + nouveau Refresh Token

// ✅ Logout révoque toutes les sessions
POST /auth/signout
→ Sessions marquées revoked=true, cookie supprimé
```

---

## 🧪 Tests & Qualité

### Tests

```bash
npm test              # Lancer les tests Vitest
npm run test:ui       # Interface Vitest UI
npm run test:coverage # Report couverture
```

**Couverture:**

- ✅ Auth Security Tests (JWT, hashing, expiration)
- ✅ AuthContext Tests (login, refresh, logout)
- ✅ Password hashing & verification
- ✅ Token expiration & rotation

### Linting

```bash
npm run lint          # ESLint (frontend)
```

---

## 📊 Monitoring & Observabilité

### Prometheus Metrics

```bash
GET /metrics          # Format Prometheus (port 3001)
```

**Métriques collectées:**

- `http_requests_total` - Total requêtes HTTP
- `http_request_duration_ms` - Latence par endpoint
- `http_requests_in_progress` - Requêtes actives
- `nodejs_memory_heap_used_bytes` - Mémoire heap
- `nodejs_uptime_seconds` - Uptime serveur

**Intégration Prometheus:**

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'sfi-dashboard-backend'
    static_configs:
      - targets: ['localhost:3001']
```

---

## 📚 API Documentation

### Swagger/OpenAPI

```bash
# Documentation disponible à:
GET http://localhost:3001/api-docs
```

**Endpoints documentés:**

- `POST /auth/signin` - Connexion
- `POST /auth/signup` - Inscription
- `POST /auth/refresh` - Rafraîchir token
- `POST /auth/signout` - Déconnexion
- `GET /api/me` - Profil utilisateur
- `POST /api/*` - Endpoints monitoring (nécessitent JWT)

---

## 🛡️ Configuration Sécurité (Production)

### Variables d'environnement essentielles

```bash
# Backend .env (à générer avec openssl rand -base64 32)
NODE_ENV=production
JWT_SECRET=<secret1>           # ✅ Généré automatiquement
JWT_REFRESH_SECRET=<secret2>   # ✅ Généré automatiquement

# Elasticsearch
ES_NODE=https://es.example.com:9200
ES_USERNAME=elastic
ES_PASSWORD=xxxxx
ES_CERT_PATH=/path/to/ca.crt

# CORS
FRONTEND_URL=https://app.example.com

# Server
PORT=3001
HOST=0.0.0.0
```

### Checklist déploiement

- [ ] `NODE_ENV=production`
- [ ] JWT_SECRET & JWT_REFRESH_SECRET générés
- [ ] HTTPS forcé (Nginx SSL)
- [ ] CORS origins = domaine production uniquement
- [ ] Rate limits ajustés selon charge
- [ ] Logs centralisés (optionnel)
- [ ] Monitoring Prometheus (optionnel)
- [ ] Backups BD programmés

---

### 1. 🖥️ Mode LOCAL (Développement sur votre machine)

Accessible uniquement en localhost.

```bash
cd local
./start.sh
# Frontend: http://localhost:5173
# Backend: http://localhost:3001
```

**Idéal pour:** Développement, débogage, tests locaux

📖 **Documentation:** [`local/README.md`](./local/README.md)

---

### 2. 🌐 Mode DEPLOYED (Ubuntu Server + Réseau)

Frontend accessible depuis autres machines du réseau. Pas d'interface graphique sur le serveur.

```bash
cd deployed
export SERVER_IP=192.168.1.100
./start.sh
# Frontend: http://192.168.1.100
# Backend: http://192.168.1.100:3001
```

**Idéal pour:** Production, serveur Ubuntu, accès réseau

📖 **Documentation:** [`deployed/README.md`](./deployed/README.md)

---

## 🚀 Démarrage rapide

### Installation

```bash
# Clone et install dépendances
git clone https://github.com/koulienathalie/sfiDashboard.git
cd sfiDashboard
npm run setup            # Installe frontend + backend

# Configure variables d'environnement
cp backend/envDefault backend/.env
# Éditer backend/.env avec vos paramètres ES
```

### Démarrage développement

```bash
# Démarrage standard
./start.sh              # Backend + Frontend

# Avec logs en direct
./scripts/logs/start-with-logs.sh

# Seulement backend ou frontend
./scripts/logs/start-with-logs.sh backend-only
./scripts/logs/start-with-logs.sh frontend-only
```

### Tests & Validation

```bash
npm test               # Lancer les tests unitaires
npm run test:ui        # Interface Vitest
./scripts/utils/test-local.sh  # Validation projet complète
```

### Scripts utiles

```bash
# Initialiser l'environnement
./scripts/dev/setup.sh

# Surveiller les logs
./scripts/logs/watch-logs.sh

# Vérifier la santé des services
./scripts/utils/health-check.sh

# Builder pour production
./scripts/build/build-frontend.sh
./scripts/build/analyze-build.sh
```

**📖 Docs complètes:** Voir [scripts/README.md](./scripts/README.md)

---

## 📦 Prérequis

- **Node.js** ≥ 18 (pour HttpOnly cookies natifs)
- **npm** ≥ 9
- **Elasticsearch** ≥ 8.0 (accessible)
- **MariaDB** ou **PostgreSQL** (pour auth)
- **Pour mode deployed:** Docker Compose ou Ubuntu 20.04+

---

## 🔧 Configuration

### Backend `.env`

```bash
# Copier et adapter
cp backend/envDefault backend/.env

# Variables importantes:
ES_NODE=https://192.168.1.50:9200        # Adresse Elasticsearch
ES_USERNAME=elastic
ES_PASSWORD=votre_mot_de_passe
PORT=3001
FRONTEND_URL=http://localhost:5173        # Pour CORS
```

### Frontend `.env` (auto-générés)

- **LOCAL:** `local/.env.local` avec `localhost:3001`
- **DEPLOYED:** `deployed/.env.production` avec IP du serveur

---

## 📂 Structure des dossiers

```
sfiDashMonitoring/
├── 📁 scripts/                  ← 🎯 Scripts utilitaires
│   ├── 📁 logs/                 ← Gestion des logs
│   │   ├── watch-logs.sh        ← Surveiller logs en direct
│   │   ├── manage-logs.sh       ← Archiver/nettoyer logs
│   │   └── start-with-logs.sh   ← Démarrer + logs actifs
│   ├── 📁 dev/                  ← Développement
│   │   ├── setup.sh             ← Initialiser l'env
│   │   └── test.sh              ← Lancer les tests
│   ├── 📁 build/                ← Build & analyse
│   │   ├── build-frontend.sh    ← Builder le frontend
│   │   └── analyze-build.sh     ← Analyser la taille
│   ├── 📁 utils/                ← Utilitaires
│   │   └── health-check.sh      ← Vérifier santé services
│   └── README.md                ← 📖 Docs scripts
│
├── 📁 local/                    ← Mode développement (localhost)
│   ├── start.sh                 ← Démarrer services
│   ├── test.sh                  ← Tester configuration
│   ├── configure.sh             ← Initialiser
│   └── README.md                ← Docs LOCAL
│
├── 📁 deployed/                 ← Mode production (réseau)
│   ├── docker-compose.yml       ← Orchestration Docker
│   ├── Dockerfile.backend       ← Image backend
│   ├── Dockerfile.frontend      ← Image frontend
│   ├── nginx.conf               ← Configuration Nginx
│   ├── .env.production          ← Template env
│   ├── start.sh                 ← Démarrer avec Docker
│   ├── health-check.sh          ← Vérifier services
│   ├── sfiDashMonitoring-*.service ← Systemd units
│   └── README.md                ← Docs DEPLOYED
│
├── 📁 backend/                  ← Code backend (partagé)
├── 📁 src/                      ← Code React (partagé)
├── package.json                 ← Dépendances (partagé)
├── start.sh                     ← 🎯 Point d'entrée principal
└── README.md                    ← Ce fichier
```

**📖 Documentation scripts:** Voir [scripts/README.md](./scripts/README.md) pour le détail complet de chaque script et les workflows.

---

## 🚀 Commandes rapides

### Mode LOCAL

```bash
cd local
./configure.sh      # Setup (première utilisation)
./start.sh          # Démarrer
./test.sh           # Tester
```

### Mode DEPLOYED

```bash
cd deployed
export SERVER_IP=192.168.1.100
./start.sh          # Démarrer avec Docker
./health-check.sh   # Vérifier services
```

---

## 🎨 Fonctionnalités

- ✅ Dashboard temps réel avec WebSocket
- ✅ Monitoring Elasticsearch Fortigate
- ✅ Alertes haute bande passante
- ✅ Rapports Top 20 consommateurs
- ✅ **Authentification JWT sécurisée** (HttpOnly cookies)
- ✅ **Refresh tokens automatiques**
- ✅ Responsive Material-UI
- ✅ Support offline avec fallbacks
- ✅ **Tests unitaires & sécurité**
- ✅ **Monitoring Prometheus**
- ✅ **API Swagger/OpenAPI**

---

## 📚 Documentation complète

| Document | Contenu |
|----------|---------|
| `LOCALHOST_CONFIG.md` | Configuration localhost détaillée |
| `Deployment.md` | Guide déploiement avancé |
| `local/README.md` | Mode développement |
| `deployed/README.md` | Mode production |
| `SECURITY.md` | Détails sécurité & JWT |
| `API.md` | Référence API complète |

---

## 👥 Équipe

**Frontend:**

- Koloina (@koulienathalie)

**Backend:**

- josoavj (@josoavj)
- haritsimba (@haritsimba)

---

## 🔗 Projets liés

- [elasticsearch-nodejs-server](https://github.com/josoavj/elasticsearch-nodejs-server) - Tests intégration
- [elasticsearch-config](https://github.com/josoavj/elasticsearch-config) - Configuration ES

---

## 📄 License

MIT

---

## 🆘 Support

Problème?

1. Consultez la documentation du mode que vous utilisez
2. Vérifiez les logs: `tail -f logs/*.log`
3. Lancez les tests: `npm test`
4. Vérifiez la santé: `curl http://localhost:3001/api/health`
5. Ouvrez une issue avec les logs et logs des tests

---

## 🔄 Roadmap

| Étape | Statut | Description |
|-------|--------|-------------|
| **1** | ✅ FAIT | Sécurité (JWT HttpOnly, refresh tokens) |
| **2** | ✅ FAIT | Tests, Swagger, Prometheus, CSRF |
| **3** | ⏳ TODO | TypeScript migration |
| **4** | ⏳ TODO | Logging centralisé (ELK/Winston) |
| **5** | ⏳ TODO | Circuit breaker Elasticsearch |
| **6** | ⏳ TODO | E2E tests (Playwright) |

---
