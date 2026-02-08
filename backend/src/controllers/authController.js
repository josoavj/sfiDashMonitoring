const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { Session } = require('../models/Session');
const { User } = require('../models/User');
const { limitUserSessions } = require('../services/sessionService');
require('../config/secrets'); // Valider les secrets au démarrage

const ACCESS_TOKEN_EXPIRATION = '15m';
const REFRESH_TOKEN_EXPIRATION = '7d';

// Les secrets doivent TOUJOURS être définis (validation faite dans secrets.js)
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Hash un refresh token avec crypto
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Configure les cookie options (Secure + HttpOnly en prod, moins strict en dev)
 */
function getCookieOptions() {
  const baseOptions = {
    httpOnly: true,
    sameSite: 'Strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
  };
  
  if (NODE_ENV === 'production') {
    return { ...baseOptions, secure: true };
  }
  return baseOptions;
}

/**
 * Crée et enregistre un refresh token
 */
async function createRefreshToken(userId, req) {
  const refreshToken = jwt.sign({ sub: userId }, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRATION });
  const refreshTokenHash = hashToken(refreshToken);
  
  await Session.create({
    userId,
    refreshTokenHash, // Stocker le hash, pas le token
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });
  
  return refreshToken;
}

exports.signUp = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'Email déjà utilisé' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ firstName, lastName, email, password: hashedPassword });

    const payload = { email: user.email, sub: user.id, name: user.firstName };
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRATION });
    const refreshToken = await createRefreshToken(user.id, req);

    // Stocker le refresh token en HttpOnly cookie (sécurisé)
    res.cookie('refreshToken', refreshToken, getCookieOptions());

    return res.status(201).json({
      accessToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.signIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Identifiants invalides' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Identifiants invalides' });

    const payload = { email: user.email, sub: user.id, name: user.firstName };
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRATION });
    const refreshToken = await createRefreshToken(user.id, req);
    
    // Limiter à 5 sessions actives par utilisateur
    await limitUserSessions(user.id, 5);

    // Stocker le refresh token en HttpOnly cookie (sécurisé)
    res.cookie('refreshToken', refreshToken, getCookieOptions());

    return res.status(200).json({
      accessToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Signin error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Refresh endpoint - échange un refresh token contre un nouvel access token
 * Le refresh token est rotationné pour éviter les replays
 */
exports.refresh = async (req, res) => {
  try {
    const incomingRefreshToken = req.cookies.refreshToken;
    if (!incomingRefreshToken) {
      return res.status(401).json({ error: 'Refresh token manquant' });
    }

    let decoded;
    try {
      decoded = jwt.verify(incomingRefreshToken, JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Refresh token invalide ou expiré' });
    }

    const userId = decoded.sub;
    const incomingHash = hashToken(incomingRefreshToken);

    // Vérifier que la session existe et n'est pas révoquée
    const session = await Session.findOne({
      where: { userId, refreshTokenHash: incomingHash, revoked: false }
    });

    if (!session) {
      return res.status(401).json({ error: 'Session invalide ou révoquée' });
    }

    // Charger l'utilisateur
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(401).json({ error: 'Utilisateur introuvable' });
    }

    // Générer un nouvel access token
    const payload = { email: user.email, sub: user.id, name: user.firstName };
    const newAccessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRATION });

    // Rotation du refresh token : générer un nouveau et révoquer l'ancien
    const newRefreshToken = jwt.sign({ sub: userId }, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRATION });
    const newRefreshHash = hashToken(newRefreshToken);

    // Mettre à jour la session avec le nouveau hash
    await session.update({
      refreshTokenHash: newRefreshHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    // Envoyer le nouveau refresh token en cookie
    res.cookie('refreshToken', newRefreshToken, getCookieOptions());

    return res.status(200).json({
      accessToken: newAccessToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Refresh error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.signOut = async (req, res) => {
  try {
    const userId = req.user && req.user.sub;
    if (!userId) return res.status(400).json({ error: 'Utilisateur non authentifié' });

    // Révoquer toutes les sessions de l'utilisateur
    await Session.update({ revoked: true }, { where: { userId } });

    // Supprimer le cookie refresh token
    res.clearCookie('refreshToken');

    return res.status(200).json({ message: 'Déconnexion réussie' });
  } catch (error) {
    console.error('Signout error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};
