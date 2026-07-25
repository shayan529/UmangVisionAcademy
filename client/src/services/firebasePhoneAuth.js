import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth, isFirebaseConfigured } from "../config/firebase.js";

/**
 * Poll for a DOM element by ID, up to a timeout.
 * Needed because render() crashes with a null-style error if called before
 * the element is painted (e.g. reCAPTCHA script loads before React mounts).
 *
 * @param {string} id        Element ID to wait for
 * @param {number} [timeout] Max wait in ms (default 3000)
 * @returns {Promise<HTMLElement|null>}
 */
const waitForElement = (id, timeout = 3000) => {
  return new Promise((resolve) => {
    const el = document.getElementById(id);
    if (el) return resolve(el);

    const start = Date.now();
    const interval = setInterval(() => {
      const found = document.getElementById(id);
      if (found) {
        clearInterval(interval);
        resolve(found);
      } else if (Date.now() - start >= timeout) {
        clearInterval(interval);
        resolve(null);
      }
    }, 50);
  });
};

/**
 * Destroy the RecaptchaVerifier stored on window and wipe the container's
 * innerHTML so Firebase can render a fresh widget into it next time.
 *
 * Safe to call multiple times — ignores errors from already-cleared instances.
 *
 * @param {string} containerId  ID of the DOM element (default 'recaptcha-container')
 */
export const clearRecaptcha = (containerId = "recaptcha-container") => {
  if (window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear();
    } catch (_) {
      // already cleared — ignore
    }
    window.recaptchaVerifier = null;
  }

  // Also remove any grecaptcha widget iframes appended to <body> by the SDK
  if (window.grecaptcha) {
    try {
      // The SDK uses incrementing widget IDs starting at 0.
      // Reset all widgets that might exist.
      for (let id = 0; id < 10; id++) {
        try { window.grecaptcha.reset(id); } catch (_) { /* ignore */ }
      }
    } catch (_) { /* ignore */ }
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
 * Create a fresh RecaptchaVerifier, render it, and store it on window.
 * Always calls clearRecaptcha first to destroy any prior instance.
 *
 * @param {string} containerId  ID of the DOM element (default 'recaptcha-container')
 * @returns {Promise<RecaptchaVerifier>}  Resolves once the widget is rendered and ready.
 */
export const setupRecaptchaVerifier = async (
  containerId = "recaptcha-container",
) => {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error(
      "Firebase is not configured. Please set VITE_FIREBASE_* environment variables.",
    );
  }

  // Destroy any previous instance first
  clearRecaptcha(containerId);

  // Wait for the container element to be present in the DOM.
  // render() will throw "Cannot read properties of null (reading 'style')"
  // if the element doesn't exist yet (e.g. script loads before React paints).
  const el = await waitForElement(containerId);
  if (!el) {
    throw new Error(
      `reCAPTCHA container #${containerId} not found in DOM. Make sure the element is rendered before sending OTP.`,
    );
  }

  const verifier = new RecaptchaVerifier(auth, containerId, {
    size: "invisible",
    callback: () => {},
    "expired-callback": () => {
      // Widget expired — will be recreated on next send attempt
      clearRecaptcha(containerId);
    },
  });

  // Eagerly render the widget so it's ready before signInWithPhoneNumber.
  // This avoids Firebase calling render() internally at an unexpected time.
  await verifier.render();

  window.recaptchaVerifier = verifier;
  return verifier;
};

/**
 * Send a phone verification OTP via Firebase Auth.
 *
 * Creates a fresh RecaptchaVerifier automatically, then calls
 * signInWithPhoneNumber.  On failure the verifier is destroyed so the next
 * attempt starts clean.
 *
 * @param {string} phoneNumber   E.164 format, e.g. +919876543210
 * @param {string} [containerId] DOM element ID for the reCAPTCHA widget (default 'recaptcha-container')
 * @returns {Promise<import("firebase/auth").ConfirmationResult>}
 */
export const sendFirebasePhoneOtp = async (
  phoneNumber,
  containerId = "recaptcha-container",
) => {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error("Firebase Authentication is not configured.");
  }

  // Always build a fresh verifier to avoid "already rendered" errors
  const verifier = await setupRecaptchaVerifier(containerId);

  try {
    const confirmationResult = await signInWithPhoneNumber(
      auth,
      phoneNumber,
      verifier,
    );
    window.confirmationResult = confirmationResult;
    return confirmationResult;
  } catch (error) {
    // Destroy the verifier so the next attempt can create a clean one
    clearRecaptcha(containerId);
    throw error;
  }
};

/**
 * Confirm the OTP code received via Firebase SMS.
 *
 * @param {import("firebase/auth").ConfirmationResult} confirmationResult
 * @param {string} otpCode  6-digit code from SMS
 * @returns {Promise<{ user: object, idToken: string, phoneNumber: string }>}
 */
export const verifyFirebasePhoneOtp = async (confirmationResult, otpCode) => {
  // Fallback to global in case the React state was lost (e.g. hot-reload)
  if (!confirmationResult && window.confirmationResult) {
    confirmationResult = window.confirmationResult;
  }

  if (!confirmationResult) {
    throw new Error("No pending OTP verification session found.");
  }

  const result = await confirmationResult.confirm(otpCode);
  const user = result.user;
  const idToken = await user.getIdToken(true);
  return { user, idToken, phoneNumber: user.phoneNumber };
};
