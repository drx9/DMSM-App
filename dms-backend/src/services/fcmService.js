const admin = require('firebase-admin');
const { getFirebaseApp, getFirebaseMessaging } = require('../config/firebase');

// Get Firebase app instance from centralized config
const app = getFirebaseApp();

const sendFCMNotification = async (fcmToken, title, body, data = {}) => {
  if (!app) {
    console.error('Firebase Admin SDK not initialized');
    return false;
  }

  try {
    // Convert all data values to strings (Firebase requirement)
    const stringData = {};
    Object.keys(data).forEach(key => {
      stringData[key] = String(data[key]);
    });

    const message = {
      token: fcmToken,
      notification: {
        title,
        body,
      },
      data: stringData,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default',
        },
      },
    };

    const messaging = getFirebaseMessaging();
    if (!messaging) {
      console.error('Firebase Messaging not available');
      return false;
    }
    const response = await messaging.send(message);
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