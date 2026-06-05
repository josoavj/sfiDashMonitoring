# 📋 Scripts & Documentation — Inventaire Complet

**Date :** 8 février 2026 · **Statut :** ✅ Opérationnel

---

## 📂 Structure des Scripts

```
sfiDashMonitoring/
├── backend/
│   ├── setup-env.sh
│   ├── start.sh
│   ├── test-connection.js
│   ├── test-data.js
│   └── testDataFortigate.js
├── local/
│   ├── configure.sh
│   ├── setup.sh
│   ├── start.sh                 ← Principal
│   ├── start-backend-only.sh
│   ├── start-frontend-only.sh
│   ├── test-websocket.sh
│   └── test.sh
├── deployed/
│   ├── check.sh
│   ├── health-check.sh          ← Important
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
├── start.sh
├── scripts/
│   └── utils/test-local.sh
└── docs/
    ├── PHASES_1_2_GUIDE.md
    └── DEPLOYMENT_PHASES_1_2.md
```

---

## 🔧 Scripts Backend

### `backend/setup-env.sh`

**Rôle :** Générer les variables d'environnement sécurisées

```bash
cd backend
bash setup-env.sh
```

**Actions :**
- Génère `JWT_SECRET`, `JWT_REFRESH_SECRET`, `SESSION_SECRET`
- Demande l'environnement (`dev` / `prod`)
- Configure Elasticsearch
- Crée `.env` avec permissions `600`
- Sauvegarde l'ancien `.env` s'il existe

**Variables générées :**

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

---

### `backend/start.sh`

**Rôle :** Démarrer le serveur backend

```bash
bash backend/start.sh
# Ou : cd backend && npm start
```

Vérifie que Node.js est installé, les dépendances npm, et que le port `3001` est disponible.

---

### `backend/test-connection.js`

**Rôle :** Tester la connexion à Elasticsearch

```bash
node backend/test-connection.js
```

---

### `backend/test-data.js`

**Rôle :** Injecter des données de test dans Elasticsearch

```bash
node backend/test-data.js
```

---

### `backend/testDataFortigate.js`

**Rôle :** Données Fortigate simulées pour test

```bash
node backend/testDataFortigate.js
```

---

## 🏠 Scripts Local (Développement)

### `local/start.sh` ⭐ Principal

**Rôle :** Démarrer frontend + backend ensemble localement

```bash
bash local/start.sh
# Ou depuis la racine : ./start.sh
```

**Vérifie :** Node.js, npm, bash, ports disponibles (`3000`, `3001`), dépendances npm.

**Démarre :**
1. Backend → `http://localhost:3001`
2. Frontend → `http://localhost:3000`

Logs en temps réel avec couleurs. Arrêt gracieux via `Ctrl+C`.

---

### `local/setup.sh`

**Rôle :** Configuration initiale du projet

```bash
bash local/setup.sh
```

**Actions :** `npm install` (frontend + backend), vérification des prérequis, création des répertoires `logs/data`, initialisation du `.env` si absent.

---

### `local/configure.sh`

**Rôle :** Configuration interactive détaillée

```bash
bash local/configure.sh
```

---

### `local/start-backend-only.sh`

**Rôle :** Démarrer le backend seul (test API)

```bash
bash local/start-backend-only.sh
# Accès API    : http://localhost:3001
# Swagger docs : http://localhost:3001/api/docs
```

---

### `local/start-frontend-only.sh`

**Rôle :** Démarrer le frontend seul avec proxy vers le backend

```bash
bash local/start-frontend-only.sh
# Accès : http://localhost:3000 (proxy → localhost:3001)
```

---

### `local/test-websocket.sh`

**Rôle :** Tester la connexion WebSocket

```bash
bash local/test-websocket.sh
```

Se connecte à `ws://localhost:3001` et envoie des messages de test.

---

### `local/test.sh`

**Rôle :** Lancer tous les tests

```bash
bash local/test.sh
```

**Tests exécutés :** frontend (`npm test`), backend (`npm test:security`), `npm audit`.

---

## 🚀 Scripts Déploiement Production

### `deployed/start.sh`

**Rôle :** Démarrer en production

```bash
bash deployed/start.sh
```

Détecte automatiquement l'environnement : Docker Compose s'il est disponible, sinon Systemd. Affiche les URLs d'accès et les logs en temps réel.

---

### `deployed/install.sh`

**Rôle :** Installation initiale en production

```bash
sudo bash deployed/install.sh
```

Installe Docker & Docker Compose (optionnel), Node.js 18+, Nginx, les services Systemd et les certificats SSL.

---

### `deployed/install-production.sh`

**Rôle :** Installation optimisée production avec sécurité renforcée

```bash
sudo bash deployed/install-production.sh
```

---

### `deployed/health-check.sh` ✨ Important

**Rôle :** Vérifier l'état de tous les services

```bash
bash deployed/health-check.sh
```

**Contrôle :** Backend API (`GET /health`), accessibilité frontend, connexion Elasticsearch, connexion base de données, WebSocket, endpoint Metrics.

Retourne un rapport détaillé avec statuts `✓` / `✗`.

---

### `deployed/verify-deployment.sh`

**Rôle :** Vérifier le déploiement après installation

```bash
bash deployed/verify-deployment.sh
```

**Vérifie :** services démarrés, ports ouverts, certificats SSL valides, permissions fichiers, variables d'environnement.

---

### `deployed/verify.sh`

**Rôle :** Vérification rapide (alias de `verify-deployment.sh`)

```bash
bash deployed/verify.sh
```

---

### `deployed/check.sh`

**Rôle :** Vérification complète du système

```bash
bash deployed/check.sh
```

---

