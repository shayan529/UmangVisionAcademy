import { sendContactEmail } from "../utils/Mailer.js";

export const handleContactForm = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(String(email).trim())) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address" });
    }

    await sendContactEmail(
      String(name).trim(),
      String(email).trim(),
      String(subject).trim(),
      String(message).trim(),
    );

    res.status(200).json({ success: true, message: "Message sent successfully" });
  } catch (error) {
    console.error("Contact Form Error:", error);
    const message =
      error.message === "Email service is not configured"
        ? "Email service is temporarily unavailable. Please try again later."
        : "Failed to send message. Please try again later.";
    res.status(500).json({ success: false, message });
  }
};
