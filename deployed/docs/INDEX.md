# Guide Déploiement - SFI Dashboard

**Configuration Systemd pour Ubuntu Server 20.04/22.04 LTS**

---

## Vue d'Ensemble

Ce dossier contient tous les outils et guides pour déployer **SFI Dashboard** sur un serveur Ubuntu avec :

- **Backend:** Node.js + Express (port 3001)
- **Frontend:** React + Vite (port 80 via Nginx)
- **Proxy:** Nginx (reverse proxy & static files)
- **Elasticsearch:** Local (port 9200)
- **Init System:** Systemd

---

## Fichiers

| Fichier | Type | Description |
|---------|------|-------------|
| **install.sh** | Script | Installation automatisée complète |
| **verify.sh** | Script | Vérification du déploiement |
| **update.sh** | Script | Mise à jour du code |
| **DEPLOYMENT-SYSTEMD.md** | Doc | Guide détaillé (45+ sections) |
| **SETUP-QUICK.md** | Doc | Guide rapide |
| **CHECKLIST.md** | Doc | Checklist de déploiement |
| **FILES-DEPLOYMENT.md** | Doc | Résumé des fichiers |

---

## Démarrage Rapide (5 min)

### 1. Sur votre machine locale

```bash
cd /home/shadowcraft/Projets/sfiDashMonitoring/deployed

# Copier les fichiers sur le serveur
scp install.sh user@172.27.28.14:/tmp/
```

### 2. Sur le serveur (SSH)

```bash
ssh user@172.27.28.14

# Lancer l'installation
sudo bash /tmp/install.sh

# Le script va demander où est le projet
# Répondre: /home/shadowcraft/Projets/sfiDashMonitoring
```

### 3. Vérifier l'installation

```bash
# Sur le serveur
bash /opt/sfiDashMonitoring/deployed/verify.sh

# Dans votre navigateur
http://172.27.28.14
```

---

## Guides

### Pour les Impatients
→ Lire: **SETUP-QUICK.md** (sections "Démarrage Rapide")

### Pour l'Installation Complète
→ Lire: **DEPLOYMENT-SYSTEMD.md** (sections 1-8)

### Pour Vérifier le Déploiement
→ Lancer: `bash /opt/sfiDashMonitoring/deployed/verify.sh`

### Avant le Déploiement
→ Utiliser: **CHECKLIST.md** pour vérifier tous les points

---

## Configuration

| Paramètre | Valeur |
|-----------|--------|
| **IP Serveur** | 172.27.28.14 |
| **Port Frontend** | 80 |
| **Port Backend** | 3001 (local, via Nginx) |
| **Port Elasticsearch** | 9200 (local) |
| **Utilisateur App** | sfiapp |
| **Répertoire** | /opt/sfiDashMonitoring |
| **Init System** | Systemd |
| **SSL/TLS** | Non (à ajouter futur) |

---

## Fonctionnalités

### Installation Automatisée (install.sh)
- Installe toutes les dépendances
- Configure les variables d'environnement
- Build le frontend
- Crée les services Systemd
- Configure Nginx
- Configure le Firewall
- Lance les services

### Vérification (verify.sh)
- État des services
- Connectivité réseau
- Fichiers et permissions
- Logs et erreurs
- Performance
- Santé Elasticsearch

### Mise à Jour (update.sh)
- Git pull
- Réinstall dépendances
- Rebuild frontend
- Redémarre services
- Vérifie la santé

---

## Étapes de Déploiement

```
1. Préparer la machine de dev
   ├─ Commiter le code
   ├─ Tester en local
   └─ Préparer les fichiers

2. Préparer le serveur Ubuntu
   ├─ Ubuntu 20.04/22.04 LTS
   ├─ SSH access
   └─ Elasticsearch installé

3. Lancer l'installation
   ├─ scp install.sh
   ├─ sudo bash install.sh
   └─ Répondre aux questions

4. Vérifier le déploiement
   ├─ bash verify.sh
   ├─ Tests manuels
   └─ Accès frontend

5. Configuration finale
   ├─ Firewall (UFW)
   ├─ SSL (optionnel futur)
   └─ Monitoring
```

---

## Tests

### Test Automatisé
```bash
# Sur le serveur
bash /opt/sfiDashMonitoring/deployed/verify.sh
```

### Tests Manuels
```bash
# Backend health
curl http://127.0.0.1:3001/api/health

# Frontend
curl http://172.27.28.14

# Depuis navigateur
http://172.27.28.14
```

---

## Opérations Courantes

### Voir le statut des services
```bash
sudo systemctl status sfi-monitoring-backend nginx elasticsearch
```

### Redémarrer le backend
```bash
sudo systemctl restart sfi-monitoring-backend
```

