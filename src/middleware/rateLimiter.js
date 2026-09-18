const config = require("../config");
const { isAllowed } = require("../services/slidingWindow");

/**
 * Rate limits by client IP by default, or by authenticated user ID
 * if `req.user` was set by the auth middleware (so logged-in users
 * get their own quota instead of sharing one per IP behind a NAT/proxy).
 */
async function rateLimiter(req, res, next) {
  const key = req.user?.sub || req.ip;

  try {
    const { allowed, count, remaining } = await isAllowed(
      key,
      config.rateLimit.windowMs,
      config.rateLimit.maxRequests
    );

    res.set("X-RateLimit-Limit", config.rateLimit.maxRequests);
    res.set("X-RateLimit-Remaining", remaining);

    if (!allowed) {
      return res.status(429).json({
        error: "Too many requests",
        limit: config.rateLimit.maxRequests,
        windowMs: config.rateLimit.windowMs,
        count,
      });
    }

    next();
  } catch (err) {
    // Fail open: if Redis is down, don't block all traffic — log and pass through.
    console.error("[rateLimiter] Redis error, failing open:", err.message);
    next();
  }
}

module.exports = rateLimiter;
