import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { checkFirebaseConfig } from '../services/firebaseConfig';

export default function FirebaseTest() {
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