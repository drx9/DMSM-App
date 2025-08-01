const fetch = require('node-fetch');

// Expo Push Notification Service
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const sendExpoNotification = async (expoPushToken, title, body, data = {}) => {
  try {
    const message = {
      to: expoPushToken,
      title: title,
      body: body,
      data: data,
      sound: 'default',
      priority: 'high',
    };

    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('Expo notification sent successfully:', result);
      return true;
    } else {
      console.error('Error sending Expo notification:', result);
      return false;
    }
  } catch (error) {
    console.error('Error sending Expo notification:', error);
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

    return await sendExpoNotification(user.fcmToken, title, body, data);
  } catch (error) {
    console.error('Error sending FCM notification to user:', error);
    return false;
  }
};

// Keep the old function name for compatibility
const sendFCMNotification = sendExpoNotification;

module.exports = { 
  sendFCMNotification, 
  sendFCMNotificationToUser 
}; 