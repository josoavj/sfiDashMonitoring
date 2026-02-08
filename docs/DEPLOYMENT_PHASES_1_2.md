# 🚀 Guide de Déploiement - Phases 1 & 2

**Dernière mise à jour:** 8 février 2026  
**Status:** ✅ Production Ready

---

## 📋 Contenu

- [Prérequis](#prérequis)
- [Installation Locale](#installation-locale)
- [Configuration Sécurité](#configuration-sécurité)
- [Déploiement Production](#déploiement-production)
- [Tests & Validation](#tests--validation)
- [Troubleshooting](#troubleshooting)

---

## 🔧 Prérequis

### Système
- **OS:** Ubuntu 20.04+ ou Linux équivalent
- **Node.js:** 18+ (`node --version`)
- **npm:** 9+ (`npm --version`)
- **Bash:** 5+

### Services
- **Elasticsearch:** 8+ (avec certificate)
- **MariaDB/MySQL:** 5.7+ (optionnel - SQLite par défaut)
- **Docker:** 20+ (optionnel - pour déploiement containerisé)

### Commandes requises
```bash
# Vérifier les dépendances
node --version   # >= 18.0.0
npm --version    # >= 9.0.0
openssl version  # >= 1.1.1
```

---

## 📦 Installation Locale

### 1️⃣ Cloner le projet
```bash
git clone <repo-url> sfiDashMonitoring
cd sfiDashMonitoring
```

### 2️⃣ Installer les dépendances

**Frontend:**
```bash
npm install
npm audit fix  # Corriger les vulnérabilités
npm run build   # Optionnel - vérifier le build
```

**Backend:**
```bash
cd backend
npm install
npm audit       # Vérifier l'état
```

### 3️⃣ Configurer l'environnement

```bash
cd backend
bash setup-env.sh
```

Script interactif qui:
- Génère les secrets sécurisés (JWT, Session)
- Demande l'environnement (dev/prod)
- Configure les variables Elasticsearch
- Crée `.env` avec permissions `600`

**Ou manuellement:**
```bash
cp .env.template .env
nano .env
# Éditer les valeurs
```

### 4️⃣ Initialiser la base de données

```bash
cd backend
npm run migrate        # Si utilisant MySQL/MariaDB
npm run seed          # Données de test (optionnel)
```

---

## 🔐 Configuration Sécurité

### Phase 1 - Sécurité Critique

#### JWT & HttpOnly Cookies
```env
JWT_SECRET=<valeur générée>          # pour access token
JWT_REFRESH_SECRET=<valeur générée>  # pour refresh token
SESSION_SECRET=<valeur générée>      # pour CSRF
```

#### Générer les secrets
```bash
# Générer 3 secrets (copier-coller dans .env)
openssl rand -base64 32  # JWT_SECRET
openssl rand -base64 32  # JWT_REFRESH_SECRET
openssl rand -base64 32  # SESSION_SECRET
```

#### Expiration tokens
```env
JWT_EXPIRATION=3600              # 1 heure
REFRESH_TOKEN_EXPIRATION=604800  # 7 jours
```

### Phase 2 - CSRF Protection
```env
SESSION_SECRET=<secret généré>
SESSION_COOKIE_SECURE=true      # HTTPS only
SESSION_COOKIE_HTTPONLY=true    # Anti-XSS (toujours true)
SESSION_COOKIE_SAMESITE=strict  # strict | lax
```

### Elasticsearch - Certificate SSL
```env
ES_CERT_PATH=./certs/http_ca.crt
ES_SSL_VERIFY=true  # En production obligatoire
```

Ou télécharger le certificat:
```bash
mkdir -p backend/certs
cd backend/certs
# Depuis Elasticsearch:
curl -u elastic:password https://ELASTICSEARCH_HOST:9200/_ssl/certificates > http_ca.crt
```

---

## 🚀 Déploiement Production

### Pre-deployment Checklist

Avant de déployer en production:

```bash
# ✓ Vérifier les secrets
echo "Vérifier JWT_SECRET, JWT_REFRESH_SECRET, SESSION_SECRET dans .env"

# ✓ Vérifier les vulnérabilités
npm audit
cd backend && npm audit

# ✓ Tester les endpoints
npm test
cd backend && npm test:security

# ✓ Vérifier HTTPS
openssl s_client -connect elasticsearch:9200

# ✓ Tester en local d'abord
NODE_ENV=development npm start
# Puis: NODE_ENV=production npm start
```

### Déploiement avec Docker

```bash
cd deployed
docker-compose up -d

# Vérifier les services
docker-compose ps
docker-compose logs -f backend

# Accéder au frontend
http://<SERVER_IP>
```

### Déploiement Manual (Systemd)

**1. Créer les services:**
```bash
sudo cp deployed/services/*.service /etc/systemd/system/
sudo systemctl daemon-reload
```

**2. Vérifier les chemins:**
```bash
# Dans sfiDashMonitoring-backend.service:
ExecStart=/usr/bin/node /path/to/backend/server.js
WorkingDirectory=/path/to/backend
EnvironmentFile=/path/to/backend/.env

# Dans sfiDashMonitoring-frontend.service:
ExecStart=/usr/bin/npm run preview
WorkingDirectory=/path/to/frontend
```

**3. Démarrer les services:**
```bash
sudo systemctl start sfiDashMonitoring-backend
sudo systemctl start sfiDashMonitoring-frontend
sudo systemctl enable sfiDashMonitoring-backend    # Auto-start
sudo systemctl enable sfiDashMonitoring-frontend
```

**4. Vérifier le statut:**
```bash
sudo systemctl status sfiDashMonitoring-backend
sudo systemctl status sfiDashMonitoring-frontend
journalctl -u sfiDashMonitoring-backend -f
```

### Nginx Configuration (Reverse Proxy)

```nginx
# /etc/nginx/sites-available/dashboard

upstream backend {
    server localhost:3001;
}

server {
    listen 443 ssl http2;
    server_name dashboard.example.com;

    ssl_certificate /etc/ssl/certs/cert.pem;
    ssl_certificate_key /etc/ssl/private/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend
    location / {
        root /var/www/sfi-dashboard;
        try_files $uri $uri/ /index.html;
        expires 1h;
    }

    # API Backend
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Cookies
        proxy_cookie_flags ~ secure httponly samesite=strict;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
    }

    # Metrics (protéger!)
    location /metrics {
        proxy_pass http://backend;
        # Autoriser seulement Prometheus
        allow 192.168.1.50;  # IP Prometheus
        deny all;
    }
}

# HTTP → HTTPS
server {
    listen 80;
    server_name dashboard.example.com;
    return 301 https://$server_name$request_uri;
}
```

Appliquer:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🧪 Tests & Validation

### Tests Frontend

```bash
npm test                # Tous les tests
npm run test:ui         # Interface Vitest
npm run test:coverage   # Rapport couverture
npm run build           # Vérifier le build
```

### Tests Backend - Sécurité

```bash
cd backend
npm test                 # Tous les tests
npm run test:security    # Tests JWT/bcrypt
npm run dev             # Mode développement
```

### Vérification API Endpoints

**Swagger UI (Documentation Interactive):**
```
http://localhost:3001/api/docs
```

**Signin:**
```bash
curl -X POST http://localhost:3001/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

**Refresh Token:**
```bash
curl -X POST http://localhost:3001/auth/refresh \
  -H "Content-Type: application/json" \
  --cookie "refreshToken=<token_from_signin>"
```

**CSRF Token:**
```bash
curl http://localhost:3001/api/csrf-token \
  -H "Cookie: connect.sid=<session_id>"
```

**Prometheus Metrics:**
```bash
curl http://localhost:3001/metrics
```

### Health Check

```bash
bash deployed/health-check.sh
```

Vérifie:
- Backend accessible
- Elasticsearch connexion
- Database connexion
- Frontend accessible

---

## 🐛 Troubleshooting

### "Token validation failed"
**Cause:** SECRET mal configuré  
**Solution:**
```bash
# Vérifier .env
cat backend/.env | grep SECRET
# Régénérer si nécessaire
bash backend/setup-env.sh
# Redémarrer backend
```

### "CORS error - Credentials not included"
**Cause:** `credentials: 'include'` manquant  
**Solution:**
```javascript
// Dans fetch:
fetch('/api/...', {
  credentials: 'include',  // ← IMPORTANT
  headers: { 'Content-Type': 'application/json' }
})
```

### "RefreshToken cookie not set"
**Cause:** HTTPS/Secure flag en dev  
**Solution:**
```bash
# En développement:
SESSION_COOKIE_SECURE=false
# Puis redémarrer
```

### "Elasticsearch certificate error"
**Cause:** ES_CERT_PATH incorrect  
**Solution:**
```bash
# Télécharger le cert depuis Elasticsearch:
curl -u elastic:password https://ES_HOST:9200/_ssl/certificates > backend/certs/http_ca.crt

# Ou dans .env:
ES_SSL_VERIFY=false  # DEV SEULEMENT
```

### "Port 3001 already in use"
**Cause:** Process précédent ne s'est pas arrêté  
**Solution:**
```bash
# Trouver le process:
lsof -i :3001
# Tuer:
kill -9 <PID>
# Ou changer le port:
PORT=3002 npm start
```

### "Database lock error"
**Cause:** SQLite verrouillé (dev)  
**Solution:**
```bash
# Supprimer la DB de dev:
rm backend/data/database.sqlite

# Redémarrer:
cd backend && npm start
```

---

## 📊 Monitoring & Logs

### Logs Backend
```bash
# Live logs
journalctl -u sfiDashMonitoring-backend -f

# Logs fichier
tail -f backend/logs/server.log

# Errors seulement
grep ERROR backend/logs/server.log
```

### Prometheus Metrics
```bash
# Scraper manuellement:
curl http://localhost:3001/metrics | grep sfi_dashboard

# Ou configurer Prometheus (prometheus.yml):
scrape_configs:
  - job_name: 'sfi-dashboard'
    static_configs:
      - targets: ['localhost:3001']
    metrics_path: '/metrics'
    scrape_interval: 15s
```

### Health Check Endpoint
```bash
curl http://localhost:3001/health
# {
#   "status": "ok",
#   "uptime": 3600,
#   "services": {
#     "elasticsearch": "ok",
#     "database": "ok"
#   }
# }
```

---

## 📚 Documentation Complète

- [PHASES_1_2_GUIDE.md](./PHASES_1_2_GUIDE.md) - Guide complet Phase 1 & 2
- [SECURITY.md](./SECURITY.md) - Guide sécurité détaillé
- [CHECKLIST_PRODUCTION.md](./CHECKLIST_PRODUCTION.md) - Checklist avant production

---

## ✅ Étapes de validation

- [ ] Variables d'env configurées (.env)
- [ ] Secrets générés (JWT, Session)
- [ ] HTTPS certificat installé
- [ ] Elasticsearch connectée
- [ ] Database initialisée
- [ ] Tests réussis (npm test)
- [ ] Swagger UI accessible (/api/docs)
- [ ] Prometheus metrics accessible (/metrics)
- [ ] Health check OK
- [ ] Logs monitoring en place

---

## 📞 Support

Pour les questions:
1. Consulter [SECURITY.md](./SECURITY.md)
2. Vérifier les [logs](#logs-backend)
3. Lancer [health-check.sh](../deployed/health-check.sh)
4. Consulter [Swagger UI](/api/docs)

**Dernière mise à jour:** 8 février 2026  
**Version:** 1.0 (Phases 1 & 2 Complètes)
