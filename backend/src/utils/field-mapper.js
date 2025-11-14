// Mapper automatique pour les champs Fortigate
const FIELD_MAPPINGS = {
  sourceIP: ['source.ip', 'srcip', 'src'],
  destIP: ['destination.ip', 'dstip', 'dst'],
  bytes: ['network.bytes', 'sentbyte', 'rcvdbyte', 'bytes'],
  destPort: ['destination.port', 'dstport', 'service'],
  protocol: ['network.protocol', 'proto', 'protocol'],
  action: ['event.action', 'action', 'status']
};

async function detectFields(esClient, index) {
  const mapping = await esClient.indices.getMapping({ index });
  const fields = {};

  for (const [key, variants] of Object.entries(FIELD_MAPPINGS)) {
    for (const variant of variants) {
      const exists = await esClient.search({ index, size: 0, body: { query: { exists: { field: variant } } } });
      if (exists.hits.total.value > 0) {
        fields[key] = variant;
        break;
      }
    }
  }

  return fields;
}

module.exports = { detectFields, FIELD_MAPPINGS };
