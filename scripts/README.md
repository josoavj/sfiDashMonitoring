# 📝 Scripts Directory - SFI Dashboard Monitoring

Organisation centralisée de tous les scripts du projet pour une meilleure maintenabilité et découverte.

## 📁 Structure

### Scripts Partagés (tous les modes)

```
scripts/                    # 🎯 Scripts partagés & utilitaires
├── logs/                   # 📋 Gestion des logs
│   ├── watch-logs.sh       # Surveiller les logs en temps réel
│   ├── manage-logs.sh      # Archiver, nettoyer, analyser les logs
│   └── start-with-logs.sh  # Démarrer backend + frontend avec logs
│
├── dev/                    # 🛠️  Développement & tests
│   ├── setup.sh            # Initialiser l'environnement de dev
│   └── test.sh             # Lancer les tests (unit, UI, coverage)
│
├── build/                  # 🏗️  Build & analyse
│   ├── build-frontend.sh   # Builder le frontend
│   └── analyze-build.sh    # Analyser la taille du build
│
├── utils/                  # 🔧 Utilitaires généraux
│   ├── health-check.sh     # Vérifier la santé des services
│   └── test-local.sh       # Test complet du projet
│
└── README.md               # Ce fichier
```

### Scripts Mode-Spécifiques

⚠️ **À garder dans leurs dossiers respectifs:**

**Backend** (`backend/`):

- `setup-env.sh` - Générer les secrets JWT et configurer .env
- `start.sh` - Démarrer le backend (peut être appelé depuis backend/)

**Local** (`local/`):

- `start.sh` - Démarrer en mode localhost
- `configure.sh` - Configuration initiale
- `setup.sh` - Setup dépendances
- `start-backend-only.sh` - Démarrer seulement le backend
- `start-frontend-only.sh` - Démarrer seulement le frontend
- `test.sh` - Tests du mode local
- `test-websocket.sh` - Tester WebSocket

**Deployed** (`deployed/`):

- Multiples scripts pour orchestration Docker, installation, health checks, déploiement, etc.

## 🚀 Scripts rapides

### Démarrage

```bash
# Démarrage standard (racine)
./start.sh

# Démarrage avec logs
./scripts/logs/start-with-logs.sh

# Démarrage backend uniquement
./scripts/logs/start-with-logs.sh backend-only

# Démarrage frontend uniquement  
./scripts/logs/start-with-logs.sh frontend-only
```

### Développement

```bash
# Setup initial (dépendances, .env)
./scripts/dev/setup.sh

# Lancer les tests
./scripts/dev/test.sh              # Tests unitaires
./scripts/dev/test.sh ui           # Interface Vitest
./scripts/dev/test.sh coverage     # Report de couverture
./scripts/dev/test.sh watch        # Mode watch
```

### Build

```bash
# Builder le frontend
./scripts/build/build-frontend.sh

# Analyser la taille du build
./scripts/build/analyze-build.sh
```

### Logs

```bash
# Surveiller les logs
./scripts/logs/watch-logs.sh         # Les deux fichiers
./scripts/logs/watch-logs.sh backend # Seulement backend
./scripts/logs/watch-logs.sh frontend# Seulement frontend

# Gérer les logs
./scripts/logs/manage-logs.sh info    # Afficher les infos
./scripts/logs/manage-logs.sh archive # Archiver les logs
./scripts/logs/manage-logs.sh clean   # Vider les logs
```

### Utilitaires

```bash
# Vérifier la santé des services
./scripts/utils/health-check.sh
```

## 📖 Détails des Scripts

### 📋 Logs (`scripts/logs/`)

#### `watch-logs.sh`
Surveille les fichiers de logs en temps réel avec `tail -f`.

```bash
./scripts/logs/watch-logs.sh         # Les deux (backend + frontend)
./scripts/logs/watch-logs.sh backend  # Seulement backend
./scripts/logs/watch-logs.sh frontend # Seulement frontend
```

#### `manage-logs.sh`
Gère les fichiers de logs: archivage, nettoyage, statistiques.

```bash
./scripts/logs/manage-logs.sh info    # Voir les infos (taille, lignes)
./scripts/logs/manage-logs.sh archive # Archiver avec timestamp
./scripts/logs/manage-logs.sh backup  # Alias pour archive
./scripts/logs/manage-logs.sh clean   # Vider les fichiers
```

**Archives:**

- Créées dans `logs/archive/` avec timestamp
- Format: `backend_YYYYMMDD_HHMMSS.log`

#### `start-with-logs.sh`
Démarre les services avec redirection des logs.

```bash
./scripts/logs/start-with-logs.sh           # Backend + Frontend
./scripts/logs/start-with-logs.sh backend-only   # Seulement backend
./scripts/logs/start-with-logs.sh frontend-only  # Seulement frontend
```

### 🛠️  Développement (`scripts/dev/`)

#### `setup.sh`
Initialise l'environnement de développement.

**Fait:**

