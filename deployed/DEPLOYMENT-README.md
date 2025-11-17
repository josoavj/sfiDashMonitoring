# 📦 Déploiement Production - SFI Dashboard Monitoring

## 🎯 Résumé

Configuration de déploiement pour **Ubuntu Server 172.27.28.14** en utilisant :
- ✅ **Systemd** (pas Docker)
- ✅ **Node.js** natif
- ✅ **Nginx** comme reverse proxy
- ✅ **Elasticsearch** externe

---

## 📋 Fichiers de Déploiement

| Fichier | Objectif |
|---------|----------|
| `install-production.sh` | Installation automatisée complète |
| `update-production.sh` | Mise à jour du code en production |
| `verify-deployment.sh` | Vérification du déploiement |
| `UBUNTU-DEPLOYMENT-GUIDE.md` | Guide détaillé complet |
| `sfiDashMonitoring-backend.service` | Service Systemd backend |
| `sfiDashMonitoring-frontend.service` | Service Nginx (optionnel) |
| `nginx.conf` | Configuration Nginx |
| `update-frontend-config.sh` | Mise à jour config frontend |

---

## ⚡ Démarrage Rapide

### Étape 1 : Préparation du serveur

```bash
# Sur votre machine locale, copier le script d'installation
scp deployed/install-production.sh user@172.27.28.14:/tmp/

# Se connecter au serveur
ssh user@172.27.28.14
```

### Étape 2 : Exécution du script

```bash
# Sur le serveur Ubuntu
sudo bash /tmp/install-production.sh

# Le script demande le chemin du projet source si nécessaire
```

### Étape 3 : Configuration finale

```bash
# Modifier le fichier .env avec les secrets
sudo nano /opt/sfiDashMonitoring/backend/.env

# Changer obligatoirement:
# - JWT_SECRET
# - JWT_REFRESH_SECRET
```

### Étape 4 : Démarrer

```bash
# Démarrer le backend
sudo systemctl start sfiDashMonitoring-backend

# Vérifier
sudo systemctl status sfiDashMonitoring-backend
curl http://localhost
```

### Étape 5 : Accès

Ouvrir : `http://172.27.28.14`

---

## 🔍 Architecture

```
┌─────────────────────────────────────────────────┐
│           Navigateur Externe (port 80)           │
│         http://172.27.28.14                     │
└────────────────┬────────────────────────────────┘
                 │
        ┌────────▼────────┐
        │  Nginx (port 80)│ ◄── /etc/nginx/nginx.conf
        └────────┬────────┘
                 │
        ┌────────┴────────┬─────────────────┐
        │                 │                 │
  /api  │         /socket.io           /assets
        │                 │                 │
 ┌──────▼────────┐       │          ┌──────▼──────┐
 │ Backend App   │───────┴──────────│  Frontend   │
 │ (port 3001)   │                  │   (built)   │
 │ Node.js       │                  │    files    │
 │ Systemd       │                  │             │
 └──────┬────────┘                  └─────────────┘
        │
 ┌──────▼────────┐
 │  Elasticsearch│
 │  172.27.28.14 │
 │  :9200        │
 └───────────────┘
```

---

## 📝 Configuration Backend (.env)

```properties
# Production Configuration
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# Elasticsearch
ES_NODE=https://172.27.28.14:9200
ES_USERNAME=stgSFI
ES_PASSWORD=Police2405$
ES_CERT_PATH=/opt/sfiDashMonitoring/backend/certs/http_ca.crt

# CORS
FRONTEND_URL=http://172.27.28.14 http://localhost

# JWT (GÉNÉRER DES VALEURS UNIQUES!)
JWT_SECRET=<votre_secret_fort_ici>
JWT_REFRESH_SECRET=<votre_refresh_secret_fort_ici>
```

---

## 🔧 Services Systemd

### Démarrage

```bash
# Backend
sudo systemctl start sfiDashMonitoring-backend

# Vérifier
sudo systemctl status sfiDashMonitoring-backend

# Nginx est automatiquement géré
sudo systemctl status nginx
```

### Logs

```bash
# Backend en temps réel
sudo journalctl -u sfiDashMonitoring-backend -f

# Nginx erreurs
tail -f /var/log/nginx/error.log

# 50 dernières lignes
sudo journalctl -u sfiDashMonitoring-backend -n 50
```

### Redémarrage

```bash
sudo systemctl restart sfiDashMonitoring-backend
sudo systemctl restart nginx
```

---

## 🔐 Sécurité

