import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth, isFirebaseConfigured } from "../config/firebase.js";

/**
 * Clear existing RecaptchaVerifier instance and empty the container DOM element.
 * @param {string} containerId ID of the DOM element
 */
export const clearRecaptcha = (containerId = "recaptcha-container") => {
  if (window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear();
    } catch (e) {
      // ignore clear errors
    }
    window.recaptchaVerifier = null;
  }
  const el =
    typeof containerId === "string"
      ? document.getElementById(containerId)
      : containerId;
  if (el) {
    el.innerHTML = "";
  }
};

/**
 * Setup Firebase RecaptchaVerifier on a DOM element safely.
 * @param {string} containerId ID of the DOM element (default 'recaptcha-container')
 * @param {object} options Additional options for RecaptchaVerifier
 * @returns {RecaptchaVerifier}
 */
export const setupRecaptchaVerifier = (
  containerId = "recaptcha-container",
  options = {},
) => {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error(
      "Firebase is not configured. Please set VITE_FIREBASE_* environment variables.",
    );
  }

  // Clear previous instance & DOM element innerHTML to prevent 'already rendered' error
  clearRecaptcha(containerId);

  const verifier = new RecaptchaVerifier(auth, containerId, {
    size: options.size || "invisible", // 'invisible' or 'normal'
    callback: (response) => {
      if (options.onSuccess) options.onSuccess(response);
    },
    "expired-callback": () => {
      if (options.onExpired) options.onExpired();
    },
    ...options,
  });

  window.recaptchaVerifier = verifier;
  return verifier;
};


/**
 * Send Phone Verification OTP using Firebase Auth.
 * @param {string} phoneNumber Phone number in E.164 format (+91XXXXXXXXXX)
 * @param {RecaptchaVerifier} recaptchaVerifier
 * @returns {Promise<ConfirmationResult>}
 */
export const sendFirebasePhoneOtp = async (phoneNumber, recaptchaVerifier) => {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error("Firebase Authentication is not configured.");
  }

  if (!recaptchaVerifier) {
    recaptchaVerifier = setupRecaptchaVerifier("recaptcha-container");
  }

  try {
    const confirmationResult = await signInWithPhoneNumber(
      auth,
      phoneNumber,
      recaptchaVerifier,
    );
    window.confirmationResult = confirmationResult;
    return confirmationResult;
  } catch (error) {
    console.error("Firebase sendPhoneOtp error:", error);
    // Reset recaptcha if failed so user can try again
    if (window.recaptchaVerifier?.render) {
      try {
        window.recaptchaVerifier.render().then((widgetId) => {
          if (window.grecaptcha) window.grecaptcha.reset(widgetId);
        });
      } catch (e) {
        // ignore reset error
      }
    }
    throw error;
  }
};

/**
 * Confirm the OTP code received via Firebase SMS.
 * @param {ConfirmationResult} confirmationResult The result from sendFirebasePhoneOtp
 * @param {string} otpCode 6-digit OTP code
 * @returns {Promise<{ user: object, idToken: string, phoneNumber: string }>}
 */
export const verifyFirebasePhoneOtp = async (confirmationResult, otpCode) => {
  if (!confirmationResult && window.confirmationResult) {
    confirmationResult = window.confirmationResult;
  }

  if (!confirmationResult) {
    throw new Error("No pending OTP verification session found.");
  }

  try {
    const result = await confirmationResult.confirm(otpCode);
    const user = result.user;
    const idToken = await user.getIdToken(true);
    return {
      user,
      idToken,
      phoneNumber: user.phoneNumber,
    };
  } catch (error) {
    console.error("Firebase verifyPhoneOtp error:", error);
    throw error;
  }
};
