# 🔄 Migration vers Architecture Moderne

## ✅ Fichiers Créés

### Dossier `local/` (Mode LOCAL - Développement)
- ✅ `local/.env.local` - Configuration frontend localhost
- ✅ `local/start.sh` - Démarrer les services
- ✅ `local/test.sh` - Tester configuration
- ✅ `local/configure.sh` - Initialiser setup
- ✅ `local/test-websocket.sh` - Tester WebSocket
- ✅ `local/README.md` - Documentation LOCAL

### Dossier `deployed/` (Mode DEPLOYED - Production)
- ✅ `deployed/.env.example` - Template variables
- ✅ `deployed/.env.production` - Variables production
- ✅ `deployed/docker-compose.yml` - Orchestration Docker
- ✅ `deployed/Dockerfile.backend` - Image backend
- ✅ `deployed/Dockerfile.frontend` - Image frontend
- ✅ `deployed/nginx.conf` - Configuration Nginx (proxy + statique)
- ✅ `deployed/start.sh` - Démarrer avec Docker
- ✅ `deployed/health-check.sh` - Vérifier services
- ✅ `deployed/sfiDashMonitoring-backend.service` - Systemd backend
- ✅ `deployed/sfiDashMonitoring-frontend.service` - Systemd frontend
- ✅ `deployed/README.md` - Documentation DEPLOYED

### Fichiers Racine Mis à Jour
- ✅ `README.md` - Guide principal réécrit
- ✅ `ARCHITECTURE.md` - Documentation architecture

---

## 🗑️ Fichiers À Archiver (Ancien système)

Les fichiers suivants à la racine peuvent être archivés/supprimés car remplacés par les nouveaux dossiers:

### Scripts à Racine (À déplacer dans local/)
- `start.sh` → **Gardé? Linker vers `local/start.sh`?**
- `test-localhost.sh` → Remplacé par `local/test.sh`
- `test-websocket.sh` → Remplacé par `local/test-websocket.sh`
- `configure-localhost.sh` → Remplacé par `local/configure.sh`
- `oldstart.sh` → Archiver/Supprimer

### Fichiers Env à Racine
- `.env.local` → Déplacé dans `local/.env.local`
- `.env.example` → Déplacé dans `deployed/.env.example`

### Documentation à Racine
- `README-LOCAL.md` → Remplacé par `local/README.md`
- `LOCALHOST_CONFIG.md` → Gardé (référence)
- `LOCALHOST_READY.md` → Peut être archivé

### Anciens Dossiers (À fusionner ou archiver)
- `deploy/` → Code fusionné dans `deployed/`
- `local/` (ancien s'il existe) → Remplacé

---

## 📋 Checklist Migration

### Pour NOUVEAU UTILISATEUR

```bash
# Développement sur votre machine
cd local
./configure.sh
./start.sh

# Ou pour production
cd deployed
export SERVER_IP=192.168.1.100
./start.sh
```

### Pour UTILISATEUR EXISTANT

```bash
# 1. Garder anciens scripts un temps (compatibilité)
# 2. Mettre à jour scripts racine pointant vers local/
# 3. Mettre à jour CI/CD si présent
# 4. Tester les deux modes
# 5. Documenter dans MIGRATION.md
```

---

## 🎯 Statut Migration

| Composant | Statut | Notes |
|-----------|--------|-------|
| LOCAL setup | ✅ Complet | Tous les scripts présents |
| DEPLOYED setup | ✅ Complet | Docker + Systemd |
| Documentation | ✅ Complet | ARCHITECTURE.md, README.md |
| Tests | ✅ Complet | test.sh, health-check.sh |
| Code partagé | ✅ Inchangé | backend/, src/, public/ |
| .gitignore | 🔶 À vérifier | Exclure dossiers de logs? |

---

## 💾 Recommandations

### À GARDER à la racine (Compatibilité)

```bash
# Liens symboliques ou wrappers vers local/
ln -s local/start.sh start.sh          # Redirige vers LOCAL par défaut
ln -s local/test.sh test.sh

# Ou créer des wrappers intelligents:
cat > start.sh << EOF
#!/bin/bash
if [ "$1" = "deployed" ]; then
  cd deployed && ./start.sh
else
  cd local && ./start.sh
fi
EOF
```

### À ARCHIVER

```bash
# Créer dossier archives/
mkdir -p archives/old-scripts
mv oldstart.sh archives/
mv LOCALHOST_READY.md archives/  # Peut être récupéré de git si besoin
```

### À DOCUMENTER

- Ajouter migration guide dans README.md
- Expliquer structure dans ARCHITECTURE.md ✅
- Ajouter exemples d'utilisation

---

## 🔍 Points à Vérifier AVANT Git

- [ ] Local mode fonctionne: `local/start.sh`
- [ ] Deployed mode fonctionne: `deployed/start.sh`
- [ ] Tests passent: `local/test.sh`
- [ ] Nginx config valide: `nginx -t`
- [ ] Docker images build: `docker-compose build`
- [ ] .gitignore exclut les bons fichiers
- [ ] Aucune credential en hardcoded
- [ ] Documentation à jour

---

## 🎨 Options de Transition

### Option 1: COMPLÈTE (Recommandée)

- Supprimer tous les anciens scripts racine
- Garder uniquement `local/` et `deployed/`
- Scripts racine = wrappers/liens vers `local/`

**Avantages:** Structure claire, pas de confusion
**Inconvénients:** Peut casser ancien CI/CD

### Option 2: PROGRESSIVE

- Garder anciens scripts en racine
- Ajouter les nouveaux dossiers
- Documenter la migration
- Déprécier graduellement

**Avantages:** Pas de breaking changes
**Inconvénients:** Maintenance double, confusion

### Option 3: HYBRIDE

- Conserver `start.sh` racine comme wrapper smart
- Supprimer autres anciens scripts
- Nouveaux utilisateurs utilisent `local/` et `deployed/`
- Anciens scripts restent fonctionnels

**Avantages:** Compatibilité + clarté
**Inconvénients:** Wrapper un peu magique

---

## 📝 Recommandation Finale

**Option 1 (COMPLÈTE)** pour un projet propre et maintenable:

```bash
# Structure finale
sfiDashMonitoring/
├── local/          ← Mode développement
├── deployed/       ← Mode production
├── backend/        ← Code backend
├── src/            ← Code React
├── README.md       ← Guide (mis à jour)
├── ARCHITECTURE.md ← Structure (nouveau)
└── package.json    ← Dépendances

# Fichiers racine DELETE:
# - oldstart.sh
# - start.sh (optionnel: remplacer par wrapper)
# - test-localhost.sh
# - configure-localhost.sh
# - test-websocket.sh
# - .env.local
# - .env.example (déplacé dans deployed/)
```

---

**Status:** ✅ Prêt pour commit
