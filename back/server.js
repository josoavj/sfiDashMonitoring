require('dotenv').config();
const express = require('express');
const { Client } = require('@elastic/elasticsearch');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
});

const PORT = process.env.PORT || 3001;

// Configuration Elasticsearch
const esClient = new Client({
    node: process.env.ES_NODE || 'http://localhost:9200',
    auth: process.env.ES_USERNAME ? {
        username: process.env.ES_USERNAME,
        password: process.env.ES_PASSWORD
    } : undefined
});

// Middleware
app.use(cors());
app.use(express.json());

// Test de connexion Elasticsearch
esClient.ping()
    .then(() => console.log('✅ Connecté à Elasticsearch'))
    .catch(err => console.error('❌ Erreur connexion Elasticsearch:', err.message));

// ============= WEBSOCKET REAL-TIME STREAMING =============

let lastCheckTimestamp = new Date();
let pollingInterval = null;
let connectedClients = 0;

// Fonction pour récupérer les nouveaux logs
async function fetchNewLogs() {
    try {
        const now = new Date();
        const result = await esClient.search({
            index: process.env.ES_INDEX || 'filebeat-*',
            body: {
                size: 100,
                query: {
                    range: {
                        '@timestamp': {
                            gt: lastCheckTimestamp.toISOString(),
                            lte: now.toISOString()
                        }
                    }
                },
                sort: [{ '@timestamp': { order: 'desc' } }]
            }
        });

        if (result.hits.hits.length > 0) {
            lastCheckTimestamp = now;
            return result.hits.hits;
        }

        lastCheckTimestamp = now;
        return [];
    } catch (error) {
        console.error('Erreur fetch new logs:', error.message);
        return [];
    }
}

// Streaming continu vers les clients
function startLogStreaming() {
    if (pollingInterval) return;

    pollingInterval = setInterval(async () => {
        if (connectedClients === 0) return;

        const newLogs = await fetchNewLogs();
        if (newLogs.length > 0) {
            io.emit('new-logs', {
                logs: newLogs,
                count: newLogs.length,
                timestamp: new Date().toISOString()
            });
            console.log(`📡 ${newLogs.length} nouveaux logs envoyés`);
        }
    }, 2000); // Vérification toutes les 2 secondes
}

function stopLogStreaming() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
        console.log('⏸️  Streaming arrêté');
    }
}

// Gestion des connexions WebSocket
io.on('connection', (socket) => {
    connectedClients++;
    console.log(`🔌 Client connecté (Total: ${connectedClients})`);

    // Démarrer le streaming si c'est le premier client
    if (connectedClients === 1) {
        lastCheckTimestamp = new Date();
        startLogStreaming();
    }

    // Envoyer l'état initial
    socket.emit('connected', {
        message: 'Connecté au serveur de logs',
        timestamp: new Date().toISOString()
    });

    // Client demande les logs initiaux
    socket.on('request-initial-logs', async (data) => {
        try {
            const { timeRange = '15m', size = 100 } = data;
            const now = new Date();
            const ranges = {
                '15m': 15 * 60 * 1000,
                '1h': 60 * 60 * 1000,
                '24h': 24 * 60 * 60 * 1000,
                '7d': 7 * 24 * 60 * 60 * 1000
            };

            const result = await esClient.search({
                index: process.env.ES_INDEX || 'filebeat-*',
                body: {
                    size,
                    query: {
                        range: {
                            '@timestamp': {
                                gte: new Date(now - ranges[timeRange]).toISOString(),
                                lte: now.toISOString()
                            }
                        }
                    },
                    sort: [{ '@timestamp': { order: 'desc' } }]
                }
            });

            socket.emit('initial-logs', {
                logs: result.hits.hits,
                total: result.hits.total.value
            });
        } catch (error) {
            socket.emit('error', { message: error.message });
        }
    });

    // Client change l'intervalle de streaming
    socket.on('change-interval', (interval) => {
        if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = setInterval(async () => {
                if (connectedClients === 0) return;
                const newLogs = await fetchNewLogs();
                if (newLogs.length > 0) {
                    io.emit('new-logs', {
                        logs: newLogs,
                        count: newLogs.length,
                        timestamp: new Date().toISOString()
                    });
                }
            }, interval * 1000);
        }
    });

    // Déconnexion
    socket.on('disconnect', () => {
        connectedClients--;
        console.log(`🔌 Client déconnecté (Restants: ${connectedClients})`);

        // Arrêter le streaming si plus de clients
        if (connectedClients === 0) {
            stopLogStreaming();
        }
    });
});

