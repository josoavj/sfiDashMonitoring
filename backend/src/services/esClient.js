const { Client } = require('@elastic/elasticsearch');
const fs = require('fs');
const path = require('path');

function createEsClientFromEnv() {
  const esConfig = {
    node: process.env.ES_NODE || 'https://localhost:9200'
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
  return client;
}

module.exports = { createEsClientFromEnv };
