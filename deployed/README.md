# 🚀 SFI Dashboard - Production Deployment

Mode DEPLOYED pour Ubuntu Server. Frontend accessible depuis le réseau, sans interface graphique sur le serveur.

## 📍 Architecture

```
Ubuntu Server (192.168.1.100)
├── Docker Container: Backend API (port 3001)
└── Docker Container: Frontend (Nginx port 80)

Accès depuis autres machines:
├── Frontend: http://192.168.1.100
├── Backend API: http://192.168.1.100:3001
└── WebSocket: ws://192.168.1.100:3001
```

## ⚡ Démarrage rapide

### Option 1: Docker Compose (Recommandé)

```bash
cd deployed

# Configurer l'IP du serveur
export SERVER_IP=192.168.1.100

# Démarrer les services
docker-compose up -d

# Vérifier le statut
docker-compose ps

# Voir les logs
docker-compose logs -f
```

### Option 2: Systemd (Serveur Ubuntu)

```bash
# Copier les service files
sudo cp deployed/sfiDashMonitoring-*.service /etc/systemd/system/

# Recharger systemd
sudo systemctl daemon-reload

# Démarrer les services
sudo systemctl start sfiDashMonitoring-backend
sudo systemctl start sfiDashMonitoring-frontend

# Statut
sudo systemctl status sfiDashMonitoring-backend
sudo systemctl status sfiDashMonitoring-frontend

# Enable au démarrage
sudo systemctl enable sfiDashMonitoring-backend
sudo systemctl enable sfiDashMonitoring-frontend
```

## 🔧 Configuration

### Définir l'adresse IP du serveur

```bash
# Pour Docker
export SERVER_IP=192.168.1.100
export SERVER_HOSTNAME=sfi-monitoring

# Ou éditer .env.production
nano .env.production
```

### Variables d'environnement

- `SERVER_IP`: Adresse IP accessible depuis le réseau
- `SERVER_HOSTNAME`: Nom d'hôte (optionnel)
- `BACKEND_PORT`: Port backend (défaut: 3001)
- `FRONTEND_PORT`: Port frontend (défaut: 80)

## 🧪 Tests

```bash
./health-check.sh

# Ou manuellement
curl http://192.168.1.100          # Frontend
curl http://192.168.1.100:3001     # Backend
```

## 📋 Logs

### Docker
```bash
docker-compose logs -f backend       # Logs backend
docker-compose logs -f frontend      # Logs nginx
```

### Systemd
```bash
journalctl -u sfiDashMonitoring-backend -f
journalctl -u sfiDashMonitoring-frontend -f
```

## 🆘 Dépannage

### Port déjà utilisé?

```bash
lsof -i :80        # Frontend
lsof -i :3001      # Backend
netstat -tlnp      # Tous les ports
```

### WebSocket ne fonctionne pas?

Vérifier que `SERVER_IP` est correctement configuré et accessible depuis le réseau.

### Accès réseau depuis autre machine?

```bash
# Depuis une autre machine du réseau
curl http://192.168.1.100
curl http://192.168.1.100:3001

# Vérifier la firewall
sudo ufw allow 80
sudo ufw allow 3001
sudo ufw enable
```

## 📚 Documentation complète

Voir `../LOCALHOST_CONFIG.md` pour configuration détaillée.
