// Firebase config for Expo app
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCw93kTCiYNqv1bQmF1UJ-aZoFvaI1TTj8",
  authDomain: "dmsm-5fb08.firebaseapp.com",
  projectId: "dmsm-5fb08",
  storageBucket: "dmsm-5fb08.appspot.com",
  messagingSenderId: "499974453409",
  appId: "1:499974453409:android:ae54875603fed9dd07d8e0"
};

// Prevent double initialization
export const firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Singleton Auth instance
export const firebaseAuth = getAuth(firebaseApp); 