### Voir les logs en temps réel
```bash
sudo journalctl -u sfi-monitoring-backend -f
```

### Mettre à jour le code
```bash
sudo bash /opt/sfiDashMonitoring/deployed/update.sh update
```

### Arrêter le service
```bash
sudo systemctl stop sfi-monitoring-backend
```

---

## Troubleshooting Rapide

| Problème | Solution |
|----------|----------|
| Backend ne démarre pas | `sudo journalctl -u sfi-monitoring-backend -n 50` |
| Nginx 502 Bad Gateway | `curl http://127.0.0.1:3001/api/health` |
| Frontend chargement lent | Vérifier espace disque: `df -h` |
| Elasticsearch ne répond pas | `sudo systemctl restart elasticsearch` |
| Permissions refusées | `sudo chown -R sfiapp:sfiapp /opt/sfiDashMonitoring` |

---

## 📞 Support

### Je veux déployer
1. Lire: **SETUP-QUICK.md**
2. Lancer: `install.sh`
3. Vérifier: `verify.sh`

### J'ai une erreur
1. Consulter les logs: `journalctl -u sfi-monitoring-backend -f`
2. Lancer: `verify.sh`
3. Lire: **DEPLOYMENT-SYSTEMD.md** section Troubleshooting

### Je veux mettre à jour
1. Lancer: `update.sh`
2. Vérifier: `verify.sh`

### Je veux une config avancée
1. Lire: **DEPLOYMENT-SYSTEMD.md**
2. Modifier les configurations
3. Redémarrer les services

---

## 📚 Documentation

| Document | Pour Qui | Contenu |
|----------|----------|---------|
| **SETUP-QUICK.md** | Tous | Démarrage rapide |
| **DEPLOYMENT-SYSTEMD.md** | Admins | Guide détaillé (45+ sections) |
| **CHECKLIST.md** | Avant deploy | Vérification complète |
| **FILES-DEPLOYMENT.md** | Référence | Résumé des fichiers |

---

## Sécurité

### Conseils Importants

1. **Firewall activé**
   ```bash
   sudo ufw enable
   sudo ufw allow 22,80,443/tcp
   sudo ufw deny 3001,9200/tcp
   ```

2. **.env sécurisé**
   ```bash
   sudo chmod 600 /opt/sfiDashMonitoring/backend/.env
   ```

3. **Pas de secrets en logs**
   ```bash
   grep -r "password\|token\|secret" /opt/sfiDashMonitoring
   ```

4. **Updates réguliers**
   ```bash
   sudo apt update && sudo apt upgrade -y
   npm audit
   ```

---

## Next Steps

**Installation OK?**
- Vérifier: `bash verify.sh`
- Tester: `http://172.27.28.14`
- Lire: **SETUP-QUICK.md** section "Gestion des Services"

**Mettre à jour le code?**
- Lancer: `sudo bash update.sh update`
- Vérifier: `bash verify.sh`

**Monitoring?**
- Logs: `sudo journalctl -u sfi-monitoring-backend -f`
- Services: `sudo systemctl status sfi-monitoring-backend nginx`

**Ajouter SSL/HTTPS?**
- Consulter: **DEPLOYMENT-SYSTEMD.md** (section future)

---

## Log Fichier

| Service | Logs |
|---------|------|
| **Backend** | `journalctl -u sfi-monitoring-backend` |
| **Nginx** | `/var/log/nginx/access.log`, `error.log` |
| **Elasticsearch** | `journalctl -u elasticsearch` |
| **Système** | `journalctl -f` |

---

## 🤝 Contacts & Support

- **Documentation Complète:** Voir `DEPLOYMENT-SYSTEMD.md`
- **Vérification Automatisée:** `verify.sh`
- **Mise à Jour:** `update.sh`
- **Logs:** `journalctl -u sfi-monitoring-backend -f`

---

## Architecture

```
172.27.28.14 (Ubuntu Server)
│
├─ Nginx (port 80)
│  ├─ Servir dist/ (React build)
│  ├─ Proxy /api → Backend:3001
│  └─ Proxy /ws → Backend:3001 (WebSocket)
│
├─ Backend API (port 3001, local)
│  └─ Node.js + Express
│
└─ Elasticsearch (port 9200, local)
   └─ Stockage des données
```

---

## Checklist Rapide

- [ ] Ubuntu 20.04/22.04 LTS
- [ ] SSH access
- [ ] Elasticsearch installé
- [ ] `install.sh` prêt
- [ ] Exécuter `install.sh`
- [ ] Exécuter `verify.sh`
- [ ] Tester `http://172.27.28.14`
- [ ] OK? Déploiement terminé!

---

**Dernière mise à jour:** 17 novembre 2025  
**Version:** 1.0  
**Créé pour:** Ubuntu 20.04/22.04 LTS - Systemd

