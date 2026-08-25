const prometheus = require('prom-client');

/**
 * Métriques Prometheus pour le monitoring
 */

// Collectors par défaut (CPU, mémoire, etc)
prometheus.collectDefaultMetrics({
  prefix: 'sfi_dashboard_'
});

/**
 * Compteurs personnalisés
 */
const httpRequestDuration = new prometheus.Histogram({
  name: 'sfi_dashboard_http_request_duration_ms',
  help: 'Durée des requêtes HTTP en millisecondes',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [10, 50, 100, 500, 1000, 5000]
});

const httpRequestTotal = new prometheus.Counter({
  name: 'sfi_dashboard_http_requests_total',
  help: 'Nombre total de requêtes HTTP',
  labelNames: ['method', 'route', 'status_code']
});

const authAttempts = new prometheus.Counter({
  name: 'sfi_dashboard_auth_attempts_total',
  help: 'Nombre total de tentatives d\'authentification',
  labelNames: ['type', 'success']
});

const elasticsearchRequests = new prometheus.Histogram({
  name: 'sfi_dashboard_elasticsearch_request_duration_ms',
  help: 'Durée des requêtes Elasticsearch',
  labelNames: ['operation', 'index', 'status'],
  buckets: [10, 50, 100, 500, 1000, 5000, 10000]
});

// Métriques Circuit Breaker
const circuitBreakerState = new prometheus.Gauge({
  name: 'sfi_dashboard_circuit_breaker_state',
  help: 'État du Circuit Breaker (0: Closed, 1: Half-Open, 2: Open)',
  labelNames: ['name']
});

const circuitBreakerFailures = new prometheus.Counter({
  name: 'sfi_dashboard_circuit_breaker_failures_total',
  help: 'Nombre total d\'échecs interceptés par le Circuit Breaker',
  labelNames: ['name', 'type'] // type: error, timeout, fallback
});

// Métriques Cache
const cacheHitsTotal = new prometheus.Counter({
  name: 'sfi_dashboard_cache_hits_total',
  help: 'Nombre total de hits dans le cache Redis',
  labelNames: ['cache_name']
});

const cacheMissesTotal = new prometheus.Counter({
  name: 'sfi_dashboard_cache_misses_total',
  help: 'Nombre total de misses dans le cache Redis',
  labelNames: ['cache_name']
});

const activeConnections = new prometheus.Gauge({
  name: 'sfi_dashboard_active_connections',
  help: 'Nombre de connexions WebSocket actives'
});

const databaseConnections = new prometheus.Gauge({
  name: 'sfi_dashboard_database_connections',
  help: 'Nombre de connexions à la base de données',
  labelNames: ['status']
});

/**
 * Middleware Prometheus pour exporter les métriques
 */
function metricsMiddleware(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const route = req.route?.path || req.path;
    
    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode },
      duration
    );
    
    httpRequestTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode
    });
  });
  
  next();
}

/**
 * Endpoint Prometheus pour scraper les métriques
 */
function setupMetricsEndpoint(app) {
  app.get('/metrics', async (req, res) => {
    try {
      res.set('Content-Type', prometheus.register.contentType);
      res.end(await prometheus.register.metrics());
    } catch (err) {
      console.error('Prometheus metrics error:', err);
      res.status(500).end(err);
    }
  });
}

module.exports = {
  metricsMiddleware,
  setupMetricsEndpoint,
  httpRequestDuration,
  httpRequestTotal,
  authAttempts,
  elasticsearchRequests,
  circuitBreakerState,
  circuitBreakerFailures,
  cacheHitsTotal,
  cacheMissesTotal,
  activeConnections,
  databaseConnections
};
