const request = require("supertest");

// Point at a downstream that won't actually be hit for /health
process.env.DOWNSTREAM_URL = "http://localhost:4000";

const app = require("../src/index");

describe("GET /health", () => {
  it("returns 200 and status ok", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});
