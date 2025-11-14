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
      // Compute simple bandwidth deltas from the new logs and emit a lightweight bandwidth event
      try {
        const sumTotal = newLogs.reduce((s, h) => s + (h._source?.network?.bytes || 0), 0);
        const sumSent = newLogs.reduce((s, h) => s + (h._source?.source?.bytes || 0), 0);
        const sumReceived = newLogs.reduce((s, h) => s + (h._source?.destination?.bytes || 0), 0);

        if (sumTotal > 0 || sumSent > 0 || sumReceived > 0) {
          io.emit('bandwidth', { timestamp: new Date().toISOString(), totalBytes: sumTotal, sentBytes: sumSent, receivedBytes: sumReceived, intervalMs });
          const bySource = {};
          for (const h of newLogs) {
            const ip = h._source?.source?.ip || h._source?.host?.ip || 'unknown';
            const bytes = h._source?.network?.bytes || 0;
            if (!bySource[ip]) bySource[ip] = { bytes: 0, count: 0 };
            bySource[ip].bytes += bytes;
            bySource[ip].count += 1;
          }

          const top = Object.keys(bySource).map(ip => ({ ip, bytes: bySource[ip].bytes, count: bySource[ip].count })).sort((a, b) => b.bytes - a.bytes).slice(0, 10);
          const byProtocol = {};
          const byApp = {};
          for (const h of newLogs) {
            const proto = h._source?.network?.protocol || 'unknown';
            const app = h._source?.network?.application || h._source?.process?.name || (h._source?.destination?.port ? `port:${h._source.destination.port}` : 'unknown');
            const bytes = h._source?.network?.bytes || 0;
            if (!byProtocol[proto]) byProtocol[proto] = { bytes: 0, count: 0 };
            if (!byApp[app]) byApp[app] = { bytes: 0, count: 0 };
            byProtocol[proto].bytes += bytes;
            byProtocol[proto].count += 1;
            byApp[app].bytes += bytes;
            byApp[app].count += 1;
          }

          const topProtocols = Object.keys(byProtocol).map(k => ({ protocol: k, bytes: byProtocol[k].bytes, count: byProtocol[k].count })).sort((a, b) => b.bytes - a.bytes).slice(0, 10);
          const topApplications = Object.keys(byApp).map(k => ({ name: k, bytes: byApp[k].bytes, count: byApp[k].count })).sort((a, b) => b.bytes - a.bytes).slice(0, 10);

          io.emit('top-bandwidth', { timestamp: new Date().toISOString(), intervalMs, top, topProtocols, topApplications });
          console.log(`📶 Bandwidth delta envoyé: total ${sumTotal} bytes (sent ${sumSent} / recv ${sumReceived}), top=${top.length}`);
        }
      } catch (err) {
        console.error('Erreur en calculant bandwidth delta:', err?.message || err);
      }
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
