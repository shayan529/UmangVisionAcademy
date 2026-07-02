import { deleteKey, getJson, isRedisReady, setJson } from "./redisClient.js";

const fallbackStore = new Map();

const ensureObject = (value) =>
  typeof value === "object" && value !== null ? value : {};

const normalizeRecord = (record) => ({
  ...ensureObject(record),
});

const setFallback = (key, record, ttlMs) => {
  fallbackStore.set(key, normalizeRecord(record));
  if (ttlMs > 0) {
    setTimeout(() => {
      const existing = fallbackStore.get(key);
      if (existing && Date.now() >= existing.expiresAt) {
        fallbackStore.delete(key);
      }
    }, ttlMs);
  }
  return true;
};

const getFallback = (key) => {
  const record = fallbackStore.get(key);
  if (!record) return null;
  if (record.expiresAt && Date.now() > record.expiresAt) {
    fallbackStore.delete(key);
    return null;
  }
  return record;
};

export const setOtpRecord = async (key, record, ttlMs = 10 * 60 * 1000) => {
  const normalized = normalizeRecord(record);
  if (normalized.expiresAt === undefined) {
    normalized.expiresAt = Date.now() + ttlMs;
  }
  if (isRedisReady()) {
    const seconds = Math.max(
      1,
      Math.ceil((normalized.expiresAt - Date.now()) / 1000),
    );
    return setJson(key, normalized, seconds);
  }
  return setFallback(key, normalized, ttlMs);
};

export const getOtpRecord = async (key) => {
  if (isRedisReady()) {
    const record = await getJson(key);
    return record ? normalizeRecord(record) : null;
  }
  return getFallback(key);
};

export const deleteOtpRecord = async (key) => {
  if (isRedisReady()) {
    await deleteKey(key);
  }
  fallbackStore.delete(key);
};

export const updateOtpRecord = async (key, updates) => {
  const record = await getOtpRecord(key);
  if (!record) return null;
  const merged = normalizeRecord({ ...record, ...updates });
  const remainingMs = merged.expiresAt ? merged.expiresAt - Date.now() : 0;
  if (remainingMs <= 0) {
    await deleteOtpRecord(key);
    return null;
  }
  await setOtpRecord(key, merged, remainingMs);
  return merged;
};
