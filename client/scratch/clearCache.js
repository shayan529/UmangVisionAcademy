import { getJson, setJson, deleteKeys } from "../server/utils/redisClient.js";

async function clearUserCache() {
  console.log("Redis operations are handled via Upstash REST. We'll just try to let the user log out and log in, actually let's look at auth.middleware.js");
}
clearUserCache();
