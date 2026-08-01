// Lightweight in-process LRU cache with TTL for hot-path user lookups.
// Sits in front of Upstash Redis to eliminate the ~50–150ms REST round-trip
// for repeat requests from the same user within the TTL window.
//
// Safe for single-process deployments (Hostinger / Render single instance).
// On multi-instance, the TTL ensures eventual consistency — cache entries
// expire and the next request fetches fresh data from Redis/MongoDB.

const DEFAULT_MAX_SIZE = 500;
const DEFAULT_TTL_MS = 60_000; // 60 seconds

class LRUCache {
  constructor({ maxSize = DEFAULT_MAX_SIZE, ttlMs = DEFAULT_TTL_MS } = {}) {
    this._maxSize = maxSize;
    this._ttlMs = ttlMs;
    this._map = new Map(); // key → { value, expiresAt }
  }

  get(key) {
    const entry = this._map.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this._map.delete(key);
      return undefined;
    }

    // Move to end (most-recently used) by re-inserting
    this._map.delete(key);
    this._map.set(key, entry);
    return entry.value;
  }

  set(key, value, ttlMs) {
    // Delete first to reset insertion order
    this._map.delete(key);

    // Evict oldest entries if at capacity
    while (this._map.size >= this._maxSize) {
      const oldestKey = this._map.keys().next().value;
      this._map.delete(oldestKey);
    }

    this._map.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs ?? this._ttlMs),
    });
  }

  delete(key) {
    this._map.delete(key);
  }

  clear() {
    this._map.clear();
  }

  get size() {
    return this._map.size;
  }
}

// Singleton instance shared across the server process.
// Used by auth.middleware.js (protect) and invalidated by redisClient.js (deleteKey).
export const userLRU = new LRUCache({
  maxSize: Number(process.env.USER_LRU_MAX_SIZE) || DEFAULT_MAX_SIZE,
  ttlMs: Number(process.env.USER_LRU_TTL_MS) || DEFAULT_TTL_MS,
});

export default LRUCache;
