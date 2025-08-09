// dms-backend/src/services/firebaseService.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Simple Firebase token verification without firebase-admin
async function verifyFirebaseToken(idToken) {
  try {
    console.log('Verifying token:', idToken);
    
    // Check if this is a test mode token
    if (idToken && idToken.startsWith('test_mode_token_')) {
      console.log('Test mode token detected:', idToken);
      
      // Extract phone number from test token
      // Supported formats:
      //  - test_mode_token_<phone>
      //  - test_mode_token_<timestamp>_<phone>
      const tokenParts = idToken.split('_');
      console.log('Token parts:', tokenParts);
      
      if (tokenParts.length >= 4) {
        // Use the last segment as phone number to avoid including timestamp
        let phoneNumber = tokenParts[tokenParts.length - 1];
        // Keep only digits and trim to last 10 digits (Indian numbers)
        phoneNumber = phoneNumber.replace(/\D/g, '');
        if (phoneNumber.length > 10) {
          phoneNumber = phoneNumber.slice(-10);
        }
        console.log('Test mode phone number:', phoneNumber);
        
        const decodedToken = {
          uid: 'test_user_' + Date.now(),
          email: 'test@example.com',
          email_verified: true,
          phone_number: phoneNumber
        };
        
        console.log('Test mode decoded token:', decodedToken);
        return decodedToken;
      } else {
        console.error('Invalid test mode token format:', idToken);
        throw new Error('Invalid test mode token format');
      }
    }
    
    // For now, we'll use a simplified approach
    // In production, you should verify the token with Firebase
    console.log('Firebase token verification (simplified):', idToken);
    
    // Since we're not using firebase-admin, we'll decode the JWT manually
    // This is a simplified approach - in production, verify with Firebase
    const tokenParts = idToken.split('.');
    if (tokenParts.length !== 3) {
      throw new Error('Invalid token format');
    }
    
    // Decode the payload (second part of JWT)
    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
    
    console.log('Raw payload:', payload);
    
    const decodedToken = {
      uid: payload.user_id || payload.sub || 'unknown',
      email: payload.email || 'unknown@example.com',
      email_verified: payload.email_verified || false,
      phone_number: payload.phone_number || payload.phoneNumber || null
    };
    
    console.log('Decoded token:', decodedToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    throw new Error('Invalid Firebase token');
  }
}

// Create or update user from Firebase auth
async function createOrUpdateUserFromFirebase(firebaseUser) {
  try {
    const { uid, email, email_verified } = firebaseUser;
    
    // Check if user exists
    let user = await User.findOne({ where: { firebaseUid: uid } });
    
    if (!user) {
      // Create new user
      user = await User.create({
        firebaseUid: uid,
        email: email,
        emailVerified: email_verified,
        name: email.split('@')[0], // Use email prefix as name
        phone: null,
        role: 'customer'
      });
      console.log('New user created from Firebase:', user.id);
    } else {
      // Update existing user
      await user.update({
        email: email,
        emailVerified: email_verified
      });
      console.log('Existing user updated from Firebase:', user.id);
    }
    
    return user;
  } catch (error) {
    console.error('Error creating/updating user from Firebase:', error);
    throw error;
  }
}

module.exports = {
  verifyFirebaseToken,
  createOrUpdateUserFromFirebase
}; 