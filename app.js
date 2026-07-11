// Third-party packages
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";

// Custom middleware and routes
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import productRoutes from "./routes/productRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";

// Initialize environment configuration (makes variables available via process.env)
dotenv.config();

// Create the main Express application instance
const app = express();

// Global Middleware
app.use(cors()); // Enable CORS for all incoming requests
app.use(express.json()); // Body-parser: lets the server read incoming JSON in req.body

// Database Connection Helper
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    // Do not crash the server in dev, log it clearly
  }
};

// Execute database connection
connectDB();

// API Route Mounts
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);

// Stripe Public Configuration Endpoint (shares publishable key with clients)
app.get("/api/config/stripe", (req, res) => {
  const pubKey = process.env.STRIPE_PUBLISHABLE_KEY;
  // Checks if Stripe key is a mock placeholder or missing
  const isMock =
    !pubKey ||
    pubKey.includes("PleaseReplaceThis") ||
    pubKey.startsWith("pk_test_51PTestKey");

  // Send credentials response
  res.json({
    publishableKey: isMock ? "mock_stripe_publishable_key_12345" : pubKey,
    isMock: isMock,
  });
});

// Root API Server check endpoint
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Centralized Error Handling Middlewares (Must be mounted LAST)
app.use(notFound); // Catches requests that don't match any of the routes above
app.use(errorHandler); // Intercepts all thrown errors (Zod, Mongoose, custom AppError)

export default app;
