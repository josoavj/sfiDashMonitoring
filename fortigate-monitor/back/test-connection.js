require('dotenv').config();
const { Client } = require('@elastic/elasticsearch');
const fs = require('fs');
const path = require('path');

const esConfig = {
    node: process.env.ES_NODE,
    auth: {
        username: process.env.ES_USERNAME,
        password: process.env.ES_PASSWORD
    }
};

if (process.env.ES_CERT_PATH) {
    const caCert = fs.readFileSync(path.resolve(process.env.ES_CERT_PATH));
    esConfig.tls = { ca: caCert, rejectUnauthorized: true };
    console.log('✅ Certificat chargé:', process.env.ES_CERT_PATH);
} else if (process.env.ES_SSL_VERIFY === 'false') {
    esConfig.tls = { rejectUnauthorized: false };
    console.warn('⚠️  SSL non vérifié');
}

const client = new Client(esConfig);

async function testConnection() {
    console.log('\n🔍 Test de connexion Elasticsearch\n');
    console.log('Configuration:');
    console.log('  Node:', process.env.ES_NODE);
    console.log('  Username:', process.env.ES_USERNAME);
    console.log('  Index:', process.env.ES_INDEX);
    console.log('');

    try {
        // Test ping
        console.log('1️⃣  Test ping...');
        await client.ping();
        console.log('   ✅ Ping réussi\n');

        // Info cluster
        console.log('2️⃣  Informations cluster...');
        const info = await client.info();
        console.log('   Cluster:', info.cluster_name);
        console.log('   Version:', info.version.number);
        console.log('   ✅ Info récupérées\n');

        // Health
        console.log('3️⃣  Santé du cluster...');
        const health = await client.cluster.health();
        console.log('   Status:', health.status);
        console.log('   Nodes:', health.number_of_nodes);
        console.log('   ✅ Health OK\n');

        // Index
        console.log('4️⃣  Liste des index filebeat...');
        const indices = await client.cat.indices({
            index: process.env.ES_INDEX,
            format: 'json'
        });
        console.log('   Trouvés:', indices.length, 'index');
        indices.forEach(idx => {
            console.log(`   - ${idx.index} (${idx['docs.count']} docs)`);
        });
        console.log('   ✅ Index listés\n');

        // Sample
        console.log('5️⃣  Récupération d\'un échantillon...');
        const sample = await client.search({
            index: process.env.ES_INDEX,
            size: 1,
            body: {
                query: { match_all: {} },
                sort: [{ '@timestamp': 'desc' }]
            }
        });

        if (sample.hits.hits.length > 0) {
            console.log('   ✅ Document trouvé');
            console.log('   Timestamp:', sample.hits.hits[0]._source['@timestamp']);
        } else {
            console.log('   ⚠️  Aucun document trouvé');
        }

        console.log('\n✅ TOUS LES TESTS RÉUSSIS !\n');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ ERREUR:', error.message);
        if (error.meta?.body?.error) {
            console.error('\nDétails:', error.meta.body.error);
        }
        process.exit(1);
    }
}

testConnection();