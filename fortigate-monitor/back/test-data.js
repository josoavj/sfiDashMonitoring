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
                console.debug(`   ❌ ${field.padEnd(20)} : ${e.message}`);
            }
        }

        // 2. Analyse détaillée de la bande passante (somme, top sources, histogramme)
        console.log('\n2️⃣ Analyse détaillée de la bande passante:');
        try {
            // Window: De 06h30 aujourd'hui jusqu'à maintenant 
            const now = new Date();
            const start = new Date(now);
            start.setHours(6, 30, 0, 0);
            // If start is in the future (we're before 06:30), use yesterday 06:30
            if (start > now) {
                start.setDate(start.getDate() - 1);
            }
            const range = { gte: start.toISOString(), lte: now.toISOString() };
            const bwAgg = await client.search({
                index: process.env.ES_INDEX,
                size: 0,
                body: {
                    query: { range: { '@timestamp': range } },
                    aggs: {
                        total_bytes: { sum: { field: 'network.bytes' } },
                        avg_bytes: { avg: { field: 'network.bytes' } },
                        top_sources_by_bytes: {
                            terms: { field: 'source.ip', size: 20 },
                            aggs: { bytes: { sum: { field: 'network.bytes' } } }
                        },
                        bandwidth_over_time: {
                            date_histogram: { field: '@timestamp', fixed_interval: '1m' },
                            aggs: { bytes: { sum: { field: 'network.bytes' } } }
                        },
                        by_protocol: { terms: { field: 'network.protocol', size: 20 }, aggs: { bytes: { sum: { field: 'network.bytes' } } } }
                    }
                }
            });

            const tot = bwAgg.aggregations?.total_bytes?.value || 0;
            const avg = bwAgg.aggregations?.avg_bytes?.value || 0;
            console.log(`   → Période analysée: ${start.toLocaleString('fr-FR')} → ${now.toLocaleString('fr-FR')}`);
            console.log(`   → Total octets (network.bytes): ${tot} (${(tot/1024/1024).toFixed(2)} MB)`);
            console.log(`   → Moyenne octets par doc: ${avg.toFixed(2)}`);

            console.log('\n   Top sources par octets:');
            (bwAgg.aggregations?.top_sources_by_bytes?.buckets || []).forEach((b, i) => {
                const bytes = b.bytes?.value || 0;
                console.log(`     ${i+1}. ${b.key} — ${bytes} bytes (${(bytes/1024/1024).toFixed(2)} MB) — docs: ${b.doc_count}`);
            });

            console.log('\n   Bande passante (histogramme 1m — last 1h):');
            (bwAgg.aggregations?.bandwidth_over_time?.buckets || []).slice(-10).forEach(bucket => {
                const bts = bucket.bytes?.value || 0;
                console.log(`     ${bucket.key_as_string} → ${bts} bytes (${(bts/1024).toFixed(1)} KB)`);
            });

            console.log('\n   Par protocole (top 20 by bytes):');
            (bwAgg.aggregations?.by_protocol?.buckets || []).forEach(p => {
                const bts = p.bytes?.value || 0;
                console.log(`     - ${p.key}: ${bts} bytes`);
            });
        } catch (e) {
            console.error('   ❌ Impossible de calculer les agrégations de bande passante:', e.message);
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
        console.log('\n4️⃣  Top 20 IPs sources:');
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
                                terms: { field, size: 20 }
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