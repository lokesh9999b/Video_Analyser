/**
 * Cache utility using node-cache.
 * Used to cache API responses to improve performance and reduce database load.
 */
const NodeCache = require('node-cache');
const logger = require('./logger');

// Cache instance: keys expire after 5 minutes by default, check for expired keys every 2 minutes
const cache = new NodeCache({ stdTTL: 300, checkperiod: 120 });

/**
 * Middleware to cache API responses.
 * Caches based on the request URL (including query params) and the user's organisation.
 * @param {number} duration - Cache duration in seconds (optional, overrides default)
 */
const cacheMiddleware = (duration) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Build a unique cache key based on the organisation and URL
    // This ensures data segregation (tenants don't see each other's cached data)
    const org = req.user ? req.user.organisation : 'public';
    const key = `__express__${org}__${req.originalUrl || req.url}`;

    const cachedBody = cache.get(key);
    if (cachedBody) {
      logger.debug(`Cache hit for ${key}`);
      return res.status(200).json(cachedBody);
    } else {
      logger.debug(`Cache miss for ${key}`);
      // Override res.json to intercept the response body and cache it
      const originalJson = res.json;
      res.json = (body) => {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cache.set(key, body, duration);
        }
        originalJson.call(res, body);
      };
      next();
    }
  };
};

/**
 * Clear all cache entries for a specific organisation.
 * Call this when data changes (e.g., new video uploaded, video deleted).
 * @param {string} organisation - The organisation to clear cache for
 */
const clearCacheForOrg = (organisation) => {
  if (!organisation) return;
  
  const keys = cache.keys();
  const orgKeys = keys.filter((key) => key.startsWith(`__express__${organisation}__`));
  
  if (orgKeys.length > 0) {
    cache.del(orgKeys);
    logger.debug(`Cleared ${orgKeys.length} cache entries for organisation: ${organisation}`);
  }
};

module.exports = {
  cache,
  cacheMiddleware,
  clearCacheForOrg,
};
