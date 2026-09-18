require("dotenv").config();

module.exports = {
  port: parseInt(process.env.PORT || "8080", 10),
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  jwtSecret: process.env.JWT_SECRET || "dev-secret-key",
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10),
  },
  downstreamUrl: process.env.DOWNSTREAM_URL || "http://localhost:4000",
};
