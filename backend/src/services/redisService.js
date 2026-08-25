const { createClient } = require('redis');
const { logger } = require('../utils/logger');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const client = createClient({
  url: REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        logger.error('Redis max reconnection retries reached');
        return new Error('Redis max reconnection retries reached');
      }
      return Math.min(retries * 100, 3000);
    }
  }
});

client.on('error', (err) => logger.error('Redis Client Error', err));
client.on('connect', () => logger.info('✅ Connected to Redis'));

/**
 * Initialisation de la connexion Redis
 */
async function initRedis() {
  try {
    if (!client.isOpen) {
      await client.connect();
    }
  } catch (err) {
    logger.error('Failed to connect to Redis', err);
  }
}

/**
 * Récupérer une valeur du cache
 */
async function getCache(key) {
  try {
    if (!client.isOpen) return null;
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (err) {
    logger.warn(`Redis get error for key ${key}`, err);
    return null;
  }
}

/**
 * Stocker une valeur en cache avec TTL (Time To Live)
 */
async function setCache(key, value, ttlSeconds = 60) {
  try {
    if (!client.isOpen) return false;
    await client.set(key, JSON.stringify(value), {
      EX: ttlSeconds
    });
    return true;
  } catch (err) {
    logger.warn(`Redis set error for key ${key}`, err);
    return false;
  }
}

/**
 * Supprimer une clé du cache
 */
async function delCache(key) {
  try {
    if (!client.isOpen) return false;
    await client.del(key);
    return true;
  } catch (err) {
    logger.warn(`Redis del error for key ${key}`, err);
    return false;
  }
}

module.exports = {
  initRedis,
  getCache,
  setCache,
  delCache,
  redisClient: client
};
