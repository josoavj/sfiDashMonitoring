# Déploiement Systemd - Guide Complet

**Configuration:** Systemd + Node.js + Nginx + Elasticsearch  
**Serveur:** Ubuntu 20.04/22.04 LTS  
**IP:** 172.27.28.14  
**Ports:** Backend (3001), Frontend (80), Elasticsearch (9200)

---

## Table des Matières

1. [Démarrage Rapide](#démarrage-rapide)
2. [Installation Manuelle](#installation-manuelle)
3. [Vérification](#vérification)
4. [Gestion des Services](#gestion-des-services)
5. [Mise à Jour](#mise-à-jour)
6. [Troubleshooting](#troubleshooting)

---

## Démarrage Rapide

### Option 1 : Installation Automatisée (Recommandé)

Sur le serveur Ubuntu, en tant que root :

```bash
# Copier le script d'installation
scp install.sh user@172.27.28.14:/tmp/

# Sur le serveur
ssh user@172.27.28.14
sudo bash /tmp/install.sh

# Le script va:
# [OK] Installer Node.js, Nginx, Git
# [OK] Créer l'utilisateur 'sfiapp'
# [OK] Cloner/copier le projet
# [OK] Installer les dépendances
# [OK] Build le frontend
# [OK] Configurer Nginx
# [OK] Créer les services Systemd
# [OK] Démarrer les services
```

### Option 2 : Installation Manuelle

Voir le fichier [DEPLOYMENT-SYSTEMD.md](DEPLOYMENT-SYSTEMD.md)

---

## Installation Manuelle

### Prérequis

```bash
# Ubuntu 20.04/22.04
sudo apt update && sudo apt upgrade -y

# Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Nginx
sudo apt install -y nginx

# Vérifications
node --version    # v18.x.x
npm --version     # 9.x.x
nginx -v          # nginx/1.x.x
```

### Étapes Principales

1. **Créer l'utilisateur et répertoires**
   ```bash
   sudo useradd -m -s /bin/bash sfiapp
   sudo mkdir -p /opt/sfiDashMonitoring
   sudo chown -R sfiapp:sfiapp /opt/sfiDashMonitoring
   ```

2. **Copier le projet**
   ```bash
   sudo cp -r /chemin/local/sfiDashMonitoring /opt/
   sudo chown -R sfiapp:sfiapp /opt/sfiDashMonitoring
   ```

3. **Installer les dépendances**
   ```bash
   cd /opt/sfiDashMonitoring
   sudo -u sfiapp npm install --production
   cd backend && sudo -u sfiapp npm install --production && cd ..
   ```

4. **Build frontend**
   ```bash
   sudo -u sfiapp npm run build
   ```

5. **Configurer le backend** (.env)
   ```bash
   sudo nano /opt/sfiDashMonitoring/backend/.env
   ```
   
   Contenu :
   ```env
   NODE_ENV=production
   PORT=3001
   HOST=127.0.0.1
   ES_HOST=http://localhost:9200
   ES_INDEX=filebeat-*
   FRONTEND_URL=http://172.27.28.14
   LOG_LEVEL=info
   ```

6. **Configurer Nginx**
   ```bash
   sudo nano /etc/nginx/sites-available/sfi-monitoring
   ```
   
   Voir [DEPLOYMENT-SYSTEMD.md](DEPLOYMENT-SYSTEMD.md) pour la config complète

7. **Créer les services Systemd**
   
   Voir [DEPLOYMENT-SYSTEMD.md](DEPLOYMENT-SYSTEMD.md)

8. **Démarrer les services**
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl start sfi-monitoring-backend
   sudo systemctl restart nginx
   ```

---

## Vérification

### Script de Vérification Automatisé

```bash
# Sur le serveur
bash /opt/sfiDashMonitoring/deployed/verify.sh

# Ou depuis votre machine
ssh user@172.27.28.14 'bash /opt/sfiDashMonitoring/deployed/verify.sh'
```

Le script vérifie :
- [OK] État des services
- [OK] Ports ouverts
- [OK] Connectivité Backend/Frontend
- [OK] Fichiers et permissions
- [OK] Logs
- [OK] Elasticsearch
- [OK] Nginx

### Tests Manuels

```bash
# Test Backend (local)
curl http://127.0.0.1:3001/api/health

# Test Frontend (via IP)
curl http://172.27.28.14
# Doit retourner le HTML (code 200)

# Test API via Frontend
curl http://172.27.28.14/api/health

# Test WebSocket
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
     http://172.27.28.14/ws
```

---

## Gestion des Services

### Statut

```bash
# Backend
sudo systemctl status sfi-monitoring-backend

# Nginx
sudo systemctl status nginx

# Elasticsearch
sudo systemctl status elasticsearch

# Tous les services
sudo systemctl status sfi-monitoring-backend nginx elasticsearch
```

### Démarrage/Arrêt/Redémarrage

```bash
# Backend
sudo systemctl start sfi-monitoring-backend
sudo systemctl stop sfi-monitoring-backend
sudo systemctl restart sfi-monitoring-backend

# Nginx
sudo systemctl restart nginx
sudo systemctl reload nginx

# Ensemble
sudo systemctl restart sfi-monitoring-backend nginx
```

### Activation au Démarrage

```bash
# Enable
sudo systemctl enable sfi-monitoring-backend
sudo systemctl enable nginx

# Disable
sudo systemctl disable sfi-monitoring-backend

# Vérifier
sudo systemctl is-enabled sfi-monitoring-backend
```

### Logs

```bash
# Backend - Temps réel
sudo journalctl -u sfi-monitoring-backend -f

# Backend - N dernières lignes
sudo journalctl -u sfi-monitoring-backend -n 50

# Backend - Depuis X minutes
sudo journalctl -u sfi-monitoring-backend --since "30 min ago"

# Nginx
sudo journalctl -u nginx -f
sudo tail -f /var/log/nginx/{access,error}.log

# Elasticsearch
sudo journalctl -u elasticsearch -f

# Tous les services
journalctl -f
```

---

## Mise à Jour

### Script de Mise à Jour Automatisé

```bash
# Sur le serveur, en tant que root
sudo bash /opt/sfiDashMonitoring/deployed/update.sh [branch]

# Exemples
sudo bash /opt/sfiDashMonitoring/deployed/update.sh update
sudo bash /opt/sfiDashMonitoring/deployed/update.sh main

# Le script:
# [OK] Arrête les services
# [OK] Git pull la branche
# [OK] Installe les dépendances
# [OK] Build le frontend
# [OK] Redémarre les services
# [OK] Vérifie la santé
```

### Mise à Jour Manuelle

```bash
cd /opt/sfiDashMonitoring

# Récupérer les changements
sudo -u sfiapp git pull origin update

# Réinstaller les dépendances
sudo -u sfiapp npm install --production
cd backend && sudo -u sfiapp npm install --production && cd ..

# Rebuild
sudo -u sfiapp npm run build

# Redémarrer
sudo systemctl restart sfi-monitoring-backend

# Recharger Nginx
sudo systemctl reload nginx
```

---

## Troubleshooting

### Backend ne démarre pas

```bash
# Voir les erreurs détaillées
sudo journalctl -u sfi-monitoring-backend -n 100

# Vérifier la syntaxe
node -c /opt/sfiDashMonitoring/backend/server.js

# Vérifier Elasticsearch
curl http://localhost:9200

# Vérifier les permissions
ls -la /opt/sfiDashMonitoring/backend/.env

# Tester manuellement
cd /opt/sfiDashMonitoring/backend
node server.js
```

### Nginx retourne 502 Bad Gateway

```bash
# Vérifier que Backend écoute
sudo netstat -tlnp | grep 3001

# Tester Backend
curl http://127.0.0.1:3001/api/health

# Vérifier config Nginx
sudo nginx -t

# Redémarrer les deux
sudo systemctl restart sfi-monitoring-backend nginx

# Vérifier les logs Nginx
sudo tail -f /var/log/nginx/error.log
```

### Problèmes de permissions

```bash
# Vérifier la propriété
ls -la /opt/sfiDashMonitoring/

# Corriger si nécessaire
sudo chown -R sfiapp:sfiapp /opt/sfiDashMonitoring

# Permissions fichiers
sudo find /opt/sfiDashMonitoring -type f -exec chmod 644 {} \;
sudo find /opt/sfiDashMonitoring -type d -exec chmod 755 {} \;
sudo chmod 600 /opt/sfiDashMonitoring/backend/.env
```

### Elasticsearch ne répond pas

```bash
# Vérifier le service
sudo systemctl status elasticsearch

# Tester la connexion
curl http://localhost:9200

# Logs
sudo journalctl -u elasticsearch -f

# Redémarrer
sudo systemctl restart elasticsearch

# Vérifier l'espace disque
df -h
```

### WebSocket ne fonctionne pas

```bash
# Vérifier la route dans Nginx
sudo grep -A 5 "location /ws" /etc/nginx/sites-available/sfi-monitoring

# Tester la connectivité
wscat -c ws://172.27.28.14/ws

# Vérifier les headers
curl -v -H "Upgrade: websocket" -H "Connection: Upgrade" \
     http://172.27.28.14/ws
```

---

## Monitoring

### Vérification rapide quotidienne

```bash
#!/bin/bash
echo "=== Services Status ==="
sudo systemctl status sfi-monitoring-backend nginx elasticsearch

echo -e "\n=== Recent Errors ==="
sudo journalctl -u sfi-monitoring-backend --since "today" | grep -i "error"

echo -e "\n=== Disk Usage ==="
df -h /opt /var/log

echo -e "\n=== Process Memory ==="
ps aux | grep -E "node|nginx" | grep -v grep
```

### Performance monitoring

```bash
# CPU/Mémoire du Backend
top -p $(pgrep -f "node.*backend/server.js")

# Connexions Elasticsearch
curl -s http://localhost:9200/_cluster/health | jq .

# Logs par seconde
journalctl -u sfi-monitoring-backend -f --tail=0 | wc -l
```

---

## Accès

**Depuis votre réseau:**

- **Frontend:** http://172.27.28.14
- **API:** http://172.27.28.14/api
- **Health Check:** http://172.27.28.14/api/health

**Local serveur seulement:**

- **Backend Direct:** http://127.0.0.1:3001
- **Elasticsearch:** http://127.0.0.1:9200

---

## Sécurité - Configuration Firewall

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS (futur)
sudo ufw allow 443/tcp

# Deny Backend direct access
sudo ufw deny 3001/tcp

# Deny Elasticsearch direct access
sudo ufw deny 9200/tcp

# Vérifier
sudo ufw status
```

---

## Structure Fichiers

```
/opt/sfiDashMonitoring/
├── backend/                 # Backend Node.js
│   ├── .env                 # Configuration (credentials)
│   ├── server.js
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   └── models/
│   └── package.json
├── frontend/                # Frontend React 19 / Vite
│   ├── src/
│   │   ├── components/
│   │   └── App.jsx
│   ├── dist/                # Frontend build
│   │   ├── index.html
│   │   └── assets/
│   ├── vite.config.js
│   └── package.json
│   └── ...
├── package.json
├── vite.config.js
└── deployed/
    ├── DEPLOYMENT-SYSTEMD.md
    ├── install.sh
    ├── verify.sh
    ├── update.sh
    └── nginx.conf

/etc/systemd/system/
└── sfi-monitoring-backend.service

/etc/nginx/sites-available/
└── sfi-monitoring

/var/log/
├── nginx/
│   ├── access.log
│   └── error.log
└── journal/              # Logs systemd
```

---

## Support et Aide

Pour toute question ou problème :

1. **Consulter les logs:**
   ```bash
   sudo journalctl -u sfi-monitoring-backend -f
   ```

2. **Vérifier la santé:**
   ```bash
   bash /opt/sfiDashMonitoring/deployed/verify.sh
   ```

3. **Consulter la documentation:**
   - [DEPLOYMENT-SYSTEMD.md](DEPLOYMENT-SYSTEMD.md) - Guide détaillé
   - README.md - Cette page

---

**Déployé avec succès le:** $(date)  
**Configuration:** Systemd - 172.27.28.14  
**Branche:** update
