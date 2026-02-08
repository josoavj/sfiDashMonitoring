# 📋 Scripts & Documentation - Inventaire Complet

**Date:** 8 février 2026  
**Status:** ✅ Phases 1 & 2 Complètes

---

## 📂 Structure des Scripts

```
sfiDashMonitoring/
├── backend/
│   ├── setup-env.sh             (🆕 Phases 1 & 2)
│   ├── start.sh
│   ├── test-connection.js
│   ├── test-data.js
│   └── testDataFortigate.js
├── local/
│   ├── configure.sh
│   ├── setup.sh
│   ├── start.sh                 (👈 Principal)
│   ├── start-backend-only.sh
│   ├── start-frontend-only.sh
│   ├── test-websocket.sh
│   └── test.sh
├── deployed/
│   ├── check.sh
│   ├── health-check.sh          (👈 Important)
│   ├── install-production.sh
│   ├── install.sh
│   ├── start-deploy.sh
│   ├── start.sh
│   ├── update-frontend-config.sh
│   ├── update-production.sh
│   ├── update.sh
│   ├── verify-deployment.sh
│   ├── verify.sh
│   └── SUMMARY.sh
├── start.sh                     (🆕 Root)
├── test-local.sh                (🆕 Root)
└── docs/
    ├── PHASES_1_2_GUIDE.md      (🆕)
    └── DEPLOYMENT_PHASES_1_2.md (🆕)
```

**Légende:** 🆕 = Nouveau (Phases 1 & 2), 👈 = Principal, ✅ = À jour

---

## 🔧 Scripts Backend

### `backend/setup-env.sh` (NOUVEAU ✨)
**Purpose:** Générer les variables d'environnement sécurisées

**Quand l'utiliser:**
```bash
cd backend
bash setup-env.sh
```

**Ce qu'il fait:**
- ✅ Génère JWT_SECRET, JWT_REFRESH_SECRET, SESSION_SECRET
- ✅ Demande l'environnement (dev/prod)
- ✅ Configure Elasticsearch
- ✅ Crée `.env` avec permissions `600`
- ✅ Backup l'ancien `.env` s'il existe

**Résultat:** Fichier `.env` configuré et sécurisé

**Variables créées:**
```env
JWT_SECRET=<random_base64_32>
JWT_REFRESH_SECRET=<random_base64_32>
SESSION_SECRET=<random_base64_32>
NODE_ENV=development|production
FRONTEND_URL=http://localhost:3000
ES_NODE=https://...
ES_USERNAME=elastic
ES_PASSWORD=...
```

### `backend/start.sh`
**Purpose:** Démarrer le serveur backend

**Usage:**
```bash
bash backend/start.sh
# Ou: cd backend && npm start
```

**Vérifie:**
- Node.js est installé
- npm dependencies
- PORT 3001 disponible

### `backend/test-connection.js`
**Purpose:** Tester la connexion à Elasticsearch

```bash
node backend/test-connection.js
```

### `backend/test-data.js`
**Purpose:** Injecter des données de test dans Elasticsearch

```bash
node backend/test-data.js
```

### `backend/testDataFortigate.js`
**Purpose:** Données Fortigate simulées pour test

```bash
node backend/testDataFortigate.js
```

---

## 🏠 Scripts Local (Développement)

### `local/start.sh` (PRINCIPAL ⭐)
**Purpose:** Démarrer frontend + backend ensemble localement

**Usage:**
```bash
bash local/start.sh
# Ou depuis racine: ./start.sh
```

**Vérifie:**
- Node.js, npm, bash
- Ports disponibles (3000, 3001)
- Dépendances npm

**Démarre:**
1. Backend sur `http://localhost:3001`
2. Frontend sur `http://localhost:3000`

**Logs en temps réel** avec couleurs

**Arrêt gracieux:** Ctrl+C → cleanup PID

### `local/setup.sh`
**Purpose:** Configuration initiale du projet

```bash
bash local/setup.sh
```

**Actions:**
- npm install (frontend + backend)
- Vérifier prérequis
- Créer répertoires logs/data
- Initialiser `.env` si absent

### `local/configure.sh`
**Purpose:** Configuration interactive détaillée

```bash
bash local/configure.sh
```

### `local/start-backend-only.sh`
**Purpose:** Démarrer backend seul (test API)

```bash
bash local/start-backend-only.sh
# Accès: http://localhost:3001
# Swagger: http://localhost:3001/api/docs
```

### `local/start-frontend-only.sh`
**Purpose:** Démarrer frontend seul (avec proxy)

```bash
bash local/start-frontend-only.sh
# Accès: http://localhost:3000
# Proxy vers backend: localhost:3001
```

