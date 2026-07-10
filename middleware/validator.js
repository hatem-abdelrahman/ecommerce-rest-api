import { z } from "zod";

// 1. Generic middleware to validate request bodies against a Zod schema
export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    // Check if the error is actually a Zod validation error
    if (error instanceof z.ZodError) {
      // Use error.issues (the official Zod array of errors) with a fallback to []
      const issues = error.issues || [];

      return res.status(400).json({
        message: "Validation failed",
        errors: issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      });
    }
    // If it's a different runtime error, log it and return 500
    console.error("Unexpected validation error:", error);
    return res.status(500).json({
      message: "An unexpected error occurred during validation",
      error: error.message,
    });
  }
};

// 2. Schema for User Login
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// 3. Schema for User Registration
export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// 4. Schema for Creating a Review
export const reviewSchema = z.object({
  rating: z
    .number()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating cannot exceed 5"),
  comment: z.string().min(3, "Comment must be at least 3 characters"),
});

// 5. Schema for Creating an Order
export const orderSchema = z.object({
  orderItems: z
    .array(
      z.object({
        name: z.string().min(1, "Item name is required"),
        qty: z.number().min(1, "Quantity must be at least 1"),
        image: z.string().url("Invalid image URL"),
        price: z.number().min(0, "Price cannot be negative"),
        product: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid product ID"), // Must be 24-character hex ID
      }),
    )
    .min(1, "Order must contain at least one item"),
  shippingAddress: z.object({
    address: z.string().min(1, "Address is required"),
    city: z.string().min(1, "City is required"),
    postalCode: z.string().min(1, "Postal code is required"),
    country: z.string().min(1, "Country is required"),
  }),
  paymentMethod: z.string().default("Stripe"),
  itemsPrice: z.number().min(0),
  taxPrice: z.number().min(0),
  shippingPrice: z.number().min(0),
  totalPrice: z.number().min(0),
});
