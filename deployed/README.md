# 🚀 Mode DEPLOYED - Production sur Ubuntu Server

Déploiement en production sur serveur Ubuntu avec Docker Compose ou Systemd. Frontend accessible depuis le réseau, **sans interface graphique sur le serveur**.

## 📍 Architecture Production

```
Ubuntu Server (192.168.1.100)
│
├── Option 1: Docker (Recommandé)
│   ├── 🐳 Container: Backend API (port 3001)
│   │   ├── Node.js Express
│   │   ├── Morgan HTTP Logging
│   │   ├── JWT Authentication
│   │   ├── Socket.io WebSocket
│   │   └── logs/backend.log (dans container)
│   │
│   └── 🐳 Container: Frontend + Nginx (port 80)
│       ├── Vite Build (optimisé)
│       ├── Nginx Reverse Proxy
│       ├── Static compression
│       └── SPA fallback
│
└── Option 2: Systemd (Native)
	├── sfiDashMonitoring-backend.service
	├── sfiDashMonitoring-frontend.service
	└── journalctl logs

## Accès Réseau
├── Frontend:  http://SERVER_IP
├── Backend:   http://SERVER_IP:3001
└── WebSocket: ws://SERVER_IP:3001/socket.io
```

## ⚡ Démarrage Rapide

### Option 1: Docker Compose (Recommandé ✅)

```bash
cd deployed

# 1. Configurer l'IP du serveur
export SERVER_IP=192.168.1.100          # Adapter à votre IP
export SERVER_HOSTNAME=sfi-monitoring   # Optionnel

# 2. Démarrer les services
docker-compose up -d

# 3. Vérifier le statut
docker-compose ps
docker-compose logs -f

# 4. Accès
# Frontend:  http://192.168.1.100
# Backend:   http://192.168.1.100:3001
# Health:    http://192.168.1.100:3001/api/health
```

### Option 2: Systemd (Native Ubuntu)

```bash
# 1. Copier les service files
sudo cp deployed/services/*.service /etc/systemd/system/

# 2. Recharger systemd
sudo systemctl daemon-reload

# 3. Activer au démarrage (optionnel)
sudo systemctl enable sfiDashMonitoring-backend
sudo systemctl enable sfiDashMonitoring-frontend

# 4. Démarrer les services
sudo systemctl start sfiDashMonitoring-backend
sudo systemctl start sfiDashMonitoring-frontend

# 5. Vérifier le statut
sudo systemctl status sfiDashMonitoring-backend
sudo systemctl status sfiDashMonitoring-frontend
```

## 📍 Accès Services

| Service | URL | Utilisation |
|---------|-----|-------------|
| **Frontend** | http://192.168.1.100 | Dashboard web (navigateur) |
| **Backend API** | http://192.168.1.100:3001 | Requêtes API REST |
| **WebSocket** | ws://192.168.1.100:3001 | Données temps réel |
| **Health Check** | http://192.168.1.100:3001/api/health | Monitoring |
| **API Docs** | http://192.168.1.100:3001/api-docs | Swagger documentation |
| **Metrics** | http://192.168.1.100:3001/metrics | Prometheus metrics |

## 🔧 Configuration Production

### Variables d'Environnement

```bash
# Pour Docker Compose
export SERVER_IP=192.168.1.100
export SERVER_HOSTNAME=sfi-monitoring
export NODE_ENV=production
export BACKEND_PORT=3001
export FRONTEND_PORT=80
```

### Backend `.env` (Production)

```env
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
FRONTEND_URL=http://192.168.1.100

# Elasticsearch
ES_NODE=https://es.example.com:9200
ES_USERNAME=elastic
ES_PASSWORD=xxxxx

# JWT
JWT_SECRET=<generated>
JWT_REFRESH_SECRET=<generated>

# Rate Limiting
RATE_LIMIT_AUTH=5,15m
RATE_LIMIT_REFRESH=10,1m
```

### Frontend (Build Args)

```env
VITE_API_URL=http://192.168.1.100:3001
VITE_BACKEND_WS_URL=ws://192.168.1.100:3001
VITE_ENV=production
```

## 📂 Structure Déploiement

```
deployed/
├── docker/
│   ├── docker-compose.yml    ← Configuration orchestration
│   ├── Dockerfile.backend    ← Image backend
│   └── Dockerfile.frontend   ← Image frontend (Nginx)
├── services/
│   ├── sfiDashMonitoring-backend.service
│   └── sfiDashMonitoring-frontend.service
├── conf/
│   └── nginx.conf            ← Configuration Nginx
├── docs/
│   ├── UBUNTU-DEPLOYMENT-GUIDE.md
│   ├── DEPLOYMENT-CHECKLIST.md
│   └── ... (documentation détaillée)
├── start.sh                  ← Démarrer le déploiement
├── health-check.sh           ← Vérifier les services
├── verify-deployment.sh      ← Vérifier la production
└── README.md                 ← Ce fichier
```

## 🎯 Scripts de Déploiement

### Démarrage & Arrêt

```bash
./start.sh                    # Démarrer avec Docker Compose
./start-deploy.sh             # Démarrage assisté
docker-compose down           # Arrêter proprement
```

### Monitoring & Vérification

```bash
./health-check.sh             # Vérifier la santé des services
./verify-deployment.sh        # Vérification complète
docker-compose ps             # Statut des containers
docker-compose logs -f        # Logs en direct
```

### Mise à Jour

```bash
./update-production.sh        # Mettre à jour en production
./update-frontend-config.sh   # Mettre à jour frontend config
```

## 📊 Optimisations Production

### Frontend (Vite Build)

