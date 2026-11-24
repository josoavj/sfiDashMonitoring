# Déploiement Systemd sur Ubuntu Server

**Configuration:** Systemd + Node.js natif + Elasticsearch local
**IP Serveur:** 172.27.28.14
**Ports:** Backend 3001, Frontend 80, Elasticsearch 9200

---

## Prérequis

```bash
# Ubuntu Server 20.04/22.04 LTS
sudo apt update && sudo apt upgrade -y

# Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Nginx (reverse proxy)
sudo apt install -y nginx

# Vérifications
node --version    # v18.x.x
npm --version     # 9.x.x ou plus
nginx -v          # nginx/1.x.x
```

---

## Étape 1 : Préparer le Serveur

### 1.1 Créer l'utilisateur d'application

```bash
# Créer utilisateur dédié
sudo useradd -m -s /bin/bash sfiapp

# Ajouter aux groupes nécessaires
sudo usermod -aG www-data sfiapp

# Créer les répertoires
sudo mkdir -p /opt/sfiDashMonitoring
sudo chown -R sfiapp:sfiapp /opt/sfiDashMonitoring

# Vérifier
id sfiapp
```

### 1.2 Cloner/copier le projet

```bash
# Option 1 : Copier depuis développement
sudo cp -r /home/shadowcraft/Projets/sfiDashMonitoring /opt/sfiDashMonitoring
sudo chown -R sfiapp:sfiapp /opt/sfiDashMonitoring

# Option 2 : Cloner depuis Git
cd /opt
sudo git clone <URL_REPO> sfiDashMonitoring
sudo chown -R sfiapp:sfiapp /opt/sfiDashMonitoring
```

### 1.3 Créer la structure de logs/data

```bash
sudo mkdir -p /opt/sfiDashMonitoring/{logs,data}
sudo chown -R sfiapp:sfiapp /opt/sfiDashMonitoring/{logs,data}
```

---

## Étape 2 : Installer les Dépendances

```bash
cd /opt/sfiDashMonitoring

# En tant qu'utilisateur sfiapp
sudo -u sfiapp bash << 'EOF'
# Frontend
npm install
npm run build

# Backend
cd backend
npm install
cd ..
EOF
```

---

## Étape 3 : Configurer l'Environnement

### 3.1 Configuration Backend (.env)

```bash
sudo nano /opt/sfiDashMonitoring/backend/.env
```

**Contenu:**
```env
# Server
NODE_ENV=production
PORT=3001
HOST=127.0.0.1

# Elasticsearch
ES_HOST=http://localhost:9200
ES_INDEX=filebeat-*

# Frontend URL
FRONTEND_URL=http://172.27.28.14

# Logs
LOG_LEVEL=info
```

### 3.2 Configuration Frontend (.env)

```bash
# Le .env de production est défini dans Vite
# Lors du build, on passe les variables d'environnement
# Voir étape 5 (systemd service file)
```

**Permissions:**
```bash
sudo chown sfiapp:sfiapp /opt/sfiDashMonitoring/backend/.env
sudo chmod 600 /opt/sfiDashMonitoring/backend/.env
```

---

## Étape 4 : Configurer Nginx (Reverse Proxy)

```bash
sudo nano /etc/nginx/sites-available/sfi-monitoring
```

**Contenu:**
```nginx
# Frontend - Servir les fichiers statiques
server {
    listen 80;
    server_name 172.27.28.14;

    root /opt/sfiDashMonitoring/dist;
    index index.html;

    # Assets statiques
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1d;
        add_header Cache-Control "public, immutable";
    }

    # API Reverse Proxy - Backend
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /ws {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }

    # SPA fallback - Toutes les routes inconnues vers index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Deny access to dotfiles
    location ~ /\. {
        deny all;
    }
}
```

**Activer le site:**
```bash
sudo ln -sf /etc/nginx/sites-available/sfi-monitoring /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Tester config Nginx
sudo nginx -t

# Recharger Nginx
sudo systemctl reload nginx
```

