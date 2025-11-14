# Backend 

Ce dossier contient le backend Node.js réorganisé en modules (src/services, src/routes, src/utils).

Usage rapide:

1. Copier `.env` depuis `envDefault` et adapter les variables (ES_NODE, ES_USERNAME, ES_PASSWORD, ES_CERT_PATH, PORT, FRONTEND_URL...)

2. Installer les dépendances (depuis le dossier racine du projet si le `package.json` principal couvre tout) ou depuis `backend`:

```bash
# depuis fish shell
cd backend
npm install
npm run dev # ou npm start
```

3. Le point d'entrée est `server.js` (qui délègue vers `src/server.js`).

Notes:
- Le client Elasticsearch est centralisé dans `src/services/esClient.js`.
- Le polling et l'émission WebSocket sont dans `src/services/logService.js`.
- Les endpoints REST sont montés via `src/routes/api.js`.
- Le fichier `envDefault` contient une configuration d'exemple.

Pour toute amélioration : tests, types (TypeScript), séparation plus fine des controllers, ou authentification, je peux proposer un plan détaillé.

```

