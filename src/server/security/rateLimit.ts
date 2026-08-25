import { createMiddleware } from "@tanstack/react-start";
import { redisClient as redis } from "../redis";

/**
 * Creates a sliding window rate limiter middleware.
 * @param limit The maximum number of requests allowed in the window.
 * @param windowSecs The time window in seconds.
 * @param prefix Redis key prefix (e.g., 'rate_limit:ai').
 */
export function createRateLimiter(limit: number, windowSecs: number, prefix: string) {
  return createMiddleware().server(async ({ next, context }) => {
    // If we're using the fallback Map instead of real Redis in dev, just let it through
    // or we could implement a basic in-memory limit. For simplicity, we implement it using Redis Multi.
    if (!redis) {
      return next({ context });
    }

    // Try to get an identifier (userId from auth, or IP).
    const ctx = context as any;
    let identifier = ctx.userId || ctx.clientIp || "anonymous";

    const key = `${prefix}:${identifier}`;
    const now = Date.now();
    const windowStart = now - windowSecs * 1000;

    try {
      // 1. Remove timestamps older than windowStart
      // 2. Count current elements
      // 3. Add current timestamp
      // 4. Set TTL
      const pipeline = redis.multi();
      pipeline.zremrangebyscore(key, 0, windowStart);
      pipeline.zcard(key);
      pipeline.zadd(key, now, `${now}-${Math.random()}`);
      pipeline.expire(key, windowSecs);

      const results = await pipeline.exec();
      if (!results) {
        // Redis error, fail open
        return next({ context });
      }

      const currentCount = results[1][1] as number;
      
      if (currentCount >= limit) {
        throw new Error(`Rate limit exceeded for ${prefix}. Please try again later.`);
      }

      return next({ context });
    } catch (err: any) {
      if (err.message?.includes("Rate limit exceeded")) {
        throw err;
      }
      console.warn("Rate limiter failed, allowing request:", err);
      return next({ context });
    }
  });
}
