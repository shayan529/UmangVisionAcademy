import express from 'express';
import {
  sendResetOtp,
  verifyResetOtp,
  resetPassword,
  sendResetOtpPhone,
  verifyResetOtpPhone,
} from '../controllers/passwordReset.controller.js';

const router = express.Router();

router.post('/forgot-password', sendResetOtp); // step 1: send OTP (email)
router.post('/forgot-password-phone', sendResetOtpPhone); // step 1: send OTP (phone)
router.post('/verify-reset-otp', verifyResetOtp); // step 2: verify OTP (email)
router.post('/verify-reset-phone-otp', verifyResetOtpPhone); // step 2: verify OTP (phone)
router.post('/reset-password', resetPassword); // step 3: set new password

export default router;
