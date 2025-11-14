<h1 align="center">SFI Monitoring Platform</h1>

<p align="center">
  <strong>Une plateforme de monitoring des données de la pare-feu Fortigate venant d'elasticsearch</strong>
</p>

<p align="center">
  <!-- Badges -->
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License">
  <img src="https://img.shields.io/github/last-commit/josoavj/sfiDashMonitoring" alt="Last Commit">
  <img src="https://img.shields.io/github/stars/josoavj/sfiDashMonitoring?style=social" alt="GitHub Stars">
</p>

### A propos

- **Description :** Plateforme de monitoring des journaux, venant d'un pare-feu Fortigate. 
- **Structure :**
    - **Base de données :** elasticsearch
    - **Front-end :** ReactJS
    - **Back-end :** NodeJS (ExpressJS)

### Démarrage rapide (développement)

Ces instructions expliquent comment lancer le projet en développement depuis la racine du dépôt.

Prérequis : Node.js (>=16), npm.

1) Installer les dépendances et démarrer l'ensemble (script centralisé `start.sh`)

```fish
# Exemple (fish shell) : définir des variables d'environnement puis lancer
set -x FRONTEND_DOMAIN "localhost"
set -x FRONTEND_PORT 5173
set -x BACKEND_PORT 3001
./start.sh
```

Le script `start.sh` :
- installe les dépendances si nécessaire
- démarre le backend (Node) en utilisant `backend/server.js` sur le port indiqué
- démarre le frontend (Vite) sur 0.0.0.0 (accessible depuis le réseau)

Logs : `./logs/backend.log` et `./logs/frontend.log`.

2) Accéder à l'interface

- Ouvrez : http://<IP_MACHINE>:5173

### Notes de configuration

- Copiez `backend/envDefault` → `backend/.env` et adaptez les valeurs (Elasticsearch, secrets).
- Variables utiles : `FRONTEND_URL` (utilisée côté backend pour CORS/socket), `PORT`/`HOST` (backend).

### Démarrage et déploiement (production)

Le script `start.sh` est pratique pour le développement. Pour la production, il est recommandé de :

1) Builder le frontend :

```bash
cd frontend
npm ci
npm run build
```

2) Servir le dossier `dist/` avec nginx (ou tout serveur statique) et proxy_pass `/api` et les websockets vers le backend Node (exemples dans `Deployment.md`).

3) Utiliser le template systemd présent dans `deploy/` pour lancer le backend comme service et laisser nginx servir le front et agir de reverse-proxy.

### Documentation et étapes avancées

Pour les étapes complètes et prescriptives (A/B/C) — rempla cement du polling per‑IP par socket rooms, configuration nginx + TLS, et stratégie de refresh tokens/cookies sécurisés — voir le fichier `Deployment.md` à la racine du projet.

---

Merci de contribuer ! Si vous rencontrez un souci, ouvrez une issue avec le log (logs/backend.log).
### ✨ Fonctionnalités

### 👥 Équipe

- Front-end :
    - [Koloina](https://github.com/koulienathalie)
- Back-end :
    - [josoavj](https://github.com/josoavj)
    - [haritsimba](https://github.com/haritsimba)

### Autres

- Test d'intégration NodeJS vers elasticsearch : [nodeServerToElasticsearch](https://github.com/josoavj/elasticsearch-nodejs-server)
- Configuration d'elasticsearch : [basicConf](https://github.com/josoavj/elasticsearch-config)

### 📃 Licence

This project can be used as a personal project. If you'd like to contribute, please contact one of the current contributors.
