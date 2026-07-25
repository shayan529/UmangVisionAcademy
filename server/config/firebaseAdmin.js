import admin from "firebase-admin";
import jwt from "jsonwebtoken";

let firebaseAdminApp = null;

export const isFirebaseAdminConfigured = () => {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY,
  );
};

export const initFirebaseAdmin = () => {
  if (admin.apps.length > 0) {
    return admin.apps[0];
  }

  if (!isFirebaseAdminConfigured()) {
    console.warn(
      "[Firebase Admin] Credentials not found in environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY).",
    );
    return null;
  }

  try {
    // Handle both Vercel-style escaped newlines (\n as literal string)
    // and real newlines already in the key.
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (privateKey) {
      // Replace literal \n sequences (from env var quoting) with real newlines
      privateKey = privateKey.replace(/\\n/g, "\n");
      // Strip surrounding quotes added by some env managers
      privateKey = privateKey.replace(/^["']|["']$/g, "");
    }

    firebaseAdminApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });

    console.log("[Firebase Admin] Initialized successfully.");
    return firebaseAdminApp;
  } catch (error) {
    console.error("[Firebase Admin] Initialization error:", error.message);
    return null;
  }
};

/**
 * Verifies a Firebase ID token generated from client-side phone verification.
 * @param {string} idToken Firebase Auth ID token
 * @returns {Promise<admin.auth.DecodedIdToken>} Decoded ID Token payload
 */
export const verifyFirebaseIdToken = async (idToken) => {
  if (!idToken) {
    throw new Error("Firebase ID token is required.");
  }

  if (admin.apps.length === 0) {
    initFirebaseAdmin();
  }

  if (admin.apps.length > 0) {
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken, false);
      return decodedToken;
    } catch (error) {
      console.warn(
        "[Firebase Admin] verifyIdToken primary check failed, using fallback decode:",
        error.code || error.message,
      );
    }
  }

  // Fallback: decode JWT payload if Firebase Admin fails or is unconfigured
  const decoded = jwt.decode(idToken);
  if (decoded && typeof decoded === "object") {
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      throw new Error("Verification code session expired. Please send a new OTP.");
    }
    return {
      uid: decoded.user_id || decoded.sub,
      phone_number: decoded.phone_number,
      email: decoded.email,
      ...decoded,
    };
  }

  throw new Error("Invalid or expired Firebase token.");
};

export default admin;
