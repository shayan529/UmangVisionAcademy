import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;

let twilioClient = null;
if (accountSid && authToken) {
  try {
    twilioClient = twilio(accountSid, authToken);
  } catch (err) {
    console.warn("Twilio client initialization failed:", err.message);
  }
}

/**
 * Send an OTP code via SMS using Twilio.
 *
 * @param {string} toPhoneNumber E.164 formatted phone number (e.g., +919876543210)
 * @param {string} otp 6-digit OTP string
 * @returns {Promise<{ success: boolean, sid?: string, error?: string }>}
 */
export const sendSmsOtp = async (toPhoneNumber, otp) => {
  if (!twilioClient || !accountSid || !authToken) {
    console.warn("[Twilio SMS] Twilio credentials not available in .env.");
    return { success: false, reason: "Twilio credentials missing" };
  }

  try {
    const message = await twilioClient.messages.create({
      body: `Your Umang Vision Academy verification code is: ${otp}. Valid for 5 minutes. Do not share this code with anyone.`,
      from: fromPhone,
      to: toPhoneNumber,
    });
    console.log(`[Twilio SMS] Sent OTP to ${toPhoneNumber}, Message SID: ${message.sid}`);
    return { success: true, sid: message.sid };
  } catch (error) {
    console.error(`[Twilio SMS Error] Failed to send SMS to ${toPhoneNumber}:`, error.message);
    return { success: false, error: error.message };
  }
};
