# 🚀 SFI Dashboard Monitoring

**Plateforme de monitoring des données Fortigate depuis Elasticsearch**

## 📋 Structure

| Composant | Technologie |
|-----------|-------------|
| **Base de données** | Elasticsearch |
| **Frontend** | React 19 + Material-UI |
| **Backend** | Node.js + Express |
| **Real-time** | Socket.io |

---

## 🎯 Deux modes de déploiement

### 1. 🖥️ Mode LOCAL (Développement sur votre machine)

Accessible uniquement en localhost.

```bash
cd local
./start.sh
# Frontend: http://localhost:5173
# Backend: http://localhost:3001
```

**Idéal pour:** Développement, débogage, tests locaux

📖 **Documentation:** [`local/README.md`](./local/README.md)

---

### 2. 🌐 Mode DEPLOYED (Ubuntu Server + Réseau)

Frontend accessible depuis autres machines du réseau. Pas d'interface graphique sur le serveur.

```bash
cd deployed
export SERVER_IP=192.168.1.100
./start.sh
# Frontend: http://192.168.1.100
# Backend: http://192.168.1.100:3001
```

**Idéal pour:** Production, serveur Ubuntu, accès réseau

📖 **Documentation:** [`deployed/README.md`](./deployed/README.md)

---

## 🚀 Démarrage rapide

---

## 📦 Prérequis

- **Node.js** ≥ 16
- **npm** ≥ 8
- **Elasticsearch** (accessible)
- **Pour mode deployed:** Docker ou Ubuntu 20.04+

---

## 🔧 Configuration

### Backend `.env`

```bash
# Copier et adapter
cp backend/envDefault backend/.env

# Variables importantes:
ES_NODE=https://192.168.1.50:9200        # Adresse Elasticsearch
ES_USERNAME=elastic
ES_PASSWORD=votre_mot_de_passe
PORT=3001
FRONTEND_URL=http://localhost:5173        # Pour CORS
```

### Frontend `.env` (auto-générés)

- **LOCAL:** `local/.env.local` avec `localhost:3001`
- **DEPLOYED:** `deployed/.env.production` avec IP du serveur

---

## 📂 Structure des dossiers

```
sfiDashMonitoring/
├── 📁 local/                    ← Mode développement (localhost)
│   ├── start.sh                 ← Démarrer services
│   ├── test.sh                  ← Tester configuration
│   ├── configure.sh             ← Initialiser
│   └── README.md                ← Docs LOCAL
│
├── 📁 deployed/                 ← Mode production (réseau)
│   ├── docker-compose.yml       ← Orchestration Docker
│   ├── Dockerfile.backend       ← Image backend
│   ├── Dockerfile.frontend      ← Image frontend
│   ├── nginx.conf               ← Configuration Nginx
│   ├── .env.production          ← Template env
│   ├── start.sh                 ← Démarrer avec Docker
│   ├── health-check.sh          ← Vérifier services
│   ├── sfiDashMonitoring-*.service ← Systemd units
│   └── README.md                ← Docs DEPLOYED
│
├── 📁 backend/                  ← Code backend (partagé)
├── 📁 src/                      ← Code React (partagé)
├── package.json                 ← Dépendances (partagé)
└── README.md                    ← Ce fichier
```

---

## 🚀 Commandes rapides

### Mode LOCAL

```bash
cd local
./configure.sh      # Setup (première utilisation)
./start.sh          # Démarrer
./test.sh           # Tester
```

### Mode DEPLOYED

```bash
cd deployed
export SERVER_IP=192.168.1.100
./start.sh          # Démarrer avec Docker
./health-check.sh   # Vérifier services
```

---

## 🎨 Fonctionnalités

- ✅ Dashboard temps réel avec WebSocket
- ✅ Monitoring Elasticsearch
- ✅ Alertes haute bande passante
- ✅ Rapports Top 20 consommateurs
- ✅ Authentification JWT
- ✅ Responsive Material-UI
- ✅ Support offline avec fallbacks

---

## 📚 Documentation complète

| Document | Contenu |
|----------|---------|
| `LOCALHOST_CONFIG.md` | Configuration localhost détaillée |
| `Deployment.md` | Guide déploiement avancé |
| `local/README.md` | Mode développement |
| `deployed/README.md` | Mode production |

---

## 👥 Équipe

**Frontend:**
- Koloina (@koulienathalie)

**Backend:**
- josoavj (@josoavj)
- haritsimba (@haritsimba)

---

## 🔗 Projets liés

- [elasticsearch-nodejs-server](https://github.com/josoavj/elasticsearch-nodejs-server) - Tests intégration
- [elasticsearch-config](https://github.com/josoavj/elasticsearch-config) - Configuration ES

---

## 📄 License

MIT

---

## 🆘 Support

Problème? 
1. Consultez la documentation du mode que vous utilisez
2. Vérifiez les logs: `tail -f logs/*.log`
3. Ouvrez une issue avec les logs


### 📃 Licence

This project can be used as a personal project. If you'd like to contribute, please contact one of the current contributors.
