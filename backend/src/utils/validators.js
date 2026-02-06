const joi = require('joi');

// Schéma de pagination réutilisable
const paginationSchema = {
  skip: joi.number().min(0).max(100000).default(0),
  limit: joi.number().min(1).max(1000).default(50)
};

// Validateurs pour les endpoints de recherche et statistiques
const validators = {
  searchParams: joi.object({
    query: joi.string().max(500).default('*'),
    from: joi.number().min(0).max(100000).default(0),
    size: joi.number().min(1).max(10000).default(100),
    timeRange: joi.object({
      from: joi.string().iso().required(),
      to: joi.string().iso().required()
    }),
    sortField: joi.string().valid('@timestamp', 'source.ip', 'destination.ip', 'event.action').default('@timestamp'),
    sortOrder: joi.string().valid('asc', 'desc').default('desc')
  }),

  // Pagination pour les users
  usersListParams: joi.object({
    ...paginationSchema
  }),

  // Pagination pour exploration
  explorationSearchParams: joi.object({
    query: joi.string().max(500).required(),
    ...paginationSchema
  }),
    }).required(),
    fields: joi.array().items(joi.string().max(50)).default(['event.action', 'source.ip'])
  }),

  topSourcesParams: joi.object({
    timeRange: joi.object({
      from: joi.string().iso().required(),
      to: joi.string().iso().required()
    }).required(),
    size: joi.number().min(1).max(1000).default(10),
    field: joi.string().valid('source.ip', 'destination.ip', 'source.port', 'destination.port').default('source.ip')
  }),

  bandwidthParams: joi.object({
    timeRange: joi.object({
      from: joi.string().iso().required(),
      to: joi.string().iso().required()
    }).required(),
    interval: joi.string().valid('1m', '5m', '15m', '1h', '1d').default('1m')
  }),

  bandwidthByIpParams: joi.object({
    timeRange: joi.object({
      from: joi.string().iso().required(),
      to: joi.string().iso().required()
    }).required(),
    ip: joi.string().ip({ version: ['ipv4', 'ipv6'] }).required(),
    interval: joi.string().valid('1m', '5m', '15m', '1h', '1d').default('1m'),
    field: joi.string().valid('source.ip', 'destination.ip').default('source.ip')
  }),

  ipStatsParams: joi.object({
    timeRange: joi.object({
      from: joi.string().iso().required(),
      to: joi.string().iso().required()
    }).required(),
    ip: joi.string().ip({ version: ['ipv4', 'ipv6'] }).required(),
    field: joi.string().valid('source.ip', 'destination.ip').default('source.ip')
  }),

  topBandwidthParams: joi.object({
    timeRange: joi.object({
      from: joi.string().iso().required(),
      to: joi.string().iso().required()
    }).required(),
    size: joi.number().min(1).max(1000).default(10),
    type: joi.string().valid('source', 'destination').default('source')
  }),

  protocolsParams: joi.object({
    timeRange: joi.object({
      from: joi.string().iso().required(),
      to: joi.string().iso().required()
    }).required(),
    size: joi.number().min(1).max(1000).default(10)
  }),

  securityEventsParams: joi.object({
    timeRange: joi.object({
      from: joi.string().iso().required(),
      to: joi.string().iso().required()
    }).required()
  })
};

// Middleware de validation réutilisable
function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { stripUnknown: true });
    
    if (error) {
      const messages = error.details.map(detail => `${detail.path.join('.')}: ${detail.message}`).join(', ');
      return res.status(400).json({ error: 'Validation failed', details: messages });
    }
    
    req.body = value;
    next();
  };
}

module.exports = {
  validators,
  validate
};
