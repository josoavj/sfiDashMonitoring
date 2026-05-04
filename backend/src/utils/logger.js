const fs = require('fs')
const path = require('path')
const morgan = require('morgan')

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../..', 'logs')
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

const logFilePath = path.join(logsDir, 'backend.log')

/**
 * Log levels
 */
const LogLevel = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
}

/**
 * Format timestamp for logs
 */
function getTimestamp() {
  return new Date().toISOString()
}

/**
 * Format log message
 */
function formatLog(level, message, data = null) {
  const timestamp = getTimestamp()
  let logMessage = `[${timestamp}] [${level}] ${message}`
  
  if (data) {
    logMessage += ` ${typeof data === 'string' ? data : JSON.stringify(data)}`
  }
  
  return logMessage
}

/**
 * Write to log file and console
 */
function writeLog(level, message, data = null) {
  const formattedLog = formatLog(level, message, data)
  
  // Write to file
  try {
    fs.appendFileSync(logFilePath, formattedLog + '\n', 'utf8')
  } catch (err) {
    console.error('Failed to write to log file:', err)
  }
  
  // Also output to console for development
  const logFunction = level === LogLevel.ERROR ? console.error : 
                     level === LogLevel.WARN ? console.warn : 
                     console.log
  logFunction(formattedLog)
}

/**
 * Logger object with utility methods
 */
const logger = {
  error: (message, data) => writeLog(LogLevel.ERROR, message, data),
  warn: (message, data) => writeLog(LogLevel.WARN, message, data),
  info: (message, data) => writeLog(LogLevel.INFO, message, data),
  debug: (message, data) => writeLog(LogLevel.DEBUG, message, data),
  
  /**
   * Log HTTP request
   */
  logRequest: (method, path, statusCode, duration) => {
    const message = `${method} ${path} - ${statusCode} (${duration}ms)`
    writeLog(LogLevel.INFO, message)
  },
  
  /**
   * Log API error
   */
  logApiError: (endpoint, error) => {
    const message = `API Error on ${endpoint}`
    writeLog(LogLevel.ERROR, message, {
      error: error.message,
      stack: error.stack
    })
  },
  
  /**
   * Log database event
   */
  logDatabase: (action, details) => {
    const message = `Database - ${action}`
    writeLog(LogLevel.INFO, message, details)
  },
  
  /**
   * Log Elasticsearch event
   */
  logElasticsearch: (action, details) => {
    const message = `Elasticsearch - ${action}`
    writeLog(LogLevel.INFO, message, details)
  }
}

/**
 * Configuration Morgan personnalisée
 * Ne logue pas les headers sensibles (Authorization, Cookie, etc)
 */
function createMorganLogger() {
  // Format personnalisé qui exclut les headers sensibles
  morgan.token('auth', (req) => {
    // Ne pas logger le header Authorization
    return req.headers.authorization ? '***REDACTED***' : '-'
  })

  morgan.token('cookie', (req) => {
    // Ne pas logger les cookies
    return req.headers.cookie ? '***REDACTED***' : '-'
  })

  // Format: IP - METHOD URL STATUS RESPONSE_TIME
  const customFormat = ':remote-addr - :method :url :status :response-time ms'
  
  return morgan(customFormat, {
    skip: (req) => {
      // Ne pas logger les health checks
      return req.path === '/api/health'
    },
    // Also log to file
    stream: {
      write: (message) => {
        try {
          fs.appendFileSync(logFilePath, message, 'utf8')
        } catch (err) {
          console.error('Failed to write morgan log:', err)
        }
      }
    }
  })
}

module.exports = { createMorganLogger, logger, LogLevel, writeLog, formatLog }
