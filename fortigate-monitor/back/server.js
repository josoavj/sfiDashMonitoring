// back/server.js
require('dotenv').config();
const express = require('express');
const { Client } = require('@elastic/elasticsearch');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const allowedOrigins = process.env.FRONTEND_URL
    ? [process.env.FRONTEND_URL]
    : ['http://localhost:3000'];

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST']
    }
});

const PORT = process.env.PORT || 3001;

// ============= CONFIGURATION ELASTICSEARCH =============

const esConfig = {
    node: process.env.ES_NODE || 'https://localhost:9200',
    auth: process.env.ES_USERNAME ? {
        username: process.env.ES_USERNAME,
        password: process.env.ES_PASSWORD
    } : undefined
};

// Gestion du certificat SSL
if (process.env.ES_CERT_PATH) {
    try {
        const caCert = fs.readFileSync(path.resolve(process.env.ES_CERT_PATH));
        esConfig.tls = {
            ca: caCert,
            rejectUnauthorized: true
        };
        console.log('✅ Certificat SSL chargé depuis:', process.env.ES_CERT_PATH);
    } catch (error) {
        console.error('❌ Erreur chargement certificat:', error.message);
        process.exit(1);
    }
} else if (process.env.ES_SSL_VERIFY === 'false') {
    esConfig.tls = {
        rejectUnauthorized: false
    };
    console.warn('⚠️  Vérification SSL désactivée (non recommandé en production)');
} else if (process.env.ES_FINGERPRINT) {
    esConfig.tls = {
        ca: undefined,
        rejectUnauthorized: false
    };
    esConfig.caFingerprint = process.env.ES_FINGERPRINT;
    console.log('✅ Utilisation du fingerprint SSL');
}

const esClient = new Client(esConfig);

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
    }, 2000);
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

    if (connectedClients === 1) {
        lastCheckTimestamp = new Date();
        startLogStreaming();
    }

    socket.emit('connected', {
        message: 'Connecté au serveur de logs',
        timestamp: new Date().toISOString()
    });

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

    socket.on('disconnect', () => {
        connectedClients--;
        console.log(`🔌 Client déconnecté (Restants: ${connectedClients})`);

        if (connectedClients === 0) {
            stopLogStreaming();
        }
    });
});

// ============= API REST ROUTES =============

// Health check
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

// Recherche de logs
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

// Statistiques générales
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

// Top sources IP
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

// Métriques de bande passante
app.post('/api/bandwidth', async (req, res) => {
    try {
        const { timeRange, interval = '1m' } = req.body;

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
                    bandwidth_over_time: {
                        date_histogram: {
                            field: '@timestamp',
                            fixed_interval: interval
                        },
                        aggs: {
                            total_bytes: {
                                sum: {
                                    field: 'network.bytes'
                                }
                            },
                            sent_bytes: {
                                sum: {
                                    field: 'source.bytes'
                                }
                            },
                            received_bytes: {
                                sum: {
                                    field: 'destination.bytes'
                                }
                            }
                        }
                    },
                    total_traffic: {
                        sum: {
                            field: 'network.bytes'
                        }
                    },
                    avg_packet_size: {
                        avg: {
                            field: 'network.bytes'
                        }
                    }
                }
            }
        });

        res.json({
            timeline: result.aggregations.bandwidth_over_time.buckets,
            total: result.aggregations.total_traffic.value || 0,
            average: result.aggregations.avg_packet_size.value || 0
        });
    } catch (error) {
        console.error('Erreur bandwidth:', error);
        res.status(500).json({ error: error.message });
    }
});

