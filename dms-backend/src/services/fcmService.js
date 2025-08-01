const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// Note: You'll need to add your service account key file
let app;
try {
  // Try to initialize if service account key exists
  const serviceAccount = require('../service-account-key.json');
  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
  console.log('Firebase Admin SDK not initialized - service account key not found');
  console.log('Please add your service-account-key.json file to src/ directory');
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
    const { User } = require('../models/User');
    const user = await User.findByPk(userId);
    
    if (!user || !user.fcmToken) {
      console.log(`No FCM token found for user ${userId}`);
      return false;
    }

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