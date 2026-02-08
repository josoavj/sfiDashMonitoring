const Tokens = require('csrf');

const tokens = new Tokens();

/**
 * Middleware CSRF qui génère et valide les tokens CSRF
 * Utilise les sessions HTTP dans les cookies
 */
function csrfProtection() {
  return (req, res, next) => {
    // Initialiser la session CSRF secrète si elle n'existe pas
    if (!req.session) {
      req.session = {};
    }

    if (!req.session.csrfSecret) {
      req.session.csrfSecret = tokens.secretSync();
    }

    // Pour les requêtes GET/OPTIONS/HEAD: générer un token et l'envoyer
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      const token = tokens.create(req.session.csrfSecret);
      res.locals.csrfToken = token;
      res.set('X-CSRF-Token', token);
      return next();
    }

    // Pour les requêtes POST/PUT/DELETE/PATCH: valider le token
    const token = req.body._csrf ||
      req.query._csrf ||
      req.headers['x-csrf-token'] ||
      req.headers['x-xsrf-token'];

    if (!token) {
      return res.status(403).json({ error: 'CSRF token manquant' });
    }

    if (!tokens.verify(req.session.csrfSecret, token)) {
      return res.status(403).json({ error: 'CSRF token invalide' });
    }

    next();
  };
}

module.exports = { csrfProtection };
