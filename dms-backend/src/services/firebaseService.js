// dms-backend/src/services/firebaseService.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Simple Firebase token verification without firebase-admin
async function verifyFirebaseToken(idToken) {
  try {
    // For now, we'll use a simplified approach
    // In production, you should verify the token with Firebase
    console.log('Firebase token verification (simplified):', idToken);
    
    // Extract user info from token (this is a simplified approach)
    // In production, you should properly verify the token with Firebase
    const decodedToken = {
      uid: idToken.uid || 'unknown',
      email: idToken.email || 'unknown@example.com',
      email_verified: idToken.email_verified || false
    };
    
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