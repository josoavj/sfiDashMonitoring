# Deployment & améliorations avancées

Ce document décrit, pas à pas, trois améliorations / tâches d'exploitation importantes (A, B, C) que vous avez demandées. Chaque section contient : but, modifications côté backend, modifications côté frontend, tests, et conseils de mise en production.

---

## A) Remplacer le polling per‑IP par socket rooms (push per‑IP)

But : réduire la charge Elasticsearch et améliorer la latence/économie réseau en poussant les mises à jour par IP uniquement aux clients intéressés.

1) Idées principales

- Le backend (logService) émet actuellement des événements globaux (`bandwidth`, `top-bandwidth`). Pour la vue per‑IP, implémentez :
  - un message d'abonnement provenant du client : `socket.emit('subscribe-ip', { ip })`
  - côté serveur, `socket.join('ip:<ip>')` et envoyer les mises à jour ciblées sur cette room : `io.to('ip:<ip>').emit('ip-bandwidth', payload)`
  - message de désabonnement : `socket.emit('unsubscribe-ip', { ip })` → `socket.leave('ip:<ip>')`

2) Backend – modifications (Express + Socket.IO)

- Dans votre service qui calcule les agrégats (ex : `logService`), ajoutez :

  - un mapping léger en mémoire ou cache pour les IPs « actives » (optionnel).
  - à chaque cycle, exécutez les agrégations par IP seulement pour les IPs abonnées (éviter de lancer un énorme agg sur toutes les IPs). Par exemple :

    - collecter la liste des rooms (ou des IPs abonnées) : `const rooms = Array.from(io.sockets.adapter.rooms.keys())` puis filtrer les clés `ip:<ip>`
    - pour chaque IP, lancer une requête d'agrégation limitée (`term` sur ip + date_histogram) ou utiliser `filter` + `sum` sur les champs pertinents
    - émettre le delta sur la room : `io.to('ip:1.2.3.4').emit('ip-bandwidth', { ip: '1.2.3.4', sentBytes, recvBytes, timestamp })`

3) Frontend – modifications

- Lorsqu'un utilisateur sélectionne une IP dans `IpView`, au lieu de démarrer un polling HTTP lourd :

  - `socket.emit('subscribe-ip', { ip })`
  - écouter `socket.on('ip-bandwidth', handler)` et mettre à jour le graphique/table
  - lors de la fermeture du modal / changement d'IP : `socket.emit('unsubscribe-ip', { ip })`

4) Sécurité & robustesse

- Limiter le nombre maximum d'IP par socket (ex : maxSubscriptions=10). Rejeter côté backend si dépassement.
- Authentifier la socket (JWT / session) et vérifier les droits avant d'autoriser le join.
- Faire un fallback : si le server est incapable d'agréger par IP (charge), retourner un message au client et retomber sur polling léger.

5) Tests

- Écrire un petit script Node qui crée une socket, `subscribe-ip`, et vérifie la réception d'au moins N événements dans un intervalle.
- Mesurer la latence et la charge ES (opérations/minute) avant/après.

---

## B) Déploiement production — build frontend + nginx + TLS (exemple)

But : servir le frontend buildé via nginx, proxy_pass les API et websocket vers le backend, gérer TLS et run as services.

1) Build frontend

```bash
cd frontend
npm ci
npm run build    # crée ./dist
```

2) Configuration nginx (exemple minimal)

Fichier `/etc/nginx/sites-available/sfidash` :

```nginx
server {
  listen 80;
  server_name example.com;

  root /var/www/sfidash/dist; # emplacement du build
  index index.html;

  # Servir les assets statiques
  location / {
    try_files $uri $uri/ /index.html;
  }

  # Proxy API
  location /api/ {
    proxy_pass http://127.0.0.1:3001/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 90;
  }

  # Websocket proxy (si vous utilisez socket.io)
  location /socket.io/ {
    proxy_pass http://127.0.0.1:3001/socket.io/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

3) Gérer TLS (Certbot)

- Installer certbot et obtenir un certificat :

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d example.com
```

4) Systemd

