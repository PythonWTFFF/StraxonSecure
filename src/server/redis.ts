import Redis from "ioredis";

// Fallback to in-memory map if Redis connection fails or isn't configured
const localCache = new Map<string, { value: string; expiry: number }>();

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// We wrap the redis instance to handle failures gracefully in a local dev environment
export let redisClient: Redis | null = null;
let useLocalCache = false;

try {
  redisClient = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      if (times > 2) {
        console.warn("[Redis] Connection failed. Falling back to local in-memory cache.");
        useLocalCache = true;
        return null; // Stop retrying
      }
      return Math.min(times * 50, 2000);
    },
  });

  redisClient.on("error", (err) => {
    // Only log the first error to avoid spam
    if (!useLocalCache) {
      console.warn("[Redis] Error:", err.message);
    }
  });
} catch (e) {
  useLocalCache = true;
}

export async function getCache(key: string): Promise<string | null> {
  if (useLocalCache || !redisClient) {
    const item = localCache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      localCache.delete(key);
      return null;
    }
    return item.value;
  }
  
  try {
    return await redisClient.get(key);
  } catch {
    useLocalCache = true;
    return null;
  }
}

export async function setCache(key: string, value: string, ttlSeconds: number = 3600): Promise<void> {
  if (useLocalCache || !redisClient) {
    localCache.set(key, { value, expiry: Date.now() + ttlSeconds * 1000 });
    return;
  }

  try {
    await redisClient.set(key, value, "EX", ttlSeconds);
  } catch {
    useLocalCache = true;
    localCache.set(key, { value, expiry: Date.now() + ttlSeconds * 1000 });
  }
}

export async function invalidateCache(keyPrefix: string): Promise<void> {
  if (useLocalCache || !redisClient) {
    for (const key of localCache.keys()) {
      if (key.startsWith(keyPrefix)) {
        localCache.delete(key);
      }
    }
    return;
  }

  try {
    // Note: In a real production system, use SCAN instead of KEYS
    const keys = await redisClient.keys(`${keyPrefix}*`);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  } catch {
    useLocalCache = true;
  }
}
