let pollingInterval = null;
let connectedClients = 0;
let lastCheckTimestamp = new Date();

async function fetchNewLogs(esClient, index = process.env.ES_INDEX || 'filebeat-*') {
  try {
    const now = new Date();
    const result = await esClient.search({
      index,
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
  } catch (err) {
    console.error('Erreur fetchNewLogs:', err.message);
    return [];
  }
}

function startLogStreaming(io, esClient, intervalMs = 2000) {
  if (pollingInterval) return;
  pollingInterval = setInterval(async () => {
    if (connectedClients === 0) return;
    const newLogs = await fetchNewLogs(esClient);
    if (newLogs.length > 0) {
      io.emit('new-logs', { logs: newLogs, count: newLogs.length, timestamp: new Date().toISOString() });
      console.log(`📡 ${newLogs.length} nouveaux logs envoyés`);
    }
  }, intervalMs);
}

function stopLogStreaming() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}

function clientConnected(io) {
  connectedClients++;
  if (connectedClients === 1) {
    lastCheckTimestamp = new Date();
    // caller should start streaming
  }
}

function clientDisconnected() {
  connectedClients--;
  if (connectedClients < 0) connectedClients = 0;
}

function getStatus() {
  return { connectedClients, streamingActive: pollingInterval !== null };
}

module.exports = { startLogStreaming, stopLogStreaming, fetchNewLogs, clientConnected, clientDisconnected, getStatus };
