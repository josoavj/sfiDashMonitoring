const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Session } = require('../models/Session');
const { User } = require('../models/User');
require('../config/secrets'); // Valider les secrets au démarrage

const ACCESS_TOKEN_EXPIRATION = '15m';
const REFRESH_TOKEN_EXPIRATION = '7d';

// Les secrets doivent TOUJOURS être définis (validation faite dans secrets.js)
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

exports.signUp = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'Email déjà utilisé' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ firstName, lastName, email, password: hashedPassword });

    const payload = { email: user.email, sub: user.id, name: user.firstName };
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRATION });
    const refreshToken = jwt.sign({ sub: user.id }, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRATION });

    await Session.create({ userId: user.id, userAgent: req.headers['user-agent'], ipAddress: req.ip, refreshToken });

    // Normaliser la réponse (même format que signin)
    return res.status(201).json({
      accessToken,
      refreshToken,
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
    const refreshToken = jwt.sign({ sub: user.id }, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRATION });

    await Session.create({ userId: user.id, userAgent: req.headers['user-agent'], ipAddress: req.ip, refreshToken });

    // Normaliser la réponse (même format que signup)
    return res.status(200).json({
      accessToken,
      refreshToken,
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

exports.signOut = async (req, res) => {
  try {
    const userId = req.user && req.user.sub;
    if (!userId) return res.status(400).json({ error: 'Utilisateur non authentifié' });

    await Session.update({ revoked: true }, { where: { userId } });
    return res.status(200).json({ message: 'Déconnexion réussie' });
  } catch (error) {
    console.error('Signout error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};