### `local/test-websocket.sh`
**Purpose:** Tester la connexion WebSocket

```bash
bash local/test-websocket.sh
```

Connecte à `ws://localhost:3001` et envoie messages de test

### `local/test.sh`
**Purpose:** Lancer tous les tests

```bash
bash local/test.sh
```

**Tests:**
- Frontend: `npm test`
- Backend: `cd backend && npm test:security`
- Vérifications npm audit

---

## 🚀 Scripts Déploiement Production

### `deployed/start.sh` (DÉMARRAGE)
**Purpose:** Démarrer en production avec Docker ou Systemd

**Usage:**
```bash
bash deployed/start.sh
```

**Détecte automatiquement:**
- Docker Compose disponible → lance services Docker
- Systemd disponible → lance services Systemd

**Affiche:**
- URLs d'accès
- Logs en temps réel

### `deployed/install.sh`
**Purpose:** Installation initiale en production

```bash
sudo bash deployed/install.sh
```

**Installe:**
- Docker & Docker Compose (optionnel)
- Node.js 18+
- Nginx
- Services Systemd
- SSL certificates

### `deployed/install-production.sh`
**Purpose:** Installation optimisée production avec sécurité

```bash
sudo bash deployed/install-production.sh
```

### `deployed/health-check.sh` (IMPORTANT ✨)
**Purpose:** Vérifier l'état de tous les services

```bash
bash deployed/health-check.sh
```

**Contrôle:**
- Backend API (GET `/health`)
- Frontend accessibility
- Elasticsearch connexion
- Database connexion
- WebSocket
- Metrics endpoint

**Output:** Détaillé avec statuts ✓/✗

### `deployed/verify-deployment.sh`
**Purpose:** Vérifier le déploiement après installation

```bash
bash deployed/verify-deployment.sh
```

**Vérifie:**
- Services démarrés
- Ports ouverts
- SSL certificats valides
- Permissions fichiers
- Variables d'env

### `deployed/verify.sh`
**Purpose:** Vérification rapide (alias)

```bash
bash deployed/verify.sh
```

### `deployed/check.sh`
**Purpose:** Vérification complète du système

```bash
bash deployed/check.sh
```

### `deployed/start-deploy.sh`
**Purpose:** Démarrage sécurisé avec vérifications

```bash
bash deployed/start-deploy.sh
```

### `deployed/update.sh`
**Purpose:** Mettre à jour le code depuis git

```bash
bash deployed/update.sh
```

**Actions:**
- Pull depuis git
- npm install
- Restart services
- Health check

### `deployed/update-production.sh`
**Purpose:** Mise à jour production avec backup

```bash
bash deployed/update-production.sh
```

**Inclut:**
- Backup base de données
- Backup configuration
- Zero-downtime deployment
- Health check post-deploy

### `deployed/update-frontend-config.sh`
**Purpose:** Mettre à jour configuration frontend

```bash
bash deployed/update-frontend-config.sh
```

### `deployed/SUMMARY.sh`
**Purpose:** Afficher un résumé du déploiement

```bash
bash deployed/SUMMARY.sh
```

---

## 📄 Root Scripts

### `./start.sh` (NOUVEAU ✨)
**Purpose:** Raccourci pour `local/start.sh`

**Usage:**
```bash
./start.sh
# Équivalent: bash local/start.sh
```

### `./test-local.sh` (NOUVEAU ✨)
**Purpose:** Raccourci pour `local/test.sh`

**Usage:**
```bash
./test-local.sh
# Équivalent: bash local/test.sh
```

---

## 📚 Documentation (Phases 1 & 2)

### Core Documentation

**`docs/PHASES_1_2_GUIDE.md`** (NOUVEAU ✨)
- 🔐 Vue d'ensemble sécurité
- 🔄 Flux authentification avec JWT + cookies
- 📊 Tableau comparatif (ancien vs nouveau)
- 📝 Fichiers modifiés & points clés
- 🧪 Tests à exécuter
- 📊 API Documentation (Swagger)
- ⚙️ Configuration variables d'env
- 🔄 Migration base de données (si nécessaire)
- ✅ Checklist implémentation

**`docs/DEPLOYMENT_PHASES_1_2.md`** (NOUVEAU ✨)
- 📋 Guide étape par étape
- 🔐 Configuration sécurité complète
- 🚀 Déploiement (Docker, Systemd, Manual)
- 🧪 Tests & validation
- 🐛 Troubleshooting
- 📊 Monitoring & logs
- ✅ Checklist validation

### Documentation Existante (À jour)

