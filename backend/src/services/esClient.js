const { Client } = require('@elastic/elasticsearch');
const fs = require('fs');
const path = require('path');
const CircuitBreaker = require('opossum');
const { logger } = require('../utils/logger');
const metrics = require('./metricsService');

// Timeout par défaut (30 secondes)
const DEFAULT_TIMEOUT = 30000;

/**
 * Wrapper pour ajouter un timeout aux requêtes Elasticsearch
 */
function withTimeout(promise, timeoutMs = DEFAULT_TIMEOUT) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Elasticsearch request timeout after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

function createEsClientFromEnv() {
  const isProduction = (process.env.NODE_ENV || 'development') === 'production';
  const esConfig = {
    node: process.env.ES_NODE || 'https://localhost:9200',
    requestTimeout: process.env.ES_TIMEOUT || DEFAULT_TIMEOUT
  };

  if (process.env.ES_USERNAME) {
    esConfig.auth = {
      username: process.env.ES_USERNAME,
      password: process.env.ES_PASSWORD
    };
  }

  // SSL Configuration
  if (process.env.ES_CERT_PATH) {
    try {
      const caCert = fs.readFileSync(path.resolve(process.env.ES_CERT_PATH));
      esConfig.tls = { ca: caCert, rejectUnauthorized: true };
      logger.info('✅ Certificat SSL chargé depuis:', process.env.ES_CERT_PATH);
    } catch (err) {
      logger.error('❌ Impossible de charger ES_CERT_PATH:', err);
      if (isProduction && process.env.ES_SSL_VERIFY !== 'false') {
        process.exit(1);
      }
      esConfig.tls = { rejectUnauthorized: false };
    }
  } else if (process.env.ES_SSL_VERIFY === 'false') {
    esConfig.tls = { rejectUnauthorized: false };
  }

  const client = new Client(esConfig);

  // Test connection
  client.ping().catch(err => logger.warn('⚠️ Ping Elasticsearch failed:', err.message));

  /**
   * Configuration du Circuit Breaker
   */
  const breakerOptions = {
    timeout: DEFAULT_TIMEOUT,
    errorThresholdPercentage: 50,
    resetTimeout: 30000
  };

  const searchBreaker = new CircuitBreaker(client.search.bind(client), breakerOptions);

  // Initial state
  metrics.circuitBreakerState.set({ name: 'elasticsearch' }, 0); // 0 = Closed

  searchBreaker.on('open', () => {
    logger.warn('🔥 Circuit Breaker OPEN for Elasticsearch');
    metrics.circuitBreakerState.set({ name: 'elasticsearch' }, 2);
  });
  searchBreaker.on('halfOpen', () => {
    logger.info('⏳ Circuit Breaker HALF_OPEN for Elasticsearch');
    metrics.circuitBreakerState.set({ name: 'elasticsearch' }, 1);
  });
  searchBreaker.on('close', () => {
    logger.info('✅ Circuit Breaker CLOSED for Elasticsearch');
    metrics.circuitBreakerState.set({ name: 'elasticsearch' }, 0);
  });
  searchBreaker.on('failure', (err) => {
    metrics.circuitBreakerFailures.inc({ name: 'elasticsearch', type: 'error' });
  });
  searchBreaker.on('timeout', () => {
    metrics.circuitBreakerFailures.inc({ name: 'elasticsearch', type: 'timeout' });
  });

  // Remplacer search par la version protégée avec monitoring
  client.protectedSearch = async (params) => {
    const start = Date.now();
    try {
      const result = await searchBreaker.fire(params);
      const duration = Date.now() - start;
      metrics.elasticsearchRequests.observe(
        { operation: 'search', index: params.index || 'default', status: 'success' },
        duration
      );
      return result;
    } catch (err) {
      const duration = Date.now() - start;
      metrics.elasticsearchRequests.observe(
        { operation: 'search', index: params.index || 'default', status: 'error' },
        duration
      );

      if (err.message === 'Open' || err.message === 'HalfOpen') {
        throw new Error('Le service de recherche est temporairement saturé (Circuit Breaker)');
      }
      throw err;
    }
  };

  client.withTimeout = (promise) => withTimeout(promise, esConfig.requestTimeout);
  
  return client;
}

module.exports = { createEsClientFromEnv, withTimeout };
