import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { fcmService } from '../app/services/fcmService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../app/config';

export default function FCMTest() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const testFCMPermission = async () => {
    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Error', 'No user logged in. Please login first.');
        setLoading(false);
        return;
      }
      
      const success = await fcmService.initialize(userId);
      Alert.alert('FCM Permission', success ? 'Granted' : 'Denied');
    } catch (error) {
      Alert.alert('Error', 'Failed to request permission');
    }
    setLoading(false);
  };

  const testFCMToken = async () => {
    setLoading(true);
    try {
      const fcmToken = await fcmService.getFCMToken();
      setToken(fcmToken);
      Alert.alert('FCM Token', fcmToken ? 'Token received!' : 'Failed to get token');
    } catch (error) {
      Alert.alert('Error', 'Failed to get FCM token');
    }
    setLoading(false);
  };

  const testBackendRegistration = async () => {
    if (!token) {
      Alert.alert('Error', 'Get FCM token first');
      return;
    }
    
    setLoading(true);
    try {
      // Get the actual logged-in user ID
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Error', 'No user logged in. Please login first.');
        setLoading(false);
        return;
      }
      
      const success = await fcmService.registerTokenWithBackend(token);
      Alert.alert('Backend Registration', success ? 'Success!' : 'Failed - Check console logs');
    } catch (error) {
      Alert.alert('Error', 'Failed to register with backend');
    }
    setLoading(false);
  };

  const testFCMNotification = async () => {
    if (!token) {
      Alert.alert('Error', 'Get FCM token first');
      return;
    }
    
    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Error', 'No user logged in. Please login first.');
        setLoading(false);
        return;
      }
      
      console.log('[FCM Test] Sending test notification to user:', userId);
      
      // Use FCM service to send test notification
      const success = await fcmService.testFCMNotification();
      if (success) {
        Alert.alert('Success', 'Test notification sent! Check your device.');
      } else {
        Alert.alert('Error', 'Failed to send test notification');
      }
    } catch (error) {
      console.error('[FCM Test] Error:', error);
      Alert.alert('Error', 'Failed to send test notification: ' + (error as Error).message);
    }
    setLoading(false);
  };

  const checkUserFCMToken = async () => {
    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Error', 'No user logged in. Please login first.');
        setLoading(false);
        return;
      }
      
      // Check if user has FCM token in database
      const response = await fetch(`https://dmsm-app-production-a35d.up.railway.app/api/users/${userId}`);
      
      if (response.ok) {
        const user = await response.json();
        const hasToken = user.fcmToken ? 'Yes' : 'No';
        Alert.alert('FCM Token Check', `User has FCM token: ${hasToken}`);
      } else {
        Alert.alert('Error', 'Failed to check user FCM token');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to check user FCM token');
    }
    setLoading(false);
  };

  const directFCMTest = async () => {
    if (!token) {
      Alert.alert('Error', 'Get FCM token first');
      return;
    }
    
    setLoading(true);
    try {
      // Send FCM notification directly using the token
      const response = await fetch(`${API_URL}/users/test-fcm-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: await AsyncStorage.getItem('userId'),
          title: 'Direct FCM Test',
          message: 'This is a direct FCM test!'
        }),
      });
      
      const result = await response.json();
      Alert.alert('Direct FCM Test', result.success ? 'Direct test sent!' : 'Failed');
    } catch (error) {
      Alert.alert('Error', 'Direct FCM test failed');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FCM Test</Text>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={testFCMPermission}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Testing...' : 'Test FCM Permission'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button} 
        onPress={testFCMToken}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Getting Token...' : 'Get FCM Token'}
        </Text>
      </TouchableOpacity>

             <TouchableOpacity 
         style={styles.button} 
         onPress={testBackendRegistration}
         disabled={loading || !token}
       >
         <Text style={styles.buttonText}>
           {loading ? 'Registering...' : 'Register with Backend'}
         </Text>
       </TouchableOpacity>

               <TouchableOpacity 
          style={styles.button} 
          onPress={testFCMNotification}
          disabled={loading || !token}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Sending...' : 'Test FCM Notification'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button} 
          onPress={checkUserFCMToken}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Checking...' : 'Check User FCM Token'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button} 
          onPress={directFCMTest}
          disabled={loading || !token}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Sending Direct...' : 'Direct FCM Test'}
          </Text>
        </TouchableOpacity>

      {token && (
        <View style={styles.tokenContainer}>
          <Text style={styles.tokenLabel}>FCM Token:</Text>
          <Text style={styles.tokenText} numberOfLines={3}>
            {token.substring(0, 50)}...
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    margin: 10,
    borderRadius: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginVertical: 5,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  tokenContainer: {
    marginTop: 15,
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  tokenLabel: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  tokenText: {
    fontSize: 12,
    color: '#666',
  },
}); 