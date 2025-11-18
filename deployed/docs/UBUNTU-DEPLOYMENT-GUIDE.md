# 🚀 Guide de Déploiement Complet - Ubuntu Server 172.27.28.14

## 📋 Configuration

- **OS:** Ubuntu Server 20.04/22.04 LTS
- **Serveur:** 172.27.28.14
- **Architecture:** Systemd (pas Docker)
- **Ports:** 
  - Frontend: 80 (Nginx)
  - Backend: 3001 (Node.js)
  - Elasticsearch: 9200 (externe)
- **User Application:** sfiapp
- **Reverse Proxy:** Nginx

---

## ⚡ Installation Rapide (Automatisée)

### Étape 1 : Transfert du projet

Sur votre machine locale :

```bash
# Copier le script d'installation
scp deployed/install-production.sh user@172.27.28.14:/tmp/

# Connexion SSH
ssh user@172.27.28.14
```

### Étape 2 : Exécution du script d'installation

Sur le serveur Ubuntu :

```bash
# Exécuter le script (en tant que root ou avec sudo)
sudo bash /tmp/install-production.sh

# Le script va:
# ✓ Installer Node.js 18+, Nginx, Git
# ✓ Créer l'utilisateur 'sfiapp'
# ✓ Préparer les répertoires (/opt/sfiDashMonitoring)
# ✓ Installer les dépendances NPM (backend + frontend)
# ✓ Compiler le frontend (npm run build)
# ✓ Configurer Nginx
# ✓ Mettre en place les services Systemd
```

### Étape 3 : Configuration finale

```bash
# Modifier le fichier .env avec les secrets
sudo nano /opt/sfiDashMonitoring/backend/.env

# Points critiques à configurer:
# - JWT_SECRET (changer la valeur par défaut)
# - JWT_REFRESH_SECRET (changer la valeur par défaut)
# - ES_PASSWORD (vérifier le mot de passe Elasticsearch)
# - FRONTEND_URL (déjà configuré pour 172.27.28.14)
```

### Étape 4 : Démarrer les services

```bash
# Démarrer le backend
sudo systemctl start sfiDashMonitoring-backend

# Le frontend est servi par Nginx (démarré automatiquement)

# Vérifier les statuts
sudo systemctl status sfiDashMonitoring-backend
sudo systemctl status nginx
```

### Étape 5 : Accès à l'application

Ouvrez votre navigateur :

```
http://172.27.28.14
```

---

## 🔧 Installation Manuelle (Détaillée)

Si vous préférez configurer manuellement ou s'il y a des erreurs :

### 1️⃣ Prérequis

```bash
# Mise à jour système
sudo apt update && sudo apt upgrade -y

# Installer Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Installer Nginx
sudo apt install -y nginx

# Installer Git
sudo apt install -y git

# Vérifier les versions
node --version      # v18.x.x ou plus
npm --version       # 9.x.x ou plus
nginx -v            # nginx/1.x.x
```

### 2️⃣ Créer l'utilisateur d'application

```bash
# Créer utilisateur dédié
sudo useradd -m -s /bin/bash sfiapp

# Ajouter aux groupes
sudo usermod -aG www-data sfiapp
sudo usermod -aG sudo sfiapp

# Vérifier
id sfiapp
```

### 3️⃣ Préparer les répertoires

```bash
# Créer la structure de répertoires
sudo mkdir -p /opt/sfiDashMonitoring
sudo mkdir -p /opt/sfiDashMonitoring/logs

# Définir les permissions
sudo chown -R sfiapp:sfiapp /opt/sfiDashMonitoring
sudo chmod 755 /opt/sfiDashMonitoring
```

### 4️⃣ Copier le projet

```bash
# Option A: Depuis votre machine locale
scp -r /chemin/local/sfiDashMonitoring/* user@172.27.28.14:/opt/sfiDashMonitoring/

# Option B: Cloner depuis Git (si disponible)
# sudo -u sfiapp git clone <repo-url> /opt/sfiDashMonitoring

# Fixer les permissions
sudo chown -R sfiapp:sfiapp /opt/sfiDashMonitoring
```

