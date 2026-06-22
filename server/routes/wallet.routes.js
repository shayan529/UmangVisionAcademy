import express from "express";
import {
  getWallet,
  createDepositOrder,
  verifyDeposit,
  mockDeposit,
  payWithWallet,
  redeemCoins,
  requestRefund,
  getPaymentTransactions,
  getRefundQueue,
  processRefund,
  exportPaymentTransactions,
} from "../controllers/wallet.controller.js";
import {
  protect,
  requirePermission,
} from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getWallet); // GET  /api/wallet
router.get(
  "/admin/transactions",
  requirePermission("payments", "view"),
  getPaymentTransactions,
);
router.get(
  "/admin/refunds",
  requirePermission("payments", "refund"),
  getRefundQueue,
);
router.get(
  "/admin/export",
  requirePermission("payments", "export"),
  exportPaymentTransactions,
);
router.post(
  "/admin/refunds/:transactionId/process",
  requirePermission("payments", "refund"),
  processRefund,
);
router.post("/deposit/order", createDepositOrder); // POST /api/wallet/deposit/order
router.post("/deposit/verify", verifyDeposit); // POST /api/wallet/deposit/verify
router.post("/deposit/mock", mockDeposit); // POST /api/wallet/deposit/mock (dev only)
router.post("/pay", payWithWallet); // POST /api/wallet/pay
router.post("/redeem-coins", redeemCoins); // POST /api/wallet/redeem-coins
router.post("/refunds/:transactionId/request", requestRefund);

export default router;
