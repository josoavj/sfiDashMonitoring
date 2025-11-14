require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const { createEsClientFromEnv } = require('./services/esClient');
const logService = require('./services/logService');
const { mountApiRoutes } = require('./routes/api');
const { mountAuthRoutes } = require('./routes/auth');

const app = express();
app.use(cors());
app.use(express.json());

const esClient = createEsClientFromEnv();
const { sequelize } = require('./databases/Sequelize');

// Mount API routes
mountApiRoutes(app, esClient, logService);
// Mount auth routes (signup/signin/signout)
mountAuthRoutes(app);

const PORT = process.env.PORT || 3001;
const server = http.createServer(app);

const allowedOrigins = process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : ['http://localhost:3000', 'http://localhost:5173'];
const io = new Server(server, { cors: { origin: allowedOrigins, methods: ['GET', 'POST'] } });

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

  socket.on('disconnect', () => {
    logService.clientDisconnected();
    console.log('🔌 Client Socket.IO déconnecté');
  });
});

// Auto-start streaming when first client connects
logService.startLogStreaming(io, esClient);

async function init() {
  try {
    await sequelize.sync();
    server.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Erreur initialisation base de données:', err);
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
