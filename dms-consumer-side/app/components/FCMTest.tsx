import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { checkFirebaseConfig } from '../services/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config';
import { fcmService } from '../services/fcmService';

export default function FCMTest() {
  const [loading, setLoading] = useState(false);

  const testFirebaseConfig = async () => {
    setLoading(true);
    try {
      console.log('[Firebase Test] Starting Firebase configuration test...');
      
      // Test basic require
      try {
        const firebase = require('@react-native-firebase/app');
        console.log('[Firebase Test] Firebase package loaded:', typeof firebase);
        console.log('[Firebase Test] Firebase keys:', Object.keys(firebase));
      } catch (error) {
        console.error('[Firebase Test] Failed to require Firebase:', error);
        Alert.alert('Error', 'Firebase package not found. Please install @react-native-firebase/app');
        setLoading(false);
        return;
      }

      // Test auth package
      try {
        const auth = require('@react-native-firebase/auth');
        console.log('[Firebase Test] Auth package loaded:', typeof auth);
      } catch (error) {
        console.error('[Firebase Test] Failed to require Firebase Auth:', error);
        Alert.alert('Error', 'Firebase Auth package not found. Please install @react-native-firebase/auth');
        setLoading(false);
        return;
      }

      const isWorking = checkFirebaseConfig();
      Alert.alert(
        'Firebase Test',
        isWorking ? 'Firebase is working! ✅' : 'Firebase has issues ❌'
      );
    } catch (error) {
      console.error('[Firebase Test] Test failed:', error);
      Alert.alert('Error', 'Firebase test failed: ' + error.message);
    }
    setLoading(false);
  };

  const testPhoneAuth = async () => {
    setLoading(true);
    try {
      const { firebasePhoneAuthService } = require('../services/firebasePhoneAuthService');
      const success = await firebasePhoneAuthService.sendPhoneOTP('9999999999');
      Alert.alert(
        'Phone Auth Test',
        success ? 'Phone Auth is working! ✅' : 'Phone Auth failed ❌'
      );
    } catch (error) {
      console.error('[Firebase Test] Phone Auth test failed:', error);
      Alert.alert('Error', 'Phone Auth test failed: ' + error.message);
    }
    setLoading(false);
  };

  const testFirebasePackages = async () => {
    setLoading(true);
    try {
      const results = [];
      
      // Test each package individually
      try {
        const firebaseApp = require('@react-native-firebase/app');
        results.push(`✅ @react-native-firebase/app: ${typeof firebaseApp}`);
      } catch (error) {
        results.push(`❌ @react-native-firebase/app: ${error.message}`);
      }

      try {
        const firebaseAuth = require('@react-native-firebase/auth');
        results.push(`✅ @react-native-firebase/auth: ${typeof firebaseAuth}`);
      } catch (error) {
        results.push(`❌ @react-native-firebase/auth: ${error.message}`);
      }

      try {
        const firebaseMessaging = require('@react-native-firebase/messaging');
        results.push(`✅ @react-native-firebase/messaging: ${typeof firebaseMessaging}`);
      } catch (error) {
        results.push(`❌ @react-native-firebase/messaging: ${error.message}`);
      }

      Alert.alert('Firebase Packages', results.join('\n'));
    } catch (error) {
      Alert.alert('Error', 'Package test failed: ' + error.message);
    }
    setLoading(false);
  };

  const checkUserFCMToken = async () => {
    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Error', 'No user logged in');
        setLoading(false);
        return;
      }

      console.log('[FCM Test] Checking FCM token for user:', userId);
      console.log('[FCM Test] API URL:', `${API_URL}/users/check-fcm-token/${userId}`);
      
      const response = await axios.get(`${API_URL}/users/check-fcm-token/${userId}`);
      
      console.log('[FCM Test] Response status:', response.status);
      console.log('[FCM Test] Response data:', response.data);
      
      if (response.data.success) {
        if (response.data.hasFCMToken) {
          Alert.alert('FCM Token Status', `✅ User has FCM token: ${response.data.fcmToken}`);
        } else {
          Alert.alert('FCM Token Status', '❌ User does not have FCM token stored in database');
        }
      } else {
        Alert.alert('FCM Token Status', '❌ Failed to check FCM token');
      }
    } catch (error) {
      console.error('[FCM Test] Error checking FCM token:', error);
      console.error('[FCM Test] Error response:', error.response?.data);
      console.error('[FCM Test] Error status:', error.response?.status);
      Alert.alert('Error', 'Failed to check FCM token: ' + (error.response?.data?.message || error.message));
    }
    setLoading(false);
  };

  const forceReRegisterFCM = async () => {
    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Error', 'No user logged in');
        setLoading(false);
        return;
      }

      console.log('[FCM Test] Force re-registering FCM token...');
      
      // Initialize FCM service
      await fcmService.initialize(userId);
      
      // Force re-register
      const success = await fcmService.forceReRegister();
      
      if (success) {
        Alert.alert('Success', 'FCM token re-registered successfully! ✅');
      } else {
        Alert.alert('Error', 'Failed to re-register FCM token ❌');
      }
    } catch (error) {
      console.error('[FCM Test] Error re-registering FCM token:', error);
      Alert.alert('Error', 'Failed to re-register FCM token: ' + error.message);
    }
    setLoading(false);
  };

  const testFCMNotification = async () => {
    setLoading(true);
    try {
      const success = await fcmService.testFCMNotification();
      if (success) {
        Alert.alert('Success', 'FCM notification test sent! Check your device.');
      } else {
        Alert.alert('Error', 'FCM notification test failed');
      }
    } catch (error) {
      console.error('[FCM Test] Error testing FCM notification:', error);
      Alert.alert('Error', 'FCM notification test failed: ' + error.message);
    }
    setLoading(false);
  };

  const manuallyRegisterToken = async () => {
    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Error', 'No user logged in');
        setLoading(false);
        return;
      }

      console.log('[FCM Test] Manually registering FCM token...');
      
      // Get current FCM token
      const token = await fcmService.getFCMToken();
      if (!token) {
        Alert.alert('Error', 'No FCM token available');
        setLoading(false);
        return;
      }

      // Manually register with backend
      const response = await axios.post(`${API_URL}/users/register-fcm-token`, {
        userId: userId,
        fcmToken: token,
        platform: 'android'
      });

      if (response.data.success) {
        Alert.alert('Success', 'FCM token manually registered! ✅');
      } else {
        Alert.alert('Error', 'Failed to register FCM token: ' + response.data.message);
      }
    } catch (error) {
      console.error('[FCM Test] Error manually registering token:', error);
      Alert.alert('Error', 'Failed to register FCM token: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Firebase Test</Text>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={testFirebasePackages}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Testing...' : 'Test Firebase Packages'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button} 
        onPress={testFirebaseConfig}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Testing...' : 'Test Firebase Config'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button} 
        onPress={testPhoneAuth}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Testing...' : 'Test Phone Auth'}
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
        onPress={forceReRegisterFCM}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Re-registering...' : 'Force Re-register FCM'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button} 
        onPress={testFCMNotification}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Testing...' : 'Test FCM Notification'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button} 
        onPress={manuallyRegisterToken}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Registering...' : 'Manually Register FCM Token'}
        </Text>
      </TouchableOpacity>
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
    padding: 15,
    borderRadius: 8,
    marginVertical: 5,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
}); 