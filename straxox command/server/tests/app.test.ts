import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { app } from "../src/app";

vi.mock("stripe", () => {
  return {
    default: class Stripe {}
  };
});

vi.mock("ioredis", () => {
  const RedisMock = require("ioredis-mock");
  return {
    default: RedisMock,
    Redis: RedisMock
  };
});

// Set required env vars for tests
process.env.STRIPE_SECRET_KEY = "sk_test_mock";

vi.mock("../src/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    }
  }
}));

describe("App Basics", () => {
  it("should have a health check endpoint", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("status", "ok");
    expect(res.body).toHaveProperty("uptime");
  });
});
