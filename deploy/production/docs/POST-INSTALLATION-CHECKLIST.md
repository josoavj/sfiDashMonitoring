# Post-Installation Checklist

## Après l'Installation

Suivez cette checklist pour vérifier que tout est correctement configuré.

---

## Étape 1 : Vérifier les Services (5 min)

```bash
# Vérifier le statut du backend
sudo systemctl status sfiDashMonitoring-backend

# Vérifier le statut de Nginx
sudo systemctl status nginx

# Les deux doivent afficher: Active: active (running)
```

---

## Étape 2 : Vérifier la Connectivité (5 min)

```bash
# Test 1: Le frontend est-il accessible?
curl -I http://localhost

# Devrait retourner: HTTP/1.1 200 OK

# Test 2: Le backend API est-il accessible?
curl -I http://localhost:3001/api

# Devrait retourner: HTTP/1.1 404 (c'est normal s'il n'y a pas de route /api)
# ou HTTP/1.1 200 si une route existe

# Test 3: WebSocket fonctionne-t-il?
# Ouvrir le navigateur et aller sur http://localhost
# Ouvrir la console (F12) et vérifier qu'il n'y a pas d'erreurs WebSocket
```

---

## Étape 3 : Vérifier la Connectivité Elasticsearch (5 min)

```bash
# Test de connexion à Elasticsearch
curl -k --user stgSFI:Police2405$ https://172.27.28.14:9200

# Devrait retourner un JSON avec cluster_name, version, etc.

# Si erreur "certificate problem":
# - Vérifier le certificat existe: ls -la /opt/sfiDashMonitoring/backend/certs/http_ca.crt
# - Vérifier le chemin dans .env: grep ES_CERT_PATH /opt/sfiDashMonitoring/backend/.env
```

---

## Étape 4 : Configuration de Sécurité (10 min)

### Modifier les secrets JWT

```bash
# OBLIGATOIRE: Générer des secrets forts
openssl rand -base64 32    # Première clé
openssl rand -base64 32    # Deuxième clé

# Éditer le fichier .env
sudo nano /opt/sfiDashMonitoring/backend/.env

# Remplacer:
# JWT_SECRET=<votre_premier_secret_ici>
# JWT_REFRESH_SECRET=<votre_deuxième_secret_ici>

# Sauvegarder (Ctrl+X, Y, Entrée)

# Redémarrer le backend pour appliquer
sudo systemctl restart sfiDashMonitoring-backend

# Vérifier que le service redémarre correctement
sleep 3
sudo systemctl status sfiDashMonitoring-backend
```

### Configurer le pare-feu (si applicable)

```bash
# Vérifier l'état du pare-feu
sudo ufw status

# Si actif, permettre HTTP
sudo ufw allow 80/tcp

# Vérifier que le port 3001 n'est pas accessible de l'extérieur
sudo ufw status numbered
```

---

## Étape 5 : Configurer les Backups (10 min)

```bash
# Créer un script de backup du .env
sudo tee /usr/local/bin/backup-sfi.sh > /dev/null << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/sfiDashMonitoring/backups"
mkdir -p "$BACKUP_DIR"
cp /opt/sfiDashMonitoring/backend/.env "$BACKUP_DIR/.env.$(date +%Y%m%d-%H%M%S)"
echo "Backup créé: $BACKUP_DIR/.env.*"
EOF

# Rendre exécutable
sudo chmod +x /usr/local/bin/backup-sfi.sh

# Tester
sudo /usr/local/bin/backup-sfi.sh

# Ajouter une tâche cron pour les backups quotidiens (optionnel)
# sudo crontab -e
# Ajouter: 0 2 * * * /usr/local/bin/backup-sfi.sh
```

---

## Étape 6 : Logs et Monitoring (5 min)

### Configurer la rotation des logs

```bash
# Les logs Systemd sont automatiquement gérés
# Mais on peut les limiter

sudo nano /etc/systemd/journald.conf

# Rechercher et modifier:
# SystemMaxUse=500M
# MaxRetentionDays=30

# Redémarrer systemd-journald
sudo systemctl restart systemd-journald
```

### Consulter les logs

```bash
# Dernières 50 lignes
sudo journalctl -u sfiDashMonitoring-backend -n 50

# En temps réel
sudo journalctl -u sfiDashMonitoring-backend -f

# Erreurs uniquement
sudo journalctl -u sfiDashMonitoring-backend -p err

# Nginx logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

---

## Étape 7 : Performance et Ressources (5 min)

```bash
# Vérifier la consommation du backend
top -u sfiapp

# Vérifier l'espace disque
df -h

# Vérifier l'utilisation mémoire
free -h

