import { Alert } from 'react-native';

export const checkFirebaseConfig = () => {
  try {
    console.log('[Firebase Config] Checking Firebase configuration...');
    
    // Check if Firebase package is available
    let firebase;
    try {
      firebase = require('@react-native-firebase/app');
      console.log('[Firebase Config] Firebase package loaded successfully');
      console.log('[Firebase Config] Firebase object:', typeof firebase);
      console.log('[Firebase Config] Firebase keys:', Object.keys(firebase));
    } catch (importError) {
      console.error('[Firebase Config] Failed to import Firebase:', importError);
      Alert.alert('Firebase Error', 'Firebase package not found. Please run: npm install @react-native-firebase/app');
      return false;
    }

    // Check if Firebase app is initialized
    let app;
    try {
      // Try different ways to access the app function
      const appFunction = firebase.default?.app || firebase.app;
      if (typeof appFunction !== 'function') {
        console.error('[Firebase Config] firebase.app is not a function:', typeof appFunction);
        Alert.alert('Firebase Error', 'Firebase app function not found. Please rebuild the app.');
        return false;
      }
      
      app = appFunction();
      console.log('[Firebase Config] Firebase app instance created');
    } catch (appError) {
      console.error('[Firebase Config] Failed to create Firebase app:', appError);
      Alert.alert('Firebase Error', 'Firebase app initialization failed. Please rebuild the app.');
      return false;
    }
    
    if (app) {
      console.log('[Firebase Config] Firebase is properly initialized');
      console.log('[Firebase Config] Project ID:', app.options.projectId);
      console.log('[Firebase Config] App ID:', app.options.appId);
      return true;
    } else {
      console.error('[Firebase Config] Firebase app is null');
      Alert.alert('Firebase Error', 'Firebase app is null. Please rebuild the app.');
      return false;
    }
  } catch (error) {
    console.error('[Firebase Config] Firebase configuration error:', error);
    Alert.alert('Firebase Error', 'Firebase configuration failed. Please rebuild the app with: npx expo run:android --clear');
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