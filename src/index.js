const express = require("express");
const morgan = require("morgan");
const { createProxyMiddleware } = require("http-proxy-middleware");

const config = require("./config");
const { optionalAuth } = require("./middleware/auth");
const rateLimiter = require("./middleware/rateLimiter");
const healthRoutes = require("./routes/health");
const tokenRoutes = require("./routes/token");
const { router: metricsRoutes, requestCounter, rateLimitedCounter } = require("./routes/metrics");

const app = express();

app.use(morgan("combined"));
app.use(express.json());

// Track every response's status code for metrics
app.use((req, res, next) => {
  res.on("finish", () => {
    requestCounter.inc({ method: req.method, status: res.statusCode });
    if (res.statusCode === 429) rateLimitedCounter.inc();
  });
  next();
});

// Unauthenticated, unlimited routes
app.use(healthRoutes);
app.use(metricsRoutes);
app.use(tokenRoutes);

// Everything below this line goes through auth + rate limiting
app.use(optionalAuth);
app.use(rateLimiter);

// Proxy all remaining traffic to the downstream service
app.use(
  "/",
  createProxyMiddleware({
    target: config.downstreamUrl,
    changeOrigin: true,
    logLevel: "warn",
  })
);

app.listen(config.port, () => {
  console.log(`FlowGate listening on port ${config.port}`);
  console.log(`Proxying to ${config.downstreamUrl}`);
});

module.exports = app;