### 5️⃣ Installer les dépendances

```bash
# Backend dependencies
cd /opt/sfiDashMonitoring/backend
sudo -u sfiapp npm install --production

# Frontend dependencies et build
cd /opt/sfiDashMonitoring
sudo -u sfiapp npm install
sudo -u sfiapp npm run build
```

### 6️⃣ Servir le frontend avec Nginx

```bash
# Copier la config Nginx
sudo cp /opt/sfiDashMonitoring/deployed/nginx.conf /etc/nginx/nginx.conf

# Copier les fichiers frontend dans le répertoire Nginx
sudo mkdir -p /usr/share/nginx/html
sudo rm -rf /usr/share/nginx/html/*
sudo cp -r /opt/sfiDashMonitoring/dist/* /usr/share/nginx/html/

# Définir les permissions
sudo chown -R nginx:nginx /usr/share/nginx/html

# Tester la configuration
sudo nginx -t

# Redémarrer Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 7️⃣ Configurer les services Systemd

```bash
# Backend service
sudo cp /opt/sfiDashMonitoring/deployed/sfiDashMonitoring-backend.service /etc/systemd/system/

# Recharger les configurations
sudo systemctl daemon-reload

# Activer les services pour démarrage automatique
sudo systemctl enable sfiDashMonitoring-backend.service

# Démarrer le service
sudo systemctl start sfiDashMonitoring-backend.service
```

### 8️⃣ Configurer les variables d'environnement

```bash
# Éditer le fichier .env du backend
sudo nano /opt/sfiDashMonitoring/backend/.env

# Vérifier/Modifier:
# ES_NODE=https://172.27.28.14:9200
# ES_USERNAME=stgSFI
# ES_PASSWORD=Police2405$
# PORT=3001
# NODE_ENV=production
# FRONTEND_URL=http://172.27.28.14 http://localhost:3000 http://localhost:5173
# JWT_SECRET=<votre_secret_unique>
# JWT_REFRESH_SECRET=<votre_refresh_secret_unique>
```

---

## 📊 Vérifications et Tests

### Vérifier que tout fonctionne

```bash
# Statut des services
sudo systemctl status sfiDashMonitoring-backend
sudo systemctl status nginx

# Vérifier que le backend écoute sur le port 3001
sudo netstat -tlnp | grep 3001

# Vérifier que Nginx écoute sur le port 80
sudo netstat -tlnp | grep 80

# Test de connectivité
curl http://localhost:3001/api/health    # Si endpoint disponible
curl http://localhost                     # Teste la page frontend
```

### Consulter les logs

```bash
# Logs du backend
sudo journalctl -u sfiDashMonitoring-backend -f

# Logs de Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Logs système
dmesg | tail -20
```

### Test de connectivité avec Elasticsearch

```bash
# Depuis le serveur backend, tester la connexion ES
curl -k --user stgSFI:Police2405$ https://172.27.28.14:9200

# Devrait retourner les infos du cluster Elasticsearch
```

---

## 🔒 Configuration de Sécurité

### Paramètres critiques

1. **JWT Secrets** - ⚠️ À générer
   ```bash
   # Générer des secrets forts
   openssl rand -base64 32
   ```
   Remplacer `JWT_SECRET` et `JWT_REFRESH_SECRET` dans `.env`

2. **Certificat Elasticsearch**
   - Vérifier que le certificat CA est accessible :
   ```bash
   ls -la /opt/sfiDashMonitoring/backend/certs/http_ca.crt
   ```

3. **Pare-feu** (Si applicable)
   ```bash
   # Permettre HTTP (80)
   sudo ufw allow 80/tcp
   
   # Permettre HTTPS (443) si configuré
   sudo ufw allow 443/tcp
   
   # Port backend interne (bloquer de l'extérieur)
   # sudo ufw deny 3001/tcp
   ```

4. **Nginx Security Headers**
   - Déjà configurés dans `nginx.conf`
   - X-Frame-Options, X-Content-Type-Options, CSP, etc.

---

## 🚀 Gestion des Services

### Démarrer/Arrêter/Redémarrer

```bash
# Backend
sudo systemctl start sfiDashMonitoring-backend
sudo systemctl stop sfiDashMonitoring-backend
sudo systemctl restart sfiDashMonitoring-backend

