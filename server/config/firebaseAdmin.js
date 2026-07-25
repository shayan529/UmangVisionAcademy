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
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
      : undefined;

    firebaseAdminApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
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
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error("[Firebase Admin] verifyIdToken error:", error.message);
    throw new Error("Invalid or expired Firebase token.");
  }
};

export default admin;
