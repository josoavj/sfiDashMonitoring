# 🚀 SFI Dashboard — Déploiement Production

> **Fait le 17 novembre 2025 · Prêt pour la production**

---

## ✅ État des tests locaux

| Composant | Statut | Détails |
|-----------|--------|---------|
| **Frontend** | ✅ OK | React, Vite, Socket.io |
| Source code | ✅ OK | — |
| `vite.config.js` | ✅ OK | — |
| **Backend** | ✅ OK | Express, Socket.io, Elasticsearch, Sequelize |
| `server.js` | ✅ OK | — |
| `.env` | ✅ OK | — |
| Certificat Elasticsearch | ✅ OK | — |

---

## ⚡ Déploiement rapide (5–10 minutes)

### 1. Depuis la machine locale

```bash
scp deployed/install-production.sh user@172.27.28.14:/tmp/
```

### 2. Sur le serveur Ubuntu (`172.27.28.14`)

```bash
ssh user@172.27.28.14
sudo bash /tmp/install-production.sh
```

### Ce que fait le script

- ✓ Installe Node.js 18+, Nginx, Git
- ✓ Crée l'utilisateur `sfi` avec sudo sans password
- ✓ Prépare `/opt/sfiDashMonitoring`
- ✓ Installe les dépendances npm
- ✓ Compile le frontend
- ✓ Configure Nginx
- ✓ Crée le service Systemd
- ✓ Démarre le service

---

## 🔧 Après l'installation

### 1. Configurer les secrets ⚠️ Important

```bash
sudo nano /opt/sfiDashMonitoring/backend/.env
```

Générer deux secrets aléatoires :

```bash
openssl rand -base64 32
```

Remplacer dans le `.env` :

```env
JWT_SECRET=<secret1>
JWT_REFRESH_SECRET=<secret2>
```

### 2. Redémarrer le service

```bash
sudo systemctl restart sfiDashMonitoring-backend
```

### 3. Vérifier l'installation

```bash
sudo bash /opt/sfiDashMonitoring/deployed/check.sh
```

### 4. Accéder à l'application

```
http://172.27.28.14
```

---

## 🛠️ Commandes essentielles

| Action | Commande |
|--------|----------|
| Status | `sudo systemctl status sfiDashMonitoring-backend` |
| Logs temps réel | `sudo journalctl -u sfiDashMonitoring-backend -f` |
| Derniers logs (50) | `sudo journalctl -u sfiDashMonitoring-backend -n 50` |
| Redémarrer | `sudo systemctl restart sfiDashMonitoring-backend` |
| Arrêter | `sudo systemctl stop sfiDashMonitoring-backend` |
| Démarrer | `sudo systemctl start sfiDashMonitoring-backend` |

**Vérification complète :**

```bash
sudo bash /opt/sfiDashMonitoring/deployed/check.sh
```

**Mise à jour future :**

```bash
sudo bash /opt/sfiDashMonitoring/deployed/update-production.sh
```

---

## 🏗️ Architecture

| Élément | Valeur |
|---------|--------|
| Utilisateur système | `sfi` (sudo sans password) |
| Répertoire | `/opt/sfiDashMonitoring` |
| Frontend | Nginx — port **80** |
| Backend | Node.js — port **3001** (interne via Nginx) |
| Elasticsearch | `172.27.28.14:9200` (accès externe) |
| Accès navigateur | `http://172.27.28.14` |

---

## 🆘 Résolution de problèmes

### Backend ne démarre pas

```bash
sudo journalctl -u sfiDashMonitoring-backend -n 50
sudo systemctl restart sfiDashMonitoring-backend
```

### Erreur 502 Bad Gateway

```bash
sudo systemctl status sfiDashMonitoring-backend
sudo netstat -tlnp | grep 3001
```

### WebSocket ne fonctionne pas

```bash
sudo systemctl restart nginx
```

### Elasticsearch indisponible

```bash
curl -k --user stgSFI:Police2405$ https://172.27.28.14:9200
```
