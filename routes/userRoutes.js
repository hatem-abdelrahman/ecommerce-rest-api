import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import {
  authUser,
  registerUser,
  getUserProfile,
  updateUserProfile,
  getAllUsers,
} from "../controllers/userController.js";
import {
  validate,
  loginSchema,
  registerSchema,
} from "../middleware/validator.js";

const router = express.Router();

// @desc    Login a user
// @route   POST /api/login
// @access  Public
router.post("/login", validate(loginSchema), authUser);

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
router.post("/", validate(registerSchema), registerUser);

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
router.get("/profile", protect, getUserProfile);

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put("/profile", protect, updateUserProfile);

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
router.get("/", protect, admin, getAllUsers);

export default router;
