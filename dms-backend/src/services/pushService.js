// dms-backend/src/services/pushService.js
const { Expo } = require('expo-server-sdk');
const expo = new Expo();

async function sendPushNotification(expoPushToken, title, message, data = {}) {
  if (!Expo.isExpoPushToken(expoPushToken)) {
    console.error('Invalid Expo push token:', expoPushToken);
    return;
  }
  try {
    await expo.sendPushNotificationsAsync([
      {
        to: expoPushToken,
        sound: 'default',
        title,
        body: message,
        data,
      },
    ]);
  } catch (err) {
    console.error('Error sending push notification:', err);
  }
}

// Enhanced function that checks user preferences before sending notifications
async function sendNotificationWithPreferences(userId, title, message, data = {}, notificationType = 'general') {
  try {
    // Get user's notification preferences from ExpoPushToken table
    const { ExpoPushToken } = require('../models');
    const tokens = await ExpoPushToken.findAll({ where: { userId } });
    
    if (tokens.length === 0) {
      console.log(`No push tokens found for user ${userId}`);
      return;
    }

    // For now, send to all tokens. In the future, you can add preference checking here
    // by storing user preferences in the database and checking them before sending
    for (const token of tokens) {
      await sendPushNotification(token.token, title, message, {
        ...data,
        notificationType,
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`Sent ${notificationType} notification to user ${userId}: ${title}`);
  } catch (error) {
    console.error('Error sending notification with preferences:', error);
  }
}

module.exports = { 
  sendPushNotification,
  sendNotificationWithPreferences 
}; 