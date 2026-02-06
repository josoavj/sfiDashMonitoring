/**
 * Service de gestion des sessions
 * - Nettoyage des sessions expirées
 * - Gestion des sessions revoquées
 */

const { Session } = require('../models/Session');

// Nettoyer les sessions expirées toutes les heures
async function startSessionCleanup() {
  const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 heure
  
  setInterval(async () => {
    try {
      // Supprimer les sessions revoquées plus vieilles que 7 jours
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const deleted = await Session.destroy({
        where: {
          revoked: true,
          createdAt: {
            [require('sequelize').Op.lt]: sevenDaysAgo
          }
        }
      });
      
      if (deleted > 0) {
        console.log(`🧹 Nettoyage sessions: ${deleted} sessions revoquées supprimées`);
      }
      
      // Optionnel: Limiter le nombre de sessions actives par user (garde les 5 plus récentes)
      const cleanup30daysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const deletedOld = await Session.destroy({
        where: {
          revoked: false,
          createdAt: {
            [require('sequelize').Op.lt]: cleanup30daysAgo
          }
        }
      });
      
      if (deletedOld > 0) {
        console.log(`🧹 Nettoyage sessions: ${deletedOld} sessions inactives (>30j) supprimées`);
      }
    } catch (err) {
      console.error('❌ Erreur session cleanup:', err.message);
    }
  }, CLEANUP_INTERVAL);
  
  console.log('✅ Session cleanup scheduler démarré (toutes les heures)');
}

/**
 * Révoquer TOUTES les sessions d'un utilisateur
 * (Utile lors du changement de password)
 */
async function revokeAllUserSessions(userId) {
  try {
    const updated = await Session.update(
      { revoked: true },
      { where: { userId } }
    );
    console.log(`🔐 ${updated[0]} sessions révoquées pour user ${userId}`);
    return updated[0];
  } catch (err) {
    console.error('❌ Erreur revoke all sessions:', err.message);
    throw err;
  }
}

/**
 * Garder seulement les N sessions les plus récentes d'un utilisateur
 */
async function limitUserSessions(userId, maxSessions = 5) {
  try {
    // Récupérer les sessions du user, ordonnées par date
    const sessions = await Session.findAll({
      where: { userId, revoked: false },
      order: [['createdAt', 'DESC']],
      attributes: ['id']
    });
    
    // Supprimer les sessions au-delà de maxSessions
    if (sessions.length > maxSessions) {
      const sessionsToDelete = sessions.slice(maxSessions).map(s => s.id);
      const deleted = await Session.destroy({
        where: { id: sessionsToDelete }
      });
      console.log(`🧹 Limité à ${maxSessions} sessions pour user ${userId} (${deleted} supprimées)`);
      return deleted;
    }
    return 0;
  } catch (err) {
    console.error('❌ Erreur limit user sessions:', err.message);
    throw err;
  }
}

module.exports = {
  startSessionCleanup,
  revokeAllUserSessions,
  limitUserSessions
};
