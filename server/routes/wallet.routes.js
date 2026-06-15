import express from "express";
import {
    getWallet,
    createDepositOrder,
    verifyDeposit,
    mockDeposit,
    payWithWallet,
} from "../controllers/wallet.controller.js";
import { protect } from "../middleware/auth.middleware.js"; // adjust path to your auth middleware

const router = express.Router();

// All wallet routes require authentication
router.use(protect);

router.get("/", getWallet);                        // GET  /api/wallet
router.post("/deposit/order", createDepositOrder); // POST /api/wallet/deposit/order
router.post("/deposit/verify", verifyDeposit);     // POST /api/wallet/deposit/verify
router.post("/deposit/mock", mockDeposit);         // POST /api/wallet/deposit/mock (dev only)
router.post("/pay", payWithWallet);                // POST /api/wallet/pay

export default router;