const { logger } = require('../utils/logger');

function validateSecrets() {
  const NODE_ENV = process.env.NODE_ENV || 'development';
  const requiredSecrets = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];

  // En production, les secrets DOIVENT être définis
  if (NODE_ENV === 'production') {
    const missingSecrets = requiredSecrets.filter(secret => !process.env[secret]);
    if (missingSecrets.length > 0) {
      logger.error('ERREUR CRITIQUE: Secrets manquants en production:', { missingSecrets });
      process.exit(1);
    }
    logger.info('Tous les secrets critiques sont définis');
  }

  // En développement, utiliser des defaults sûrs (mais avertir)
  if (NODE_ENV === 'development') {
    const missingSecrets = requiredSecrets.filter(secret => !process.env[secret]);
    if (missingSecrets.length > 0) {
      logger.warn('ATTENTION: En développement local, les secrets suivants utilisent des valeurs par défaut:', { missingSecrets });
    }
  }
}

// Valider au chargement du module
validateSecrets();

module.exports = {
  validateSecrets
};