// ============= API REST (pour compatibilité) =============

app.get('/api/health', async (req, res) => {
    try {
        const health = await esClient.cluster.health();
        const info = await esClient.info();
        res.json({
            cluster: health,
            elasticsearch: {
                version: info.version.number,
                cluster_name: info.cluster_name
            },
            websocket: {
                connected_clients: connectedClients,
                streaming_active: pollingInterval !== null
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/search', async (req, res) => {
    try {
        const {
            query = '*',
            from = 0,
            size = 100,
            timeRange,
            sortField = '@timestamp',
            sortOrder = 'desc'
        } = req.body;

        const mustClauses = [];
        const filterClauses = [];

        if (timeRange?.from && timeRange?.to) {
            filterClauses.push({
                range: {
                    '@timestamp': {
                        gte: timeRange.from,
                        lte: timeRange.to
                    }
                }
            });
        }

        if (query && query !== '*') {
            mustClauses.push({
                query_string: {
                    query: query,
                    default_operator: 'AND'
                }
            });
        }

        const searchBody = {
            index: process.env.ES_INDEX || 'filebeat-*',
            from,
            size,
            body: {
                query: {
                    bool: {
                        must: mustClauses.length > 0 ? mustClauses : [{ match_all: {} }],
                        filter: filterClauses
                    }
                },
                sort: [{ [sortField]: { order: sortOrder } }]
            }
        };

        const result = await esClient.search(searchBody);

        res.json({
            total: result.hits.total.value,
            hits: result.hits.hits,
            took: result.took
        });
    } catch (error) {
        console.error('Erreur recherche:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/stats', async (req, res) => {
    try {
        const { timeRange, fields = ['event.action', 'source.ip'] } = req.body;

        const aggs = {
            timeline: {
                date_histogram: {
                    field: '@timestamp',
                    fixed_interval: '1h'
                }
            }
        };

        fields.forEach(field => {
            const aggName = field.replace(/\./g, '_');
            aggs[aggName] = {
                terms: {
                    field: field,
                    size: 10
                }
            };
        });

        const result = await esClient.search({
            index: process.env.ES_INDEX || 'filebeat-*',
            body: {
                size: 0,
                query: {
                    range: {
                        '@timestamp': {
                            gte: timeRange.from,
                            lte: timeRange.to
                        }
                    }
                },
                aggs
            }
        });

        res.json({
            timeline: result.aggregations.timeline.buckets,
            stats: Object.keys(result.aggregations)
                .filter(key => key !== 'timeline')
                .reduce((acc, key) => {
                    acc[key] = result.aggregations[key].buckets;
                    return acc;
                }, {})
        });
    } catch (error) {
        console.error('Erreur stats:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/top-sources', async (req, res) => {
    try {
        const { timeRange, size = 10, field = 'source.ip' } = req.body;

        const result = await esClient.search({
            index: process.env.ES_INDEX || 'filebeat-*',
            body: {
                size: 0,
                query: {
                    range: {
                        '@timestamp': {
                            gte: timeRange.from,
                            lte: timeRange.to
                        }
                    }
                },
                aggs: {
                    top_sources: {
                        terms: {
                            field: field,
                            size: size
                        }
                    }
                }
            }
        });

        res.json(result.aggregations.top_sources.buckets);
    } catch (error) {
        console.error('Erreur top sources:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============= DÉMARRAGE =============
server.listen(PORT, () => {
    console.log(`
  🚀 Serveur API + WebSocket démarré
  📡 API REST: http://localhost:${PORT}
  🔌 WebSocket: ws://localhost:${PORT}
  🔍 Elasticsearch: ${process.env.ES_NODE || 'http://localhost:9200'}
  📊 Index: ${process.env.ES_INDEX || 'filebeat-*'}
  `);
});

process.on('unhandledRejection', (err) => {
    console.error('Erreur non gérée:', err);
});

process.on('SIGTERM', () => {
    console.log('SIGTERM reçu, fermeture...');
    stopLogStreaming();
    server.close(() => {
        console.log('Serveur fermé');
        process.exit(0);
    });
});