### `deployed/start-deploy.sh`

**Rôle :** Démarrage sécurisé avec vérifications préalables

```bash
bash deployed/start-deploy.sh
```

---

### `deployed/update.sh`

**Rôle :** Mettre à jour le code depuis git

```bash
bash deployed/update.sh
```

Pull git → `npm install` → restart services → health check.

---

### `deployed/update-production.sh`

**Rôle :** Mise à jour production avec backup

```bash
bash deployed/update-production.sh
```

Inclut backup de la base de données et de la configuration, déploiement sans interruption (*zero-downtime*), et health check post-déploiement.

---

### `deployed/update-frontend-config.sh`

**Rôle :** Mettre à jour la configuration frontend uniquement

```bash
bash deployed/update-frontend-config.sh
```

---

### `deployed/SUMMARY.sh`

**Rôle :** Afficher un résumé du déploiement

```bash
bash deployed/SUMMARY.sh
```

---

## 📄 Scripts Racine

### `./start.sh`

**Rôle :** Raccourci vers `local/start.sh`

```bash
./start.sh
```

---

### `./scripts/utils/test-local.sh`

**Rôle :** Raccourci vers `local/test.sh`

```bash
./scripts/utils/test-local.sh
```

---

## 📚 Documentation

### `docs/PHASES_1_2_GUIDE.md`

- Vue d'ensemble sécurité
- Flux authentification JWT + cookies
- Tableau comparatif (avant / après)
- Fichiers modifiés et points clés
- Tests à exécuter
- Documentation API (Swagger)
- Configuration variables d'environnement
- Migration base de données
- Checklist d'implémentation

### `docs/DEPLOYMENT_PHASES_1_2.md`

- Guide étape par étape
- Configuration sécurité complète
- Déploiement (Docker, Systemd, Manuel)
- Tests & validation
- Troubleshooting
- Monitoring & logs
- Checklist de validation

### `docs/SECURITY.md`

- JWT token refresh flow
- Protection CSRF
- Options de sécurité des cookies

### `deployed/docs/`

| Fichier | Description |
|---------|-------------|
| `CHECKLIST.md` | Checklist déploiement |
| `DEPLOYMENT-INDEX.md` | Index général |
| `DEPLOYMENT-README.md` | README déploiement |
| `DEPLOYMENT-SUMMARY.txt` | Résumé texte |
| `DEPLOYMENT-SYSTEMD.md` | Guide Systemd |
| `FILES-DEPLOYMENT.md` | Fichiers concernés |
| `GETTING-STARTED.md` | Démarrage rapide |
| `INDEX.md` | Index docs |
| `POST-INSTALLATION-CHECKLIST.md` | Post-install |
| `SETUP-QUICK.md` | Setup rapide |
| `UBUNTU-DEPLOYMENT-GUIDE.md` | Guide Ubuntu |

---

## 🎯 Guide de Démarrage Rapide

### Développement

```bash
# 1. Configuration initiale (une seule fois)
bash local/setup.sh

# 2. Générer les secrets (une seule fois)
cd backend && bash setup-env.sh

# 3. Démarrer
./start.sh
```

**URLs disponibles :**

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:3001 |
| Swagger | http://localhost:3001/api/docs |
| Prometheus | http://localhost:3001/metrics |

---

### Production — Première installation

```bash
# 1. Installation
sudo bash deployed/install-production.sh

# 2. Configuration sécurité
cd backend && bash setup-env.sh   # Choisir "production"

# 3. Démarrer
bash deployed/start.sh

# 4. Vérifier
bash deployed/health-check.sh
```

### Production — Mises à jour

```bash
# Mise à jour complète avec backup
bash deployed/update-production.sh

# Ou : manuelle
bash deployed/update.sh
bash deployed/health-check.sh
```

---

## 🔒 Sécurité — Points Importants

### Variables d'environnement

✅ **À faire :**

- Générer avec `openssl rand -base64 32`
- Stocker dans `.env` (permissions `600`)
- Ne **jamais** committer `.env` dans git

❌ **À ne pas faire :**

- Utiliser des valeurs par défaut
- Partager les secrets
- Stocker en clair dans git

### Permissions des scripts

```bash
# Vérifier les permissions
ls -la local/*.sh deployed/*.sh backend/*.sh

# Rendre exécutables si nécessaire (755 ou 750)
chmod 755 local/start.sh deployed/start.sh
```

### Configuration production obligatoire

```env
NODE_ENV=production
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_HTTPONLY=true
```

HTTPS avec certificat SSL requis.

---

## 📞 Référence Rapide

| Besoin | Commande |
|--------|----------|
| Démarrer localement | `./start.sh` |
| Tester localement | `./scripts/utils/test-local.sh` |
| Setup production | `sudo bash deployed/install-production.sh` |
| Démarrer production | `bash deployed/start.sh` |
| Vérifier les services | `bash deployed/health-check.sh` |
| Mettre à jour le code | `bash deployed/update-production.sh` |
| Générer les secrets | `cd backend && bash setup-env.sh` |
| Tester l'API seule | `bash local/start-backend-only.sh` |
| Voir Swagger | http://localhost:3001/api/docs |
| Voir Metrics | http://localhost:3001/metrics |

---

## ✅ Checklist

- [x] Script `setup-env.sh` créé et rendu exécutable
- [x] `.env.template` complété
- [x] Documentation `PHASES_1_2_GUIDE.md` créée
- [x] Documentation `DEPLOYMENT_PHASES_1_2.md` créée
- [x] Inventaire scripts documenté
- [ ] Tests manuels des scripts
- [ ] Vérification déploiement en environnement test

---

**Dernière mise à jour :** 8 février 2026 · **Version :** 1.0