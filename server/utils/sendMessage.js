import axios from 'axios';

const sendOTP = async (phoneNumber, otp) => {
  try {
    const response = await axios.post(
      'https://www.fast2sms.com/dev/otp/send',
      {
        mobile: phoneNumber, // 10-digit without +91
        otp_id: process.env.FAST2SMS_OTP_ID,
        otp: otp, // your generated OTP
        otp_expiry: 10, // minutes
      },
      {
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    return { success: true, data: response.data };
  } catch (error) {
    console.error('Fast2SMS error:', error?.response?.data || error.message);
    return { success: false, error: error?.response?.data };
  }
};

export default sendOTP;
