// import * as Notifications from 'expo-notifications';
// import Constants from 'expo-constants';
import axios from 'axios';
import { API_URL } from '../config';

export async function registerForPushNotificationsAsync(userId: string) {
  // Temporarily disabled for build testing
  console.log('Push notifications temporarily disabled');
  return null;
  
  // let token;
  // if (Constants.isDevice) {
  //   const { status: existingStatus } = await Notifications.getPermissionsAsync();
  //   let finalStatus = existingStatus;
  //   if (existingStatus !== 'granted') {
  //     const { status } = await Notifications.requestPermissionsAsync();
  //     finalStatus = status;
  //   }
  //   if (finalStatus !== 'granted') {
  //     alert('Failed to get push token for push notification!');
  //     return;
  //   }
  //   token = (await Notifications.getExpoPushTokenAsync()).data;
  //   await sendTokenToBackend(userId, token);
  // } else {
  //   alert('Must use physical device for Push Notifications');
  // }
  // return token;
}

export async function sendTokenToBackend(userId: string, token: string) {
  // Temporarily disabled for build testing
  console.log('Push token registration temporarily disabled');
  
  // try {
  //   await axios.post(`${API_URL}/users/register-expo-push-token`, { userId, token });
  // } catch (err) {
  //   console.error('Failed to register push token:', err);
  // }
} 