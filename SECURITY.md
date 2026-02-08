# 🔒 Guide de Sécurité - SFI Dashboard

> **Phase 1 - Phases de sécurité implémentées**

## 📋 Table des matières

1. [Authentification JWT](#authentification-jwt)
2. [Refresh Token Rotation](#refresh-token-rotation)
3. [CSRF Protection](#csrf-protection)
4. [Cookie Security](#cookie-security)
5. [Rate Limiting](#rate-limiting)
6. [Variables d'environnement](#variables-denvironnement)
7. [Déploiement sécurisé](#déploiement-sécurisé)

---

## Authentification JWT

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (React)                                       │
├─────────────────────────────────────────────────────────┤
│  1. Login (email, password)                             │
│     ↓                                                   │
│  2. POST /auth/signin                                  │
│     ← { accessToken, user }                            │
│     ← Cookie: refreshToken (HttpOnly, Secure)          │
│     ↓                                                   │
│  3. Store accessToken in memory                        │
│  4. Use Authorization: Bearer <token> for requests     │
│                                                         │
│  [Auto-refresh before expiration]                      │
│  POST /auth/refresh (credentials: 'include')           │
│  ← { accessToken, user }                               │
│  ← New refreshToken cookie                             │
└─────────────────────────────────────────────────────────┘
```

### Tokens

#### Access Token
- **Durée:** 15 minutes
- **Stockage:** mémoire (état React)
- **Utilisation:** Header `Authorization: Bearer <token>`
- **Contenu:** `{ sub, email, name, iat, exp }`

#### Refresh Token
- **Durée:** 7 jours
- **Stockage:** HttpOnly Cookie (pas accessible en JS)
- **Utilisation:** Automatique via `credentials: 'include'`
- **Contenu:** `{ sub, iat, exp }`
- **BD:** Stocké en tant que **hash SHA256**, pas en clair

### Implémentation Frontend

```javascript
// Tokens sécurisés - pas d'XSS possible
const [user, setUser] = useState(null)  // Access token en mémoire
// Refresh token en cookie HttpOnly (inaccessible en JS)

// Login
const { data } = await fetch('/auth/signin', {
  credentials: 'include'  // ← Recevoir le cookie
})
localStorage.setItem('accessToken', data.accessToken)

// Requests avec token
fetch('/api/data', {
  headers: { 'Authorization': `Bearer ${user.accessToken}` },
  credentials: 'include'  // ← Envoyer le refresh cookie
})
```

### Implémentation Backend

```javascript
// JWT_SECRET et JWT_REFRESH_SECRET doivent être définis
require('dotenv').config()

const JWT_SECRET = process.env.JWT_SECRET
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET

// Tokens signés avec secrets forts
const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' })
const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' })
```

---

## Refresh Token Rotation

### Concept

Pour éviter les attaques par **token replay**, les refresh tokens sont:

1. **Générés uniques** à chaque refresh
2. **Hachés avant stockage** (SHA256)
3. **Comparés en BD** à chaque utilisation
4. **Remplacés** après chaque refresh

### Flux

```
Client envie /auth/refresh avec cookie refreshToken
↓
Backend reçoit le token → hash(token) → cherche en BD
↓
Si hash trouvé et pas expiré:
  - Nouveau accessToken généré
  - Nouveau refreshToken généré
  - Nouveau hash stocké en BD
  - Cookie avec nouveau token envoyé
↓
Si hash pas trouvé ou expiré:
  - 401 Unauthorized → Logout côté client
```

### Code Backend

```javascript
// Hash le token
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

// Refresh endpoint
exports.refresh = async (req, res) => {
  const incomingToken = req.cookies.refreshToken
  const incomingHash = hashToken(incomingToken)
  
  // Vérifier le hash en BD (jamais comparer les tokens en clair)
  const session = await Session.findOne({
    where: { refreshTokenHash: incomingHash, revoked: false }
  })
  
  if (!session) return res.status(401).json({ error: 'Token invalide' })
  
  // Générer nouvel access token
  const newAccessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' })
  
  // Générer nouveau refresh token (rotation)
  const newRefreshToken = jwt.sign({ sub: userId }, JWT_REFRESH_SECRET, { expiresIn: '7d' })
  const newRefreshHash = hashToken(newRefreshToken)
  
  // Mettre à jour la session
  await session.update({ refreshTokenHash: newRefreshHash })
  
  // Envoyer le nouveau token en cookie
  res.cookie('refreshToken', newRefreshToken, getCookieOptions())
  res.json({ accessToken: newAccessToken })
}
```

---

## CSRF Protection

### Implémentation

Double submit token (CSRF token dans header):

#### 1. GET /api/csrf-token - Obtenir le token
```javascript
app.get('/api/csrf-token', (req, res) => {
  const token = crypto.randomBytes(32).toString('hex')
  res.cookie('XSRF-TOKEN', token, {
    httpOnly: false,  // ← Doit être lisible en JS
    sameSite: 'Strict',
    maxAge: 3600000   // 1 heure
  })
  res.json({ token })
})
```

#### 2. Frontend - Envoyer le token
```javascript
// 1. Obtenir le token au chargement
const { token } = await fetch('/api/csrf-token').then(r => r.json())

// 2. L'envoyer dans le header de chaque POST/PUT/DELETE
fetch('/api/data', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': token,  // ← Depuis localStorage ou état
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify(data),
  credentials: 'include'
})
```

#### 3. Backend - Vérifier le token
```javascript
function verifyCsrfToken(req, res, next) {
  const csrfToken = req.headers['x-csrf-token']
  const csrfCookie = req.cookies['XSRF-TOKEN']
  
  if (csrfToken !== csrfCookie) {
    return res.status(403).json({ error: 'CSRF token invalide' })
  }
  next()
}

// Appliquer au routes sensibles
app.post('/api/data', verifyCsrfToken, authenticate, handler)
```

---

## Cookie Security

### Options HTTP Only Cookie

```javascript
{
  httpOnly: true,          // ✅ Non accessible en JS (XSS safe)
  secure: true,            // ✅ HTTPS seulement (en prod)
  sameSite: 'Strict',      // ✅ Pas d'envoi cross-site (CSRF safe)
  maxAge: 7 * 24 * 3600 * 1000,  // 7 jours
  path: '/',
  domain: 'app.example.com'  // Production seulement
}
```

### Sécurité
- **HttpOnly:** Empêche XSS (pas d'accès `document.cookie`)
- **Secure:** Envoie uniquement sur HTTPS
- **SameSite=Strict:** Pas d'envoi dans les requêtes cross-site (CSRF)

### Développement vs Production

```javascript
// Development
{
  httpOnly: true,
  sameSite: 'Strict',
  secure: false  // HTTP autorisé
}

// Production
{
  httpOnly: true,
  sameSite: 'Strict',
  secure: true,  // HTTPS obligatoire
  domain: 'app.example.com'
}
```

---

## Rate Limiting

### Auth Endpoints
- **Limite:** 5 tentatives par 15 minutes
- **Message:** "Trop de tentatives, réessayez dans 15 minutes"

```javascript
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Trop de tentatives, réessayez dans 15 minutes'
})

app.post('/auth/signin', authLimiter, signIn)
app.post('/auth/signup', authLimiter, signUp)
```

### Refresh Endpoint
- **Limite:** 10 tentatives par minute
- **Raison:** Plus permissif (auto-refresh fréquent)

```javascript
const refreshLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Trop de tentatives de refresh'
})

app.post('/auth/refresh', refreshLimiter, refresh)
```

### API Endpoints
```javascript
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,  // 100 requêtes par minute
  skip: req => req.user?.role === 'admin'
})

