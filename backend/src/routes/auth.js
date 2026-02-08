const { signIn, signUp, signOut, refresh } = require('../controllers/authController');
const { authenticate } = require('../middlewares/authMiddleware');
const { validate, validators } = require('../utils/validators');
const rateLimit = require('express-rate-limit');

// Rate limiters pour auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Seulement 5 tentatives
  message: 'Trop de tentatives, réessayez dans 15 minutes'
});

// Rate limiter pour refresh (plus permissif)
const refreshLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 tentatives par minute
  message: 'Trop de tentatives de refresh, réessayez dans 1 minute'
});

// Validateurs auth
const signupValidator = require('joi').object({
  firstName: require('joi').string().min(2).max(50).required(),
  lastName: require('joi').string().min(2).max(50).required(),
  email: require('joi').string().email().required(),
  password: require('joi').string().min(8).max(128).required()
});

const signinValidator = require('joi').object({
  email: require('joi').string().email().required(),
  password: require('joi').string().required()
});

function mountAuthRoutes(app) {
  app.post('/auth/signup', authLimiter, validate(signupValidator), signUp);
  app.post('/auth/signin', authLimiter, validate(signinValidator), signIn);
  app.post('/auth/refresh', refreshLimiter, refresh); // Nouveau endpoint - pas besoin d'authenticate
  app.post('/auth/signout', authenticate, signOut);
}

module.exports = { mountAuthRoutes };
