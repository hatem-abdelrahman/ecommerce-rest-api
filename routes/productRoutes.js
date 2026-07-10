import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import {
  getProducts,
  getProductById,
  deleteProduct,
  createProduct,
  updateProduct,
  createProductReview,
} from "../controllers/productController.js";
import { validate, reviewSchema } from "../middleware/validator.js";

const router = express.Router();

// 1. Group routes by path '/'
router
  .route("/")
  .get(getProducts) // GET /api/products
  .post(protect, admin, createProduct); // POST /api/products

// 2. Group routes by path '/id'
router
  .route("/:id")
  .get(getProductById) // GET /api/products/:id
  .put(protect, admin, updateProduct) // PUT /api/products/:id
  .delete(protect, admin, deleteProduct); // DELETE /api/products/:id

// 3. Route for reviews '/:id/reviews'
router
  .route("/:id/reviews")
  .post(protect, validate(reviewSchema), createProductReview);

export default router;
