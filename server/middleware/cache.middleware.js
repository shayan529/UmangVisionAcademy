import { getJson, setJson } from "../utils/redisClient.js";

const resolveCacheKey = (keyOrFactory, req) =>
  typeof keyOrFactory === "function" ? keyOrFactory(req) : keyOrFactory;

export const cacheRoute = (keyOrFactory, ttlSeconds = 30) => {
  return async (req, res, next) => {
    const cacheKey = resolveCacheKey(keyOrFactory, req);
    if (!cacheKey) return next();

    const cached = await getJson(cacheKey);
    if (cached !== null) {
      return res.json(cached);
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      setJson(cacheKey, body, ttlSeconds).catch(() => undefined);
      return originalJson(body);
    };

    return next();
  };
};
