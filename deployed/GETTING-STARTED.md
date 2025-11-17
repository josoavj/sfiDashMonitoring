# 🎯 Premiers Pas - Guide de Déploiement

**Vous venez de recevoir les fichiers de déploiement?**  
Commencez ici! 👈

---

## ⏰ Temps Estimé

- **Lecture complète:** 5-10 minutes
- **Installation:** 5-10 minutes (automatisée)
- **Vérification:** 2-3 minutes
- **Total:** 15-25 minutes

---

## 📋 Avant de Commencer

Assurez-vous que vous avez :

- ✅ Accès SSH au serveur Ubuntu
- ✅ Droits `sudo` sur le serveur
- ✅ Ubuntu 20.04 LTS ou 22.04 LTS installé
- ✅ Elasticsearch installé et fonctionnel
- ✅ Au moins 5GB d'espace disque libre
- ✅ Au moins 4GB de mémoire RAM disponible

---

## 🚀 En 4 Étapes

### Étape 1 : Copier les fichiers (2 min)

Sur **votre machine locale** :

```bash
cd /home/shadowcraft/Projets/sfiDashMonitoring/deployed

# Copier le script d'installation sur le serveur
scp install.sh user@172.27.28.14:/tmp/
```

### Étape 2 : Lancer l'installation (10 min)

Sur **le serveur** :

```bash
# Se connecter au serveur
ssh user@172.27.28.14

# Lancer le script d'installation
sudo bash /tmp/install.sh

# Le script va:
# - Demander le chemin du projet local (si clone)
# - Installer les dépendances
# - Configurer l'application
# - Démarrer les services
```

### Étape 3 : Vérifier l'installation (3 min)

Sur **le serveur** :

```bash
# Exécuter la vérification automatisée
bash /opt/sfiDashMonitoring/deployed/verify.sh

# Vous devez voir: ✅ tests réussis
```

### Étape 4 : Accéder à l'application (1 min)

Dans **votre navigateur** :

```
http://172.27.28.14
```

✅ **Prêt!** L'application est maintenant en ligne.

---

## 📖 Après l'Installation

### Je veux comprendre ce qui a été installé
→ Lire: **INDEX.md**

### Je veux en savoir plus sur la configuration
→ Lire: **SETUP-QUICK.md**

### Je veux du détail technique complet
→ Lire: **DEPLOYMENT-SYSTEMD.md**

### Je veux une checklist complète avant de déployer
→ Utiliser: **CHECKLIST.md**

### Je veux vérifier que tout fonctionne
→ Lancer: `bash /opt/sfiDashMonitoring/deployed/verify.sh`

---

## 🔄 Opérations Courantes

### Voir le statut
```bash
sudo systemctl status sfi-monitoring-backend
```

### Redémarrer l'application
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

---

## 🚨 Quelque Chose ne Fonctionne Pas?

### Le déploiement a échoué
```bash
# Voir les erreurs détaillées
sudo journalctl -u sfi-monitoring-backend -n 50

# Relancer la vérification
bash /opt/sfiDashMonitoring/deployed/verify.sh
```

### L'application ne charge pas
```bash
# Vérifier que le backend répond
curl http://127.0.0.1:3001/api/health

# Attendre quelques secondes et réessayer
# (Elasticsearch peut prendre du temps au démarrage)
```

### Nginx retourne une erreur 502
```bash
# Vérifier que le backend écoute
sudo netstat -tlnp | grep 3001

# Redémarrer les deux services
sudo systemctl restart sfi-monitoring-backend nginx
```

---

## 📊 Architecture Déployée

Voici ce qui a été installé sur le serveur 172.27.28.14 :

```
Navigateur (votre machine)
    ↓
    http://172.27.28.14
    ↓
Nginx (port 80)
    ├─ Servir les fichiers statiques (React build)
    ├─ Proxy /api/* vers Backend:3001
    └─ Proxy /ws vers Backend:3001 (WebSocket)
    ↓
Backend API (port 3001, local)
    ├─ Node.js + Express
    └─ Elasticsearch (port 9200)
```

---

## 📱 Accès

- **Frontend (app):** http://172.27.28.14
- **API:** http://172.27.28.14/api
- **Health Check:** http://172.27.28.14/api/health

---

## 🛠️ Structure des Fichiers

### Scripts (exécutables)
```bash
install.sh    # Installation automatisée
verify.sh     # Vérification après déploiement
update.sh     # Mise à jour du code
```

### Documentation
```markdown
INDEX.md                  # Page d'accueil (START HERE!)
SETUP-QUICK.md           # Démarrage rapide
DEPLOYMENT-SYSTEMD.md    # Guide détaillé
FILES-DEPLOYMENT.md      # Résumé des fichiers
CHECKLIST.md             # Checklist complète
SUMMARY.sh               # Résumé formaté
GETTING-STARTED.md       # Ce fichier
```

### Configuration
```bash
/opt/sfiDashMonitoring/backend/.env    # Configuration backend
/etc/nginx/sites-available/sfi-monitoring  # Configuration Nginx
/etc/systemd/system/sfi-monitoring-backend.service  # Service Systemd
```

