# 🛡️ Fortigate Monitor Dashboard

> Tableau de bord de monitoring en temps réel pour les logs Fortigate via Elasticsearch avec WebSocket

![License](https://img.shields.io/badge/license-ISC-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-18.2.0-61dafb.svg)

## 📋 Table des matières

- [Aperçu](#-aperçu)
- [Fonctionnalités](#-fonctionnalités)
- [Architecture](#-architecture)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Utilisation](#-utilisation)
- [API Documentation](#-api-documentation)
- [Dépannage](#-dépannage)
- [Performance](#-performance)
- [Sécurité](#-sécurité)
- [Contribution](#-contribution)

## 🎯 Aperçu

Fortigate Monitor est une solution complète de monitoring en temps réel pour les logs de pare-feu Fortigate stockés dans Elasticsearch. L'interface offre une visualisation interactive avec des graphiques, des statistiques et une surveillance en direct via WebSocket.

### Captures d'écran

- **Dashboard principal** : Vue d'ensemble avec KPIs
- **Bande passante** : Graphiques de consommation réseau
- **Sécurité** : Analyse des menaces et IPs bloquées
- **Logs live** : Flux en temps réel des événements

## ✨ Fonctionnalités

### 🔴 Monitoring en temps réel
- ✅ WebSocket pour les mises à jour instantanées (< 2 secondes)
- ✅ Notification sonore optionnelle sur nouveaux événements
- ✅ Animation visuelle des nouveaux logs
- ✅ Compteur de logs reçus en temps réel

### 📊 Analyse de bande passante
- ✅ Graphiques temporels de consommation
- ✅ Top 10 consommateurs de bande passante
- ✅ Calcul automatique des débits (bps, Kbps, Mbps, Gbps)
- ✅ Agrégations par période configurable

### 🔒 Sécurité
- ✅ Détection des connexions bloquées/autorisées
- ✅ Top IPs sources malveillantes
- ✅ Statistiques par type d'action (allow, deny, drop)
- ✅ Graphiques de distribution des événements

### 🌐 Analyse réseau
- ✅ Répartition par protocole (TCP, UDP, ICMP, etc.)
- ✅ Top ports de destination
- ✅ Applications réseau détectées
- ✅ Statistiques de connexions

### 🔍 Recherche avancée
- ✅ Syntaxe Elasticsearch Query String
- ✅ Filtres temporels (15m, 1h, 6h, 24h, 7j)
- ✅ Recherche dans tous les champs
- ✅ Export des résultats

### 🎨 Interface moderne
- ✅ Design responsive (mobile/tablet/desktop)
- ✅ Thème sombre optimisé
- ✅ Graphiques interactifs avec Recharts
- ✅ Navigation par onglets
- ✅ Indicateurs de statut en temps réel

## 🏗️ Architecture

```
┌─────────────────┐
│   Fortigate     │
│    Firewall     │
└────────┬────────┘
         │ Logs
         ▼
┌─────────────────┐
│    Filebeat     │
│   (Shipper)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐       WebSocket        ┌─────────────────┐
│ Elasticsearch   │◄──────────────────────►│  Backend API    │
│   (Storage)     │      REST API          │  (Node.js)      │
└─────────────────┘                        └────────┬────────┘
                                                    │
                                                    ▼
                                           ┌─────────────────┐
                                           │  Frontend UI    │
                                           │   (React)       │
                                           └─────────────────┘
```

### Stack technique

**Backend**
- Node.js 18+
- Express.js
- Socket.IO (WebSocket)
- @elastic/elasticsearch 8.x
- dotenv

**Frontend**
- React 18
- Vite (Build tool)
- Recharts (Graphiques)
- Tailwind CSS (Styling)
- Lucide React (Icons)
- Socket.IO Client

**Infrastructure**
- Elasticsearch 8.x
- Filebeat 8.x
- Fortigate Firewall

## 📦 Prérequis

### Logiciels requis

```bash
# Node.js >= 18.0.0
node --version

# npm >= 9.0.0
npm --version

# Elasticsearch >= 8.0.0 (avec Filebeat configuré)
curl -X GET "localhost:9200"
```

### Accès réseau

- Elasticsearch accessible (port 9200 par défaut)
- Ports locaux disponibles : 3000 (frontend), 3001 (backend)

### Certificat SSL

Si Elasticsearch utilise HTTPS avec certificat auto-signé :
- Fichier `http_ca.crt` disponible
- Ou fingerprint du certificat
- Ou désactivation SSL pour dev uniquement

## 🚀 Installation

### 1. Cloner ou extraire le projet

```bash
cd ~/Projets/sfiDashMonitoring/fortigate-monitor
```

### 2. Installation automatique (recommandé)

```bash
# Installer toutes les dépendances (backend + frontend)
npm run install:all
```

### 3. Installation manuelle

```bash
# Installer concurrently à la racine
npm install

# Backend
cd back
npm install
cd ..

# Frontend
cd frontend
npm install
cd ..
```

## ⚙️ Configuration

### 1. Configuration Backend

Créez le fichier `back/.env` :

```env
# ============================================
# ELASTICSEARCH CONFIGURATION
# ============================================
ES_NODE=https://172.27.28.14:9200
ES_USERNAME=elastic
ES_PASSWORD=votre_mot_de_passe
ES_INDEX=filebeat-*

# ============================================
# SSL CERTIFICATE (choisir UNE option)
# ============================================

# Option 1 : Certificat CA (RECOMMANDÉ pour production)
ES_CERT_PATH=./certs/http_ca.crt

# Option 2 : Désactiver SSL (DEV UNIQUEMENT)
# ES_SSL_VERIFY=false

# Option 3 : Fingerprint du certificat
# ES_FINGERPRINT=AA:BB:CC:DD:EE:FF:11:22:33:44:55:66:77:88:99:00:AA:BB:CC:DD

# ============================================
# SERVER CONFIGURATION
# ============================================
PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### 2. Certificat SSL

```bash
# Créer le dossier certs
mkdir -p back/certs

# Copier le certificat depuis Elasticsearch
cp /chemin/vers/http_ca.crt back/certs/

# Vérifier les permissions
chmod 644 back/certs/http_ca.crt
```

#### Obtenir le certificat depuis Docker

```bash
# Si Elasticsearch tourne dans Docker
docker cp elasticsearch:/usr/share/elasticsearch/config/certs/http_ca.crt back/certs/
```

#### Générer le fingerprint (alternative)

```bash
openssl s_client -connect 172.27.28.14:9200 -showcerts </dev/null 2>/dev/null | \
  openssl x509 -fingerprint -sha256 -noout | \
  cut -d'=' -f2 | tr -d ':'
```

### 3. Configuration Frontend

Le fichier `frontend/vite.config.js` est déjà configuré :

```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})
```

### 4. Vérification de la configuration Filebeat

Assurez-vous que Filebeat est configuré pour envoyer les logs Fortigate à Elasticsearch :

```yaml
# /etc/filebeat/filebeat.yml
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /var/log/fortigate/*.log
  fields:
    log_type: fortigate

output.elasticsearch:
  hosts: ["https://172.27.28.14:9200"]
  username: "elastic"
  password: "password"
  ssl.certificate_authorities: ["/etc/filebeat/certs/http_ca.crt"]
```

## 🎮 Utilisation

### Démarrage rapide

```bash
cd fortigate-monitor

# Méthode 1 : Script shell (recommandé)
./start.sh

# Méthode 2 : NPM scripts
npm run dev

# Méthode 3 : Manuel (2 terminaux)
# Terminal 1
cd back && npm start

# Terminal 2
cd frontend && npm run dev
```

### Accès aux interfaces

Une fois démarré, accédez à :

- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:3001/api/health
- **WebSocket** : ws://localhost:3001

### Tests et diagnostics

```bash
# Tester la connexion Elasticsearch
npm run test:connection

# Analyser les données disponibles
npm run test:data

# Voir les logs backend
tail -f logs/backend.log

# Voir les logs frontend
tail -f logs/frontend.log
```

### Commandes disponibles

```bash
# Développement
npm run dev                 # Démarrer backend + frontend
npm run start:back          # Backend uniquement
npm run start:front         # Frontend uniquement

# Tests
npm run test:connection     # Test connexion ES
npm run test:data           # Analyse des données

# Build et déploiement
npm run build:front         # Build production
npm run preview             # Preview du build

# Maintenance
npm run install:all         # Réinstaller tout
npm run clean               # Nettoyer node_modules
npm run logs                # Voir tous les logs
```

## 📡 API Documentation

### Endpoints REST

#### Health Check
```http
GET /api/health
```

**Réponse :**
```json
{
  "cluster": {
    "status": "green",
    "number_of_nodes": 1
  },
  "elasticsearch": {
    "version": "8.11.0",
    "cluster_name": "elasticsearch"
  },
  "websocket": {
    "connected_clients": 2,
    "streaming_active": true
  }
}
```

#### Recherche de logs
```http
POST /api/search
Content-Type: application/json

{
  "query": "action:deny AND source.ip:192.168.1.*",
  "size": 100,
  "timeRange": {
    "from": "2024-01-01T00:00:00Z",
    "to": "2024-01-01T23:59:59Z"
  }
}
```

#### Statistiques
```http
POST /api/stats
Content-Type: application/json

{
  "timeRange": {
    "from": "2024-01-01T00:00:00Z",
    "to": "2024-01-01T23:59:59Z"
  }
}
```

#### Bande passante
```http
POST /api/bandwidth
Content-Type: application/json

{
  "timeRange": {
    "from": "2024-01-01T00:00:00Z",
    "to": "2024-01-01T23:59:59Z"
  },
  "interval": "5m"
}
```

#### Top consommateurs
```http
POST /api/top-bandwidth
Content-Type: application/json

{
  "timeRange": {
    "from": "2024-01-01T00:00:00Z",
    "to": "2024-01-01T23:59:59Z"
  },
  "size": 10,
  "type": "source"
}
```

#### Événements de sécurité
```http
POST /api/security-events
Content-Type: application/json

{
  "timeRange": {
    "from": "2024-01-01T00:00:00Z",
    "to": "2024-01-01T23:59:59Z"
  }
}
```

### WebSocket Events

#### Client → Serveur

```javascript
// Demander les logs initiaux
socket.emit('request-initial-logs', { 
  timeRange: '1h', 
  size: 100 
});

// Changer l'intervalle de refresh
socket.emit('change-interval', 5); // 5 secondes
```

#### Serveur → Client

```javascript
// Connexion établie
socket.on('connected', (data) => {
  console.log(data.message);
});

// Logs initiaux
socket.on('initial-logs', (data) => {
  console.log(data.logs); // Array de logs
  console.log(data.total); // Total de logs
});

// Nouveaux logs
socket.on('new-logs', (data) => {
  console.log(data.logs);   // Nouveaux logs
  console.log(data.count);  // Nombre de nouveaux logs
  console.log(data.timestamp); // Timestamp
});

// Erreur
socket.on('error', (error) => {
  console.error(error.message);
});
```

## 🐛 Dépannage

### Problème : Backend ne démarre pas

```bash
# Vérifier les logs
cat logs/backend.log

# Erreur commune : Certificat SSL
# Solution : Vérifier ES_CERT_PATH dans .env

# Erreur commune : Port déjà utilisé
# Solution : Changer PORT dans .env
```

### Problème : "No data available" partout

```bash
# Vérifier qu'Elasticsearch a des données
curl -k -u elastic:password https://172.27.28.14:9200/filebeat-*/_count

# Vérifier les champs disponibles
npm run test:data

# Adapter les noms de champs dans server.js si nécessaire
```

### Problème : WebSocket ne se connecte pas

```bash
# Vérifier que le backend écoute
netstat -an | grep 3001

# Vérifier dans la console du navigateur
# Devrait voir : "WebSocket connecté"

# Vérifier CORS
# Dans back/server.js, ligne :
app.use(cors());
```

### Problème : Graphiques vides

Les champs Elasticsearch peuvent varier selon la configuration Filebeat.

**Champs possibles pour la bande passante :**
- `network.bytes`
- `source.bytes` / `destination.bytes`
- `sentbyte` / `rcvdbyte`
- `bytes`

**Solution :** Exécutez `npm run test:data` pour identifier les champs disponibles, puis adaptez `back/server.js`.

### Problème : Erreur CORS

```bash
# Ajouter dans back/server.js
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

## ⚡ Performance

### Optimisations backend

- **Pooling WebSocket** : Les logs sont vérifiés toutes les 2 secondes seulement quand des clients sont connectés
- **Limite de logs** : Buffer de 200 logs maximum en mémoire
- **Agrégations ES** : Utilisation de `size: 0` pour les statistiques
- **Arrêt automatique** : Le streaming s'arrête quand il n'y a plus de clients

### Optimisations frontend

- **React.memo** : Composants optimisés pour éviter les re-renders
- **Debouncing** : Recherche avec délai pour réduire les requêtes
- **Lazy loading** : Chargement progressif des onglets
- **Vite** : Build ultra-rapide en développement

### Recommandations de déploiement

**Pour production :**

```bash
# Build optimisé
cd frontend
npm run build

# Les fichiers sont dans frontend/dist/
# Servir avec nginx ou Apache
```

**Configuration nginx :**

```nginx
server {
    listen 80;
    server_name monitor.example.com;

    # Frontend
    location / {
        root /path/to/fortigate-monitor/frontend/dist;
        try_files $uri /index.html;
    }

    # API Backend
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## 🔐 Sécurité

### Bonnes pratiques

✅ **Ne jamais exposer Elasticsearch directement au public**
✅ Utiliser HTTPS en production
✅ Certificats SSL valides
✅ Authentification forte
✅ Limiter les permissions Elasticsearch
✅ Firewall sur les ports backend
✅ Rate limiting sur l'API
✅ Validation des entrées utilisateur

### Fichiers sensibles

```bash
# Ne JAMAIS committer :
back/.env
back/certs/*.crt
back/certs/*.pem
```

### Configuration Elasticsearch recommandée

Créer un utilisateur dédié avec permissions limitées :

```bash
# Dans Kibana Dev Tools
POST /_security/user/fortigate_monitor
{
  "password" : "secure_password",
  "roles" : [ "fortigate_monitor_role" ]
}

POST /_security/role/fortigate_monitor_role
{
  "indices": [
    {
      "names": [ "filebeat-*" ],
      "privileges": [ "read", "view_index_metadata" ]
    }
  ]
}
```

## 🤝 Contribution

Les contributions sont les bienvenues !

### Workflow

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

### Standards de code

- ESLint pour JavaScript
- Prettier pour le formatage
- Commentaires en français pour la logique métier
- Tests unitaires requis pour les nouvelles fonctionnalités

## 📄 License

ISC License - Voir le fichier LICENSE pour plus de détails

## 👥 Auteurs

- josoavj - Développement initial

## 🙏 Remerciements

- Elastic pour Elasticsearch
- Fortinet pour Fortigate
- La communauté React
- Les contributeurs open-source
