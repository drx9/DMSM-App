const admin = require('firebase-admin');

// Centralized Firebase Admin SDK initialization
let firebaseApp = null;

function initializeFirebase() {
  try {
    // Check if Firebase is already initialized
    if (!admin.apps.length) {
      // Initialize with service account or environment variables
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        // Use Railway environment variable (production)
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
        console.log('✅ Firebase Admin SDK initialized with Railway service account');
      } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
        console.log('✅ Firebase Admin SDK initialized with local service account');
      } else if (process.env.FIREBASE_PROJECT_ID) {
        // Initialize with project ID (for testing/development)
        console.log('⚠️ Firebase Admin SDK initialized with project ID only - token verification will not work');
        console.log('⚠️ For production, you need FIREBASE_SERVICE_ACCOUNT with full credentials');
        firebaseApp = admin.initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID
        });
      } else {
        console.log('Firebase Admin SDK not configured. Using test mode.');
      }
    } else {
      // Firebase is already initialized, get the existing app
      firebaseApp = admin.app();
      console.log('✅ Firebase Admin SDK already initialized, using existing app');
      
      // Check if the existing app has credentials
      if (firebaseApp.options.credential) {
        console.log('✅ Existing Firebase app has credentials for token verification');
      } else {
        console.log('⚠️ Existing Firebase app lacks credentials for token verification');
      }
    }
    
    return firebaseApp;
  } catch (error) {
    console.log('Firebase Admin SDK initialization failed:', error.message);
    console.log('Using test mode for development.');
    return null;
  }
}

function getFirebaseApp() {
  if (!firebaseApp) {
    firebaseApp = initializeFirebase();
  }
  return firebaseApp;
}

function getFirebaseAuth() {
  const app = getFirebaseApp();
  return app ? app.auth() : null;
}

function getFirebaseMessaging() {
  const app = getFirebaseApp();
  return app ? app.messaging() : null;
}

module.exports = {
  initializeFirebase,
  getFirebaseApp,
  getFirebaseAuth,
  getFirebaseMessaging
};
