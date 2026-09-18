/**
 * Sliding-window rate limiter backed by a Redis sorted set.
 *
 * How it works:
 * - Each request adds a timestamped entry to a per-key sorted set.
 * - Entries older than `windowMs` are trimmed on every call.
 * - If the number of remaining entries exceeds `maxRequests`, the request
 *   is rejected.
 *
 * This is the classic "sliding window log" algorithm — more accurate than
 * fixed-window counters (no burst-at-the-boundary problem) and cheap enough
 * for a gateway to run on every request.
 */
const redis = require("./redisClient");

async function isAllowed(key, windowMs, maxRequests) {
  const now = Date.now();
  const windowStart = now - windowMs;
  const redisKey = `ratelimit:${key}`;

  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(redisKey, 0, windowStart); // drop old entries
  pipeline.zadd(redisKey, now, `${now}-${Math.random()}`); // record this request
  pipeline.zcard(redisKey); // count requests in window
  pipeline.pexpire(redisKey, windowMs); // auto-cleanup if key goes idle

  const results = await pipeline.exec();
  const count = results[2][1]; // result of zcard

  return {
    allowed: count <= maxRequests,
    count,
    remaining: Math.max(0, maxRequests - count),
  };
}

module.exports = { isAllowed };
