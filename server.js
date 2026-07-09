import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import productRoutes from "./routes/productRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Database Connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    // Do not crash the server in dev, log it clearly
  }
};

connectDB();

// API routes
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);

// Stripe config endpoint
app.get("/api/config/stripe", (req, res) => {
  const pubKey = process.env.STRIPE_PUBLISHABLE_KEY;
  const isMock =
    !pubKey ||
    pubKey.includes("PleaseReplaceThis") ||
    pubKey.startsWith("pk_test_51PTestKey");

  res.json({
    publishableKey: isMock ? "mock_stripe_publishable_key_12345" : pubKey,
    isMock: isMock,
  });
});

app.get("/", (req, res) => {
  res.send("API is running...");
});

// Custom 404 handler
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

// Custom error handling middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in mode on port ${PORT}`);
});
