import { z } from "zod";

// 1. The Global Error Handler (Express detects it has 4 parameters)
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let errors = undefined;

  // Case A: Handle Zod Validation Errors
  if (err instanceof z.ZodError) {
    statusCode = 400;
    message = "Validation failed";
    errors = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
  }

  // Case B: Handle Mongoose Invalid Object ID (CastError)
  // E.g., trying to search for a product with ID "123"
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Resource not found. Invalid format for field: ${err.path}`;
  }

  // Case C: Handle MongoDB Duplicate Key Error (code 11000)
  // E.g., registering a user with an email that is already in use
  if (err.code === 11000) {
    statusCode = 400;
    const duplicateField = Object.keys(err.keyValue)[0];
    message = `The ${duplicateField} is already registered. Please use another one.`;
  }

  // Send the clean error response
  res.status(statusCode).json({
    message,
    ...(errors && { errors }), // Only include the errors array if validation failed
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

// 2. Custom 404 handler for routes that do not exist
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error); // Passes the 404 error to the errorHandler above
};