- ✅ Vérifie Node.js et npm
- ✅ Installe les dépendances frontend
- ✅ Installe les dépendances backend
- ✅ Crée `.env.local` (frontend)
- ✅ Crée `backend/.env` depuis le template

```bash
./scripts/dev/setup.sh
```

#### `test.sh`
Lance les tests avec différentes options.

```bash
./scripts/dev/test.sh              # Tests unitaires (défaut)
./scripts/dev/test.sh ui           # Vitest UI (http://localhost:51204)
./scripts/dev/test.sh coverage     # Report couverture + ouvre HTML
./scripts/dev/test.sh watch        # Mode watch
```

### 🏗️  Build (`scripts/build/`)

#### `build-frontend.sh`
Build le frontend pour la production.

```bash
./scripts/build/build-frontend.sh
```

**Résultat:**

- Build dans `dist/`
- Output: liste des fichiers générés

#### `analyze-build.sh`
Analyse la taille du build.

```bash
./scripts/build/analyze-build.sh
```

**Affiche:**

- Taille totale du build
- Détail des fichiers (top 10)
- Estimations gzip

### 🔧 Utilitaires (`scripts/utils/`)

#### `health-check.sh`
Vérifie l'état des services et des dépendances.

```bash
./scripts/utils/health-check.sh
```

**Vérifie:**

- ✅ Backend (port 3001)
- ✅ Frontend (port 5173)
- ✅ Répertoire logs
- ✅ Fichiers de logs
- ✅ Node.js et npm

#### `test-local.sh`
Test complet du projet pour validation avant déploiement.

```bash
./scripts/utils/test-local.sh
```

**Vérifie:**

- ✅ Frontend config (package.json, vite.config.js, dépendances)
- ✅ Backend config (package.json, .env, dépendances)
- ✅ Structur du projet (dossiers, fichiers essentiels)

## 🔄 Nettoyage effectué

Les scripts suivants ont été **supprimés de la racine** (déjà dans `scripts/`):

- ❌ `manage-logs.sh` → maintenant `scripts/logs/manage-logs.sh`
- ❌ `start-with-logs.sh` → maintenant `scripts/logs/start-with-logs.sh`
- ❌ `watch-logs.sh` → maintenant `scripts/logs/watch-logs.sh`
- ❌ `test-local.sh` → maintenant `scripts/utils/test-local.sh`

**Seul `start.sh` reste à la racine** comme point d'entrée principal ✅

## ⚠️ Scripts Mode-Spécifiques (À NE PAS DÉPLACER)

Ces scripts doivent rester dans leurs dossiers respectifs car ils sont spécifiques à chaque mode:

### `backend/` - Scripts backend

- `backend/setup-env.sh` - Génère secrets JWT, configure .env
- `backend/start.sh` - Démarre le backend (appel local depuis backend/)

### `local/` - Mode développement localhost
Reste inchangé avec tous ses scripts spécifiques.

### `deployed/` - Mode production/réseau
Reste inchangé avec tous ses scripts Docker, installation, etc.

### Nouveau développeur

```bash
# 1. Clone et install
git clone https://github.com/koulienathalie/sfiDashboard.git
cd sfiDashboard

# 2. Setup environnement
./scripts/dev/setup.sh

# 3. Éditer backend/.env avec tes credentials ES

# 4. Démarrer
./start.sh

# 5. (Optionnel) Surveiller les logs
./scripts/logs/watch-logs.sh &
```

### Développement quotidien

```bash
# Terminal 1: Démarrer
./start.sh

# Terminal 2: Surveiller les logs
./scripts/logs/watch-logs.sh

# Terminal 3: Lancer les tests
./scripts/dev/test.sh watch
```

### Avant de commit

```bash
# Linter le code
npm run lint

# Lancer les tests
./scripts/dev/test.sh

# Voir la couverture
./scripts/dev/test.sh coverage
```

### Avant un déploiement

```bash
# Valider le projet complet
./scripts/utils/test-local.sh

# Builder
./scripts/build/build-frontend.sh

# Analyser la taille
./scripts/build/analyze-build.sh

# Health check
./scripts/utils/health-check.sh

# Archiver les logs
./scripts/logs/manage-logs.sh archive
```

## 📋 Checklist d'utilisation

- [ ] Tous les scripts sont exécutables (`chmod +x`)
- [ ] Scripts testés en local avant commit
- [ ] Documentation à jour quand un script change
- [ ] Pas de chemins absolus (utiliser chemins relatifs)
- [ ] Support des couleurs pour meilleure lisibilité
- [ ] Nouveaux scripts ajoutés dans le bon dossier
- [ ] Mode-spécifiques restent dans local/ ou deployed/

## 🔄 Maintenance

Pour ajouter un nouveau script:

1. Créer dans le bon dossier sous `scripts/`
2. Rendre exécutable: `chmod +x scripts/subfolder/script.sh`
3. Documenter dans ce README
4. Tester en local
5. Committer

---

**Dernière mise à jour**: 2026-05-04
**Version**: 1.0.0
