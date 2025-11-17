require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const { createEsClientFromEnv } = require('./services/esClient');
const logService = require('./services/logService');
const { mountApiRoutes } = require('./routes/api');
const { mountAuthRoutes } = require('./routes/auth');

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
    // Permettre aussi les requêtes sans origin (comme Postman, tests, etc)
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('❌ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 86400
};

app.use(cors(corsOptions));app.use(cors(corsOptions));
app.use(express.json());

const esClient = createEsClientFromEnv();
const { sequelize } = require('./databases/Sequelize');

// Mount API routes
mountApiRoutes(app, esClient, logService);
// Mount auth routes (signup/signin/signout)
mountAuthRoutes(app);

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
      const { timeRange = '15m', size = 100 } = data;
      const now = new Date();
      const ranges = { '15m': 15 * 60 * 1000, '1h': 60 * 60 * 1000, '24h': 24 * 60 * 60 * 1000, '7d': 7 * 24 * 60 * 60 * 1000 };

      const result = await esClient.search({ index: process.env.ES_INDEX || 'filebeat-*', body: { size, query: { range: { '@timestamp': { gte: new Date(now - ranges[timeRange]).toISOString(), lte: now.toISOString() } } }, sort: [{ '@timestamp': { order: 'desc' } }] } });
      socket.emit('initial-logs', { logs: result.hits.hits, total: result.hits.total?.value || 0 });
    } catch (err) {
      socket.emit('error', { message: err.message });
    }
  });

  socket.on('change-interval', (intervalSecs) => {
    // Restart streaming with new interval
    if (intervalSecs && Number(intervalSecs) > 0) {
      logService.stopLogStreaming();
      logService.startLogStreaming(io, esClient, Number(intervalSecs) * 1000);
    }
  });

  // Subscribe/unsubscribe to per-IP rooms
  socket.on('subscribe-ip', (data) => {
    try {
      const ip = typeof data === 'string' ? data : data?.ip;
      if (!ip) return;
      const room = `ip:${ip}`;
      socket.join(room);
      console.log(`Socket ${socket.id} joined ${room}`);
    } catch (e) {
      console.error('subscribe-ip error', e?.message || e);
    }
  });

  socket.on('unsubscribe-ip', (data) => {
    try {
      const ip = typeof data === 'string' ? data : data?.ip;
      if (!ip) return;
      const room = `ip:${ip}`;
      socket.leave(room);
      console.log(`Socket ${socket.id} left ${room}`);
    } catch (e) {
      console.error('unsubscribe-ip error', e?.message || e);
    }
  });

  socket.on('disconnect', () => {
    logService.clientDisconnected();
    console.log('🔌 Client Socket.IO déconnecté');
  });
});

// Auto-start streaming when first client connects
logService.startLogStreaming(io, esClient);

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
