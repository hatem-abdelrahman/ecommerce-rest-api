import request from "supertest";
import mongoose from "mongoose";
import app from "../app.js";

// Jest provides this hook to run code AFTER all tests in this file finish
afterAll(async () => {
  // CRITICAL: Close the database connection when tests are done.
  // If you forget this, Jest will hang forever and won't exit!
  await mongoose.connection.close();
});

describe("Base API Endpoints", () => {
  // Test 1: Verify the root path
  it('should return "API is running..." on GET /', async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe("API is running...");
  });

  // Test 2: Verify the Stripe configuration endpoint
  it("should return stripe config details on GET /api/config/stripe", async () => {
    const res = await request(app).get("/api/config/stripe");
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("publishableKey");
    expect(res.body).toHaveProperty("isMock");
  });
});

describe("User Input Validation via Zod", () => {
  // Test 3: Verify that Zod blocks bad login requests with 400
  it("should reject invalid login data with 400 Bad Request", async () => {
    const res = await request(app).post("/api/users/login").send({
      email: "invalid-email",
      password: "123", // Too short
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Validation failed");
    expect(res.body.errors).toBeDefined();
    // We expect 2 errors (one for email, one for password)
    expect(res.body.errors.length).toBe(2);
  });
});