// Top consommateurs de bande passante
app.post('/api/top-bandwidth', async (req, res) => {
    try {
        const { timeRange, size = 10, type = 'source' } = req.body;
        const field = type === 'source' ? 'source.ip' : 'destination.ip';

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
                    top_consumers: {
                        terms: {
                            field: field,
                            size: size,
                            order: { total_bytes: 'desc' }
                        },
                        aggs: {
                            total_bytes: {
                                sum: {
                                    field: 'network.bytes'
                                }
                            },
                            connection_count: {
                                value_count: {
                                    field: field
                                }
                            }
                        }
                    }
                }
            }
        });

        res.json(result.aggregations.top_consumers.buckets);
    } catch (error) {
        console.error('Erreur top bandwidth:', error);
        res.status(500).json({ error: error.message });
    }
});

// Statistiques par protocole/port
app.post('/api/protocols', async (req, res) => {
    try {
        const { timeRange, size = 10 } = req.body;

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
                    by_protocol: {
                        terms: {
                            field: 'network.protocol',
                            size: size
                        }
                    },
                    by_destination_port: {
                        terms: {
                            field: 'destination.port',
                            size: size
                        },
                        aggs: {
                            bytes: {
                                sum: {
                                    field: 'network.bytes'
                                }
                            }
                        }
                    },
                    by_application: {
                        terms: {
                            field: 'network.application',
                            size: size
                        }
                    }
                }
            }
        });

        res.json({
            protocols: result.aggregations.by_protocol.buckets,
            ports: result.aggregations.by_destination_port.buckets,
            applications: result.aggregations.by_application.buckets
        });
    } catch (error) {
        console.error('Erreur protocols:', error);
        res.status(500).json({ error: error.message });
    }
});

// Actions et événements de sécurité
app.post('/api/security-events', async (req, res) => {
    try {
        const { timeRange } = req.body;

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
                    by_action: {
                        terms: {
                            field: 'event.action',
                            size: 20
                        }
                    },
                    denied_connections: {
                        filter: {
                            terms: {
                                'event.action': ['deny', 'block', 'drop']
                            }
                        },
                        aggs: {
                            top_denied_ips: {
                                terms: {
                                    field: 'source.ip',
                                    size: 10
                                }
                            }
                        }
                    },
                    allowed_connections: {
                        filter: {
                            terms: {
                                'event.action': ['allow', 'accept', 'permit']
                            }
                        }
                    }
                }
            }
        });

        res.json({
            actions: result.aggregations.by_action.buckets,
            denied: result.aggregations.denied_connections.doc_count,
            allowed: result.aggregations.allowed_connections.doc_count,
            top_denied_ips: result.aggregations.denied_connections.top_denied_ips?.buckets || []
        });
    } catch (error) {
        console.error('Erreur security events:', error);
        res.status(500).json({ error: error.message });
    }
});

// Liste des index disponibles
app.get('/api/indices', async (req, res) => {
    try {
        const indices = await esClient.cat.indices({ format: 'json' });
        res.json(indices.filter(idx => idx.index.startsWith('filebeat')));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============= DÉMARRAGE DU SERVEUR =============

server.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════╗
║  🚀 Serveur Fortigate Monitor                      ║
╠════════════════════════════════════════════════════╣
║  📡 API REST:    http://localhost:${PORT}              ║
║  🔌 WebSocket:   ws://localhost:${PORT}                ║
║  🔍 Elasticsearch: ${esConfig.node}     ║
║  📊 Index:       ${process.env.ES_INDEX || 'filebeat-*'}                ║
╚════════════════════════════════════════════════════╝
  `);
});

// Gestion gracieuse de l'arrêt
process.on('SIGTERM', () => {
    console.log('\n⏹️  SIGTERM reçu, fermeture gracieuse...');
    stopLogStreaming();
    server.close(() => {
        console.log('✅ Serveur fermé proprement');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('\n⏹️  SIGINT reçu, fermeture gracieuse...');
    stopLogStreaming();
    server.close(() => {
        console.log('✅ Serveur fermé proprement');
        process.exit(0);
    });
});

process.on('unhandledRejection', (err) => {
    console.error('❌ Erreur non gérée:', err);
});