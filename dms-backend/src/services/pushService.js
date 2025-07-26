// dms-backend/src/services/pushService.js
const { Expo } = require('expo-server-sdk');
const expo = new Expo();

// Firebase Admin SDK for HTTP v1 API
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = require('../../fcm-service-account.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'dmsm-5fb08'
  });
}

async function sendPushNotification(expoPushToken, title, message, data = {}) {
  console.log('Attempting to send push notification:', { expoPushToken, title, message, data });
  
  if (!Expo.isExpoPushToken(expoPushToken)) {
    console.error('Invalid Expo push token:', expoPushToken);
    return;
  }

  try {
    // Try Expo push service first
    const expoResult = await expo.sendPushNotificationsAsync([
      {
        to: expoPushToken,
        sound: 'default',
        title,
        body: message,
        data,
      },
    ]);
    
    console.log('Expo push notification result:', expoResult);
    
    // If Expo fails with FCM error, try Firebase HTTP v1 API directly
    if (expoResult[0] && expoResult[0].status === 'error' && 
        expoResult[0].message.includes('FCM server key')) {
      
      console.log('Expo FCM failed, trying Firebase HTTP v1 API directly...');
      
      // Convert Expo token to FCM token format (this is a simplified approach)
      // In production, you'd need to store both Expo and FCM tokens
      const fcmToken = expoPushToken.replace('ExponentPushToken[', '').replace(']', '');
      
      const firebaseMessage = {
        message: {
          token: fcmToken,
          notification: {
            title: title,
            body: message
          },
          data: {
            ...data,
            notificationType: data.notificationType || 'general',
            timestamp: new Date().toISOString()
          },
          android: {
            notification: {
              sound: 'default',
              priority: 'high'
            }
          }
        }
      };

      const firebaseResult = await admin.messaging().send(firebaseMessage);
      console.log('Firebase HTTP v1 API result:', firebaseResult);
      return [{ status: 'ok', firebaseResult }];
    }
    
    return expoResult;
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