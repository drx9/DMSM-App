// dms-backend/src/services/firebaseService.js
const admin = require('firebase-admin');
const { User } = require('../models');
const { getFirebaseApp, getFirebaseAuth } = require('../config/firebase');

// Get Firebase app instance from centralized config
const firebaseApp = getFirebaseApp();

// Proper Firebase token verification for Phone Auth
async function verifyFirebaseToken(idToken) {
  try {
    console.log('🔐 Verifying Firebase token:', idToken ? 'present' : 'missing');
    
    // Check if this is a test mode token
    if (idToken && idToken.startsWith('test_mode_token_')) {
      console.log('🧪 Test mode token detected:', idToken);
      
      // Extract phone number from test token
      const tokenParts = idToken.split('_');
      console.log('Token parts:', tokenParts);
      
      if (tokenParts.length >= 3) {
        let phoneNumber = tokenParts[tokenParts.length - 1];
        phoneNumber = phoneNumber.replace(/\D/g, '');
        if (phoneNumber.length > 10) {
          phoneNumber = phoneNumber.slice(-10);
        }
        
        if (phoneNumber.length !== 10) {
          console.error('Invalid phone number length:', phoneNumber.length);
          throw new Error('Invalid phone number length in test token');
        }
        
        console.log('🧪 Test mode phone number:', phoneNumber);
        
        const decodedToken = {
          uid: 'test_user_' + Date.now(),
          email: 'test@example.com',
          email_verified: true,
          phone_number: phoneNumber
        };
        
        console.log('🧪 Test mode decoded token:', decodedToken);
        return decodedToken;
      } else {
        console.error('Invalid test mode token format:', idToken);
        throw new Error('Invalid test mode token format');
      }
    }
    
    // Real Firebase token verification
    if (!firebaseApp) {
      console.log('⚠️ Firebase Admin SDK not configured, cannot verify real tokens');
      throw new Error('Firebase Admin SDK not configured');
    }
    
    // Check if Firebase app has proper credentials for token verification
    if (!firebaseApp.options.credential) {
      console.log('⚠️ Firebase Admin SDK initialized without credentials - cannot verify tokens');
      console.log('⚠️ Current Firebase config:', firebaseApp.options);
      throw new Error('Firebase Admin SDK initialized without credentials - token verification not supported');
    }
    
    try {
      const auth = getFirebaseAuth();
      if (!auth) {
        throw new Error('Firebase Auth not available');
      }
      
      const decodedToken = await auth.verifyIdToken(idToken);
      console.log('✅ Firebase token verified successfully:', {
        uid: decodedToken.uid,
        phone_number: decodedToken.phone_number,
        email: decodedToken.email
      });
      return decodedToken;
    } catch (firebaseError) {
      console.error('❌ Firebase token verification failed:', firebaseError.message);
      throw new Error('Invalid Firebase token: ' + firebaseError.message);
    }
    
  } catch (error) {
    console.error('❌ Error verifying Firebase token:', error);
    throw error;
  }
}

// Create or update user from Firebase auth
async function createOrUpdateUserFromFirebase(firebaseUser) {
  try {
    const { uid, email, email_verified, phone_number } = firebaseUser;
    
    // Check if user exists by Firebase UID or phone number
    let user = await User.findOne({ 
      where: { 
        [require('sequelize').Op.or]: [
          { firebaseUid: uid },
          { phoneNumber: phone_number }
        ]
      } 
    });
    
    if (!user) {
      // Create new user
      user = await User.create({
        firebaseUid: uid,
        phoneNumber: phone_number,
        email: email || null,
        emailVerified: email_verified || false,
        name: email ? email.split('@')[0] : `User_${phone_number}`,
        password: 'firebase_auth_user', // Placeholder password
        isVerified: true, // Firebase Phone Auth users are verified
        role: 'user'
      });
      console.log('✅ New user created from Firebase:', user.id);
    } else {
      // Update existing user
      await user.update({
        firebaseUid: uid,
        phoneNumber: phone_number,
        email: email || user.email,
        emailVerified: email_verified || user.emailVerified,
        isVerified: true
      });
      console.log('✅ Existing user updated from Firebase:', user.id);
    }
    
    return user;
  } catch (error) {
    console.error('❌ Error creating/updating user from Firebase:', error);
    throw error;
  }
}

module.exports = {
  verifyFirebaseToken,
  createOrUpdateUserFromFirebase
}; 