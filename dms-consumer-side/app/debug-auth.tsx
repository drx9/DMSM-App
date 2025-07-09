import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://dmsm-app-production-a35d.up.railway.app/api';

const DebugAuthScreen = () => {
  const [phoneNumber, setPhoneNumber] = useState('1234567890');
  const [otp, setOtp] = useState('');
  const [userId, setUserId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const testAsyncStorage = async () => {
    try {
      await AsyncStorage.setItem('testKey', 'testValue');
      const value = await AsyncStorage.getItem('testKey');
      Alert.alert('AsyncStorage Test', `Success: ${value}`);
    } catch (error) {
      Alert.alert('AsyncStorage Test', `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testBackend = async () => {
    try {
      const response = await axios.get(`${API_URL}/health`);
      Alert.alert('Backend Test', `Success: ${response.status}`);
    } catch (error) {
      Alert.alert('Backend Test', `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const initiateLogin = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post(`${API_URL}/auth/login`, {
        phoneNumber: phoneNumber,
      });

      console.log('Login response:', response.data);

      if (response.data.success && response.data.userExists) {
        setUserId(response.data.userId);
        Alert.alert('Login', `OTP sent to ${phoneNumber}. Check console for OTP.`);
      } else {
        Alert.alert('Login', 'User not found. Please register first.');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Login Error', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post(`${API_URL}/auth/verify`, {
        userId: userId,
        otp: otp,
        type: 'PHONE'
      });

      console.log('OTP verification response:', response.data);

      if (response.data.token) {
        console.log('Token received:', response.data.token);

        // Store token
        await AsyncStorage.setItem('userToken', response.data.token);
        console.log('Token stored in AsyncStorage');

        // Verify storage
        const storedToken = await AsyncStorage.getItem('userToken');
        console.log('Stored token retrieved:', storedToken ? 'Success' : 'Failed');

        Alert.alert('Success', 'Token stored successfully!');
      } else {
        Alert.alert('Error', 'No token received');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      Alert.alert('OTP Error', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const checkToken = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      Alert.alert('Token Check', token ? `Token exists: ${token.substring(0, 20)}...` : 'No token found');
    } catch (error) {
      Alert.alert('Token Check Error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const testProfileAPI = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Profile Test', 'No token found');
        return;
      }

      const response = await axios.get(`${API_URL}/user/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Profile response:', response.data);
      Alert.alert('Profile Test', 'Profile API working!');
    } catch (error) {
      console.error('Profile test error:', error);
      Alert.alert('Profile Test Error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const clearToken = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      Alert.alert('Clear Token', 'Token cleared successfully');
    } catch (error) {
      Alert.alert('Clear Token Error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleProfileAPI = async () => {
    try {
      await testProfileAPI();
    } catch (error) {
      console.error('Profile API test error:', error);
      Alert.alert('Profile API Test Error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleClearAllData = async () => {
    try {
      await clearToken();
      await AsyncStorage.removeItem('testKey');
      Alert.alert('Clear All Data', 'All stored data cleared successfully');
    } catch (error) {
      Alert.alert('Clear All Data Error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Authentication Debug</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Tests</Text>
        <TouchableOpacity style={styles.button} onPress={testAsyncStorage}>
          <Text style={styles.buttonText}>Test AsyncStorage</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={testBackend}>
          <Text style={styles.buttonText}>Test Backend</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={checkToken}>
          <Text style={styles.buttonText}>Check Token</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={clearToken}>
          <Text style={styles.buttonText}>Clear Token</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Login Flow</Text>
        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
        />
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={initiateLogin}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Sending...' : 'Send OTP'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>OTP Verification</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter OTP"
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
        />
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={verifyOTP}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Verifying...' : 'Verify OTP'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API Tests</Text>
        <TouchableOpacity style={styles.debugButton} onPress={handleProfileAPI}>
          <Text style={styles.debugButtonText}>Test Profile API</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#4CAF50' }]}
          onPress={() => router.push('/account-details')}
        >
          <Text style={styles.buttonText}>Go to Account Details</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.debugButton} onPress={handleClearAllData}>
          <Text style={styles.debugButtonText}>Clear All Stored Data</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#1A1A1A',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1A1A1A',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  debugButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  debugButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DebugAuthScreen; 