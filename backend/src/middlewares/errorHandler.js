/**
 * Middleware de gestion centralisée des erreurs
 * Sanitize les messages d'erreur pour éviter l'information disclosure
 */

function errorHandler(err, req, res, next) {
  // Ne pas exposer les stack traces en production
  const NODE_ENV = process.env.NODE_ENV || 'development';
  const isDevelopment = NODE_ENV === 'development';

  // Logger l'erreur complète (côté serveur uniquement)
  console.error('Erreur:', {
    message: err.message,
    status: err.status || 500,
    stack: isDevelopment ? err.stack : undefined,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  // Déterminer le code de statut
  let statusCode = err.status || 500;
  let message = 'Une erreur serveur s\'est produite';

  // Messages d'erreur spécifiques par type
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation échouée';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Non autorisé';
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    message = 'Ressource non trouvée';
  } else if (err.name === 'RateLimitError') {
    statusCode = 429;
    message = 'Trop de requêtes, veuillez réessayer plus tard';
  } else if (err.message?.includes('timeout')) {
    statusCode = 504;
    message = 'Le serveur a mis trop longtemps à répondre';
  }

  // Réponse sécurisée
  const response = {
    error: message,
    ...(isDevelopment && { details: err.message })
  };

  // Ajouter l'ID de requête pour traçabilité (optionnel)
  if (req.id) {
    response.requestId = req.id;
  }

  res.status(statusCode).json(response);
}

module.exports = errorHandler;