app.get('/api/data', authenticate, apiLimiter, handler)
```

---

## Variables d'environnement

### Génération des secrets
```bash
# Générer JWT_SECRET (utilisé pour signer les access tokens)
openssl rand -base64 32
# Exemple: abc123...xyz= (43 caractères)

# Générer JWT_REFRESH_SECRET (utilisé pour signer les refresh tokens)
openssl rand -base64 32
# Exemple: def456...uvw= (43 caractères)
```

### Backend .env (à ne JAMAIS commiter)
```bash
# ===== SECURITY =====
NODE_ENV=production
JWT_SECRET=<votre_secret_fort_32_chars>       # ✅ Généré ci-dessus
JWT_REFRESH_SECRET=<votre_autre_secret>       # ✅ Différent du premier

# ===== ELASTICSEARCH =====
ES_NODE=https://elasticsearch.example.com:9200
ES_USERNAME=elastic
ES_PASSWORD=<votre_mdp_elasticsearch>
ES_CERT_PATH=/path/to/ca.crt
ES_TIMEOUT=30000

# ===== DATABASE =====
DB_HOST=localhost
DB_USER=sfi_user
DB_PASSWORD=<votre_mdp_db>
DB_NAME=sfi_dashboard
DB_PORT=3306

# ===== SERVER =====
PORT=3001
HOST=0.0.0.0
FRONTEND_URL=https://app.example.com

