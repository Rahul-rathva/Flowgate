# FlowGate — Distributed Rate-Limiting API Gateway

FlowGate is a lightweight API gateway that sits in front of your backend
services and enforces a **distributed, Redis-backed sliding-window rate
limit** per user (or per IP for anonymous traffic), while proxying allowed
requests through to the real service. It also exposes Prometheus-compatible
metrics out of the box.

This is the pattern behind almost every production API today — nobody lets
raw traffic hit their services directly. It's also one of the most common
systems-design interview questions ("design a rate limiter"), so this
project doubles as a working answer to that question.

## Why this project

- **Rate limiting is a top systems-design topic** — this implements the
  sliding-window-log algorithm (more accurate than fixed windows) using
  Redis sorted sets, atomically via a pipeline.
- **Fails open, not closed.** If Redis goes down, the gateway logs the
  error and lets traffic through instead of taking your whole API offline —
  a deliberate reliability trade-off worth explaining in an interview.
- **Per-user AND per-IP limiting.** Authenticated requests (JWT) get their
  own quota; anonymous requests fall back to IP-based limiting.
- **Observable by default.** `/metrics` exposes Prometheus metrics
  (request counts by status code, rate-limit rejections) — the kind of
  thing real gateways are judged on.

## Architecture

```
Client
  │
  ▼
FlowGate (Express)
  │
  ├── /health, /metrics, /token   → answered directly, never rate-limited
  │
  ├── optionalAuth middleware      → decodes JWT if present → req.user
  │
  ├── rateLimiter middleware       → sliding window check via Redis
  │        │
  │        ▼
  │   Redis (sorted set per key: ratelimit:<user-or-ip>)
  │
  └── proxy (http-proxy-middleware) → forwards allowed requests to
                                        DOWNSTREAM_URL (mock-service here)
```

## Tech stack

| Layer          | Choice                          |
|----------------|----------------------------------|
| Gateway        | Node.js, Express                |
| Rate limiting  | Redis (sorted sets, sliding window log) |
| Auth           | JWT (optional — anonymous traffic still works) |
| Proxying       | http-proxy-middleware            |
| Metrics        | prom-client (Prometheus format)  |
| Infra          | Docker, Docker Compose           |
| CI             | GitHub Actions (tests against a real Redis service) |
| Tests          | Jest, Supertest                  |

## Getting started

### 1. Clone and configure
```bash
git clone <your-repo-url>
cd flowgate
cp .env.example .env
```

### 2. Run with Docker Compose
```bash
docker compose up --build
```
This starts three containers: `redis`, `mock-service` (a fake downstream
API), and `gateway` (FlowGate itself) on port 8080.

### 3. Try it out

**Anonymous request, proxied through to the mock service:**
```bash
curl http://localhost:8080/orders
```

**Hit the rate limit** (default: 100 requests/minute per IP — lower it in
`.env` to `RATE_LIMIT_MAX_REQUESTS=3` to see a 429 quickly):
```bash
for i in $(seq 1 5); do curl -i http://localhost:8080/orders; done
```
You'll see `X-RateLimit-Remaining` decrease, then a `429 Too Many Requests`
once the limit is hit.

**Authenticated request with its own quota:**
```bash
TOKEN=$(curl -s -X POST http://localhost:8080/token \
  -H "Content-Type: application/json" \
  -d '{"username": "rahul"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/orders
```

**Check metrics:**
```bash
curl http://localhost:8080/metrics
```

### 4. Run tests locally
```bash
npm install
npm test
```

## License
MIT
