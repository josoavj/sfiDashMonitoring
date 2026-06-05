# 📚 Documentation Index

**Status:** ✅ Production Ready

---

## 🎯 Commencez ici

Vous êtes nouveau? Suivez ces étapes:

1. **[📋 Prérequis](#prérequis)** - Vérifier votre système
2. **[🚀 Démarrage Rapide](#démarrage-rapide)** - Lancer localement
3. **[🔐 Sécurité](#sécurité)** - Comprendre les changements
4. **[📖 Documentation Complète](#documentation-complète)** - Approfondir

---

## 📋 Prérequis

### Système

```bash
# Vérifier les dépendances
node --version      # >= 18.0.0
npm --version       # >= 9.0.0
openssl version     # >= 1.1.1
docker -v           # (optionnel)
```

### Services externes

- **Elasticsearch 8+** - Pour les logs Fortigate/appliances
- **Certificat SSL** - Pour HTTPS en production

---

## 🚀 Démarrage Rapide

### Mode Développement (Local)

**1. Cloner & Installer (une fois)**

```bash
git clone <repo-url> sfiDashMonitoring
cd sfiDashMonitoring
npm install
cd backend && npm install
```

**2. Configurer l'environnement (une fois)**

```bash
cd backend
bash setup-env.sh
# Script interactif → génère secrets + crée .env
```

**3. Démarrer (répété)**

```bash
./start.sh
# Ou: bash local/start.sh
```

**Accès:**

- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:3001
- **API Docs:** http://localhost:3001/api/docs
- **Metrics:** http://localhost:3001/metrics

### Mode Production

**1. Installation (une fois)**

```bash
sudo bash deployed/install-production.sh
```

**2. Configuration (une fois)**

```bash
cd backend
bash setup-env.sh  # Choisir "production"
```

**3. Démarrer**

```bash
bash deployed/start.sh
```

**4. Vérifier**

```bash
bash deployed/health-check.sh
```

---

## 🔐 Sécurité

### Sécurité Critique ⚠️

- **JWT → HttpOnly Secure Cookies** - Élimine XSS
- **Refresh Token Rotation** - Invalide les anciens tokens
- **Token Hashing (SHA256)** - Hash stocké en DB, pas en clair
- **Tests Sécurité** - Vitest pour JWT/bcrypt/hashing
- **npm Audit Fix** - 0 vulnérabilités (frontend), dépendances (backend)

**Variables clés:**

```env
JWT_SECRET=<généré>                 # Access token
JWT_REFRESH_SECRET=<généré>         # Refresh token
SESSION_SECRET=<généré>             # CSRF protection

# Générer avec:
openssl rand -base64 32
```

### Observabilité & CSRF 

- **CSRF Protection** - Double-submit pattern avec session
- **Swagger/OpenAPI** - Documentation interactive `/api/docs`
- **Prometheus Metrics** - Export sur `/metrics`

**Endpoints nouveaux:**

- `POST /auth/refresh` - Rotation tokens
- `GET /api/csrf-token` - Récupérer token CSRF
- `GET /metrics` - Prometheus metrics
- `GET /api/docs` - Swagger UI

---

## 📖 Documentation Complète

### 🔐 Sécurité (À LIRE)

**[SECURITY.md](./SECURITY.md)**

- Flux authentification JWT + refresh
- CSRF protection implémentation
- Cookie security options
- Rate limiting configuration
- Best practices

**Pages utiles:**

- [JWT Refresh Flow](./SECURITY.md#jwt-refresh-flow) - Comprendre le refresh
- [CSRF Protection](./SECURITY.md#csrf-protection) - Validation tokens
- [Token Storage](./SECURITY.md#token-storage) - HttpOnly cookies vs localStorage

### 🚀 Déploiement (À LIRE)

**[DEPLOYMENT_PHASES_1_2.md](./DEPLOYMENT_PHASES_1_2.md)**

- Prérequis système
- Installation local + production
- Configuration sécurité
- Déploiement Docker/Systemd/Manual
- Nginx reverse proxy
- Tests & validation
- Troubleshooting

**Sections utiles:**

- [Installation Locale](./DEPLOYMENT_PHASES_1_2.md#installation-locale) - Setup dev
- [Déploiement Production](./DEPLOYMENT_PHASES_1_2.md#déploiement-production) - Deploy
- [Nginx Configuration](./DEPLOYMENT_PHASES_1_2.md#nginx-configuration-reverse-proxy) - HTTPS
- [Tests & Validation](./DEPLOYMENT_PHASES_1_2.md#tests--validation) - Vérifier

### 📋 Guide Complet

**[PHASES_1_2_GUIDE.md](./PHASES_1_2_GUIDE.md)**

- Fichiers modifiés détail
- Tests à exécuter
- Configuration variables
- Migration base de données
- Troubleshooting

**Sections utiles:**

- [Flux Authentification](./PHASES_1_2_GUIDE.md#-flux-authentification-nouveau) - Diagramme
- [Fichiers Clés](./PHASES_1_2_GUIDE.md#-fichiers-clés---modifications) - Quoi a changé
- [API Documentation](./PHASES_1_2_GUIDE.md#-api-documentation) - Swagger + Prometheus
- [Configuration](./PHASES_1_2_GUIDE.md#-configuration) - Variables .env

### 📋 Scripts & Inventaire

**[SCRIPTS_INVENTORY.md](./SCRIPTS_INVENTORY.md)**

- Tous les scripts documentés
- Quand & comment utiliser chaque script
- Paramètres & options
- Résumé des changements

**Rapide lookup:**

- [Scripts Backend](./SCRIPTS_INVENTORY.md#-scripts-backend) - setup-env.sh, start.sh, test-*.js
- [Scripts Local](./SCRIPTS_INVENTORY.md#-scripts-local-développement) - start.sh, start-backend-only.sh
- [Scripts Prod](./SCRIPTS_INVENTORY.md#-scripts-déploiement-production) - install.sh, health-check.sh
- [Guide Rapide](./SCRIPTS_INVENTORY.md#-guide-de-démarrage-rapide) - Pense-bête

### Checklist Production

**[CHECKLIST_PRODUCTION.md](./CHECKLIST_PRODUCTION.md)**

- 25+ points de vérification
- Problèmes courants & solutions
- Commands de vérification
- Sécurité validation

### 📋 Audit Initial (Référence)

**[AUDIT_PHASES_1_2_SUMMARY.md](./AUDIT_PHASES_1_2_SUMMARY.md)**

- Résumé audit complet
- Vulnérabilités trouvées
- Fixes appliquées
- Impact sécurité

---

## 🧪 Tests

### Exécuter les tests

```bash
# Frontend
npm test                # Tous les tests
npm run test:ui         # Interface interactive Vitest
npm run test:coverage   # Rapport couverture

# Backend
cd backend
npm test                # Tous les tests
npm run test:security   # Tests JWT/bcrypt/hashing
npm run dev             # Mode développement avec hot-reload
```

### Vérifier endpoints

**Swagger UI (Interactive):**

```
http://localhost:3001/api/docs
```

**Signin:**

```bash
curl -X POST http://localhost:3001/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

**Refresh Token:**

```bash
curl -X POST http://localhost:3001/auth/refresh \
  --cookie "refreshToken=<token_from_signin>"
```

**Health Check:**

```bash
bash deployed/health-check.sh
```

---

## 🗂️ Structure Documentation

```
docs/
├── README.md                          (👈 Vous êtes ici)
├── SECURITY.md                        ✅ Sécurité détaillée
├── DEPLOYMENT_PHASES_1_2.md           ✅ Guide déploiement
├── PHASES_1_2_GUIDE.md                ✅ Vue d'ensemble changements
├── SCRIPTS_INVENTORY.md               ✅ Tous les scripts
├── CHECKLIST_PRODUCTION.md            ✅ Points de vérification
├── AUDIT_PHASES_1_2_SUMMARY.md        ✅ Résumé audit initial
├── ARCHITECTURE.md
├── COMPLETION-REPORT.md
├── Deployment.md
├── EXPLORATION.md
├── MIGRATION.md
└── ...autres docs

backend/
├── .env.template                      🆕 Template variables
├── setup-env.sh                       🆕 Script configuration
├── .env                               ⚠️  NE PAS COMMITTER
└── ...

local/
├── start.sh                           Principal pour dev
└── ...

deployed/
├── install-production.sh              Installation prod
├── start.sh                           Démarrage prod
├── health-check.sh                    Vérifier services
└── ...
```

---

## 🎯 Cas d'Usage Courants

### "Je suis nouveau, je veux juste tester localement"

1. Lire: [Démarrage Rapide](#démarrage-rapide)
2. Exécuter: `./start.sh`
3. Visiter: http://localhost:3000
4. API Docs: http://localhost:3001/api/docs

### "Je dois comprendre la sécurité"

1. Lire: [SECURITY.md](./SECURITY.md)
2. Consulter: [PHASES_1_2_GUIDE.md](./PHASES_1_2_GUIDE.md#-flux-authentification-nouveau)
3. Points clés: JWT cookies, refresh tokens, CSRF

### "Je déploie en production"

1. Lire: [DEPLOYMENT_PHASES_1_2.md](./DEPLOYMENT_PHASES_1_2.md)
2. Checklist: [CHECKLIST_PRODUCTION.md](./CHECKLIST_PRODUCTION.md)
3. Exécuter: `sudo bash deployed/install-production.sh`
4. Vérifier: `bash deployed/health-check.sh`

### "Les scripts ne fonctionnent pas"

1. Consulter: [SCRIPTS_INVENTORY.md](./SCRIPTS_INVENTORY.md)
2. Lire: section "Troubleshooting" dans [DEPLOYMENT_PHASES_1_2.md](./DEPLOYMENT_PHASES_1_2.md#-troubleshooting)
3. Vérifier: `bash deployed/check.sh`

### "Je dois mettre à jour la config"

1. Lire: [PHASES_1_2_GUIDE.md#configuration](./PHASES_1_2_GUIDE.md#-configuration)
2. Éditer: `backend/.env`
3. Redémarrer: `systemctl restart sfiDashMonitoring-backend`

---

## 🔑 Commandes Essentielles

```bash
# Développement
./start.sh                             # Démarrer frontend+backend
./scripts/utils/test-local.sh          # Tests
cd backend && bash setup-env.sh        # Configurer secrets

# Production
sudo bash deployed/install-production.sh # Installer
bash deployed/start.sh                   # Démarrer
bash deployed/health-check.sh            # Vérifier

# Monitoring
curl http://localhost:3001/metrics       # Prometheus
curl http://localhost:3001/api/docs      # Swagger
bash deployed/verify-deployment.sh       # Rapport complet
```

---

## Checklist de Vérification

- [ ] Node.js 18+ installé
- [ ] Backend `.env` configuré
 - [ ] Frontend démarre sur port 5173
- [ ] Backend démarre sur port 3001
- [ ] Swagger accessible: `/api/docs`
- [ ] Metrics accessible: `/metrics`
- [ ] Tests réussissent: `npm test` + `npm test:security`
- [ ] Health check OK: `bash deployed/health-check.sh`

---

## 📞 Besoin d'Aide?

### Problème local?

1. Vérifier: `npm install`
2. Configurer: `bash backend/setup-env.sh`
3. Consulter: [DEPLOYMENT_PHASES_1_2.md#troubleshooting](./DEPLOYMENT_PHASES_1_2.md#-troubleshooting)

### Problème production?

1. Vérifier: `bash deployed/health-check.sh`
2. Logs: `journalctl -u sfiDashMonitoring-backend -f`
3. Consulter: [CHECKLIST_PRODUCTION.md](./CHECKLIST_PRODUCTION.md)

### Sécurité?

1. Lire: [SECURITY.md](./SECURITY.md)
2. Vérifier: Variables `.env` généré avec `openssl`
3. Tester: `npm run test:security`

### API?

1. Swagger UI: http://localhost:3001/api/docs
2. Consulter: [PHASES_1_2_GUIDE.md#api-documentation](./PHASES_1_2_GUIDE.md#-api-documentation)

---

## 📚 Ressources Supplémentaires

### Documentation Technique

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Architecture système
- **[SECURITY.md](./SECURITY.md)** - Sécurité détaillée
- **[MIGRATION.md](./MIGRATION.md)** - Migrations base de données

### Déploiement

- **[deployed/docs/DEPLOYMENT-README.md](../deployed/docs/DEPLOYMENT-README.md)** - Guide déploiement avancé
- **[deployed/docs/UBUNTU-DEPLOYMENT-GUIDE.md](../deployed/docs/UBUNTU-DEPLOYMENT-GUIDE.md)** - Ubuntu spécifique

### Autre

- **[README.md](./README.md)** - Racine du projet
- **[start.sh](../start.sh)** - Script de démarrage
 - **[test-local.sh](../scripts/utils/test-local.sh)** - Script de test

---

## 🎓 Apprentissage

Recommandation de lecture par profil:

**👨‍💼 Manager/PO:**

- [PHASES_1_2_GUIDE.md](./PHASES_1_2_GUIDE.md) - Vue d'ensemble
- [CHECKLIST_PRODUCTION.md](./CHECKLIST_PRODUCTION.md) - Points critiques

**👨‍💻 Développeur Frontend:**

- [DEPLOYMENT_PHASES_1_2.md](./DEPLOYMENT_PHASES_1_2.md) - Setup
- [SECURITY.md](./SECURITY.md#token-storage) - JWT handling

**👨‍💻 Développeur Backend:**

- [SECURITY.md](./SECURITY.md) - Complètement
- [PHASES_1_2_GUIDE.md](./PHASES_1_2_GUIDE.md#-fichiers-clés---modifications) - Fichiers modifiés

**🔐 Responsable Sécurité:**

- [SECURITY.md](./SECURITY.md) - Complètement
- [DEPLOYMENT_PHASES_1_2.md](./DEPLOYMENT_PHASES_1_2.md#-configuration-sécurité) - Configuration

**🚀 DevOps/SysAdmin:**

- [SCRIPTS_INVENTORY.md](./SCRIPTS_INVENTORY.md) - Tous les scripts
- [DEPLOYMENT_PHASES_1_2.md](./DEPLOYMENT_PHASES_1_2.md#-déploiement-production) - Déploiement
- [deployed/docs/](../deployed/docs/) - Docs avancées

---

[⬆️ Retour en haut](#-documentation-index)