---

## 📞 Besoin d'Aide?

1. **Vérification rapide:**
   ```bash
   bash /opt/sfiDashMonitoring/deployed/verify.sh
   ```

2. **Logs détaillés:**
   ```bash
   sudo journalctl -u sfi-monitoring-backend -f
   ```

3. **Consulter la doc:**
   - `INDEX.md` - Vue d'ensemble
   - `SETUP-QUICK.md` - Guide rapide
   - `DEPLOYMENT-SYSTEMD.md` - Guide complet

4. **Tester manuellement:**
   ```bash
   curl http://127.0.0.1:3001/api/health
   curl http://172.27.28.14
   ```

---

## ✅ Checklist Post-Installation

Vérifiez que :

- [ ] `verify.sh` a tous les tests en vert ✅
- [ ] Frontend charge: http://172.27.28.14 ✅
- [ ] API répond: `/api/health` ✅
- [ ] Pas d'erreurs dans les logs ✅
- [ ] Services actifs: `systemctl status sfi-monitoring-backend` ✅

---

## 🎉 Félicitations!

Vous venez de déployer SFI Dashboard sur Ubuntu Server!

### Prochaines étapes recommandées:

1. **Tester l'application**
   - Accéder à http://172.27.28.14
   - Se connecter
   - Vérifier les données

2. **Apprendre les commandes courantes**
   - Consulter: **SETUP-QUICK.md** (section "Gestion des Services")

3. **Configurer le monitoring**
   - Logs: `sudo journalctl -u sfi-monitoring-backend -f`
   - Services: `sudo systemctl status sfi-monitoring-backend nginx`

4. **Ajouter SSL/HTTPS** (optionnel)
   - Consulter: **DEPLOYMENT-SYSTEMD.md** (future section)

---

## 📚 Documentation Complète

| Document | Pour | Quand |
|----------|------|-------|
| **INDEX.md** | Tout le monde | Pour un aperçu général |
| **SETUP-QUICK.md** | Administrateurs | Pour les opérations courantes |
| **DEPLOYMENT-SYSTEMD.md** | Administrateurs avancés | Pour du detail technique |
| **CHECKLIST.md** | Avant déploiement | Pour vérifier tout |
| **verify.sh** | Tous | Pour vérifier l'installation |

---

## 🌐 Configuration par Défaut

```
IP Serveur:        172.27.28.14
Port Frontend:     80
Port Backend:      3001 (local)
Port Elasticsearch: 9200 (local)
Utilisateur App:   sfiapp
Répertoire:        /opt/sfiDashMonitoring
Init System:       Systemd
SSL/TLS:           Non (à ajouter)
```

---

## 💡 Astuces

1. **Accès direct sans port HTTP:**
   - http://172.27.28.14 (via Nginx)

2. **Backend local uniquement:**
   - Accessible seulement via Nginx (sécurité)

3. **Logs en temps réel:**
   ```bash
   sudo journalctl -u sfi-monitoring-backend -f
   ```

4. **Redémarrage rapide:**
   ```bash
   sudo systemctl restart sfi-monitoring-backend
   ```

5. **Mise à jour simple:**
   ```bash
   sudo bash /opt/sfiDashMonitoring/deployed/update.sh update
   ```

---

## 🚀 Status Actuel

✅ **Installation Systemd complète**
- Node.js + Express
- React + Vite
- Nginx (reverse proxy)
- Elasticsearch
- Systemd services
- Firewall UFW (optionnel)

❌ **Non inclus dans cette version**
- SSL/TLS (HTTPS)
- Base de données externe
- Load balancer
- Monitoring avancé (à configurer)

---

## 📝 Notes Personnelles

```
Date du déploiement: _______________
Serveur: 172.27.28.14
Responsable: _______________
Notes: _________________________
```

---

## 🔗 Liens Utiles

| Lien | Destination |
|------|------------|
| **Frontend** | http://172.27.28.14 |
| **API** | http://172.27.28.14/api |
| **Health** | http://172.27.28.14/api/health |

---

## ❓ Questions Fréquemment Posées

**Q: Comment redémarrer l'application?**  
A: `sudo systemctl restart sfi-monitoring-backend`

**Q: Comment voir les erreurs?**  
A: `sudo journalctl -u sfi-monitoring-backend -f`

**Q: Comment mettre à jour le code?**  
A: `sudo bash /opt/sfiDashMonitoring/deployed/update.sh update`

**Q: L'application ne charge pas, quoi faire?**  
A: Lancer `bash /opt/sfiDashMonitoring/deployed/verify.sh`

**Q: Où est stocké le code?**  
A: `/opt/sfiDashMonitoring`

**Q: Qui peut accéder à l'application?**  
A: Toute personne sur le réseau: http://172.27.28.14

---

**Version:** 1.0  
**Créé:** 17 novembre 2025  
**Configuration:** Systemd - Ubuntu 20.04/22.04 LTS

---

### 🎯 Prêt à Déployer?

1. Lire ce document (✓ fait!)
2. Lancer `install.sh`
3. Lancer `verify.sh`
4. Tester http://172.27.28.14

**C'est tout! 🚀**