| Feature | Bénéfice | Details |
|---------|----------|---------|
| **Bundle Split** | ↓ 40% initial | Lazy loading des pages |
| **Compression** | ↓ 60% size | Gzip + compression nginx |
| **Caching** | ↑ 60% perfs | Response cache (TTL) |
| **Minification** | ↓ bundle | Uglify + CSS minimize |

### Backend (Production)

| Feature | Détails |
|---------|---------|
| **Morgan Logging** | Logs HTTP en fichier |
| **Health Checks** | Docker/Kubernetes ready |
| **Rate Limiting** | Protect against abuse |
| **CORS Strict** | Origins whitelist |
| **JWT HttpOnly** | Cookies sécurisés |

### Infrastructure

| Feature | Détails |
|---------|---------|
| **Docker** | Isolation & reproductibilité |
| **Nginx** | Reverse proxy + compression |
| **Auto-restart** | Container restart policy |
| **Health Probes** | Liveness + readiness |
| **Volume Mounts** | Data persistence |

## 📋 Logs & Monitoring

### Voir les Logs

**Docker:**
```bash
docker-compose logs -f backend       # Logs backend
docker-compose logs -f frontend      # Logs nginx/frontend
docker-compose logs -f               # Tous les logs
```

**Systemd:**
```bash
journalctl -u sfiDashMonitoring-backend -f
journalctl -u sfiDashMonitoring-frontend -f
```

### Archiver les Logs

```bash
# Depuis la racine du projet
../scripts/logs/manage-logs.sh info     # Voir les infos
../scripts/logs/manage-logs.sh archive  # Archiver
../scripts/logs/manage-logs.sh clean    # Nettoyer
```

## 🔒 Sécurité Production

### Checklist Sécurité

- [ ] `NODE_ENV=production`
- [ ] JWT_SECRET & JWT_REFRESH_SECRET générés (openssl rand -base64 32)
- [ ] HTTPS activé (SSL certificate)
- [ ] CORS_ORIGINS = domaine production uniquement
- [ ] Rate limits configurés
- [ ] Firewall (ufw) actif
- [ ] Logs centralisés/archivés
- [ ] Monitoring/alertes en place
- [ ] Backups programmés
- [ ] Credentials dans .env (pas en dur)

### Firewall (ufw)

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing

sudo ufw allow 80/tcp          # HTTP
sudo ufw allow 3001/tcp        # Backend API
sudo ufw allow 443/tcp         # HTTPS (si SSL)
sudo ufw allow 22/tcp          # SSH

sudo ufw enable
sudo ufw status
```

### HTTPS (Let's Encrypt)

```bash
# Installer Certbot
sudo apt install certbot python3-certbot-nginx

# Obtenir un certificat
sudo certbot certonly --standalone -d yourdomain.com

# Configurer Nginx (voir conf/nginx.conf)
# Renouvellement automatique (cron job)
```

## 🆘 Troubleshooting

### Services ne démarrent pas?

```bash
# Vérifier Docker
docker ps
docker logs <container_id>

# Vérifier les ports
sudo lsof -i :80
sudo lsof -i :3001

# Vérifier la configuration
docker-compose config
docker-compose logs
```

### Accès réseau impossible?

```bash
# Vérifier l'IP
hostname -I

# Tester la connectivité
curl http://192.168.1.100
curl http://192.168.1.100:3001/api/health

# Vérifier le firewall
sudo ufw status
sudo ufw allow 80
sudo ufw allow 3001
```

### Performance slow?

```bash
# Vérifier les ressources
docker stats

# Analyser les logs
docker-compose logs backend | grep "ERROR\|WARN"

# Vérifier Elasticsearch
curl https://your-es-server:9200/_cluster/health
```

### Réinitialiser complètement?

```bash
# Arrêter et supprimer les containers
docker-compose down --remove-orphans

# Nettoyer les volumes (ATTENTION: perte de données!)
docker volume prune

# Reconstruire les images
docker-compose build --no-cache

# Redémarrer
docker-compose up -d
```

## 📚 Documentation Complète

Consulter les guides détaillés:

- [UBUNTU-DEPLOYMENT-GUIDE.md](docs/UBUNTU-DEPLOYMENT-GUIDE.md) - Installation complète
- [DEPLOYMENT-CHECKLIST.md](docs/DEPLOYMENT-CHECKLIST.md) - Checklist pré-production
- [docs/INDEX.md](docs/INDEX.md) - Index de toute la documentation
- [Main README](../README.md) - Vue d'ensemble du projet
- [SECURITY.md](../SECURITY.md) - Sécurité détaillée

## 🚀 Workflow Déploiement

### 1️⃣ Préparation

```bash
# Builder le frontend
../scripts/build/build-frontend.sh

# Analyser la taille
../scripts/build/analyze-build.sh

# Lancer les tests
../scripts/dev/test.sh coverage
```

### 2️⃣ Configuration

```bash
# Définir les variables
export SERVER_IP=192.168.1.100
export SERVER_HOSTNAME=sfi-monitoring

# Éditer la configuration
nano backend/.env       # Backend secrets
nano deployed/conf/nginx.conf  # Nginx config
```

### 3️⃣ Déploiement

```bash
cd deployed

# Démarrer
docker-compose up -d

# Vérifier
./health-check.sh
./verify-deployment.sh
```

### 4️⃣ Post-Déploiement

```bash
# Archiver les logs anciens
../scripts/logs/manage-logs.sh archive

# Configurer les backups
# (voir docs/DEPLOYMENT-CHECKLIST.md)

# Configurer le monitoring
# (Prometheus, alertes, etc)
```

---

**Mode DEPLOYED:** Production sur serveur avec haute disponibilité
**Mode LOCAL:** Développement rapide sur votre machine (voir `local/README.md`)
