import { Alert } from 'react-native';

export const initializeFirebase = () => {
  try {
    console.log('[Firebase Config] Initializing Firebase...');
    
    const firebase = require('@react-native-firebase/app');
    
    // Check if Firebase is already initialized
    try {
      const existingApp = firebase.app();
      console.log('[Firebase Config] Firebase already initialized');
      return existingApp;
    } catch (error) {
      console.log('[Firebase Config] No existing Firebase app, creating new one...');
    }
    
    // Initialize Firebase app
    const app = firebase.initializeApp();
    console.log('[Firebase Config] Firebase initialized successfully');
    console.log('[Firebase Config] Project ID:', app.options.projectId);
    
    return app;
  } catch (error) {
    console.error('[Firebase Config] Firebase initialization failed:', error);
    console.warn('[Firebase Config] To enable Firebase: Add google-services.json to android/app/');
    return null;
  }
};

export const checkFirebaseConfig = () => {
  try {
    console.log('[Firebase Config] Checking Firebase configuration...');
    
    // Check if Firebase package is available
    let firebase;
    try {
      firebase = require('@react-native-firebase/app');
      console.log('[Firebase Config] Firebase package loaded successfully');
    } catch (importError) {
      console.error('[Firebase Config] Failed to import Firebase:', importError);
      return false;
    }

    // Check if Firebase app is initialized
    let app;
    try {
      const appFunction = firebase.default?.app || firebase.app;
      if (typeof appFunction !== 'function') {
        console.error('[Firebase Config] firebase.app is not a function:', typeof appFunction);
        return false;
      }
      
      app = appFunction();
      console.log('[Firebase Config] Firebase app instance created');
    } catch (appError) {
      console.error('[Firebase Config] Failed to create Firebase app:', appError);
      return false;
    }
    
    if (app) {
      console.log('[Firebase Config] Firebase is properly initialized');
      console.log('[Firebase Config] Project ID:', app.options.projectId);
      console.log('[Firebase Config] App ID:', app.options.appId);
      return true;
    } else {
      console.error('[Firebase Config] Firebase app is null');
      return false;
    }
  } catch (error) {
    console.error('[Firebase Config] Firebase configuration error:', error);
    return false;
  }
};

export const getFirebaseConfig = () => {
  try {
    const firebase = require('@react-native-firebase/app');
    const appFunction = firebase.default?.app || firebase.app;
    const app = appFunction();
    return app.options;
  } catch (error) {
    console.error('[Firebase Config] Failed to get Firebase config:', error);
    return null;
  }
}; 