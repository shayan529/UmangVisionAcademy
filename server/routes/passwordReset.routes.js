import express from 'express';
import {
  sendResetOtp,
  verifyResetOtp,
  resetPassword,
} from '../controllers/passwordReset.controller.js';

const router = express.Router();

router.post('/forgot-password', sendResetOtp); // step 1: send OTP
router.post('/verify-reset-otp', verifyResetOtp); // step 2: verify OTP → get resetToken
router.post('/reset-password', resetPassword); // step 3: set new password

export default router;
