// dms-backend/src/services/pushService.js
const { Expo } = require('expo-server-sdk');
const expo = new Expo();

async function sendPushNotification(expoPushToken, title, message, data = {}) {
  console.log('Attempting to send push notification:', { expoPushToken, title, message, data });
  
  if (!Expo.isExpoPushToken(expoPushToken)) {
    console.error('Invalid Expo push token:', expoPushToken);
    return;
  }

  try {
    const result = await expo.sendPushNotificationsAsync([
      {
        to: expoPushToken,
        sound: 'default',
        title,
        body: message,
        data,
      },
    ]);
    
    console.log('Push notification sent successfully:', result);
    return result;
  } catch (err) {
    console.error('Error sending push notification:', err);
    throw err;
  }
}

// Enhanced function that checks user preferences before sending notifications
async function sendNotificationWithPreferences(userId, title, message, data = {}, notificationType = 'general') {
  try {
    console.log(`Sending ${notificationType} notification to user ${userId}:`, { title, message, data });
    
    // Get user's notification preferences from ExpoPushToken table
    const { ExpoPushToken } = require('../models');
    const tokens = await ExpoPushToken.findAll({ where: { userId } });
    
    console.log(`Found ${tokens.length} tokens for user ${userId}`);
    
    if (tokens.length === 0) {
      console.log(`No push tokens found for user ${userId}`);
      return;
    }

    // For now, send to all tokens. In the future, you can add preference checking here
    // by storing user preferences in the database and checking them before sending
    let successCount = 0;
    let failureCount = 0;
    
    for (const token of tokens) {
      try {
        await sendPushNotification(token.token, title, message, {
          ...data,
          notificationType,
          timestamp: new Date().toISOString()
        });
        successCount++;
      } catch (error) {
        console.error(`Failed to send notification to token ${token.token}:`, error);
        failureCount++;
      }
    }
    
    console.log(`Sent ${notificationType} notification to user ${userId}: ${title} (${successCount} success, ${failureCount} failed)`);
  } catch (error) {
    console.error('Error sending notification with preferences:', error);
    throw error;
  }
}

module.exports = { 
  sendPushNotification,
  sendNotificationWithPreferences 
}; 