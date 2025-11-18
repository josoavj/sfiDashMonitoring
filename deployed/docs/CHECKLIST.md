# ✅ Checklist Déploiement Systemd

Utilise cette checklist pour vérifier que tout est prêt avant le déploiement.

---

## 📋 Avant le Déploiement

### Préparation Machine de Développement

- [ ] Code commité et pushé sur la branche `update`
- [ ] Tests frontend passent en local
- [ ] Tests backend passent en local
- [ ] Pas d'erreurs de build (`npm run build`)
- [ ] Fichier `.env.example` à jour (ou `.env` correctement configuré)
- [ ] Pas de secrets en dur dans le code
- [ ] Dépendances npm à jour (optionnel: `npm audit`)

### Préparation Serveur Ubuntu

- [ ] Ubuntu 20.04 LTS ou 22.04 LTS installé
- [ ] Connexion SSH fonctionnelle
- [ ] Utilisateur avec accès sudo
- [ ] Elasticsearch installé et fonctionnel sur le serveur
- [ ] Espace disque > 5GB libre
- [ ] Mémoire RAM > 4GB disponible
- [ ] Connexion Internet stable

### Fichiers de Déploiement Prêts

- [ ] `install.sh` - Script d'installation
- [ ] `verify.sh` - Script de vérification
- [ ] `update.sh` - Script de mise à jour
- [ ] `DEPLOYMENT-SYSTEMD.md` - Guide détaillé
- [ ] `SETUP-QUICK.md` - Guide rapide

### Configuration

- [ ] IP Serveur confirmée: **172.27.28.14**
- [ ] Port backend: **3001**
- [ ] Port frontend: **80**
- [ ] Variables Elasticsearch configurées
- [ ] Nom de domaine ou IP accessible du réseau

---

## 🚀 Pendant le Déploiement

### Étape 1 : Préparation

- [ ] SSH sur le serveur
- [ ] Se mettre en root ou utiliser sudo
- [ ] Créer dossier temporaire: `mkdir /tmp/deploy`

### Étape 2 : Copier les Fichiers

- [ ] Copier `install.sh` sur le serveur
- [ ] Rendre exécutable: `chmod +x install.sh`
- [ ] Copier le projet complet ou cloner depuis Git

### Étape 3 : Installation

- [ ] Lancer le script: `sudo bash /tmp/install.sh`
- [ ] Répondre aux questions du script
- [ ] Attendre la fin (2-5 minutes)
- [ ] Vérifier qu'aucune erreur fatale n'est affichée

### Étape 4 : Vérification

- [ ] Lancer: `bash /opt/sfiDashMonitoring/deployed/verify.sh`
- [ ] Tous les tests doivent passer (vert ✓)
- [ ] Vérifier les logs: `sudo journalctl -u sfi-monitoring-backend -f`

### Étape 5 : Tests Manuels

- [ ] Tester le backend: `curl http://127.0.0.1:3001/api/health`
- [ ] Tester le frontend: `curl http://172.27.28.14`
- [ ] Ouvrir le navigateur: `http://172.27.28.14`
- [ ] Se connecter avec les credentials
- [ ] Vérifier l'affichage des données

---

## ✅ Après le Déploiement

### Vérifications Système

- [ ] Services actifs: `sudo systemctl status sfi-monitoring-backend nginx`
- [ ] Ports ouverts: `sudo netstat -tlnp | grep -E '80|3001'`
- [ ] Logs sans erreur: `sudo journalctl -u sfi-monitoring-backend --since "10 min ago"`
- [ ] Elasticsearch accessible: `curl http://localhost:9200`

### Vérifications Application

- [ ] Frontend charge
- [ ] API répond: `/api/health` retourne status "ok"
- [ ] WebSocket connecté (voir console JS)
- [ ] Données affichées (tables, graphiques)
- [ ] Recherche fonctionne
- [ ] Filtres temporels fonctionnent

### Vérifications Firewall

- [ ] Frontend accessible de l'extérieur (port 80)
- [ ] Backend NOT accessible directement (port 3001)
- [ ] Elasticsearch NOT accessible de l'extérieur (port 9200)

### Vérifications Sécurité

- [ ] Fichier `.env` a les permissions `600`
- [ ] Pas de credentials en logs
- [ ] Utilisateur `sfiapp` est propriétaire du code
- [ ] Services tournent en tant que `sfiapp`, pas root

### Documentation

- [ ] Documenter l'IP serveur: **172.27.28.14**
- [ ] Documenter les accès pour l'équipe
- [ ] Communiquer l'URL d'accès: `http://172.27.28.14`
- [ ] Partager la procédure de maintenance

---

## 🔄 Maintenance Quotidienne

### Vérifications Quotidiennes

- [ ] Services en cours d'exécution
- [ ] Pas d'erreurs en logs
- [ ] Espace disque OK
- [ ] Mémoire OK
- [ ] Application répond normalement

### Checks Hebdomadaires

- [ ] Vérifier les logs d'erreur (journalctl)
- [ ] Vérifier les alertes (Elasticsearch)
- [ ] Vérifier l'espace disque des logs
- [ ] Tester les backups (si applicable)

### Checks Mensuels

- [ ] Mettre à jour les dépendances (npm)
- [ ] Vérifier les mises à jour système
- [ ] Archiver les anciens logs
- [ ] Nettoyer les fichiers temporaires

---

## 📊 Checklist de Troubleshooting

Si quelque chose ne fonctionne pas :

- [ ] Consulter les logs: `sudo journalctl -u sfi-monitoring-backend -f`
- [ ] Vérifier Elasticsearch: `curl http://localhost:9200`
- [ ] Vérifier la config Nginx: `sudo nginx -t`
- [ ] Redémarrer le service: `sudo systemctl restart sfi-monitoring-backend`
- [ ] Vérifier les permissions: `ls -la /opt/sfiDashMonitoring`
- [ ] Vérifier l'espace disque: `df -h`
- [ ] Vérifier la mémoire: `free -h`

---

## 📝 Notes Post-Déploiement

**Date du déploiement:** _______________________

**IP Serveur:** 172.27.28.14

**Responsable:** _______________________

**Notes:** 

```
_________________________________________________________________

_________________________________________________________________

_________________________________________________________________
```

**Contacts d'Urgence:**

- Admin Système: _______________________
- Admin App: _______________________
- Support: _______________________

---

## 🔐 Accès et Credentials

**Ne pas oublier de configurer:**

- [ ] Credentials Elasticsearch
- [ ] Variables d'environnement backend
- [ ] Base de données (si applicable)
- [ ] Certificats SSL (futur)
- [ ] Sauvegarde des .env

---

## 📞 Contacts

En cas de problème:

1. Vérifier les logs
2. Lancer `verify.sh`
3. Consulter la documentation
4. Contacter l'admin système

---

**Déploiement Systemd - Checklist v1.0**
**Dernière mise à jour:** 17 novembre 2025
