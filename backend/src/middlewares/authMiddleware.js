const jwt = require('jsonwebtoken');
const { Session } = require('../models/Session');
require('../config/secrets'); // Valider les secrets au démarrage

const JWT_SECRET = process.env.JWT_SECRET;

async function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant ou format invalide' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Vérifier que la session n'est pas révoquée
    const session = await Session.findOne({
      where: { userId: decoded.sub, revoked: false }
    });
    
    if (!session) {
      return res.status(401).json({ error: 'Session révoquée ou invalide' });
    }
    
    req.user = decoded;
    next();
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Token expiré' : 'Token invalide';
    return res.status(401).json({ error: message });
  }
}

module.exports = { authenticate };