- Utilisez le template `deploy/sfiDashMonitoring.service` (présent dans le repo) pour exécuter le backend via systemd. Exemple simplifié :

```ini
[Unit]
Description=sfiDashMonitoring backend
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/sfidash
ExecStart=/usr/bin/node backend/server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

5) Superviser et mise à l'échelle

- Configurez journald / logrotate pour les logs Node et nginx.
- Sur charge plus importante : envisager un load-balancer + plusieurs instances backend (avec sticky-sessions ou token-auth pour websockets), ou une file d'événements (Redis/pubsub) pour scaler Socket.IO.

---

## C) Refresh tokens & sécurité de session

But : améliorer la sécurité des tokens d'accès et la résilience de l'authentification (tokens courts + refresh token long et stocké en cookie HttpOnly).

1) Principes

- Token d'accès (JWT) : courte durée (ex : 1–15 minutes).
- Refresh token : longue durée (ex : 7–30 jours). Stocké en cookie HttpOnly, Secure, SameSite=strict (ou Lax selon besoins).
- Rotation des refresh tokens : à chaque `/auth/refresh` émettre un nouveau refresh token et révoquer l'ancien (stocker un hash côté serveur).

2) Backend – endpoints à ajouter

- POST `/auth/login` : renvoie AccessToken (body) et installe RefreshToken en cookie HttpOnly.
- POST `/auth/refresh` : lis le cookie RefreshToken, vérifie en DB (ou blacklist), renvoie un nouveau AccessToken et refresh token (mise à jour du cookie).
- POST `/auth/logout` : supprime le cookie refresh et révoque le refresh token côté serveur.

3) Stockage

- Stocker les refresh tokens hachés dans la table `Sessions` (existant dans le repo). Inclure : userId, refreshTokenHash, expiresAt, deviceInfo, lastSeen.

4) Sécurité et CSRF

- Cookie HttpOnly + Secure + SameSite=strict réduit le risque XSS/CSRF. Pour les navigateurs où SameSite empêche le refresh, vous pouvez utiliser la stratégie double submit cookie (envoyer aussi un header X-CSRF-Token obtenu via endpoint sécurisé), ou stocker le refresh token en HttpOnly et exiger un CSRF token pour les actions sensibles.
- Toujours exiger HTTPS en production.

5) Exemple d'implémentation (Express)

- À la réception d'un login valide :

```js
// pseudo-code
const accessToken = signAccessToken(user);
const refreshToken = randomToken();
await Sessions.create({ userId: user.id, refreshHash: hash(refreshToken), expiresAt: ... });
res.cookie('refresh', refreshToken, { httpOnly: true, secure: true, sameSite: 'Strict', maxAge: 30*24*3600*1000 });
res.json({ accessToken });
```

Route `/auth/refresh` :

```js
const incoming = req.cookies.refresh;
const session = await Sessions.findByHash(hash(incoming));
if (!session) return res.status(401).end();
// rotate
const newRefresh = randomToken();
session.update({ refreshHash: hash(newRefresh), expiresAt: ... });
res.cookie('refresh', newRefresh, { httpOnly: true, secure: true, sameSite: 'Strict' });
res.json({ accessToken: signAccessToken(user) });
```

6) Tests & Migration

- Tester le flux complet (login → accès → refresh → requisition) en local via HTTPS (nginx + self-signed pour test).
- Ajouter une page d'administration pour lister et révoquer sessions (utile en cas de compromission).

---

## Checklist avant mise en production

- [ ] Tester le fallback si Socket rooms échouent (retour au polling léger)
- [ ] Mettre en place monitoring ES (opcount, latence) et alertes
- [ ] Configurer backups/restore pour ES et les sessions (si besoin)
- [ ] Examiner les en-têtes de sécurité sur nginx (HSTS, X-Frame-Options, CSP minimal)

---

Si vous voulez, je peux :

- implémenter la logique Socket.IO rooms côté backend et un petit client d'exemple (A).
- générer un exemple automatisé de déploiement (Ansible / Docker Compose) pour B.
- fournir les endpoints Express complets et les tests unitaires pour le refresh token (C).

Indiquez la priorité (A, B ou C) et je commence l'implémentation.
