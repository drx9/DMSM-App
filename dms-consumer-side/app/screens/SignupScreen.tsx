import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import {
  useRouter,
  useLocalSearchParams
} from 'expo-router';
import axios, { AxiosError } from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { API_URL } from '../config';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { AntDesign, FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

interface ApiResponse {
  success: boolean;
  message?: string;
  userId?: string;
  errors?: Array<{ msg: string; param: string }>;
}

WebBrowser.maybeCompleteAuthSession();

const SignupScreen = () => {
  const params = useLocalSearchParams();
  const {
    phoneNumber: initialPhoneNumber
  } = params;
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState((initialPhoneNumber as string) || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const router = useRouter();
  const { t } = useLanguage();
  const { login } = useAuth();
  const { initializeNotifications } = useNotifications();

  // Check if phone number was already verified during login
  useEffect(() => {
    const checkPhoneVerification = async () => {
      try {
        const verifiedPhone = await AsyncStorage.getItem('verifiedPhoneNumber');
        const verificationTime = await AsyncStorage.getItem('phoneVerificationTime');
        
        if (verifiedPhone && verificationTime) {
          const timeDiff = Date.now() - parseInt(verificationTime);
          // Check if verification was within last 10 minutes
          if (verifiedPhone === phoneNumber && timeDiff < 10 * 60 * 1000) {
            setIsPhoneVerified(true);
            console.log('Phone number already verified, skipping second OTP');
          } else {
            // Clear expired verification
            await clearVerificationData();
          }
        }
      } catch (error) {
        console.error('Error checking phone verification:', error);
      }
    };

    if (phoneNumber) {
      checkPhoneVerification();
    }
  }, [phoneNumber]);

  const clearVerificationData = async () => {
    try {
      await AsyncStorage.removeItem('verifiedPhoneNumber');
      await AsyncStorage.removeItem('phoneVerificationTime');
      setIsPhoneVerified(false);
    } catch (error) {
      console.error('Error clearing verification data:', error);
    }
  };

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: '875079305931-f0k3mdqqrrbj9ablfn1gdqp7rn4567iq.apps.googleusercontent.com', // Android client ID
    iosClientId: '875079305931-f0k3mdqqrrbj9ablfn1gdqp7rn4567iq.apps.googleusercontent.com', // Same for now, update when you create iOS client
    androidClientId: '875079305931-f0k3mdqqrrbj9ablfn1gdqp7rn4567iq.apps.googleusercontent.com', // Your Android client ID
    webClientId: '875079305931-f0k3mdqqrrbj9ablfn1gdqp7rn4567iq.apps.googleusercontent.com', // Same for now, update when you create web client
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      if (id_token) {
        axios.post(`${API_URL}/auth/google`, { token: id_token })
          .then(async (res) => {
            if (res.data.success && res.data.token && res.data.user) {
              await AsyncStorage.setItem('userId', res.data.user.id);
              // await AsyncStorage.setItem('userToken', res.data.token);
              Alert.alert('Success', 'Logged in with Google!');
              router.replace('/(tabs)');
            } else if (res.data.redirectToRegister && res.data.email) {
              // setEmail(res.data.email); // Prefill email field - REMOVED
            } else {
              Alert.alert('Error', res.data.message || 'Google login failed');
            }
          })
          .catch((err) => {
            console.error('Google login backend error:', err);
            Alert.alert('Error', 'Google login failed');
          });
      }
    }
  }, [response]);

  const handleSignup = async () => {
    if (!name || !phoneNumber) {
      Alert.alert(t('error'), t('enterYourPhoneNumber'));
      return;
    }

    if (phoneNumber.length !== 10) {
      Alert.alert(t('error'), t('pleaseEnterAValid10DigitPhoneNumber'));
      return;
    }

    try {
      setIsLoading(true);
      
      // If phone number was already verified during login, skip OTP verification
      if (isPhoneVerified && phoneNumber) {
        console.log('Phone already verified, creating user directly');
        
        // Prepare user data
        const userData = {
          name,
          phoneNumber: phoneNumber, // Send without +91 prefix
        };

        // Create user directly without OTP verification
        try {
          const requestData: any = {
            name,
            phoneNumber: phoneNumber,
            isVerified: true
          };

          console.log('Sending registration data:', requestData);

          const response = await axios.post(`${API_URL}/auth/register`, requestData);
          
          if (response.data.success) {
            // Clear the stored verification data
            await clearVerificationData();
            
            // Auto-login after successful registration
            try {
              console.log('Auto-login after registration...');
              
              // Use the new auto-login endpoint
              const loginResponse = await axios.post(`${API_URL}/auth/auto-login`, {
                phoneNumber: phoneNumber,
                password: 'default_password_123' // Use a default password for phone-only registration
              });
              
              if (loginResponse.data.success && loginResponse.data.token) {
                // Store the auth token
                await AsyncStorage.setItem('userToken', loginResponse.data.token);
                console.log('✅ Auto-login successful, token stored');
                
                // Store user info using AuthContext
                await login({
                  id: loginResponse.data.user.id,
                  name: loginResponse.data.user.name,
                  email: loginResponse.data.user.email || '',
                  phone: loginResponse.data.user.phoneNumber || phoneNumber,
                }, loginResponse.data.token);
                
                // Initialize notifications
                await initializeNotifications(loginResponse.data.user.id);
                
                Alert.alert('Success', 'Account created and logged in successfully!');
                router.replace('/(tabs)');
              } else {
                Alert.alert('Success', 'Account created successfully! Please login to continue.');
                router.replace('/login');
              }
            } catch (loginError) {
              console.error('Auto-login error:', loginError);
              Alert.alert('Success', 'Account created successfully! Please login to continue.');
              router.replace('/login');
            }
          } else {
            Alert.alert('Error', response.data.message || 'Failed to create account');
          }
        } catch (error: any) {
          console.error('Registration error:', error);
          if (error.response?.data?.errors) {
            // Show validation errors
            const errorMessages = error.response.data.errors.map((err: any) => err.msg).join('\n');
            Alert.alert('Validation Error', errorMessages);
          } else {
            Alert.alert('Error', error.response?.data?.message || 'Failed to create account');
          }
        }
      }
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert('Error', 'Failed to start registration process. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    // setShowDatePicker(Platform.OS === 'ios'); // REMOVED
    if (selectedDate) {
      // setDateOfBirth(selectedDate); // REMOVED
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/dms-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.welcomeText}>{t('signUp')}</Text>
          <Text style={styles.subtitle}>{t('createYourAccountToContinue')}</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('fullName')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('enterYourFullName')}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('phoneNumber')}</Text>
            <View style={styles.phoneInputContainer}>
              <Text style={styles.countryCode}>+91</Text>
              <TextInput
                style={styles.phoneInput}
                placeholder={t('enterYourPhoneNumber')}
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                maxLength={10}
                editable={!isPhoneVerified}
              />
            </View>
            {isPhoneVerified && (
              <View style={styles.verifiedContainer}>
                <Text style={styles.verifiedText}>✓ Phone number already verified</Text>
                <TouchableOpacity onPress={clearVerificationData} style={styles.reverifyButton}>
                  <Text style={styles.reverifyButtonText}>Re-verify</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.signupButton,
              (isLoading) && styles.signupButtonDisabled,
            ]}
            onPress={handleSignup}
            disabled={isLoading}
          >
            <Text style={styles.signupButtonText}>
              {isLoading ? t('registering') : (isPhoneVerified ? 'Create Account (Phone Verified)' : t('register'))}
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {t('alreadyHaveAnAccount')}{' '}
              <Text style={styles.loginText} onPress={() => router.replace('/login')}>
                {t('login')}
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '400',
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 6,
    fontWeight: '500',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  countryCode: {
    fontSize: 13,
    color: '#6B7280',
    marginRight: 8,
    fontWeight: '500',
  },
  phoneInput: {
    flex: 1,
    height: 42,
    fontSize: 13,
    color: '#1F2937',
  },
  input: {
    height: 42,
    fontSize: 13,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  signupButton: {
    backgroundColor: '#10B981',
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  signupButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  signupButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '400',
  },
  loginText: {
    color: '#10B981',
    fontWeight: '600',
  },
  verifiedText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '500',
  },
  verifiedContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  reverifyButton: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  reverifyButtonText: {
    color: '#1F2937',
    fontSize: 11,
    fontWeight: '500',
  },
  pickerContainer: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    overflow: 'hidden',
  },
  picker: {
    height: 42,
    width: '100%',
    color: '#1F2937',
  },
});

export default SignupScreen;