### Secrets JWT (OBLIGATOIRE)

Générez des valeurs fortes :

```bash
# Générer deux secrets uniques
openssl rand -base64 32
openssl rand -base64 32

# Copier les valeurs dans .env
```

### Pare-feu (si applicable)

```bash
# Autoriser HTTP uniquement
sudo ufw allow 80/tcp

# Port 3001 reste interne (Nginx proxy)
```

### Headers de sécurité

Déjà configurés dans `nginx.conf`:
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Referrer-Policy

---

## 📊 Monitoring

### Vérifier le déploiement

```bash
# Script de vérification automatique
sudo bash /opt/sfiDashMonitoring/deployed/verify-deployment.sh
```

### Healthcheck manuel

```bash
# Frontend
curl http://localhost/health

# Backend
curl -s http://localhost:3001/api | head

# Elasticsearch
curl -k --user stgSFI:Police2405$ https://172.27.28.14:9200
```

### Ressources

```bash
# CPU/Mémoire
top -u sfiapp

# Espace disque
df -h

# Connexions
sudo netstat -antp | grep 3001
```

---

## 🚀 Mise à Jour en Production

### Script automatisé

```bash
# Depuis le serveur
sudo bash /opt/sfiDashMonitoring/deployed/update-production.sh

# Le script:
# 1. Arrête le backend
# 2. Récupère le code (Git ou manuel)
# 3. Réinstalle les dépendances
# 4. Recompile le frontend
# 5. Déploie les fichiers
# 6. Redémarre les services
```

### Mise à jour manuelle

```bash
# Copier le nouveau code
scp -r /chemin/local/* user@172.27.28.14:/opt/sfiDashMonitoring/

# Sur le serveur
cd /opt/sfiDashMonitoring/backend
sudo -u sfiapp npm install --production

cd /opt/sfiDashMonitoring
sudo -u sfiapp npm run build
sudo cp -r dist/* /usr/share/nginx/html/

sudo systemctl restart sfiDashMonitoring-backend
```

---

## 🐛 Dépannage

### Le backend ne démarre pas

```bash
# 1. Vérifier les logs
sudo journalctl -u sfiDashMonitoring-backend -n 50 -e

# 2. Vérifier les permissions
ls -la /opt/sfiDashMonitoring/backend/

# 3. Tester manuellement
sudo su - sfiapp
cd /opt/sfiDashMonitoring/backend
node server.js
```

### 502 Bad Gateway sur Nginx

```bash
# 1. Vérifier que le backend est actif
sudo systemctl status sfiDashMonitoring-backend

# 2. Vérifier le port 3001
sudo netstat -tlnp | grep 3001

# 3. Redémarrer Nginx
sudo systemctl restart nginx
```

### WebSocket ne fonctionne pas

```bash
# Vérifier la config Nginx pour /socket.io
sudo nginx -T | grep -A 20 "socket.io"

# Tester la connexion
wscat -c ws://localhost:3001/socket.io
```

### Elasticsearch non accessible

```bash
# Vérifier la connexion
curl -k --user stgSFI:Police2405$ https://172.27.28.14:9200

# Vérifier le certificat
ls -la /opt/sfiDashMonitoring/backend/certs/http_ca.crt

# Vérifier la configuration .env
cat /opt/sfiDashMonitoring/backend/.env | grep ES_
```

---

## 📚 Documentation Complète

Pour plus de détails, consultez **UBUNTU-DEPLOYMENT-GUIDE.md**

---

## 📞 Support

**En cas de problème :**

1. Consultez les logs : `sudo journalctl -u sfiDashMonitoring-backend -f`
2. Vérifiez `.env` : `cat /opt/sfiDashMonitoring/backend/.env`
3. Testez l'accès : `curl http://localhost:3001/api`
4. Redémarrez : `sudo systemctl restart sfiDashMonitoring-backend`

---

## ✅ Checklist Final

- [ ] Script `install-production.sh` exécuté avec succès
- [ ] `.env` configuré avec les secrets JWT
- [ ] Service backend actif : `systemctl status sfiDashMonitoring-backend`
- [ ] Nginx écoute sur le port 80 : `netstat -tlnp | grep 80`
- [ ] Application accessible : `http://172.27.28.14`
- [ ] Logs sans erreurs : `journalctl -u sfiDashMonitoring-backend -f`
- [ ] Elasticsearch accessible : `curl -k --user stgSFI:Police2405$ https://172.27.28.14:9200`

---

**Déployé le:** 17 novembre 2025  
**Version:** 1.0.0
