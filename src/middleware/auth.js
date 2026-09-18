const jwt = require("jsonwebtoken");
const config = require("../config");

/**
 * Optional JWT auth. If a valid Bearer token is present, attaches the
 * decoded payload to req.user (used by the rate limiter to key on user
 * instead of IP). If no token is present, requests continue as
 * "anonymous" and are rate-limited by IP instead — auth is not required
 * to use the gateway, only to get a per-user quota.
 */
function optionalAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return next();
  }

  try {
    req.user = jwt.verify(token, config.jwtSecret);
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  next();
}

function issueDemoToken(subject) {
  return jwt.sign({ sub: subject }, config.jwtSecret, { expiresIn: "1h" });
}

module.exports = { optionalAuth, issueDemoToken };
