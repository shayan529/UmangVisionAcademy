import express from "express";
import {
  getWallet,
  createDepositOrder,
  verifyDeposit,
  mockDeposit,
  payWithWallet,
  redeemCoins,
} from "../controllers/wallet.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getWallet); // GET  /api/wallet
router.post("/deposit/order", createDepositOrder); // POST /api/wallet/deposit/order
router.post("/deposit/verify", verifyDeposit); // POST /api/wallet/deposit/verify
router.post("/deposit/mock", mockDeposit); // POST /api/wallet/deposit/mock (dev only)
router.post("/pay", payWithWallet); // POST /api/wallet/pay
router.post("/redeem-coins", redeemCoins); // POST /api/wallet/redeem-coins

export default router;
