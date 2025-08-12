import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './context/AuthContext';
import { useRouter } from 'expo-router';

const DebugAuthScreen = () => {
  const [storageData, setStorageData] = useState<any>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { debugStorage, testModeLogin, logout, user, isAuthenticated, forceAuthCheck } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadStorageData();
  }, []);

  const loadStorageData = async () => {
    try {
      const data = await debugStorage();
      setStorageData(data);
    } catch (error) {
      console.error('Error loading storage data:', error);
    }
  };

  const testAsyncStorage = async () => {
    try {
      await AsyncStorage.setItem('testKey', 'testValue');
      const value = await AsyncStorage.getItem('testKey');
      await AsyncStorage.removeItem('testKey');
      Alert.alert('AsyncStorage Test', value === 'testValue' ? '✅ Working!' : '❌ Failed');
    } catch (error) {
      Alert.alert('AsyncStorage Test Error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const testBackend = async () => {
    try {
      const response = await fetch('https://httpbin.org/get');
      if (response.ok) {
        Alert.alert('Backend Test', '✅ Network working!');
      } else {
        Alert.alert('Backend Test', '❌ Network failed');
      }
    } catch (error) {
      Alert.alert('Backend Test Error', error instanceof Error ? error.message : 'Unknown error');
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

  const clearToken = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      Alert.alert('Clear Token', 'Token cleared successfully');
      loadStorageData();
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
      await AsyncStorage.clear();
      Alert.alert('Clear All Data', 'All stored data cleared successfully');
      loadStorageData();
    } catch (error) {
      Alert.alert('Clear All Data Error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const testProfileAPI = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Profile Test', 'No token found');
        return;
      }

      // You can replace this with your actual API endpoint
      const response = await fetch('https://httpbin.org/headers', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Profile response:', response.status);
      Alert.alert('Profile Test', 'Profile API working!');
    } catch (error) {
      console.error('Profile test error:', error);
      Alert.alert('Profile Test Error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const initiateLogin = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter a phone number');
      return;
    }

    setIsLoading(true);
    try {
      const success = await testModeLogin();
      if (success) {
        Alert.alert('Success', 'Test mode login successful!');
        loadStorageData();
      } else {
        Alert.alert('Error', 'Test mode login failed');
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      Alert.alert('Success', 'Logged out successfully');
      loadStorageData();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const goToMainApp = () => {
    router.replace('/(tabs)');
  };

  const goToLogin = () => {
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Authentication Debug</Text>

        {/* Current Auth State */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Auth State</Text>
          <Text style={styles.infoText}>User: {user ? user.id : 'None'}</Text>
          <Text style={styles.infoText}>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</Text>
        </View>

        {/* Storage Contents */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Storage Contents</Text>
          {storageData ? (
            <View>
              <Text style={styles.infoText}>All Keys: {storageData.allKeys?.length || 0}</Text>
              <Text style={styles.infoText}>Auth Keys: {Object.keys(storageData.authData || {}).length}</Text>
              {storageData.authData && Object.entries(storageData.authData).map(([key, value]: [string, any]) => (
                <Text key={key} style={styles.storageItem}>
                  {key}: {value ? (value.length > 50 ? `${value.substring(0, 50)}...` : value) : 'null'}
                </Text>
              ))}
            </View>
          ) : (
            <Text style={styles.infoText}>Loading storage data...</Text>
          )}
          <TouchableOpacity style={styles.button} onPress={loadStorageData}>
            <Text style={styles.buttonText}>Refresh Storage Data</Text>
          </TouchableOpacity>
        </View>

        {/* Basic Tests */}
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
          <TouchableOpacity style={styles.button} onPress={forceAuthCheck}>
            <Text style={styles.buttonText}>Force Auth Check</Text>
          </TouchableOpacity>
        </View>

        {/* Login Flow */}
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
              {isLoading ? 'Sending...' : 'Test Mode Login'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <TouchableOpacity style={styles.button} onPress={handleLogout}>
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleClearAllData}>
            <Text style={styles.buttonText}>Clear All Data</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={goToMainApp}>
            <Text style={styles.buttonText}>Go to Main App</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={goToLogin}>
            <Text style={styles.buttonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
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
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  storageItem: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DebugAuthScreen; 