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
}

const client = new Client(esConfig);

async function testData() {
    console.log('\n🔍 Analyse des données Fortigate\n');

    try {
        // 1. Échantillon de document
        console.log('1️⃣  Structure d\'un document:');
        const sample = await client.search({
            index: process.env.ES_INDEX,
            size: 1,
            body: {
                query: { match_all: {} },
                sort: [{ '@timestamp': 'desc' }]
            }
        });

        if (sample.hits.hits.length > 0) {
            const doc = sample.hits.hits[0]._source;
            console.log(JSON.stringify(doc, null, 2).substring(0, 500) + '...\n');

            // Lister les champs
            console.log('📋 Champs disponibles:');
            Object.keys(doc).forEach(key => {
                console.log(`   - ${key}`);
            });
        }

        // 2. Champs de bande passante
        console.log('\n2️⃣  Vérification champs de bande passante:');
        const bwFields = ['network.bytes', 'source.bytes', 'destination.bytes', 'bytes', 'sentbyte', 'rcvdbyte'];
        for (const field of bwFields) {
            try {
                const result = await client.search({
                    index: process.env.ES_INDEX,
                    size: 0,
                    body: { query: { exists: { field } } }
                });
                const count = result.hits.total.value;
                if (count > 0) {
                    console.log(`   ✅ ${field.padEnd(20)} : ${count} docs`);
                }
            } catch (e) {
                // Champ n'existe pas
            }
        }

        // 3. Champs d'action
        console.log('\n3️⃣  Actions firewall:');
        const actionFields = ['event.action', 'action', 'status'];
        for (const field of actionFields) {
            try {
                const result = await client.search({
                    index: process.env.ES_INDEX,
                    size: 0,
                    body: {
                        query: { exists: { field } },
                        aggs: {
                            actions: {
                                terms: { field, size: 10 }
                            }
                        }
                    }
                });
                const count = result.hits.total.value;
                if (count > 0) {
                    console.log(`   ✅ ${field.padEnd(20)} : ${count} docs`);
                    result.aggregations.actions.buckets.forEach(b => {
                        console.log(`      - ${b.key}: ${b.doc_count}`);
                    });
                }
            } catch (e) {
                // Champ n'existe pas
            }
        }

        // 4. Top IPs
        console.log('\n4️⃣  Top 5 IPs sources:');
        const ipFields = ['source.ip', 'srcip', 'src'];
        for (const field of ipFields) {
            try {
                const result = await client.search({
                    index: process.env.ES_INDEX,
                    size: 0,
                    body: {
                        query: { exists: { field } },
                        aggs: {
                            top_ips: {
                                terms: { field, size: 5 }
                            }
                        }
                    }
                });
                if (result.hits.total.value > 0) {
                    console.log(`   Champ: ${field}`);
                    result.aggregations.top_ips.buckets.forEach((ip, idx) => {
                        console.log(`   ${idx + 1}. ${ip.key} : ${ip.doc_count} connexions`);
                    });
                    break;
                }
            } catch (e) {
                // Continue
            }
        }

        // 5. Statistiques globales
        console.log('\n5️⃣  Statistiques globales:');
        const stats = await client.search({
            index: process.env.ES_INDEX,
            size: 0,
            body: {
                query: { match_all: {} },
                aggs: {
                    date_range: {
                        min: { field: '@timestamp' },
                    },
                    date_max: {
                        max: { field: '@timestamp' }
                    }
                }
            }
        });

        console.log('   Total documents:', stats.hits.total.value);
        console.log('   Période:');
        console.log('     - Début:', new Date(stats.aggregations.date_range.value_as_string).toLocaleString('fr-FR'));
        console.log('     - Fin:', new Date(stats.aggregations.date_max.value_as_string).toLocaleString('fr-FR'));

        console.log('\n✅ Analyse terminée !\n');

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    }
}

testData();