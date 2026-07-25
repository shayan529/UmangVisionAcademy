import admin from "firebase-admin";

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

  if (admin.apps.length === 0) {
    throw new Error(
      "Firebase Admin is not configured on the server. Please check server environment variables.",
    );
  }

  try {
    // checkRevoked: false avoids an extra network call; revocation is
    // an edge case that doesn't apply to freshly-issued phone auth tokens.
    const decodedToken = await admin.auth().verifyIdToken(idToken, false);
    return decodedToken;
  } catch (error) {
    // Log the real Firebase error code to help diagnose env/config issues
    console.error(
      "[Firebase Admin] verifyIdToken failed:",
      error.code || error.errorInfo?.code,
      error.message,
    );
    // Surface a meaningful message to the client
    if (error.code === "auth/id-token-expired") {
      throw new Error("Verification code session expired. Please send a new OTP.");
    }
    if (error.code === "auth/argument-error" || error.code === "auth/invalid-credential") {
      throw new Error("Server Firebase configuration error. Please contact support.");
    }
    throw new Error("Invalid or expired Firebase token.");
  }
};

export default admin;
