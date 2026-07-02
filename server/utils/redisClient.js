import { createClient } from "redis";
import { Redis as UpstashRedis } from "@upstash/redis";

// Support two modes:
// 1) Upstash REST (set UPSTASH_REDIS_REST_URL & UPSTASH_REDIS_REST_TOKEN)
// 2) regular redis client via REDIS_URL or REDIS_HOST/REDIS_PORT

const useUpstash = !!process.env.UPSTASH_REDIS_REST_URL;
let client = null;
let upstash = null;
let redisReady = false;

if (useUpstash) {
  upstash = new UpstashRedis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  redisReady = true;
  console.log("[Redis] using Upstash REST client");
} else {
  const redisOptions = process.env.REDIS_URL
    ? { url: process.env.REDIS_URL }
    : {
        socket: {
          host: process.env.REDIS_HOST || "127.0.0.1",
          port: Number(process.env.REDIS_PORT) || 6379,
        },
        password: process.env.REDIS_PASSWORD || undefined,
      };

  client = createClient(redisOptions);

  client.on("error", (error) => {
    console.error("[Redis] error:", error?.message || error);
  });

  client.on("connect", () => {
    console.log("[Redis] connecting...");
  });

  client.on("ready", () => {
    redisReady = true;
    console.log("[Redis] ready");
  });

  client.on("end", () => {
    redisReady = false;
    console.warn("[Redis] connection closed");
  });
}

export const connectRedis = async () => {
  try {
    if (useUpstash) {
      // Upstash REST client doesn't require a long-lived connection.
      // Do a light test call to confirm configuration.
      if (
        !process.env.UPSTASH_REDIS_REST_URL ||
        !process.env.UPSTASH_REDIS_REST_TOKEN
      ) {
        redisReady = false;
        console.warn("[Redis] Upstash env not configured");
        return;
      }
      try {
        await upstash.get("__upstash_ping__").catch(() => undefined);
        redisReady = true;
        console.log("[Redis] Upstash ready");
      } catch (err) {
        redisReady = false;
        console.warn("[Redis] Upstash ping failed:", err?.message || err);
      }
      return;
    }

    if (client.isOpen) return;
    await client.connect();
    redisReady = client.isOpen;
    if (redisReady) {
      console.log("[Redis] connected successfully");
    }
  } catch (error) {
    redisReady = false;
    console.warn("[Redis] connection failed:", error?.message || error);
  }
};

export const isRedisReady = () =>
  redisReady && (useUpstash ? true : client.isOpen);

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

export const getJson = async (key) => {
  if (!isRedisReady()) return null;
  try {
    if (useUpstash) {
      const raw = await upstash.get(key);
      return normalizeRedisValue(raw, key);
    }
    const raw = await client.get(key);
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
      if (ttlSeconds) {
        await upstash.set(key, payload, { ex: ttlSeconds });
      } else {
        await upstash.set(key, payload);
      }
      return true;
    }

    if (ttlSeconds) {
      await client.set(key, payload, { EX: ttlSeconds });
    } else {
      await client.set(key, payload);
    }
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
      const results = await Promise.all(keys.map((k) => upstash.del(k)));
      return results.reduce((acc, r) => acc + (r || 0), 0);
    }
    return client.del(keys);
  } catch (error) {
    console.error("[Redis] deleteKeys error:", error?.message || error);
    return 0;
  }
};

export const deleteKey = async (key) => {
  if (!isRedisReady() || !key) return 0;
  try {
    if (useUpstash) {
      return await upstash.del(key);
    }
    return client.del(key);
  } catch (error) {
    console.error("[Redis] deleteKey error:", error?.message || error);
    return 0;
  }
};

export const scanKeys = async (pattern) => {
  if (!isRedisReady()) return [];
  try {
    if (useUpstash) {
      // Upstash supports `keys` and `scan` — prefer `scan` when available.
      if (typeof upstash.scanIterator === "function") {
        const matched = [];
        for await (const k of upstash.scanIterator({
          MATCH: pattern,
          COUNT: 100,
        })) {
          matched.push(k);
        }
        return matched;
      }
      if (typeof upstash.keys === "function") {
        return await upstash.keys(pattern);
      }
      return [];
    }

    const matchedKeys = [];
    for await (const key of client.scanIterator({
      MATCH: pattern,
      COUNT: 100,
    })) {
      matchedKeys.push(key);
    }
    return matchedKeys;
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
  const cached = await getJson(key);
  if (cached !== null) {
    return cached;
  }

  const data = await fetcher();
  await setJson(key, data, ttlSeconds);
  return data;
};

export default useUpstash ? upstash : client;
