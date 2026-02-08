# 🚀 Deployment Guide - SFI Dashboard v2.0

> **Version:** 2.0 (Phases 1 & 2)  
> **Date:** 8 février 2026  
> **Status:** ✅ Production-ready

## 📋 Table des matières

1. [Pre-deployment Checks](#pre-deployment-checks)
2. [Environment Setup](#environment-setup)
3. [Database Migration](#database-migration)
4. [Docker Deployment](#docker-deployment)
5. [Nginx Configuration](#nginx-configuration)
6. [Monitoring Setup](#monitoring-setup)
7. [Troubleshooting](#troubleshooting)

---

## Pre-deployment Checks

### 1. Build & Tests
```bash
# Root directory
npm run build          # ✅ Doit réussir
npm test              # ✅ Tous les tests passent
npm run lint          # ✅ Pas d'erreurs ESLint
npm audit             # ✅ 0 vulnérabilités

# Backend
cd backend
npm audit             # ✅ 0 vulnérabilités (warnings acceptées)
npm test              # ✅ Security tests passent
```

### 2. Security Review
- [ ] JWT_SECRET & JWT_REFRESH_SECRET générés (`openssl rand -base64 32`)
- [ ] Aucun secret en clair dans le code
- [ ] .env NOT committed à Git
- [ ] HTTPS/TLS configuré
- [ ] CORS origins = domaine production seulement
- [ ] Rate limits appropriés

### 3. Performance Check
```bash
npm run build

# Vérifier bundle size
ls -lh dist/
# Frontend: < 500KB (gzipped < 150KB)

du -sh dist/
du -sh backend/
```

---

## Environment Setup

### Backend .env Production
```bash
# Générer les secrets AVANT de créer le fichier
SECRET1=$(openssl rand -base64 32)
SECRET2=$(openssl rand -base64 32)

# Créer backend/.env
cat > backend/.env << EOF
# ===== SECURITY =====
NODE_ENV=production
JWT_SECRET=$SECRET1
JWT_REFRESH_SECRET=$SECRET2

# ===== ELASTICSEARCH =====
ES_NODE=https://elasticsearch.example.com:9200
ES_USERNAME=elastic
ES_PASSWORD=$(read -s; echo $REPLY)  # Prompt mot de passe
ES_CERT_PATH=/etc/ssl/certs/elasticsearch-ca.crt
ES_TIMEOUT=30000

# ===== DATABASE =====
DB_HOST=db.example.com
DB_USER=sfi_user
DB_PASSWORD=$(read -s; echo $REPLY)  # Prompt mot de passe
DB_NAME=sfi_dashboard
DB_PORT=3306

# ===== SERVER =====
PORT=3001
HOST=0.0.0.0
FRONTEND_URL=https://app.example.com

# ===== OPTIONAL =====
LOG_LEVEL=info
PROMETHEUS_ENABLED=true
EOF

# Permissions
chmod 600 backend/.env
chown sfi:sfi backend/.env  # User dédié
```

### Frontend Configuration
```bash
# .env.production (peut être committé)
cat > .env.production << EOF
VITE_API_URL=https://api.example.com
VITE_BACKEND_WS_URL=wss://api.example.com
EOF
```

---

## Database Migration

### Session Table Update
```sql
-- Ajouter colonne refreshTokenHash (si elle n'existe pas)
ALTER TABLE sessions 
ADD COLUMN refreshTokenHash VARCHAR(64) UNIQUE;

-- Index sur refreshTokenHash pour rapidité
CREATE INDEX idx_sessions_refreshTokenHash 
  ON sessions(refreshTokenHash);

-- Index sur userId + revoked
CREATE INDEX idx_sessions_user_revoked 
  ON sessions(userId, revoked);

-- Vérifier que expiresAt existe
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS expiresAt DATETIME;
```

### Cleanup Sessions anciennes
```sql
-- Supprimer les sessions expirées
DELETE FROM sessions 
WHERE expiresAt < NOW();

-- Supprimer les sessions révoquées > 7 jours
DELETE FROM sessions 
WHERE revoked = 1 
  AND createdAt < DATE_SUB(NOW(), INTERVAL 7 DAY);
```

---

## Docker Deployment

### Build Images
```bash
# Backend
docker build -f deployed/docker/Dockerfile.backend -t sfi-dashboard-backend:v2.0 .

# Frontend
docker build -f deployed/docker/Dockerfile.frontend -t sfi-dashboard-frontend:v2.0 .

# Tag pour registry
docker tag sfi-dashboard-backend:v2.0 registry.example.com/sfi-dashboard-backend:v2.0
docker tag sfi-dashboard-frontend:v2.0 registry.example.com/sfi-dashboard-frontend:v2.0

# Push
docker push registry.example.com/sfi-dashboard-backend:v2.0
docker push registry.example.com/sfi-dashboard-frontend:v2.0
```

### Docker Compose
```yaml
version: '3.8'

services:
  backend:
    image: registry.example.com/sfi-dashboard-backend:v2.0
    container_name: sfi-dashboard-backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
      - ES_NODE=${ES_NODE}
      - ES_USERNAME=${ES_USERNAME}
      - ES_PASSWORD=${ES_PASSWORD}
      - ES_CERT_PATH=/etc/ssl/elasticsearch-ca.crt
      - DB_HOST=${DB_HOST}
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_NAME=sfi_dashboard
      - FRONTEND_URL=https://app.example.com
    volumes:
      - /etc/ssl/certs/elasticsearch-ca.crt:/etc/ssl/elasticsearch-ca.crt:ro
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
    networks:
      - sfi-network

  frontend:
    image: registry.example.com/sfi-dashboard-frontend:v2.0
    container_name: sfi-dashboard-frontend
    ports:
      - "3000:80"
    environment:
      - VITE_API_URL=https://api.example.com
      - VITE_BACKEND_WS_URL=wss://api.example.com
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - sfi-network

networks:
  sfi-network:
    driver: bridge
```

### Lancer
```bash
# Avec variables d'environnement
docker-compose --env-file production.env up -d

# Vérifier
docker-compose logs -f backend
docker-compose ps
```

---

## Nginx Configuration

### Reverse Proxy Setup
```nginx
upstream backend {
  server 127.0.0.1:3001;
}

# Redirect HTTP → HTTPS
server {
  listen 80;
  server_name app.example.com api.example.com;
  return 301 https://$server_name$request_uri;
}

# HTTPS - Frontend
server {
  listen 443 ssl http2;
  server_name app.example.com;

  ssl_certificate /etc/letsencrypt/live/app.example.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/app.example.com/privkey.pem;

  # TLS Configuration
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers HIGH:!aNULL:!MD5;
  ssl_prefer_server_ciphers on;
  ssl_session_cache shared:SSL:10m;
  ssl_session_timeout 10m;

  # Security Headers
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-XSS-Protection "1; mode=block" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;

  # Frontend assets
  location / {
    root /var/www/sfi-dashboard/dist;
    try_files $uri $uri/ /index.html;
    expires 1h;
    add_header Cache-Control "public, immutable";
  }

  # API Proxy
  location /api {
    proxy_pass http://backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    
    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
  }

  # WebSocket Support
  location /socket.io {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}

# HTTPS - Backend API
server {
  listen 443 ssl http2;
  server_name api.example.com;

  ssl_certificate /etc/letsencrypt/live/api.example.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;

  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers HIGH:!aNULL:!MD5;

  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

  # Proxy all requests to backend
  location / {
    proxy_pass http://backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    
    # WebSocket
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

### SSL Certificate (Let's Encrypt)
```bash
# Installer certbot
sudo apt-get install certbot python3-certbot-nginx

# Générer certificats
sudo certbot certonly --standalone \
  -d app.example.com \
  -d api.example.com

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

---

## Monitoring Setup

### Prometheus Configuration
```yaml
# /etc/prometheus/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'sfi-dashboard-backend'
    static_configs:
      - targets: ['localhost:3001']
    metrics_path: '/metrics'
```

### Health Checks
```bash
# Backend health
curl -k https://api.example.com/api/health

# Metrics
curl -k https://api.example.com/metrics | grep http_requests_total

# WebSocket
wscat -c wss://api.example.com/socket.io/
```

### Logs
```bash
# Container logs (Docker)
docker logs -f sfi-dashboard-backend

# System logs (Systemd)
journalctl -u sfi-dashboard-backend -f

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

## Troubleshooting

### JWT Token Issues
```bash
# Vérifier que les secrets sont définis
grep JWT_ backend/.env

# Vérifier token valide (15min)
curl -H "Authorization: Bearer <token>" \
  https://api.example.com/api/me

# Si expiration error: refresh
curl -X POST \
  --cookie "refreshToken=<token>" \
  https://api.example.com/auth/refresh
```

### Database Connection
```bash
# Tester connexion
mysql -h $DB_HOST -u $DB_USER -p $DB_NAME
# Lister tables
SHOW TABLES;
# Vérifier sessions
SELECT COUNT(*) FROM sessions WHERE revoked=0;
```

### Elasticsearch Issues
```bash
# Tester connexion
curl -u elastic:$ES_PASSWORD \
  --cacert $ES_CERT_PATH \
  https://$ES_NODE/_cluster/health

# Vérifier indices
curl -u elastic:$ES_PASSWORD \
  --cacert $ES_CERT_PATH \
  https://$ES_NODE/_cat/indices
```

### CORS Issues
```bash
# Vérifier FRONTEND_URL
grep FRONTEND_URL backend/.env

# Test CORS
curl -H "Origin: https://app.example.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  https://api.example.com/api/health
```

---

## Post-Deployment

### 1. Verify Services
```bash
# Backend health
curl -f https://api.example.com/api/health

# Frontend load
curl -f https://app.example.com/

# Prometheus
curl -f https://prometheus.example.com/
```

### 2. Test Authentication
```bash
# Signup
curl -X POST -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@example.com","password":"Secure123!"}' \
  https://api.example.com/auth/signup

# Login
curl -X POST -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Secure123!"}' \
  https://api.example.com/auth/signin

# Token refresh
curl -X POST \
  --cookie "refreshToken=<token>" \
  https://api.example.com/auth/refresh
```

### 3. Backup Database
```bash
# MySQL dump
mysqldump -u $DB_USER -p $DB_NAME > sfi_dashboard_$(date +%Y%m%d).sql

# Compress
gzip sfi_dashboard_*.sql

# Store offsite
# Recommandé: S3, Google Cloud Storage, etc.
```

### 4. Monitor
```bash
# Systemd service status
systemctl status sfi-dashboard-backend

# Container status (Docker)
docker ps -a

# Prometheus queries
# Request rate: rate(http_requests_total[5m])
# Error rate: rate(http_requests_total{status=~"5.."}[5m])
# Memory usage: nodejs_memory_heap_used_bytes
```

---

## Rollback Plan

Si des problèmes critiques:

```bash
# 1. Revenir à version précédente
git checkout <previous-tag>

# 2. Reconstruire & redéployer
docker build -f deployed/docker/Dockerfile.backend -t sfi-dashboard-backend:rollback .
docker-compose up -d --force-recreate

# 3. Vérifier
curl https://api.example.com/api/health

# 4. Vérifier les logs
docker logs -f sfi-dashboard-backend

# 5. Si OK, documenter l'incident
# Créer issue GitHub avec
#   - Cause
#   - Symptômes
#   - Résolution
```

---

## Support

Besoin d'aide?
1. Consultez les logs: `docker logs sfi-dashboard-backend`
2. Vérifiez SECURITY.md pour JWT issues
3. Vérifiez README.md pour configuration
4. Ouvrez une issue avec logs complets

---

**Last Updated:** 8 février 2026  
**Version:** 2.0 (Production-ready)
