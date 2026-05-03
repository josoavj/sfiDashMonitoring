/**
 * Simple in-memory cache for API responses with TTL (Time To Live)
 * Optimizes repeated API calls by caching responses locally
 * 
 * Usage:
 *   apiCache.set(key, response, ttlMs)
 *   apiCache.get(key)  // Returns cached response if not expired
 */

class APICache {
  constructor() {
    this.cache = new Map()
  }

  /**
   * Store a response in cache with TTL
   * @param {string} key - Cache key (usually the URL)
   * @param {any} value - Value to cache (Response object or parsed data)
   * @param {number} ttlMs - Time to live in milliseconds (default: 5 min)
   */
  set(key, value, ttlMs = 300000) {
    const expiresAt = Date.now() + ttlMs
    this.cache.set(key, { value, expiresAt })
  }

  /**
   * Retrieve a cached response if it hasn't expired
   * @param {string} key - Cache key
   * @returns {any|null} Cached value or null if expired/missing
   */
  get(key) {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }
    
    return entry.value
  }

  /**
   * Clear specific cache entry
   * @param {string} key - Cache key to clear
   */
  delete(key) {
    this.cache.delete(key)
  }

  /**
   * Clear entire cache
   */
  clear() {
    this.cache.clear()
  }

  /**
   * Get cache statistics (for debugging)
   */
  getStats() {
    let validCount = 0
    let expiredCount = 0
    const now = Date.now()

    for (const [, entry] of this.cache) {
      if (now > entry.expiresAt) {
        expiredCount++
      } else {
        validCount++
      }
    }

    return {
      totalSize: this.cache.size,
      validEntries: validCount,
      expiredEntries: expiredCount
    }
  }
}

export const apiCache = new APICache()

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  SHORT: 60000,       // 1 minute
  MEDIUM: 300000,     // 5 minutes
  LONG: 900000,       // 15 minutes
  VERY_LONG: 3600000  // 1 hour
}
