# Index des Fichiers de Déploiement

## Configuration Complète pour Ubuntu Server 172.27.28.14

Déploiement Systemd (sans Docker) - Node.js natif + Nginx

---

## Structure des Fichiers

### 1. Scripts d'Installation

| Fichier | Description | Usage |
|---------|-------------|-------|
| `install-production.sh` | Installation automatisée complète | `sudo bash install-production.sh` |
| `update-production.sh` | Mise à jour du code en production | `sudo bash update-production.sh` |
| `verify-deployment.sh` | Vérification du déploiement | `sudo bash verify-deployment.sh` |
| `update-frontend-config.sh` | Mise à jour config frontend | `bash update-frontend-config.sh` |

### 2. Documentation

| Fichier | Description |
|---------|-------------|
| `UBUNTU-DEPLOYMENT-GUIDE.md` | Guide complet détaillé (installation, configuration, troubleshooting) |
| `DEPLOYMENT-README.md` | Résumé rapide + checklist |
| `POST-INSTALLATION-CHECKLIST.md` | Vérifications post-installation |
| `DEPLOYMENT-INDEX.md` | Ce fichier (index et résumé) |

### 3. Configuration Systemd

| Fichier | Description | Destination |
|---------|-------------|-------------|
| `sfiDashMonitoring-backend.service` | Service backend Node.js | `/etc/systemd/system/` |
| `sfiDashMonitoring-frontend.service` | Service Nginx (optionnel) | `/etc/systemd/system/` |

### 4. Configuration Serveur

| Fichier | Description | Destination |
|---------|-------------|-------------|
| `nginx.conf` | Configuration Nginx reverse proxy | `/etc/nginx/nginx.conf` |

---

## Configuration du Projet

### Fichier .env Backend

**Emplacement:** `/opt/sfiDashMonitoring/backend/.env`

**Configuration Production:**
```properties
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
ES_NODE=https://172.27.28.14:9200
ES_USERNAME=stgSFI
ES_PASSWORD=Police2405$
ES_CERT_PATH=/opt/sfiDashMonitoring/backend/certs/http_ca.crt
FRONTEND_URL=http://172.27.28.14 http://localhost
JWT_SECRET=<GÉNÉRER>
JWT_REFRESH_SECRET=<GÉNÉRER>
```

---

## Arborescence du Déploiement

```
/opt/sfiDashMonitoring/
├── backend/
│   ├── .env                 (Configuration - IMPORTANT!)
│   ├── server.js            (Point d'entrée)
│   ├── src/
│   ├── certs/
│   │   └── http_ca.crt      (Certificat Elasticsearch)
│   ├── node_modules/        (Dépendances)
│   └── package.json
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   └── ...
├── dist/                    (Frontend compilé → Nginx)
├── deployed/
│   ├── *.sh                 (Scripts)
│   ├── *.service            (Systemd)
│   ├── nginx.conf           (Config Nginx)
│   └── *.md                 (Documentation)
└── ...

/etc/nginx/
└── nginx.conf               (Symlink ou copie)

/etc/systemd/system/
└── sfiDashMonitoring-backend.service

/usr/share/nginx/html/
└── (fichiers frontend compilés)

/var/log/nginx/
└── access.log, error.log
```

---

## Flux d'Installation Rapide

### Pour qui a peu de temps :

```bash
# 1. Sur votre machine locale
scp deployed/install-production.sh user@172.27.28.14:/tmp/

# 2. SSH au serveur
ssh user@172.27.28.14

# 3. Exécuter l'installation
sudo bash /tmp/install-production.sh

# 4. Configurer les secrets
sudo nano /opt/sfiDashMonitoring/backend/.env
# Changer JWT_SECRET et JWT_REFRESH_SECRET

# 5. Redémarrer
sudo systemctl restart sfiDashMonitoring-backend

# 6. Vérifier
curl http://localhost
sudo systemctl status sfiDashMonitoring-backend

# 7. Accès externe
# Ouvrir: http://172.27.28.14
```

**Temps total: ~10-15 minutes**

---

## Vérifications Rapides

```bash
# Statut des services
sudo systemctl status sfiDashMonitoring-backend
sudo systemctl status nginx

# Logs en temps réel
sudo journalctl -u sfiDashMonitoring-backend -f

# Ports actifs
sudo netstat -tlnp | grep -E ':80|:3001'

# Elasticsearch
curl -k --user stgSFI:Police2405$ https://172.27.28.14:9200

# Vérification complète
sudo bash /opt/sfiDashMonitoring/deployed/verify-deployment.sh
```

---

## Points de Sécurité Critiques

1. **JWT Secrets** - Générer et configurer obligatoirement
   ```bash
   openssl rand -base64 32
   ```

2. **Fichier .env** - Ne pas commiter dans Git
   ```bash
   # Ajouter au .gitignore
   echo "backend/.env" >> .gitignore
   ```

3. **Certificat Elasticsearch** - Doit être accessible
   ```bash
   ls -la /opt/sfiDashMonitoring/backend/certs/http_ca.crt
   ```

