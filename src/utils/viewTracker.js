// ====================================================
// VIEW TRACKER UTILITY
// ====================================================
// Tracks topic views to prevent counting multiple views
// from the same user within a cooldown period.

// In-memory store for view tracking
// Key: `${topicId}:${visitorKey}`, Value: timestamp
const viewCache = new Map();

// Cooldown period in milliseconds (1 hour = 3600000ms)
const VIEW_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

// Cleanup interval (every 10 minutes)
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;

/**
 * Check if a view should be counted for a visitor
 * @param {string} topicId - The topic ID
 * @param {string} visitorKey - User ID or IP address
 * @returns {boolean} - True if view should be counted
 */
export function shouldCountView(topicId, visitorKey) {
  const cacheKey = `${topicId}:${visitorKey}`;
  const now = Date.now();
  const lastView = viewCache.get(cacheKey);

  if (!lastView || (now - lastView) >= VIEW_COOLDOWN_MS) {
    // Record this view
    viewCache.set(cacheKey, now);
    return true;
  }

  return false;
}

/**
 * Get the cooldown period in hours (for logging/debugging)
 */
export function getCooldownHours() {
  return VIEW_COOLDOWN_MS / (60 * 60 * 1000);
}

/**
 * Cleanup expired entries from the cache
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, timestamp] of viewCache.entries()) {
    if ((now - timestamp) >= VIEW_COOLDOWN_MS) {
      viewCache.delete(key);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    // Optional: Log cleanup stats in development
    // console.log(`View tracker cleanup: removed ${cleaned} expired entries`);
  }
}

// Start periodic cleanup
setInterval(cleanupExpiredEntries, CLEANUP_INTERVAL_MS);

export default {
  shouldCountView,
  getCooldownHours,
};
