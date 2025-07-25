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

module.exports = { sendPushNotification }; 