require('dotenv').config();
const { Client } = require('@elastic/elasticsearch');
const fs = require('fs');

const esConfig = {
    node: process.env.ES_NODE,
    auth: {
        username: process.env.ES_USERNAME,
        password: process.env.ES_PASSWORD
    }
};

if (process.env.ES_CERT_PATH) {
    const caCert = fs.readFileSync(process.env.ES_CERT_PATH);
    esConfig.tls = { ca: caCert, rejectUnauthorized: true };
}

const client = new Client(esConfig);

async function testData() {
    try {
        // Test 1: Connexion
        console.log('\n🔍 Test 1: Connexion Elasticsearch');
        const info = await client.info();
        console.log('✅ Connecté:', info.cluster_name, '- Version:', info.version.number);

        // Test 2: Liste des index
        console.log('\n🔍 Test 2: Index Filebeat');
        const indices = await client.cat.indices({ index: 'filebeat-*', format: 'json' });
        console.log('✅ Index trouvés:', indices.length);
        indices.forEach(idx => {
            console.log(`  - ${idx.index} (${idx['docs.count']} docs)`);
        });

        // Test 3: Récupérer un échantillon
        console.log('\n🔍 Test 3: Échantillon de logs');
        const sample = await client.search({
            index: 'filebeat-*',
            size: 1,
            body: {
                query: { match_all: {} },
                sort: [{ '@timestamp': 'desc' }]
            }
        });

        if (sample.hits.hits.length > 0) {
            const doc = sample.hits.hits[0]._source;
            console.log('✅ Structure du document:');
            console.log(JSON.stringify(doc, null, 2));

            // Analyser les champs disponibles
            console.log('\n📊 Champs détectés:');
            const fields = Object.keys(doc);
            fields.forEach(field => {
                console.log(`  - ${field}: ${typeof doc[field]}`);
            });
        }

        // Test 4: Vérifier les champs de bande passante
        console.log('\n🔍 Test 4: Champs de bande passante');
        const bandwidthFields = ['network.bytes', 'source.bytes', 'destination.bytes', 'bytes'];
        for (const field of bandwidthFields) {
            const result = await client.search({
                index: 'filebeat-*',
                size: 0,
                body: {
                    query: { exists: { field } }
                }
            });
            console.log(`  ${field}: ${result.hits.total.value} documents`);
        }

        // Test 5: Top IPs
        console.log('\n🔍 Test 5: Top 5 IPs sources');
        const topIPs = await client.search({
            index: 'filebeat-*',
            size: 0,
            body: {
                aggs: {
                    top_ips: {
                        terms: {
                            field: 'source.ip',
                            size: 5
                        }
                    }
                }
            }
        });

        topIPs.aggregations.top_ips.buckets.forEach((ip, idx) => {
            console.log(`  ${idx + 1}. ${ip.key}: ${ip.doc_count} connexions`);
        });

    } catch (error) {
        console.error('❌ Erreur:', error.message);
        if (error.meta?.body) {
            console.error('Détails:', JSON.stringify(error.meta.body, null, 2));
        }
    }
}

testData();