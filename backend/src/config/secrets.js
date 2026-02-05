/**
 * Configuration de sécurité pour les variables d'environnement critiques
 */

function validateSecrets() {
  const NODE_ENV = process.env.NODE_ENV || 'development';
  const requiredSecrets = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];

  // En production, les secrets DOIVENT être définis
  if (NODE_ENV === 'production') {
    const missingSecrets = requiredSecrets.filter(secret => !process.env[secret]);
    if (missingSecrets.length > 0) {
      console.error('ERREUR CRITIQUE: Secrets manquants en production:');
      missingSecrets.forEach(secret => console.error(`   - ${secret}`));
      console.error('\nDéfinez ces variables d\'environnement avant de déployer!');
      process.exit(1);
    }
    console.log(' Tous les secrets critiques sont définis');
  }

  // En développement, utiliser des defaults sûrs (mais avertir)
  if (NODE_ENV === 'development') {
    const missingSecrets = requiredSecrets.filter(secret => !process.env[secret]);
    if (missingSecrets.length > 0) {
      console.warn(' ATTENTION: En développement local, les secrets suivants utilisent des valeurs par défaut:');
      missingSecrets.forEach(secret => console.warn(`   - ${secret} (utilisez une variable d'environnement en production!)`));
    }
  }
}

// Valider au chargement du module
validateSecrets();

module.exports = {
  validateSecrets
};
