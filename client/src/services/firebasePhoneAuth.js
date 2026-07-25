import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth, isFirebaseConfigured } from "../config/firebase.js";

/**
 * Poll for a DOM element by ID, up to a timeout.
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
 * Fully destroy any existing RecaptchaVerifier and reset the container element.
 *
 * Google's grecaptcha SDK internally marks DOM elements as "rendered" and
 * refuses to render into the same element twice. Clearing innerHTML or
 * removing attributes is NOT enough — the SDK keeps an internal map.
 *
 * The only reliable fix is to replace the container with a brand-new DOM
 * element that has the same ID. Since #recaptcha-container is a simple
 * empty <div> with no React children, this is safe.
 *
 * @param {string} containerId  ID of the DOM element (default 'recaptcha-container')
 */
export const clearRecaptcha = (containerId = "recaptcha-container") => {
  // 1. Clear the Firebase RecaptchaVerifier instance
  if (window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear();
    } catch (_) {
      // already cleared — ignore
    }
    window.recaptchaVerifier = null;
  }

  // 2. Reset any grecaptcha widgets the SDK may have created
  if (window.grecaptcha) {
    try {
      for (let id = 0; id < 10; id++) {
        try { window.grecaptcha.reset(id); } catch (_) { /* ignore */ }
      }
    } catch (_) { /* ignore */ }
  }

  // 3. Remove orphaned reCAPTCHA iframes injected into document.body
  document.querySelectorAll("body > div").forEach((div) => {
    if (div.querySelector('iframe[src*="recaptcha"]')) {
      try { div.remove(); } catch (_) { /* ignore */ }
    }
  });

  // 4. Replace the container element with a fresh clone so the grecaptcha
  //    SDK's internal "already rendered" tracking is fully reset.
  const el =
    typeof containerId === "string"
      ? document.getElementById(containerId)
      : containerId;
  if (el && el.parentNode) {
    const freshEl = document.createElement("div");
    freshEl.id = containerId;
    el.parentNode.replaceChild(freshEl, el);
  }
};

/**
 * Create a fresh RecaptchaVerifier, render it, and store it on window.
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

  // Always start clean — destroy any previous verifier and reset the container
  clearRecaptcha(containerId);

  // Wait for the fresh container element to be present in the DOM
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
      clearRecaptcha(containerId);
    },
  });

  await verifier.render();
  window.recaptchaVerifier = verifier;
  return verifier;
};

/**
 * Send a phone verification OTP via Firebase Auth.
 *
 * Creates a fresh RecaptchaVerifier automatically, then calls
 * signInWithPhoneNumber. On failure the verifier is destroyed so the next
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
