const pino = require('pino');
const pinoHttp = require('pino-http');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const isProduction = process.env.NODE_ENV === 'production';
const logFilePath = path.join(logsDir, 'backend.log');

/**
 * Configuration des transports Pino
 * En production : On écrit en JSON dans un fichier via un stream asynchrone.
 * En développement : On utilise pino-pretty pour la lisibilité console.
 */
const transport = pino.transport({
  targets: [
    {
      target: 'pino/file',
      options: { destination: logFilePath, mkdir: true },
      level: isProduction ? 'info' : 'debug'
    },
    ...(isProduction ? [] : [{
      target: 'pino-pretty',
      options: { colorize: true },
      level: 'debug'
    }])
  ]
});

const pinoInstance = pino(
  {
    level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
    base: { pid: process.pid, hostname: 'sfi-backend' },
    timestamp: pino.stdTimeFunctions.isoTime
  },
  transport
);

/**
 * Logger asynchrone ultra-performant
 */
const logger = {
  error: (msg, obj) => pinoInstance.error(obj, msg),
  warn: (msg, obj) => pinoInstance.warn(obj, msg),
  info: (msg, obj) => pinoInstance.info(obj, msg),
  debug: (msg, obj) => pinoInstance.debug(obj, msg),

  logRequest: (method, path, statusCode, duration) => {
    pinoInstance.info({ method, path, statusCode, duration }, 'HTTP Request');
  },

  logApiError: (endpoint, error) => {
    pinoInstance.error({ endpoint, error: error.message, stack: error.stack }, `API Error on ${endpoint}`);
  },

  logDatabase: (action, details) => {
    pinoInstance.info({ action, details }, `Database - ${action}`);
  },

  logElasticsearch: (action, details) => {
    pinoInstance.info({ action, details }, `Elasticsearch - ${action}`);
  }
};

/**
 * Middleware de logging HTTP pour Express (remplace Morgan)
 */
function createMorganLogger() {
  return pinoHttp({
    logger: pinoInstance,
    useLevel: 'info',
    serializers: {
      req: (req) => ({
        method: req.method,
        url: req.url,
        // On masque les headers sensibles
        headers: {
          ...req.headers,
          authorization: req.headers.authorization ? '***REDACTED***' : undefined,
          cookie: req.headers.cookie ? '***REDACTED***' : undefined
        }
      }),
      res: (res) => ({
        statusCode: res.statusCode
      })
    },
    customLogLevel: function (req, res, err) {
      if (res.statusCode >= 400 && res.statusCode < 500) return 'warn';
      if (res.statusCode >= 500 || err) return 'error';
      return 'info';
    },
    // Ne pas logger les health checks pour ne pas polluer
    autoLogging: {
      ignore: (req) => req.url === '/api/health'
    }
  });
}

module.exports = { createMorganLogger, logger, pino: pinoInstance };
