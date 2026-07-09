import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import {
  addOrderItems,
  getMyOrders,
  getOrderById,
  createStripePaymentIntent,
  updateOrderToPaid,
  updateOrderToDelivered,
  getOrders,
} from "../controllers/orderController.js";

const router = express.Router();

// 1. Group routes by path '/'
router
  .route("/")
  .post(protect, addOrderItems) // POST /api/orders
  .get(protect, admin, getOrders); // GET /api/orders (Admin only)

// 2. Route for user's personal orders '/myorders'
router.route("/myorders").get(protect, getMyOrders); // GET /api/orders/myorders

// 3. Group routes by path '/:id'
router.route("/:id").get(protect, getOrderById); // GET /api/orders/:id

// 4. Route for Stripe Payment Intent '/:id/stripe-intent'
router.route("/:id/stripe-intent").post(protect, createStripePaymentIntent); // POST /api/orders/:id/stripe-intent

// 5. Route for updating order status to paid '/:id/pay'
router.route("/:id/pay").put(protect, updateOrderToPaid); // PUT /api/orders/:id/pay

// 6. Route for updating order status to delivered '/:id/deliver'
router.route("/:id/deliver").put(protect, admin, updateOrderToDelivered); // PUT /api/orders/:id/deliver (Admin only)

export default router;
