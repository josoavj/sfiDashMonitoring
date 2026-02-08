require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

const { createEsClientFromEnv } = require('./services/esClient');
const logService = require('./services/logService');
const { mountApiRoutes } = require('./routes/api');
const { mountAuthRoutes } = require('./routes/auth');
const errorHandler = require('./middlewares/errorHandler');
const { createMorganLogger } = require('./utils/logger');
const { csrfProtection } = require('./middlewares/csrfMiddleware');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
const { metricsMiddleware, setupMetricsEndpoint } = require('./services/metricsService');

// Import models to register them with Sequelize before sync
const { User } = require('./models/User');
const { Session } = require('./models/Session');
const { Setting } = require('./models/Setting');

// Parse FRONTEND_URL(s) - Support multiple URLs separated by spaces
const parseAllowedOrigins = () => {
  if (!process.env.FRONTEND_URL) {
    return ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173'];
  }
  const urls = process.env.FRONTEND_URL.split(/\s+/).filter(url => url.trim());
  // Always include localhost fallbacks
  const defaultUrls = ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173'];
  return [...new Set([...urls, ...defaultUrls])]; // Remove duplicates
};

const allowedOrigins = parseAllowedOrigins();
console.log('✅ Allowed Origins for CORS:', allowedOrigins.join(', '));

const app = express();

// Configuration CORS détaillée
const corsOptions = {
  origin: function (origin, callback) {
    // En production, REJETER les requêtes sans origin
    const NODE_ENV = process.env.NODE_ENV || 'development';
    
    if (!origin) {
      // Accepter en développement, rejeter en production
      if (NODE_ENV === 'production') {
        return callback(new Error('Origin required in production'));
      }
      return callback(null, true); // Développement: accepter
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`❌ CORS blocked origin: ${origin} (NODE_ENV: ${NODE_ENV})`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 86400
};

app.use(cors(corsOptions));
app.use(helmet()); // Security headers
app.use(compression()); // Compression de réponses
app.use(createMorganLogger()); // HTTP request logging (sans tokens sensibles)
app.use(express.json());
app.use(cookieParser()); // Parser pour les cookies (HttpOnly)

// Session middleware pour CSRF
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'dev-session-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge: 24 * 60 * 60 * 1000 // 24h
  }
});

app.use(sessionMiddleware);

// CSRF protection sur certaines routes
app.use(csrfProtection());

// Prometheus metrics middleware
app.use(metricsMiddleware);

const esClient = createEsClientFromEnv();
const { sequelize } = require('./databases/Sequelize');

// Setup Swagger documentation (AVANT les routes)
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  customCss: '.swagger-ui .topbar { display: none }',
  swaggerOptions: {
    persistAuthorization: true
  }
}));

// Setup Prometheus metrics endpoint
setupMetricsEndpoint(app);

// Mount API routes
mountApiRoutes(app, esClient, logService);
// Mount auth routes (signup/signin/signout/refresh)
mountAuthRoutes(app);

// Error handling middleware (DOIT être le dernier)
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';
const server = http.createServer(app);

const io = new Server(server, { 
  cors: { 
    origin: allowedOrigins, 
    methods: ['GET', 'POST'],
    credentials: true
  } 
});

// WebSocket handling
io.on('connection', (socket) => {
  logService.clientConnected(io);
  console.log('🔌 Client connecté via Socket.IO');

  socket.emit('connected', { message: 'Connecté au serveur de logs', timestamp: new Date().toISOString() });

  socket.on('request-initial-logs', async (data) => {
    try {
      const { timeRange = '15m', size = 100 } = data || {};
      
      // Validation stricte
      const validRanges = { '15m': 15 * 60 * 1000, '1h': 60 * 60 * 1000, '24h': 24 * 60 * 60 * 1000, '7d': 7 * 24 * 60 * 60 * 1000 };
      if (!validRanges[timeRange]) {
        socket.emit('error', { message: 'timeRange invalide' });
        return;
      }
      
      const sizeNum = Number(size);
      if (!Number.isInteger(sizeNum) || sizeNum < 1 || sizeNum > 1000) {
        socket.emit('error', { message: 'size doit être entre 1 et 1000' });
        return;
      }

      const now = new Date();
      const result = await esClient.search({ index: process.env.ES_INDEX || 'filebeat-*', body: { size: sizeNum, query: { range: { '@timestamp': { gte: new Date(now - validRanges[timeRange]).toISOString(), lte: now.toISOString() } } }, sort: [{ '@timestamp': { order: 'desc' } }] } });
      socket.emit('initial-logs', { logs: result.hits.hits, total: result.hits.total?.value || 0 });
    } catch (err) {
      socket.emit('error', { message: 'Erreur lors du chargement des logs' });
    }
  });

  socket.on('change-interval', (intervalSecs) => {
    // Validation stricte de l'intervalle
    const interval = Number(intervalSecs);
    if (!Number.isInteger(interval) || interval < 1 || interval > 3600) {
      socket.emit('error', { message: 'intervalSecs doit être entre 1 et 3600 secondes' });
      return;
    }
    
    logService.stopLogStreaming();
    logService.startLogStreaming(io, esClient, interval * 1000);
  });

  // Subscribe/unsubscribe to per-IP rooms
  socket.on('subscribe-ip', (data) => {
    try {
      const ip = typeof data === 'string' ? data : data?.ip;
      
      // Validation IP (format basique)
      if (!ip || typeof ip !== 'string' || !/^[\d.]+$/.test(ip) && !/^[\da-f:]+$/i.test(ip)) {
        socket.emit('error', { message: 'IP invalide' });
        return;
      }
      
      const room = `ip:${ip}`;
      socket.join(room);
      console.log(`Socket ${socket.id} joined ${room}`);
    } catch (e) {
      socket.emit('error', { message: 'Erreur subscribe-ip' });
    }
  });

  socket.on('unsubscribe-ip', (data) => {
    try {
      const ip = typeof data === 'string' ? data : data?.ip;
      
      // Validation IP (format basique)
      if (!ip || typeof ip !== 'string' || !/^[\d.]+$/.test(ip) && !/^[\da-f:]+$/i.test(ip)) {
        socket.emit('error', { message: 'IP invalide' });
        return;
      }
      
      const room = `ip:${ip}`;
      socket.leave(room);
      console.log(`Socket ${socket.id} left ${room}`);
    } catch (e) {
      socket.emit('error', { message: 'Erreur unsubscribe-ip' });
    }
  });

  socket.on('disconnect', () => {
    logService.clientDisconnected();
    console.log('🔌 Client Socket.IO déconnecté');
  });
});

// Auto-start streaming when first client connects
logService.startLogStreaming(io, esClient);

// Démarrer le nettoyage des sessions
const { startSessionCleanup } = require('./services/sessionService');
startSessionCleanup();

async function init() {
    try {
    // Force sync to recreate tables with all columns
    await sequelize.sync({ alter: true });
    server.listen(PORT, HOST, () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║     🚀 SFI Dash Monitoring Backend Started                 ║
╠════════════════════════════════════════════════════════════╣
║ 📍 Server:      http://${HOST}:${PORT}                     ║
║ 🔌 WebSocket:   ws://localhost:${PORT}/socket.io/          ║
║ 📊 Elasticsearch: Connected                                ║
║ 💾 Database:    Connected (alter: true)                    ║
╚════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (err) {
    console.error('❌ Erreur initialisation base de données:', err);
    process.exit(1);
  }
}

init();

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  logService.stopLogStreaming();
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...');
  logService.stopLogStreaming();
  server.close(() => process.exit(0));
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});
