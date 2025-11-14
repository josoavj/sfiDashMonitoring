function mountApiRoutes(app, esClient, logService) {
  // health
  app.get('/api/health', async (req, res) => {
    try {
      const health = await esClient.cluster.health();
      const info = await esClient.info();
      res.json({
        cluster: health,
        elasticsearch: { version: info.version.number, cluster_name: info.cluster_name },
        websocket: logService.getStatus()
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/search', async (req, res) => {
    try {
      const { query = '*', from = 0, size = 100, timeRange, sortField = '@timestamp', sortOrder = 'desc' } = req.body;
      const mustClauses = [];
      const filterClauses = [];

      if (timeRange?.from && timeRange?.to) {
        filterClauses.push({ range: { '@timestamp': { gte: timeRange.from, lte: timeRange.to } } });
      }

      if (query && query !== '*') {
        mustClauses.push({ query_string: { query, default_operator: 'AND' } });
      }

      const result = await esClient.search({
        index: process.env.ES_INDEX || 'filebeat-*',
        from,
        size,
        body: {
          query: { bool: { must: mustClauses.length > 0 ? mustClauses : [{ match_all: {} }], filter: filterClauses } },
          sort: [{ [sortField]: { order: sortOrder } }]
        }
      });

      res.json({ total: result.hits.total.value, hits: result.hits.hits, took: result.took });
    } catch (err) {
      console.error('Erreur search:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/stats', async (req, res) => {
    try {
      const { timeRange, fields = ['event.action', 'source.ip'] } = req.body;
      const aggs = { timeline: { date_histogram: { field: '@timestamp', fixed_interval: '1h' } } };
      fields.forEach(field => { aggs[field.replace(/\./g, '_')] = { terms: { field, size: 10 } }; });

      const result = await esClient.search({ index: process.env.ES_INDEX || 'filebeat-*', body: { size: 0, query: { range: { '@timestamp': { gte: timeRange.from, lte: timeRange.to } } }, aggs } });

      res.json({ timeline: result.aggregations.timeline.buckets, stats: Object.keys(result.aggregations).filter(k => k !== 'timeline').reduce((acc, key) => { acc[key] = result.aggregations[key].buckets; return acc; }, {}) });
    } catch (err) {
      console.error('Erreur stats:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/top-sources', async (req, res) => {
    try {
      const { timeRange, size = 10, field = 'source.ip' } = req.body;
      const result = await esClient.search({ index: process.env.ES_INDEX || 'filebeat-*', body: { size: 0, query: { range: { '@timestamp': { gte: timeRange.from, lte: timeRange.to } } }, aggs: { top_sources: { terms: { field, size } } } } });
      res.json(result.aggregations.top_sources.buckets);
    } catch (err) {
      console.error('Erreur top-sources:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/bandwidth', async (req, res) => {
    try {
      const { timeRange, interval = '1m' } = req.body;
      const result = await esClient.search({
        index: process.env.ES_INDEX || 'filebeat-*',
        body: {
          size: 0,
          query: { range: { '@timestamp': { gte: timeRange.from, lte: timeRange.to } } },
          aggs: {
            bandwidth_over_time: { date_histogram: { field: '@timestamp', fixed_interval: interval }, aggs: { total_bytes: { sum: { field: 'network.bytes' } }, sent_bytes: { sum: { field: 'source.bytes' } }, received_bytes: { sum: { field: 'destination.bytes' } } } },
            total_traffic: { sum: { field: 'network.bytes' } },
            avg_packet_size: { avg: { field: 'network.bytes' } }
          }
        }
      });

      res.json({ timeline: result.aggregations.bandwidth_over_time.buckets, total: result.aggregations.total_traffic.value || 0, average: result.aggregations.avg_packet_size.value || 0 });
    } catch (err) {
      console.error('Erreur bandwidth:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/bandwidth-by-ip', async (req, res) => {
    try {
      const { timeRange, interval = '1m', ip, field = 'source.ip' } = req.body;
      if (!ip) return res.status(400).json({ error: 'ip required' });

      const result = await esClient.search({
        index: process.env.ES_INDEX || 'filebeat-*',
        body: {
          size: 0,
          query: {
            bool: {
              must: [ { term: { [field]: ip } } ],
              filter: { range: { '@timestamp': { gte: timeRange.from, lte: timeRange.to } } }
            }
          },
          aggs: {
            bandwidth_over_time: { date_histogram: { field: '@timestamp', fixed_interval: interval }, aggs: { total_bytes: { sum: { field: 'network.bytes' } }, sent_bytes: { sum: { field: 'source.bytes' } }, received_bytes: { sum: { field: 'destination.bytes' } } } }
          }
        }
      });

      res.json({ timeline: result.aggregations.bandwidth_over_time.buckets });
    } catch (err) {
      console.error('Erreur bandwidth-by-ip:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/top-bandwidth', async (req, res) => {
    try {
      const { timeRange, size = 10, type = 'source' } = req.body;
      const field = type === 'source' ? 'source.ip' : 'destination.ip';
      const result = await esClient.search({ index: process.env.ES_INDEX || 'filebeat-*', body: { size: 0, query: { range: { '@timestamp': { gte: timeRange.from, lte: timeRange.to } } }, aggs: { top_consumers: { terms: { field, size, order: { total_bytes: 'desc' } }, aggs: { total_bytes: { sum: { field: 'network.bytes' } }, connection_count: { value_count: { field } } } } } } });
      res.json(result.aggregations.top_consumers.buckets);
    } catch (err) {
      console.error('Erreur top-bandwidth:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/protocols', async (req, res) => {
    try {
      const { timeRange, size = 10 } = req.body;
      const result = await esClient.search({ index: process.env.ES_INDEX || 'filebeat-*', body: { size: 0, query: { range: { '@timestamp': { gte: timeRange.from, lte: timeRange.to } } }, aggs: { by_protocol: { terms: { field: 'network.protocol', size } }, by_destination_port: { terms: { field: 'destination.port', size }, aggs: { bytes: { sum: { field: 'network.bytes' } } } }, by_application: { terms: { field: 'network.application', size } } } } });
      res.json({ protocols: result.aggregations.by_protocol.buckets, ports: result.aggregations.by_destination_port.buckets, applications: result.aggregations.by_application.buckets });
    } catch (err) {
      console.error('Erreur protocols:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/security-events', async (req, res) => {
    try {
      const { timeRange } = req.body;
      const result = await esClient.search({ index: process.env.ES_INDEX || 'filebeat-*', body: { size: 0, query: { range: { '@timestamp': { gte: timeRange.from, lte: timeRange.to } } }, aggs: { by_action: { terms: { field: 'event.action', size: 20 } }, denied_connections: { filter: { terms: { 'event.action': ['deny', 'block', 'drop'] } }, aggs: { top_denied_ips: { terms: { field: 'source.ip', size: 10 } } } }, allowed_connections: { filter: { terms: { 'event.action': ['allow', 'accept', 'permit'] } } } } } });
      res.json({ actions: result.aggregations.by_action.buckets, denied: result.aggregations.denied_connections.doc_count, allowed: result.aggregations.allowed_connections.doc_count, top_denied_ips: result.aggregations.denied_connections.top_denied_ips?.buckets || [] });
    } catch (err) {
      console.error('Erreur security-events:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/indices', async (req, res) => {
    try {
      const indices = await esClient.cat.indices({ format: 'json' });
      res.json(indices.filter(idx => idx.index && idx.index.startsWith('filebeat')));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/consumer-samples', async (req, res) => {
    try {
      const { timeRange, ip, field = 'source.ip', size = 3 } = req.body;
      if (!ip) return res.status(400).json({ error: 'ip required' });
      const result = await esClient.search({ index: process.env.ES_INDEX || 'filebeat-*', body: { size, sort: [{ '@timestamp': { order: 'desc' } }], query: { bool: { must: [{ term: { [field]: ip } } ], filter: timeRange && timeRange.from && timeRange.to ? [{ range: { '@timestamp': { gte: timeRange.from, lte: timeRange.to } } }] : [] } } } });
      res.json({ hits: result.hits.hits });
    } catch (err) {
      console.error('Erreur consumer-samples:', err.message);
      res.status(500).json({ error: err.message });
    }
  });
}

module.exports = { mountApiRoutes };
