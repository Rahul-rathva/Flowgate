const express = require("express");
const client = require("prom-client");

const router = express.Router();

client.collectDefaultMetrics();

const requestCounter = new client.Counter({
  name: "flowgate_requests_total",
  help: "Total requests handled by the gateway",
  labelNames: ["method", "status"],
});

const rateLimitedCounter = new client.Counter({
  name: "flowgate_rate_limited_total",
  help: "Total requests rejected for exceeding the rate limit",
});

router.get("/metrics", async (req, res) => {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
});

module.exports = { router, requestCounter, rateLimitedCounter };
