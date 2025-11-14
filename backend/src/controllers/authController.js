const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Session } = require('../models/Session');
const { User } = require('../models/User');

const ACCESS_TOKEN_EXPIRATION = '15m';
const REFRESH_TOKEN_EXPIRATION = '7d';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev_jwt_refresh_secret';

exports.signUp = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ message: 'Email déjà utilisé' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ firstName, lastName, email, password: hashedPassword });

    const payload = { email: user.email, sub: user.id, name: user.firstName };
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRATION });
    const refreshToken = jwt.sign({ sub: user.id }, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRATION });

    await Session.create({ userId: user.id, userAgent: req.headers['user-agent'], ipAddress: req.ip, refreshToken });

    return res.status(201).json({ id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, accessToken, refreshToken });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.signIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Identifiants invalides' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ message: 'Mot de passe incorrect' });

    const payload = { email: user.email, sub: user.id, name: user.firstName };
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRATION });
    const refreshToken = jwt.sign({ sub: user.id }, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRATION });

    await Session.create({ userId: user.id, userAgent: req.headers['user-agent'], ipAddress: req.ip, refreshToken });

    return res.status(200).json({ message: 'Connexion réussie', accessToken, refreshToken });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.signOut = async (req, res) => {
  try {
    const userId = req.user && req.user.sub;
    if (!userId) return res.status(400).json({ message: 'Utilisateur non authentifié' });

    await Session.update({ revoked: true }, { where: { userId } });
    return res.status(200).json({ message: 'Déconnexion réussie' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};
