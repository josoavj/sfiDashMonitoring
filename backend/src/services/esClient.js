const { Client } = require('@elastic/elasticsearch');
const fs = require('fs');
const path = require('path');

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
  const esConfig = {
    node: process.env.ES_NODE || 'https://localhost:9200',
    requestTimeout: process.env.ES_TIMEOUT || DEFAULT_TIMEOUT // Timeout au niveau du client
  };

  if (process.env.ES_USERNAME) {
    esConfig.auth = {
      username: process.env.ES_USERNAME,
      password: process.env.ES_PASSWORD
    };
  }

  if (process.env.ES_CERT_PATH) {
    try {
      const caCert = fs.readFileSync(path.resolve(process.env.ES_CERT_PATH));
      esConfig.tls = { ca: caCert, rejectUnauthorized: true };
      console.log('✅ Certificat SSL chargé depuis:', process.env.ES_CERT_PATH);
    } catch (err) {
      console.error('❌ Impossible de charger ES_CERT_PATH:', err.message);
      process.exit(1);
    }
  } else if (process.env.ES_SSL_VERIFY === 'false') {
    esConfig.tls = { rejectUnauthorized: false };
    console.warn('⚠️  Vérification SSL désactivée (DEV seulement)');
  } else if (process.env.ES_FINGERPRINT) {
    esConfig.tls = { ca: undefined, rejectUnauthorized: false };
    esConfig.caFingerprint = process.env.ES_FINGERPRINT;
    console.log('✅ Utilisation du fingerprint SSL');
  }

  const client = new Client(esConfig);
  client.ping().then(() => console.log('✅ Connecté à Elasticsearch')).catch(err => {
    console.warn('⚠️ Ping Elasticsearch failed:', err.message);
  });
  
  // Exposer la fonction withTimeout
  client.withTimeout = (promise) => withTimeout(promise, esConfig.requestTimeout);
  
  return client;
}

module.exports = { createEsClientFromEnv, withTimeout };