---

## Étape 5 : Créer les Services Systemd

### 5.1 Service Backend

```bash
sudo nano /etc/systemd/system/sfi-monitoring-backend.service
```

**Contenu:**
```ini
[Unit]
Description=SFI Dashboard - Backend API
After=network.target elasticsearch.service
Wants=elasticsearch.service

[Service]
Type=simple
User=sfiapp
Group=sfiapp
WorkingDirectory=/opt/sfiDashMonitoring/backend

# Variables d'environnement
Environment="NODE_ENV=production"
Environment="PORT=3001"
Environment="HOST=127.0.0.1"
Environment="ES_HOST=http://localhost:9200"
Environment="ES_INDEX=filebeat-*"
Environment="FRONTEND_URL=http://172.27.28.14"
Environment="LOG_LEVEL=info"

# Démarrer le service
ExecStart=/usr/bin/node /opt/sfiDashMonitoring/backend/server.js

# Redémarrage automatique
Restart=always
RestartSec=10
StartLimitInterval=600
StartLimitBurst=3

# Logs
StandardOutput=journal
StandardError=journal
SyslogIdentifier=sfi-backend

[Install]
WantedBy=multi-user.target
```

### 5.2 Service Frontend

```bash
sudo nano /etc/systemd/system/sfi-monitoring-frontend.service
```

**Contenu:**
```ini
[Unit]
Description=SFI Dashboard - Frontend (Nginx)
After=network.target

[Service]
Type=oneshot
ExecStart=/bin/sh -c 'sudo systemctl restart nginx'
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
```

**Activer les services:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable sfi-monitoring-backend
sudo systemctl enable nginx
```

---

## Étape 6 : Démarrer les Services

```bash
# Démarrer le backend
sudo systemctl start sfi-monitoring-backend

# Vérifier le statut
sudo systemctl status sfi-monitoring-backend

# Voir les logs
sudo journalctl -u sfi-monitoring-backend -f

# Démarrer Nginx (déjà fait précédemment)
sudo systemctl restart nginx
```

---

## Étape 7 : Tests

### 7.1 Test Backend
```bash
curl http://127.0.0.1:3001/api/health
# Doit retourner: {"cluster": {...}, "elasticsearch": {...}, "websocket": {...}}
```

### 7.2 Test Frontend
```bash
curl http://172.27.28.14
# Doit retourner le HTML de l'application

# Ou depuis un navigateur
# http://172.27.28.14
```

### 7.3 Test WebSocket
```bash
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" http://172.27.28.14/ws
```

### 7.4 Vérifier tous les services
```bash
sudo systemctl status sfi-monitoring-backend
sudo systemctl status nginx
sudo systemctl status elasticsearch

# Logs
sudo journalctl -u sfi-monitoring-backend -n 50
sudo journalctl -u nginx -n 50
```

---

## Gestion des Services

### Arrêter/Redémarrer
```bash
# Backend
sudo systemctl stop sfi-monitoring-backend
sudo systemctl restart sfi-monitoring-backend

# Frontend (Nginx)
sudo systemctl restart nginx

# Tout
sudo systemctl restart sfi-monitoring-backend nginx
```

### Logs
```bash
# Backend - Temps réel
sudo journalctl -u sfi-monitoring-backend -f

# Backend - Dernières 50 lignes
sudo journalctl -u sfi-monitoring-backend -n 50

# Nginx
sudo journalctl -u nginx -f

# Tous les logs système
journalctl -f
```

### Activer au démarrage
```bash
sudo systemctl enable sfi-monitoring-backend
sudo systemctl enable nginx

# Vérifier
sudo systemctl is-enabled sfi-monitoring-backend
```

---

## Mise à Jour du Code

### Mettre à jour le backend
```bash
cd /opt/sfiDashMonitoring

# Récupérer les changements
sudo -u sfiapp git pull origin update

