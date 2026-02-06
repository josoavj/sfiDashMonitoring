const morgan = require('morgan');

/**
 * Configuration Morgan personnalisée
 * Ne logue pas les headers sensibles (Authorization, Cookie, etc)
 */
function createMorganLogger() {
  // Format personnalisé qui exclut les headers sensibles
  morgan.token('auth', (req) => {
    // Ne pas logger le header Authorization
    return req.headers.authorization ? '***REDACTED***' : '-';
  });

  morgan.token('cookie', (req) => {
    // Ne pas logger les cookies
    return req.headers.cookie ? '***REDACTED***' : '-';
  });

  // Format: IP - METHOD URL STATUS RESPONSE_TIME
  const customFormat = ':remote-addr - :method :url :status :response-time ms';
  
  return morgan(customFormat, {
    skip: (req) => {
      // Ne pas logger les health checks
      return req.path === '/api/health';
    }
  });
}

module.exports = { createMorganLogger };
