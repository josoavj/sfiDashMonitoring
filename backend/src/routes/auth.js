const { signIn, signUp, signOut } = require('../controllers/authController');
const { authenticate } = require('../middlewares/authMiddleware');

function mountAuthRoutes(app) {
  app.post('/auth/signup', signUp);
  app.post('/auth/signin', signIn);
  app.post('/auth/signout', authenticate, signOut);
}

module.exports = { mountAuthRoutes };