# ===== OPTIONAL =====
LOG_LEVEL=info
PROMETHEUS_ENABLED=true
```

### Frontend .env (peut être committé, pas de secrets)
```bash
VITE_API_URL=https://api.example.com:3001
VITE_BACKEND_WS_URL=wss://api.example.com:3001
```

### ⚠️ Règles importantes
- ❌ Ne JAMAIS commiter `.env` avec les secrets
- ❌ Ne JAMAIS partager JWT_SECRET
- ✅ Générer des nouveaux secrets à chaque déploiement
- ✅ Stocker en variables d'environnement (pas en config)
- ✅ Rotationner les secrets mensuellement en production

---

## Déploiement sécurisé

### Checklist avant production

- [ ] `NODE_ENV=production`
- [ ] JWT_SECRET & JWT_REFRESH_SECRET générés avec `openssl rand -base64 32`
- [ ] HTTPS/TLS configuré (certificat Let's Encrypt)
- [ ] `secure: true` dans les cookies (HTTPS forcé)
- [ ] CORS: uniquement le domaine production
- [ ] Rate limits ajustés selon la charge attendue
- [ ] Secrets dans des variables d'environnement (pas en code)
- [ ] Logs centralisés (optionnel: ELK, Datadog, etc.)
- [ ] Monitoring Prometheus en place
- [ ] Backups BD programmés
- [ ] Rotation des secrets mensuellement

### Docker

```dockerfile
# ✅ Ne pas backer les secrets
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src ./src
EXPOSE 3001

# Variables d'environnement injectées au runtime
CMD ["node", "src/server.js"]
```

```bash
# Lancer avec docker run (secrets via -e)
docker run -d \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e JWT_SECRET=<secret> \
  -e JWT_REFRESH_SECRET=<secret> \
  -e ES_NODE=https://es:9200 \
  -e ES_USERNAME=elastic \
  -e ES_PASSWORD=<mdp> \
  --name sfi-backend \
  sfi-dashboard:latest
```

### Nginx Configuration

```nginx
server {
  listen 443 ssl http2;
  server_name api.example.com;

  ssl_certificate /etc/letsencrypt/live/api.example.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;

  # TLS 1.2+
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers HIGH:!aNULL:!MD5;

  # Sécurité headers
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-XSS-Protection "1; mode=block" always;

  location / {
    proxy_pass http://localhost:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # WebSocket support
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}

# Rediriger HTTP → HTTPS
server {
  listen 80;
  server_name api.example.com;
  return 301 https://$server_name$request_uri;
}
```

---

## Tests de sécurité

### Lancer les tests
```bash
# Tests d'authentification sécurité
npm test

# Tests avec couverture
npm run test:coverage

# Tests avec UI
npm run test:ui
```

### Vérifications manuelles

```bash
# 1. Vérifier que le token expire
curl -H "Authorization: Bearer <token_expiré>" http://localhost:3001/api/me
# Doit retourner 401 Token expiré

# 2. Vérifier que le refresh token n'est pas accessible
# Ouvrir la console navigateur → Application → Cookies
# refreshToken ne doit PAS être visible

# 3. Vérifier CORS
curl -H "Origin: http://attacker.com" http://localhost:3001/api/me
# Doit retourner CORS error

# 4. Vérifier rate limiting
# Faire 6 POST /auth/signin en < 15 minutes
# La 6ème doit être rejetée avec 429

# 5. Test CSRF
# Faire une requête POST sans X-CSRF-Token
# Doit retourner 403
```

---

## Ressources

- [OWASP JWT Security](https://owasp.org/www-community/attacks/jwt)
- [OWASP CSRF Prevention](https://owasp.org/www-community/attacks/csrf)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [HTTP-Only Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#restrict_access_to_cookies)

---

**Dernière mise à jour:** 8 février 2026  
**Statut:** Phase 1 ✅ Complétée
