import express from 'express';
import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import SyslogFetchService from './services/SyslogFetchService.js';
import { signIn, signUp, signOut } from './controllers/authController.js';
import { authenticate } from './middlewares/authMiddleware.js';
import { sequelize } from './databases/Sequelize.js';

dotenv.config();

console.log(`port : ${process.env.PORT}`)

await sequelize.sync({ force: true });

const app = express();
app.use(express.json());

// --- Routes d'authentification ---
app.post('/auth/signup', signUp);
app.post('/auth/signin', signIn);
app.post('/auth/signout', authenticate, signOut);

// --- Route sécurisée ---
app.get('/profile', authenticate, (req, res) => {
  res.json({ message: 'Bienvenue ' + req.user.sub });
});

const PORT = process.env.PORT || 3000;

// --- Lancement du serveur HTTP ---
const server = app.listen(PORT, () => {
  console.log(`✅ Serveur Express lancé sur le port ${PORT}`);
});

// --- WebSocket ---
const wss = new WebSocketServer({ server });
const clients = new Set();

wss.on('connection', (ws) => {
  console.log('🔌 Nouveau client WebSocket connecté');
  clients.add(ws);

  ws.on('close', () => {
    clients.delete(ws);
  });
});

// --- Service de récupération des logs ---
const syslogService = new SyslogFetchService();

async function broadcastSyslogs() {
  const logs = await syslogService.fetchLogs(100);

  if (logs.length > 0) {
    const payload = JSON.stringify({ type: 'syslogs', data: logs });
    for (const client of clients) {
      if (client.readyState === 1) {
        client.send(payload);
      }
    }
    console.log(`📡 ${logs.length} journaux envoyés aux clients WebSocket`);
  } else {
    console.log('⚠️ Aucun log à envoyer');
  }
}

// --- Exécuter toutes les 10 secondes ---
setInterval(broadcastSyslogs, 10_000);
