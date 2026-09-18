const Redis = require("ioredis");
const config = require("../config");

const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 200, 2000),
});

redis.on("error", (err) => {
  console.error("[redis] connection error:", err.message);
});

module.exports = redis;
