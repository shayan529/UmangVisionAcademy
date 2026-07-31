import { createClient } from "redis";
import { Redis as UpstashRedis } from "@upstash/redis";

// Support two modes:
// 1) Upstash REST (set UPSTASH_REDIS_REST_URL & UPSTASH_REDIS_REST_TOKEN)
// 2) regular redis client via REDIS_URL or REDIS_HOST/REDIS_PORT

const useUpstash = !!process.env.UPSTASH_REDIS_REST_URL;

let cached = global.redisCache;
if (!cached) {
  cached = global.redisCache = {
    client: null,
    upstash: null,
    redisReady: false,
  };
}

if (useUpstash) {
  if (!cached.upstash) {
    cached.upstash = new UpstashRedis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    cached.redisReady = true;
    console.log("[Redis] using Upstash REST client");
  }
} else {
  if (!cached.client) {
    const redisOptions = process.env.REDIS_URL
      ? { url: process.env.REDIS_URL }
      : {
          socket: {
            host: process.env.REDIS_HOST || "127.0.0.1",
            port: Number(process.env.REDIS_PORT) || 6379,
          },
          password: process.env.REDIS_PASSWORD || undefined,
        };

    cached.client = createClient(redisOptions);

    cached.client.on("error", (error) => {
      console.error("[Redis] error:", error?.message || error);
    });

    cached.client.on("connect", () => {
      console.log("[Redis] connecting...");
    });

    cached.client.on("ready", () => {
      cached.redisReady = true;
      console.log("[Redis] ready");
    });

    cached.client.on("end", () => {
      cached.redisReady = false;
      console.warn("[Redis] connection closed");
    });
  }
}

export const connectRedis = async () => {
  try {
    if (useUpstash) {
      if (
        !process.env.UPSTASH_REDIS_REST_URL ||
        !process.env.UPSTASH_REDIS_REST_TOKEN
      ) {
        cached.redisReady = false;
        console.warn("[Redis] Upstash env not configured");
        return;
      }
      try {
        await cached.upstash.get("__upstash_ping__").catch(() => undefined);
        cached.redisReady = true;
        console.log("[Redis] Upstash ready");
      } catch (err) {
        cached.redisReady = false;
        console.warn("[Redis] Upstash ping failed:", err?.message || err);
      }
      return;
    }

    if (cached.client.isOpen) {
      console.log("[Redis] Reusing existing connection");
      return;
    }
    
    console.log("[Redis] Creating new connection...");
    await cached.client.connect();
    cached.redisReady = cached.client.isOpen;
    if (cached.redisReady) {
      console.log("[Redis] connected successfully");
    }
  } catch (error) {
    cached.redisReady = false;
    console.warn("[Redis] connection failed:", error?.message || error);
  }
};

export const isRedisReady = () =>
  cached.redisReady && (useUpstash ? true : cached.client.isOpen);

const normalizeRedisValue = (raw, key) => {
  if (raw == null) return null;

  if (typeof raw === "object") {
    return raw;
  }

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return null;

    try {
      return JSON.parse(trimmed);
    } catch {
      console.warn(`[Redis] ignoring malformed cached value for ${key}`);
      return null;
    }
  }

  return raw;
};

const REDIS_TIMEOUT_MS = Number(process.env.REDIS_TIMEOUT_MS) || 1500; // 1500 ms buffer for remote Upstash REST API calls

const runWithTimeout = async (promise, fallbackValue = null) => {
  let timeoutId;
  const timeoutPromise = new Promise((resolve) => {
    timeoutId = setTimeout(() => {
      console.warn("[Redis] Operation timed out, returning fallback");
      resolve(fallbackValue);
    }, REDIS_TIMEOUT_MS);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } catch (err) {
    console.error("[Redis] Operation error:", err?.message || err);
    return fallbackValue;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const getJson = async (key) => {
  if (!isRedisReady()) return null;
  try {
    if (useUpstash) {
      const raw = await runWithTimeout(cached.upstash.get(key), null);
      return normalizeRedisValue(raw, key);
    }
    const raw = await runWithTimeout(cached.client.get(key), null);
    return normalizeRedisValue(raw, key);
  } catch (error) {
    console.error("[Redis] getJson error:", error?.message || error);
    return null;
  }
};

export const setJson = async (key, value, ttlSeconds) => {
  if (!isRedisReady()) return false;
  try {
    const payload = JSON.stringify(value);
    if (useUpstash) {
      const promise = ttlSeconds
        ? cached.upstash.set(key, payload, { ex: ttlSeconds })
        : cached.upstash.set(key, payload);
      await runWithTimeout(promise, null);
      return true;
    }

    const promise = ttlSeconds
      ? cached.client.set(key, payload, { EX: ttlSeconds })
      : cached.client.set(key, payload);
    await runWithTimeout(promise, null);
    return true;
  } catch (error) {
    console.error("[Redis] setJson error:", error?.message || error);
    return false;
  }
};

export const deleteKeys = async (keys) => {
  if (!isRedisReady() || !Array.isArray(keys) || keys.length === 0) return 0;
  try {
    if (useUpstash) {
      const promise = Promise.all(keys.map((k) => cached.upstash.del(k)));
      const results = await runWithTimeout(promise, []);
      return (results || []).reduce((acc, r) => acc + (r || 0), 0);
    }
    return await runWithTimeout(cached.client.del(keys), 0);
  } catch (error) {
    console.error("[Redis] deleteKeys error:", error?.message || error);
    return 0;
  }
};

export const deleteKey = async (key) => {
  if (!isRedisReady() || !key) return 0;
  try {
    if (useUpstash) {
      return await runWithTimeout(cached.upstash.del(key), 0);
    }
    return await runWithTimeout(cached.client.del(key), 0);
  } catch (error) {
    console.error("[Redis] deleteKey error:", error?.message || error);
    return 0;
  }
};

export const scanKeys = async (pattern) => {
  if (!isRedisReady()) return [];
  try {
    if (useUpstash) {
      if (typeof cached.upstash.keys === "function") {
        return await runWithTimeout(cached.upstash.keys(pattern), []);
      }
      if (typeof cached.upstash.scanIterator === "function") {
        const scanPromise = (async () => {
          const matched = [];
          for await (const k of cached.upstash.scanIterator({
            MATCH: pattern,
            COUNT: 100,
          })) {
            matched.push(k);
          }
          return matched;
        })();
        return await runWithTimeout(scanPromise, []);
      }
      return [];
    }

    const scanPromise = (async () => {
      const matchedKeys = [];
      for await (const key of cached.client.scanIterator({
        MATCH: pattern,
        COUNT: 100,
      })) {
        matchedKeys.push(key);
      }
      return matchedKeys;
    })();
    return await runWithTimeout(scanPromise, []);
  } catch (error) {
    console.error("[Redis] scanKeys error:", error?.message || error);
    return [];
  }
};

export const invalidateCache = async (pattern) => {
  const keys = await scanKeys(pattern);
  if (keys.length === 0) return 0;
  return deleteKeys(keys);
};

export const cacheResponse = async (key, ttlSeconds, fetcher) => {
  const cachedData = await getJson(key);
  if (cachedData !== null) {
    return cachedData;
  }

  const data = await fetcher();
  await setJson(key, data, ttlSeconds);
  return data;
};

export default useUpstash ? cached.upstash : cached.client;