# Réinstaller les dépendances
sudo -u sfiapp bash << 'EOF'
cd backend
npm install
cd ..
EOF

# Redémarrer le service
sudo systemctl restart sfi-monitoring-backend

# Vérifier
sudo systemctl status sfi-monitoring-backend
```

### Mettre à jour le frontend
```bash
cd /opt/sfiDashMonitoring

# Récupérer les changements
sudo -u sfiapp git pull origin update

# Rebuild
sudo -u sfiapp npm run build

# Recharger Nginx
sudo systemctl reload nginx

# Vérifier
sudo systemctl status nginx
```

---

## Sécurité - Points Importants

1. **Firewall (UFW)**
   ```bash
   sudo ufw enable
   sudo ufw allow 22/tcp      # SSH
   sudo ufw allow 80/tcp      # HTTP
   sudo ufw allow 443/tcp     # HTTPS (optionnel futur)
   sudo ufw deny 3001/tcp     # Backend local seulement (via Nginx)
   sudo ufw deny 9200/tcp     # Elasticsearch local seulement
   ```

2. **Vérifier les accès**
   ```bash
   # Backend doit être inaccessible de l'extérieur
   curl http://172.27.28.14:3001    # Ne doit pas répondre
   
   # Mais accessible via Nginx
   curl http://172.27.28.14/api/health  # Doit répondre
   ```

3. **Permissions fichiers**
   ```bash
   sudo find /opt/sfiDashMonitoring -type f -exec chmod 644 {} \;
   sudo find /opt/sfiDashMonitoring -type d -exec chmod 755 {} \;
   sudo chmod 600 /opt/sfiDashMonitoring/backend/.env
   ```

---

## Troubleshooting

### Backend ne démarre pas
```bash
# Voir les erreurs détaillées
sudo journalctl -u sfi-monitoring-backend -n 100

# Vérifier la syntaxe Node
node -c /opt/sfiDashMonitoring/backend/server.js

# Vérifier Elasticsearch
curl http://localhost:9200
```

### Nginx erreur 502 Bad Gateway
```bash
# Vérifier que le backend écoute
sudo netstat -tlnp | grep 3001

# Tester la connexion
curl http://127.0.0.1:3001/api/health

# Redémarrer les deux
sudo systemctl restart sfi-monitoring-backend nginx
```

### Problèmes de permissions
```bash
# Vérifier la propriété
ls -la /opt/sfiDashMonitoring/

# Corriger si nécessaire
sudo chown -R sfiapp:sfiapp /opt/sfiDashMonitoring
```

---

## Vérifier le Déploiement

```bash
#!/bin/bash
# Script de vérification - À exécuter après le déploiement

echo "=== Vérification du Déploiement ==="

echo -e "\n1. Vérifier les services..."
sudo systemctl status sfi-monitoring-backend --no-pager | head -5
sudo systemctl status nginx --no-pager | head -5

echo -e "\n2. Vérifier les ports..."
sudo netstat -tlnp | grep -E '3001|80|:9200'

echo -e "\n3. Tester le backend..."
curl -s http://127.0.0.1:3001/api/health | head -c 100

echo -e "\n4. Tester le frontend..."
curl -s -o /dev/null -w "%{http_code}" http://172.27.28.14

echo -e "\n5. Vérifier les logs backend..."
sudo journalctl -u sfi-monitoring-backend -n 5 --no-pager

echo -e "\n[OK] Déploiement vérifié!"
```

---

## Support

Pour des questions ou problèmes, consulte les logs :

```bash
# Logs backend détaillés
sudo journalctl -u sfi-monitoring-backend -f --since "30 minutes ago"

# Logs Nginx
sudo tail -f /var/log/nginx/access.log /var/log/nginx/error.log

# Logs Elasticsearch
sudo journalctl -u elasticsearch -f
```

---

**Déploiement configuré pour : 172.27.28.14 - Systemd - Pas de SSL**
