# Fichiers de Déploiement Créés

Résumé des fichiers de déploiement pour Systemd sur Ubuntu Server.

---

## Fichiers Disponibles

### 1. **SETUP-QUICK.md** (Ce fichier)
**Description:** Guide rapide de déploiement  
**Contenu:**
- Table des matières
- Démarrage rapide
- Installation manuelle
- Vérification
- Gestion des services
- Mise à jour
- Troubleshooting

### 2. **DEPLOYMENT-SYSTEMD.md**
**Description:** Guide détaillé complet (45+ sections)  
**Contenu:**
- Prérequis système
- Préparation du serveur
- Installation dépendances
- Configuration environnement
- Configuration Nginx (reverse proxy)
- Création services Systemd
- Tests manuels
- Gestion des services
- Mise à jour du code
- Sécurité & Firewall
- Troubleshooting avancé

### 3. **install.sh** (Exécutable)
**Description:** Script d'installation automatisée  
**Fonction:** Automatise complètement le déploiement  
**Utilisation:**
```bash
sudo bash /tmp/install.sh
```

**Ce que fait le script:**
- [OK] Met à jour le système
- [OK] Installe Node.js, Nginx, Git
- [OK] Crée l'utilisateur sfiapp
- [OK] Copie/clone le projet
- [OK] Installe les dépendances
- [OK] Build le frontend
- [OK] Configure les variables d'environnement
- [OK] Configure Nginx
- [OK] Crée les services Systemd
- [OK] Configure le Firewall (UFW)
- [OK] Démarre les services
- [OK] Lance des tests

### 4. **verify.sh** (Exécutable)
**Description:** Script de vérification du déploiement  
**Fonction:** Teste tous les composants après déploiement  
**Utilisation:**
```bash
bash /opt/sfiDashMonitoring/deployed/verify.sh
```

**Ce que vérifie le script:**
- [OK] État des services (Backend, Nginx, Elasticsearch)
- [OK] Ports ouverts
- [OK] Connectivité Backend/Frontend/WebSocket
- [OK] Fichiers et permissions
- [OK] Variables d'environnement
- [OK] Logs (erreurs)
- [OK] Santé Elasticsearch
- [OK] Configuration Nginx
- [OK] Uptime et performance

### 5. **update.sh** (Exécutable)
**Description:** Script de mise à jour du code  
**Fonction:** Met à jour le code et redémarre les services  
**Utilisation:**
```bash
sudo bash /opt/sfiDashMonitoring/deployed/update.sh update
```

**Ce que fait le script:**
- [OK] Arrête le backend
- [OK] Git pull les changements
- [OK] Installe les dépendances
- [OK] Build le frontend
- [OK] Redémarre les services
- [OK] Vérifie la santé

---

## Utilisation Rapide

### Scenario 1 : Installation depuis zéro

```bash
# Sur votre machine locale
scp deploy/install.sh user@172.27.28.14:/tmp/

# Sur le serveur
ssh user@172.27.28.14
sudo bash /tmp/install.sh
```

### Scenario 2 : Installation sur machine existante

```bash
# Depuis le repo local
cd /opt/sfiDashMonitoring/deployed

# Copier sur le serveur
scp install.sh verify.sh update.sh user@172.27.28.14:~

# Sur le serveur
ssh user@172.27.28.14
sudo bash install.sh
```

### Scenario 3 : Vérifier le déploiement

```bash
# Sur le serveur
bash /opt/sfiDashMonitoring/deployed/verify.sh
```

### Scenario 4 : Mettre à jour le code

```bash
# Sur le serveur
sudo bash /opt/sfiDashMonitoring/deployed/update.sh update
```

---

## Configuration Fournie

### IP Serveur
- **172.27.28.14**

### Ports
- **Frontend:** 80 (via Nginx)
- **Backend:** 3001 (local, via Nginx reverse proxy)
- **Elasticsearch:** 9200 (local)

### Utilisateur d'Application
- **Utilisateur:** sfiapp
- **Répertoire:** /opt/sfiDashMonitoring
- **Permissions:** 755 (dirs), 644 (files)

### Services Systemd
- **Backend:** sfi-monitoring-backend
- **Frontend:** nginx

---

## Points Clés

1. **Automatisé**: Le script `install.sh` fait tout
2. **Sécurisé**: Backend non accessible directement (via Nginx)
3. **Vérifié**: Script `verify.sh` pour tester le déploiement
4. **Mis à jour**: Script `update.sh` pour les mises à jour
5. **Documenté**: 3 guides (rapide, détaillé, scripts)

---

## Support

Pour des questions :

1. **Guide détaillé:** Lire `DEPLOYMENT-SYSTEMD.md`
2. **Vérifier:** Lancer `verify.sh`
3. **Logs:** `sudo journalctl -u sfi-monitoring-backend -f`

---

**Créé le:** 17 novembre 2025  
**Version:** 1.0  
**Configuration:** Systemd - Ubuntu 20.04/22.04 LTS