# Conseils:
# - Backend doit utiliser < 200MB
# - Espace disque disponible > 10GB
# - Si problèmes: augmenter les ressources ou vérifier la configuration ES_INDEX
```

---

## Étape 8 : Accès Utilisateur Externe (5 min)

### Sur le navigateur externe

```
http://172.27.28.14
```

Devrait afficher:
- [OK] Logo SFI Dashboard
- [OK] Page de connexion ou dashboard
- [OK] Pas d'erreurs console (F12)
- [OK] WebSocket connecté (vert dans le coin)

### Si erreur 502/503:

```bash
# Le backend n'est pas accessible
# Solutions:
sudo systemctl restart sfiDashMonitoring-backend
sudo systemctl restart nginx
sudo journalctl -u sfiDashMonitoring-backend -n 20 -e

# Vérifier le port 3001
sudo netstat -tlnp | grep 3001
```

---

## Étape 9 : Documentation et Runbooks (10 min)

### Créer une documentation pour votre équipe

```bash
# Sauvegarder cette checklist
sudo cp deployed/POST-INSTALLATION-CHECKLIST.md /opt/sfiDashMonitoring/

# Créer un runbook pour démarrages/arrêts
cat > /opt/sfiDashMonitoring/OPERATIONS.md << 'EOF'
# Opérations SFI Dashboard

## Démarrage
sudo systemctl start sfiDashMonitoring-backend
sudo systemctl status sfiDashMonitoring-backend

## Arrêt
sudo systemctl stop sfiDashMonitoring-backend

## Redémarrage
sudo systemctl restart sfiDashMonitoring-backend

## Logs temps réel
sudo journalctl -u sfiDashMonitoring-backend -f

## Mise à jour
sudo bash /opt/sfiDashMonitoring/deployed/update-production.sh
EOF

# Faire une copie de ces fichiers
sudo chown sfiapp:sfiapp /opt/sfiDashMonitoring/OPERATIONS.md
```

---

## Étape 10 : Vérification Finale (5 min)

### Exécuter le script de vérification

```bash
# Vérification complète du déploiement
sudo bash /opt/sfiDashMonitoring/deployed/verify-deployment.sh

# Tous les tests doivent passer
```

### Tester l'URL externe

```bash
# Sur une machine externe/différente
# Ouvrir: http://172.27.28.14

# Vérifier:
# - Page charge correctement
# - Pas d'erreurs dans la console (F12)
# - WebSocket connecté
# - Données s'affichent correctement
```

---

## Problèmes Courants

### "Cannot GET /"

**Cause:** Frontend n'est pas compilé ou Nginx mal configuré

**Solution:**
```bash
cd /opt/sfiDashMonitoring
npm run build
sudo cp -r dist/* /usr/share/nginx/html/
sudo systemctl restart nginx
```

### "502 Bad Gateway"

**Cause:** Backend n'est pas accessible ou n'a pas démarré

**Solution:**
```bash
sudo systemctl status sfiDashMonitoring-backend
sudo journalctl -u sfiDashMonitoring-backend -n 50
sudo systemctl restart sfiDashMonitoring-backend
```

### WebSocket ne fonctionne pas

**Cause:** Configuration Nginx ou backend

**Solution:**
```bash
# Vérifier la config Nginx
sudo nginx -T | grep socket.io

# Vérifier le backend écoute sur 3001
sudo netstat -tlnp | grep 3001

# Redémarrer
sudo systemctl restart sfiDashMonitoring-backend nginx
```

### Elasticsearch indisponible

**Cause:** Certificat ou connexion

**Solution:**
```bash
# Tester
curl -k --user stgSFI:Police2405$ https://172.27.28.14:9200

# Vérifier le certificat
ls -la /opt/sfiDashMonitoring/backend/certs/http_ca.crt

# Vérifier la config
grep ES_ /opt/sfiDashMonitoring/backend/.env

# Redémarrer backend
sudo systemctl restart sfiDashMonitoring-backend
```

---

## Contacts et Support

- **Logs:** `sudo journalctl -u sfiDashMonitoring-backend -f`
- **Configuration:** `/opt/sfiDashMonitoring/backend/.env`
- **Nginx:** `/etc/nginx/nginx.conf`
- **Systemd:** `/etc/systemd/system/sfiDashMonitoring-backend.service`

---

## Résumé de la Checklist

- [ ] Services actifs (backend, Nginx)
- [ ] Frontend accessible sur http://localhost
- [ ] Backend API accessible
- [ ] WebSocket fonctionne
- [ ] Elasticsearch accessible
- [ ] Secrets JWT générés et configurés
- [ ] Pare-feu configuré (si applicable)
- [ ] Backups en place
- [ ] Logs vérifiés
- [ ] Accès externe fonctionnel (http://172.27.28.14)
- [ ] Vérification complète réussie

**Déploiement prêt pour la production!**
