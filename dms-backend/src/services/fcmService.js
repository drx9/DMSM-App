const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
let app;
try {
  let serviceAccount;
  
  // Check if we're in Railway (production) environment
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    // Use environment variable (Railway)
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    console.log('Firebase Admin SDK initialized with Railway environment variable');
  } else {
    // Use local file (development)
    serviceAccount = require('../service-account-key.json');
    console.log('Firebase Admin SDK initialized with local service account key');
  }
  
  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
  console.log('Firebase Admin SDK not initialized:', error.message);
  console.log('Please add FIREBASE_SERVICE_ACCOUNT_KEY environment variable in Railway or service-account-key.json file locally');
}

const sendFCMNotification = async (fcmToken, title, body, data = {}) => {
  if (!app) {
    console.error('Firebase Admin SDK not initialized');
    return false;
  }

  try {
    const message = {
      token: fcmToken,
      notification: {
        title,
        body,
      },
      data: data,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default',
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log('FCM notification sent successfully:', response);
    return true;
  } catch (error) {
    console.error('Error sending FCM notification:', error);
    return false;
  }
};

const sendFCMNotificationToUser = async (userId, title, body, data = {}) => {
  try {
    // Get user's FCM token from database
    const { User } = require('../models');
    const user = await User.findByPk(userId);
    
    if (!user) {
      console.log(`User not found: ${userId}`);
      return false;
    }
    
    if (!user.fcmToken) {
      console.log(`No FCM token found for user ${userId}`);
      return false;
    }

    console.log(`Sending FCM notification to user ${userId} with token: ${user.fcmToken.substring(0, 20)}...`);
    return await sendFCMNotification(user.fcmToken, title, body, data);
  } catch (error) {
    console.error('Error sending FCM notification to user:', error);
    return false;
  }
};

module.exports = { 
  sendFCMNotification, 
  sendFCMNotificationToUser 
}; 