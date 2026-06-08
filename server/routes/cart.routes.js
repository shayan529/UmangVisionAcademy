import express from "express";
import {
  addToCart,
  clearCart,
  getCart,
  removeFromCart,
} from "../controllers/cart.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/cart/add", protect, addToCart);
router.get("/cart", protect, getCart);
router.delete("/cart/:courseId", protect, removeFromCart);
router.delete("/cart", protect, clearCart);

export default router;
