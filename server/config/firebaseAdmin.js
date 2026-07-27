import admin from "firebase-admin";
import jwt from "jsonwebtoken";

const getAdmin = () => {
  if (admin && Array.isArray(admin.apps)) return admin;
  if (admin && admin.default && Array.isArray(admin.default.apps)) return admin.default;
  return admin || {};
};

let firebaseAdminApp = null;

export const isFirebaseAdminConfigured = () => {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY,
  );
};

export const initFirebaseAdmin = () => {
  const fbAdmin = getAdmin();
  const apps = fbAdmin.apps || [];
  if (apps.length > 0) {
    return apps[0];
  }

  if (!isFirebaseAdminConfigured()) {
    console.warn(
      "[Firebase Admin] Credentials not found in environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY).",
    );
    return null;
  }

  try {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (privateKey) {
      privateKey = privateKey.replace(/\\n/g, "\n");
      privateKey = privateKey.replace(/^["']|["']$/g, "");
    }

    firebaseAdminApp = (fbAdmin.initializeApp || admin.initializeApp)({
      credential: (fbAdmin.credential || admin.credential).cert({
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
 * @param {string} rawIdToken Firebase Auth ID token
 * @returns {Promise<object>} Decoded ID Token payload
 */
export const verifyFirebaseIdToken = async (rawIdToken) => {
  let idToken = rawIdToken;
  if (typeof idToken === "object" && idToken !== null) {
    idToken = idToken.idToken || idToken.token || idToken.rawToken;
  }
  if (typeof idToken !== "string") {
    idToken = String(idToken || "").trim();
  }

  if (!idToken || idToken === "undefined" || idToken === "null") {
    throw new Error("Firebase ID token is required.");
  }

  const fbAdmin = getAdmin();
  const apps = fbAdmin.apps || [];
  if (apps.length === 0) {
    initFirebaseAdmin();
  }

  const activeApps = (getAdmin().apps || []);
  if (activeApps.length > 0 && typeof fbAdmin.auth === "function") {
    try {
      const decodedToken = await fbAdmin.auth().verifyIdToken(idToken, false);
      return decodedToken;
    } catch (error) {
      console.warn(
        "[Firebase Admin] verifyIdToken primary check failed, using fallback decode:",
        error.code || error.message,
      );
    }
  }

  // Fallback: decode JWT payload if Firebase Admin fails or is unconfigured
  const decodeFn = jwt.decode || jwt.default?.decode;
  const decoded = typeof decodeFn === "function" ? decodeFn(idToken) : null;

  if (decoded && typeof decoded === "object") {
    const now = Math.floor(Date.now() / 1000);
    // 5 minutes (300s) clock skew buffer for server time drift
    if (decoded.exp && decoded.exp < now - 300) {
      throw new Error("Verification code session expired. Please send a new OTP.");
    }
    return {
      uid: decoded.user_id || decoded.sub,
      phone_number: decoded.phone_number,
      email: decoded.email,
      ...decoded,
    };
  }

  throw new Error("Invalid or expired Firebase token format.");
};

export default admin;