# Nginx
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx

# Vérifier l'état au démarrage
sudo systemctl enable sfiDashMonitoring-backend
sudo systemctl enable nginx
```

### Redéployer une mise à jour

```bash
# Arrêter le service
sudo systemctl stop sfiDashMonitoring-backend

# Mettre à jour le code
cd /opt/sfiDashMonitoring
sudo -u sfiapp git pull origin main  # Si Git est utilisé
# OU copier les nouveaux fichiers

# Réinstaller les dépendances si nécessaire
cd backend && sudo -u sfiapp npm install --production

# Rebuilder le frontend si nécessaire
cd /opt/sfiDashMonitoring
sudo -u sfiapp npm run build
sudo cp -r dist/* /usr/share/nginx/html/

# Redémarrer
sudo systemctl start sfiDashMonitoring-backend
sudo systemctl reload nginx
```

---

## 🐛 Dépannage

### Le backend ne démarre pas

```bash
# Vérifier les logs
sudo journalctl -u sfiDashMonitoring-backend -n 50

# Vérifier les permissions
ls -la /opt/sfiDashMonitoring/backend/

# Tester Node.js directement
cd /opt/sfiDashMonitoring/backend
sudo -u sfiapp node server.js
```

### Nginx retourne 502 Bad Gateway

```bash
# Vérifier que le backend est en cours d'exécution
sudo systemctl status sfiDashMonitoring-backend

# Vérifier que le port 3001 est écoute
sudo netstat -tlnp | grep 3001

# Redémarrer Nginx
sudo systemctl restart nginx
```

### Les connexions WebSocket ne fonctionnent pas

```bash
# Vérifier la configuration Nginx pour /socket.io
sudo nginx -T | grep socket.io

# Vérifier les logs d'erreur Nginx
tail -f /var/log/nginx/error.log

# Redémarrer les services
sudo systemctl restart sfiDashMonitoring-backend
sudo systemctl restart nginx
```

### Certificat SSL/TLS Elasticsearch invalide

```bash
# Vérifier le chemin du certificat
ls -la /opt/sfiDashMonitoring/backend/certs/http_ca.crt

# Tester la connexion avec le certificat
curl -k --cacert /opt/sfiDashMonitoring/backend/certs/http_ca.crt \
  --user stgSFI:Police2405$ \
  https://172.27.28.14:9200

# Si le certificat n'existe pas, récupérez-le depuis Elasticsearch
# scp user@elasticsearch:/chemin/http_ca.crt \
#     /opt/sfiDashMonitoring/backend/certs/
```

---

## 📈 Monitoring et Maintenance

### Surveillance des ressources

```bash
# Utilisation CPU et mémoire
top -u sfiapp

# Espace disque
df -h

# Connexions réseau actives
sudo netstat -anp | grep 3001
sudo netstat -anp | grep nginx
```

### Rotation des logs

Les logs sont gérés par systemd/journalctl :

```bash
# Effacer les anciens logs (plus de 30 jours)
sudo journalctl --vacuum=time=30d

# Limiter la taille des logs
sudo nano /etc/systemd/journald.conf
# Définir: SystemMaxUse=500M
```

### Backups recommandés

```bash
# Sauvegarder la configuration
tar -czf backup-config-$(date +%Y%m%d).tar.gz \
  /opt/sfiDashMonitoring/backend/.env \
  /etc/nginx/nginx.conf

# Sauvegarder les données
# (selon votre configuration de base de données)
```

---

## 📞 Support et Questions

Pour les issues :
1. Consultez les logs : `journalctl -u sfiDashMonitoring-backend -f`
2. Vérifiez la configuration `.env`
3. Testez la connectivité vers Elasticsearch
4. Vérifiez les pare-feu et règles de sécurité
