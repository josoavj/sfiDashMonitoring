const { signIn, signUp, signOut } = require('../controllers/authController');
const { authenticate } = require('../middlewares/authMiddleware');
const { validate, validators } = require('../utils/validators');
const rateLimit = require('express-rate-limit');

// Rate limiters pour auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Seulement 5 tentatives
  message: 'Trop de tentatives, réessayez dans 15 minutes'
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
  app.post('/auth/signout', authenticate, signOut);
}

module.exports = { mountAuthRoutes };
