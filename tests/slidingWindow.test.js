const { isAllowed } = require("../src/services/slidingWindow");
const redis = require("../src/services/redisClient");

describe("sliding window rate limiter", () => {
  const testKey = "test-user";

  afterEach(async () => {
    await redis.del(`ratelimit:${testKey}`);
  });

  afterAll(async () => {
    await redis.quit();
  });

  it("allows requests under the limit", async () => {
    const result = await isAllowed(testKey, 60000, 5);
    expect(result.allowed).toBe(true);
    expect(result.count).toBe(1);
  });

  it("rejects requests over the limit", async () => {
    for (let i = 0; i < 5; i++) {
      await isAllowed(testKey, 60000, 5);
    }
    const result = await isAllowed(testKey, 60000, 5);
    expect(result.allowed).toBe(false);
  });
});
