const bcrypt = require('bcrypt');
const { authenticate } = require('../middlewares/authMiddleware');
const { User } = require('../models/User');
const { Setting } = require('../models/Setting');

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

  app.post('/api/ip-stats', async (req, res) => {
    try {
      const { timeRange, ip, field = 'source.ip' } = req.body;
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
            doc_count_agg: { value_count: { field: '_id' } },
            total_bytes: { sum: { field: 'network.bytes' } },
            avg_bytes: { avg: { field: 'network.bytes' } }
          }
        }
      });

      res.json({
        count: result.aggregations.doc_count_agg.value || 0,
        total_bytes: result.aggregations.total_bytes.value || 0,
        avg_bytes: result.aggregations.avg_bytes.value || 0
      });
    } catch (err) {
      console.error('Erreur ip-stats:', err.message);
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

  // --- Persistent endpoints (Sequelize-backed) ---
  // Users: require admin role for listing/creating/deleting
  app.get('/api/users', authenticate, async (req, res) => {
    try {
      const requester = req.user?.sub ? await User.findByPk(req.user.sub) : null;
      if (!requester || requester.role !== 'admin') return res.status(403).json({ error: 'Admin required' });
      const users = await User.findAll({ attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'createdAt'] });
      res.json({ users });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/users', authenticate, async (req, res) => {
    try {
      const requester = req.user?.sub ? await User.findByPk(req.user.sub) : null;
      if (!requester || requester.role !== 'admin') return res.status(403).json({ error: 'Admin required' });
      const { firstName, lastName, email, password, role = 'user' } = req.body;
      if (!email || !password || !firstName) return res.status(400).json({ error: 'firstName, email and password required' });
      const hashed = await bcrypt.hash(password, 10);
      const user = await User.create({ firstName, lastName, email, password: hashed, role });
      res.status(201).json({ id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role, createdAt: user.createdAt });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/users/:id', authenticate, async (req, res) => {
    try {
      const requester = req.user?.sub ? await User.findByPk(req.user.sub) : null;
      if (!requester || requester.role !== 'admin') return res.status(403).json({ error: 'Admin required' });
      const id = Number(req.params.id);
      const user = await User.findByPk(id);
      if (!user) return res.status(404).json({ error: 'user not found' });
      await user.destroy();
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Settings: key/value persisted in Settings table (admin only)
  app.get('/api/settings', authenticate, async (req, res) => {
    try {
      const requester = req.user?.sub ? await User.findByPk(req.user.sub) : null;
      if (!requester || requester.role !== 'admin') return res.status(403).json({ error: 'Admin required' });
      const entries = await Setting.findAll();
      const settings = {};
      entries.forEach(e => { settings[e.key] = e.value; });
      res.json(settings);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/settings', authenticate, async (req, res) => {
    try {
      const requester = req.user?.sub ? await User.findByPk(req.user.sub) : null;
      if (!requester || requester.role !== 'admin') return res.status(403).json({ error: 'Admin required' });
      const body = req.body || {};
      // accept either { key: value } pairs or { entries: [{key, value}, ...] }
      if (Array.isArray(body.entries)) {
        for (const e of body.entries) await Setting.upsert({ key: e.key, value: e.value });
      } else {
        for (const [k, v] of Object.entries(body)) {
          await Setting.upsert({ key: k, value: v });
        }
      }
      const entries = await Setting.findAll();
      const settings = {};
      entries.forEach(e => { settings[e.key] = e.value; });
      res.json(settings);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Current user endpoints (uses JWT from authenticate)
  app.get('/api/me', authenticate, async (req, res) => {
    try {
      const uid = req.user?.sub;
      if (!uid) return res.status(401).json({ error: 'Missing user' });
      const user = await User.findByPk(uid, { attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'createdAt'] });
      res.json({ user });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/me', authenticate, async (req, res) => {
    try {
      const uid = req.user?.sub;
      if (!uid) return res.status(401).json({ error: 'Missing user' });
      const body = req.body || {};
      const allowed = ['firstName', 'lastName', 'email', 'password'];
      const updateData = {};
      for (const k of allowed) {
        if (body[k] !== undefined) {
          if (k === 'password') updateData.password = await bcrypt.hash(body.password, 10);
          else updateData[k] = body[k];
        }
      }
      await User.update(updateData, { where: { id: uid } });
      const user = await User.findByPk(uid, { attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'createdAt'] });
      res.json({ user });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Reports: Generate comprehensive network consumption report
  app.post('/api/reports/generate', async (req, res) => {
    try {
      const { timeRange, limit = 20, includeServices = true } = req.body;
      if (!timeRange?.from || !timeRange?.to) {
        return res.status(400).json({ error: 'timeRange.from and timeRange.to required' });
      }

      // Fetch top IPs by total bytes
      const topIPsRes = await esClient.search({
        index: process.env.ES_INDEX || 'filebeat-*',
        body: {
          size: 0,
          query: {
            range: { '@timestamp': { gte: timeRange.from, lte: timeRange.to } }
          },
          aggs: {
            top_ips: {
              terms: { field: 'source.ip', size: limit },
              aggs: {
                total_bytes: { sum: { field: 'network.bytes' } },
                sent_bytes: { sum: { field: 'source.bytes' } },
                received_bytes: { sum: { field: 'destination.bytes' } },
                connections: { cardinality: { field: 'destination.ip' } }
              }
            }
          }
        }
      });

      // Calculate total bytes for percentage
      let totalNetworkBytes = 0;
      const topIPs = (topIPsRes.aggregations?.top_ips?.buckets || []).map((b) => {
        const bytes = b.total_bytes?.value || 0;
        totalNetworkBytes += bytes;
        return {
          ip: b.key,
          bytes,
          bandwidth: (b.sent_bytes?.value || 0) + (b.received_bytes?.value || 0),
          connections: b.connections?.value || 0
        };
      });

      // Add percentages
      const topIPsWithPercentage = topIPs.map((ip) => ({
        ...ip,
        percentage: totalNetworkBytes > 0 ? (ip.bytes / totalNetworkBytes) * 100 : 0
      }));

      // Fetch top services if requested
      let topServices = [];
      if (includeServices) {
        const topServicesRes = await esClient.search({
          index: process.env.ES_INDEX || 'filebeat-*',
          body: {
            size: 0,
            query: {
              range: { '@timestamp': { gte: timeRange.from, lte: timeRange.to } }
            },
            aggs: {
              top_services: {
                terms: { field: 'network.application', size: 20 },
                aggs: {
                  total_bytes: { sum: { field: 'network.bytes' } },
                  connections: { cardinality: { field: 'destination.ip' } }
                }
              }
            }
          }
        });

        topServices = (topServicesRes.aggregations?.top_services?.buckets || []).map((b) => ({
          name: b.key || 'Inconnu',
          bytes: b.total_bytes?.value || 0,
          bandwidth: (b.total_bytes?.value || 0) / ((Date.parse(timeRange.to) - Date.parse(timeRange.from)) / 1000 || 1),
          connections: b.connections?.value || 0
        }));
      }

      // Calculate summary statistics
      const totalBytes = topIPsWithPercentage.reduce((sum, ip) => sum + ip.bytes, 0);
      const totalConnections = topIPsWithPercentage.reduce((sum, ip) => sum + ip.connections, 0);
      const timeDiffSeconds = (new Date(timeRange.to) - new Date(timeRange.from)) / 1000;
      const avgBandwidth = totalBytes / (timeDiffSeconds || 1);

      res.json({
        topIPs: topIPsWithPercentage,
        topServices,
        summary: {
          totalBytes,
          totalConnections,
          avgBandwidth,
          timePeriod: `${new Date(timeRange.from).toLocaleString('fr-FR')} - ${new Date(timeRange.to).toLocaleString('fr-FR')}`
        }
      });
    } catch (err) {
      console.error('Erreur generate report:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // Advanced exploration search with multiple filters
  app.post('/api/exploration/search', async (req, res) => {
    try {
      const {
        timeRange,
        sourceIp,
        sourcePort,
        from = 0,
        size = 50,
        sortField = '@timestamp',
        sortOrder = 'desc'
      } = req.body;

      const filterClauses = [];

      // Time range filter (required)
      if (timeRange?.from && timeRange?.to) {
        filterClauses.push({
          range: { '@timestamp': { gte: timeRange.from, lte: timeRange.to } }
        });
      }

      // Source IP filter (primary filter)
      if (sourceIp) {
        filterClauses.push({ term: { 'source.ip': sourceIp } });
      }

      // Source port filter (optional)
      if (sourcePort) {
        filterClauses.push({ term: { 'source.port': parseInt(sourcePort) } });
      }

      const result = await esClient.search({
        index: process.env.ES_INDEX || 'filebeat-*',
        from,
        size,
        body: {
          query: {
            bool: {
              filter: filterClauses.length > 0 ? filterClauses : [{ match_all: {} }]
            }
          },
          sort: [{ [sortField]: { order: sortOrder } }]
        }
      });

      // Log first document to see structure
      if (result.hits.hits.length > 0) {
        console.log('📊 Sample document:', JSON.stringify({
          source_ip: result.hits.hits[0]._source.source?.ip,
          source_port: result.hits.hits[0]._source.source?.port,
          dest_ip: result.hits.hits[0]._source.destination?.ip,
          dest_port: result.hits.hits[0]._source.destination?.port,
          network_bytes: result.hits.hits[0]._source.network?.bytes,
          network_protocol: result.hits.hits[0]._source.network?.protocol,
          application_service: result.hits.hits[0]._source.fortinet?.firewall?.dstinetsvc || result.hits.hits[0]._source.rule?.name || 'Unknown'
        }, null, 2));
      }

      res.json({
        total: result.hits.total.value,
        hits: result.hits.hits,
        took: result.took
      });
    } catch (err) {
      console.error('Erreur exploration search:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // Get aggregated stats for exploration search (for ALL results, not just paginated ones)
  app.post('/api/exploration/stats', async (req, res) => {
    try {
      const {
        timeRange,
        sourceIp,
        sourcePort
      } = req.body;

      const filterClauses = [];

      // Time range filter (required)
      if (timeRange?.from && timeRange?.to) {
        filterClauses.push({
          range: { '@timestamp': { gte: timeRange.from, lte: timeRange.to } }
        });
      }

      // Source IP filter (primary filter)
      if (sourceIp) {
        filterClauses.push({ term: { 'source.ip': sourceIp } });
      }

      // Source port filter (optional)
      if (sourcePort) {
        filterClauses.push({ term: { 'source.port': parseInt(sourcePort) } });
      }

      const result = await esClient.search({
        index: process.env.ES_INDEX || 'filebeat-*',
        size: 0,  // No documents needed, just aggregations
        body: {
          query: {
            bool: {
              filter: filterClauses.length > 0 ? filterClauses : [{ match_all: {} }]
            }
          },
          aggs: {
            total_bytes: { sum: { field: 'network.bytes' } },
            total_packets: { value_count: { field: '@timestamp' } },
            unique_applications: { cardinality: { field: 'fortinet.firewall.dstinetsvc', precision_threshold: 1000 } }
          }
        }
      });

      const totalBytes = result.aggregations.total_bytes.value || 0;
      const totalPackets = result.aggregations.total_packets.value || 0;
      const uniqueApplications = result.aggregations.unique_applications.value || 0;

      res.json({
        totalBytes,
        avgBytes: totalPackets > 0 ? Math.round(totalBytes / totalPackets) : 0,
        uniqueServices: uniqueApplications,
        packetCount: totalPackets
      });
    } catch (err) {
      console.error('Erreur exploration stats:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // IP range search
  app.post('/api/exploration/ip-range', async (req, res) => {
    try {
      const {
        timeRange,
        startIp,
        endIp,
        field = 'source.ip',
        from = 0,
        size = 50,
        sortField = '@timestamp',
        sortOrder = 'desc'
      } = req.body;

      if (!startIp || !endIp) {
        return res.status(400).json({ error: 'startIp and endIp are required' });
      }

      // Convert IP strings to numbers for comparison
      const ipToNumber = (ip) => {
        const parts = ip.split('.');
        return (parseInt(parts[0]) * 16777216) + (parseInt(parts[1]) * 65536) + (parseInt(parts[2]) * 256) + parseInt(parts[3]);
      };

      const startNum = ipToNumber(startIp);
      const endNum = ipToNumber(endIp);

      // Build IP range filter for Elasticsearch
      const filterClauses = [];

      // Time range filter (required)
      if (timeRange?.from && timeRange?.to) {
        filterClauses.push({
          range: { '@timestamp': { gte: timeRange.from, lte: timeRange.to } }
        });
      }

      // IP range filter - use range query instead of post-processing
      filterClauses.push({
        range: { [field]: { gte: startIp, lte: endIp } }
      });

      // Search documents in IP range
      const result = await esClient.search({
        index: process.env.ES_INDEX || 'filebeat-*',
        from,
        size,
        body: {
          query: {
            bool: {
              filter: filterClauses.length > 0 ? filterClauses : [{ match_all: {} }]
            }
          },
          sort: [{ [sortField]: { order: sortOrder } }]
        }
      });

      // Log sample document
      if (result.hits.hits.length > 0) {
        console.log('📊 IP Range Sample document:', JSON.stringify({
          source_ip: result.hits.hits[0]._source.source?.ip,
          source_port: result.hits.hits[0]._source.source?.port,
          dest_ip: result.hits.hits[0]._source.destination?.ip,
          dest_port: result.hits.hits[0]._source.destination?.port,
          network_bytes: result.hits.hits[0]._source.network?.bytes,
          network_protocol: result.hits.hits[0]._source.network?.protocol
        }, null, 2));
      }

      res.json({
        total: result.hits.total.value,
        hits: result.hits.hits,
        took: result.took
      });
    } catch (err) {
      console.error('Erreur IP range search:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // Get aggregated stats for IP range search
  app.post('/api/exploration/ip-range-stats', async (req, res) => {
    try {
      const {
        timeRange,
        startIp,
        endIp,
        field = 'source.ip'
      } = req.body;

      if (!startIp || !endIp) {
        return res.status(400).json({ error: 'startIp and endIp are required' });
      }

      const filterClauses = [];

      // Time range filter (required)
      if (timeRange?.from && timeRange?.to) {
        filterClauses.push({
          range: { '@timestamp': { gte: timeRange.from, lte: timeRange.to } }
        });
      }

      // IP range filter
      filterClauses.push({
        range: { [field]: { gte: startIp, lte: endIp } }
      });

      const result = await esClient.search({
        index: process.env.ES_INDEX || 'filebeat-*',
        size: 0,  // No documents needed, just aggregations
        body: {
          query: {
            bool: {
              filter: filterClauses.length > 0 ? filterClauses : [{ match_all: {} }]
            }
          },
          aggs: {
            total_bytes: { sum: { field: 'network.bytes' } },
            total_packets: { value_count: { field: '@timestamp' } },
            unique_applications: { cardinality: { field: 'fortinet.firewall.dstinetsvc', precision_threshold: 1000 } }
          }
        }
      });

      const totalBytes = result.aggregations.total_bytes.value || 0;
      const totalPackets = result.aggregations.total_packets.value || 0;
      const uniqueApplications = result.aggregations.unique_applications.value || 0;

      res.json({
        totalBytes,
        avgBytes: totalPackets > 0 ? Math.round(totalBytes / totalPackets) : 0,
        uniqueServices: uniqueApplications,
        packetCount: totalPackets
      });
    } catch (err) {
      console.error('Erreur IP range stats:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // Service consumption by port
  app.post('/api/exploration/services-by-port', async (req, res) => {
    try {
      const {
        timeRange,
        port,
        field = 'destination.port'
      } = req.body;

      if (!port) {
        return res.status(400).json({ error: 'port is required' });
      }

      const result = await esClient.search({
        index: process.env.ES_INDEX || 'filebeat-*',
        body: {
          size: 0,
          query: {
            bool: {
              must: [{ term: { [field]: parseInt(port) } }],
              filter: timeRange?.from && timeRange?.to ? [
                { range: { '@timestamp': { gte: timeRange.from, lte: timeRange.to } } }
              ] : []
            }
          },
          aggs: {
            services: {
              terms: { field: 'network.application', size: 20 }
            },
            by_source_ip: {
              terms: { field: 'source.ip', size: 20 },
              aggs: {
                total_bytes: { sum: { field: 'network.bytes' } },
                services: { terms: { field: 'network.application', size: 5 } }
              }
            },
            total_bytes: { sum: { field: 'network.bytes' } },
            avg_bytes: { avg: { field: 'network.bytes' } }
          }
        }
      });

      res.json({
        services: result.aggregations.services.buckets,
        topSources: result.aggregations.by_source_ip.buckets,
        stats: {
          totalBytes: result.aggregations.total_bytes.value,
          avgBytes: Math.round(result.aggregations.avg_bytes.value || 0),
          portQueried: port
        }
      });
    } catch (err) {
      console.error('Erreur services by port:', err.message);
      res.status(500).json({ error: err.message });
    }
  });
}

module.exports = { mountApiRoutes };