4. **Pare-feu** - Seul port 80 (HTTP) exposé
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw deny 3001/tcp
   ```

---

## Mise à Jour du Code

### Option 1: Script automatisé

```bash
sudo bash /opt/sfiDashMonitoring/deployed/update-production.sh
```

### Option 2: Manuel

```bash
# Arrêter
sudo systemctl stop sfiDashMonitoring-backend

# Copier code
scp -r /local/code/* user@172.27.28.14:/opt/sfiDashMonitoring/

# Installer & build
cd /opt/sfiDashMonitoring/backend && npm install
cd /opt/sfiDashMonitoring && npm run build
sudo cp -r dist/* /usr/share/nginx/html/

# Redémarrer
sudo systemctl start sfiDashMonitoring-backend
```

---

## Troubleshooting Rapide

| Problème | Commande de Diagnostic | Solution |
|----------|------------------------|----------|
| Backend n'est pas actif | `sudo systemctl status sfiDashMonitoring-backend` | `sudo systemctl restart sfiDashMonitoring-backend` |
| 502 Bad Gateway | `sudo netstat -tlnp \| grep 3001` | Vérifier que port 3001 écoute |
| WebSocket ne fonctionne pas | `curl ws://localhost:3001/socket.io` | Redémarrer Nginx: `sudo systemctl restart nginx` |
| Elasticsearch indisponible | `curl -k --user stgSFI:Police2405$ https://172.27.28.14:9200` | Vérifier le certificat et le mot de passe |
| Frontend ne charge pas | `curl http://localhost` | Vérifier `/usr/share/nginx/html` |

---

## 📱 Accès à l'Application

### URL Production

```
http://172.27.28.14
```

### Ports Internes (localhost seulement)

- **Frontend:** Port 80 (via Nginx)
- **Backend:** Port 3001 (localhost seulement, via proxy Nginx)
- **Nginx:** Port 80 (reverse proxy)

### Elasticsearch (externe)

- **Adresse:** 172.27.28.14:9200
- **Utilisateur:** stgSFI
- **Protocole:** HTTPS avec certificat

---

## 📚 Documentation Externe

Pour plus de détails :

1. **Installation complète:** Voir `UBUNTU-DEPLOYMENT-GUIDE.md`
2. **Résumé rapide:** Voir `DEPLOYMENT-README.md`
3. **Post-installation:** Voir `POST-INSTALLATION-CHECKLIST.md`

---

## Commandes Essentielles

```bash
# Démarrage et arrêt
sudo systemctl start sfiDashMonitoring-backend
sudo systemctl stop sfiDashMonitoring-backend
sudo systemctl restart sfiDashMonitoring-backend

# Activation au démarrage
sudo systemctl enable sfiDashMonitoring-backend
sudo systemctl disable sfiDashMonitoring-backend

# Logs
sudo journalctl -u sfiDashMonitoring-backend -f      # Temps réel
sudo journalctl -u sfiDashMonitoring-backend -n 100  # 100 dernières
sudo journalctl -u sfiDashMonitoring-backend -p err  # Erreurs

# Vérification
sudo systemctl status sfiDashMonitoring-backend
sudo nginx -t                                        # Tester Nginx
sudo systemctl reload nginx                          # Recharger Nginx

# Édition de configuration
sudo nano /opt/sfiDashMonitoring/backend/.env
sudo nano /etc/nginx/nginx.conf
```

---

## 📞 Support et Questions

### Vérifications à faire en cas de problème :

1. **Logs du backend:**
   ```bash
   sudo journalctl -u sfiDashMonitoring-backend -n 50 -e
   ```

2. **Configuration .env:**
   ```bash
   cat /opt/sfiDashMonitoring/backend/.env
   ```

3. **Ports actifs:**
   ```bash
   sudo netstat -tlnp | grep -E ':80|:3001'
   ```

4. **Connectivity réseau:**
   ```bash
   curl http://localhost:3001/api
   curl http://localhost
   ```

5. **Elasticsearch:**
   ```bash
   curl -k --user stgSFI:Police2405$ https://172.27.28.14:9200
   ```

---

## Checklist de Déploiement Final

- [ ] Tous les scripts sont exécutables (`chmod +x`)
- [ ] `.env` est configuré avec secrets JWT uniques
- [ ] Service backend actif et au démarrage
- [ ] Nginx écoute sur port 80
- [ ] Elasticsearch accessible
- [ ] Frontend accessible à http://172.27.28.14
- [ ] Logs sans erreurs critiques
- [ ] Vérification complète réussie (`verify-deployment.sh`)
- [ ] Backups en place
- [ ] Documentation lue et compris

---

## 📅 Version et Historique

**Version:** 1.0.0  
**Date:** 17 novembre 2025  
**Environnement:** Ubuntu Server 20.04/22.04 LTS  
**IP Serveur:** 172.27.28.14  
**Architecture:** Systemd + Node.js + Nginx + Elasticsearch

**Historique des modifications:**
- v1.0.0: Configuration initiale pour déploiement Systemd