**`docs/SECURITY.md`**
- ✅ Intégration Phases 1 & 2
- ✅ JWT token refresh flow
- ✅ CSRF protection details
- ✅ Cookie security options
- Voir: [SECURITY.md](./SECURITY.md#jwt-refresh-flow)

**`deployed/docs/`**
- CHECKLIST.md
- DEPLOYMENT-INDEX.md
- DEPLOYMENT-README.md
- DEPLOYMENT-SUMMARY.txt
- DEPLOYMENT-SYSTEMD.md
- FILES-DEPLOYMENT.md
- GETTING-STARTED.md
- INDEX.md
- POST-INSTALLATION-CHECKLIST.md
- SETUP-QUICK.md
- UBUNTU-DEPLOYMENT-GUIDE.md

---

## 🎯 Guide de Démarrage Rapide

### Développement

```bash
# 1. Configuration initiale (une fois)
bash local/setup.sh

# 2. Générer les secrets (une fois)
cd backend && bash setup-env.sh

# 3. Démarrer (répété)
./start.sh
# Ou: bash local/start.sh
```

**Accès:**
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Swagger: http://localhost:3001/api/docs
- Prometheus: http://localhost:3001/metrics

### Production (Première fois)

```bash
# 1. Installation
sudo bash deployed/install-production.sh

# 2. Configuration sécurité
cd backend && bash setup-env.sh  # Choisir "production"

# 3. Démarrer
bash deployed/start.sh

# 4. Vérifier
bash deployed/health-check.sh
```

### Production (Mises à jour)

```bash
# Mettre à jour le code
bash deployed/update-production.sh

# Ou: Manuel
bash deployed/update.sh
bash deployed/health-check.sh
```

---

## 📊 Résumé des Changements (Phases 1 & 2)

| Script | Statut | Utilité |
|--------|--------|---------|
| `backend/setup-env.sh` | 🆕 NEW | Générer secrets JWT/Session |
| `backend/start.sh` | ✅ OK | Démarrer backend |
| `local/start.sh` | ✅ OK | Démarrer frontend+backend |
| `local/start-backend-only.sh` | ✅ OK | Tester API seule |
| `deployed/start.sh` | ✅ OK | Déployer production |
| `deployed/health-check.sh` | ✅ OK | Vérifier services |
| `deployed/install-production.sh` | ✅ OK | Setup production |
| `root/start.sh` | 🆕 NEW | Raccourci local/start.sh |
| `root/test-local.sh` | 🆕 NEW | Raccourci local/test.sh |

---

## 🔒 Sécurité - Points Importants

### Variables d'environnement
✅ **À faire:**
- Générer avec `openssl rand -base64 32`
- Stocker dans `.env` (permissions 600)
- Ne JAMAIS committer `.env` en git

❌ **À ne pas faire:**
- Utiliser des valeurs par défaut
- Partager les secrets
- Stocker en clair dans git

### Script Permissions
```bash
# Vérifier les permissions
ls -la local/*.sh deployed/*.sh backend/*.sh

# Doivent être exécutables (755 ou 750)
chmod 755 local/start.sh deployed/start.sh
```

### Configuration Production
```bash
# ✓ Production obligatoire:
NODE_ENV=production
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_HTTPONLY=true
HTTPS enabled (certificat SSL)
```

---

## 📞 Utilisation Rapide

| Besoin | Commande |
|--------|----------|
| Démarrer localement | `./start.sh` |
| Tester localement | `./test-local.sh` |
| Setup production | `bash deployed/install-production.sh` |
| Démarrer production | `bash deployed/start.sh` |
| Vérifier services | `bash deployed/health-check.sh` |
| Mettre à jour code | `bash deployed/update-production.sh` |
| Générer secrets | `cd backend && bash setup-env.sh` |
| Tester API | `bash local/start-backend-only.sh` |
| Voir Swagger | `http://localhost:3001/api/docs` |
| Voir Metrics | `http://localhost:3001/metrics` |

---

## ✅ Checklist

- [x] Script `setup-env.sh` créé (sécurité)
- [x] Script `setup-env.sh` rendu exécutable
- [x] `.env.template` complété (Phase 1 & 2)
- [x] Documentation `PHASES_1_2_GUIDE.md` créée
- [x] Documentation `DEPLOYMENT_PHASES_1_2.md` créée
- [x] Inventaire scripts documenté (ce fichier)
- [ ] Tests manuels des scripts
- [ ] Vérification déploiement en environnement test

---

**Dernière mise à jour:** 8 février 2026  
**Version:** 1.0 (Phases 1 & 2 Complètes)  
**Responsable:** System Setup Agent
