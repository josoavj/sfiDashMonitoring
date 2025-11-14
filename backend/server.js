require('dotenv').config();
try {
  require('./src/server');
} catch (err) {
  console.error('Erreur lors du chargement de ./src/server:', err);
  process.exit(1);
}