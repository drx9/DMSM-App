import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import axios, { AxiosError } from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { API_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { AntDesign, FontAwesome } from '@expo/vector-icons';
import otpService from '../services/otpService';
import { useNotifications } from '../context/NotificationContext';

// TODO: Add token storage mechanism (e.g., AsyncStorage)
// import AsyncStorage from '@react-native-async-storage/async-storage';

interface PhoneLoginResponse {
  success: boolean;
  message?: string;
  userId?: string;
  userExists?: boolean;
}

interface EmailLoginResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

type ApiResponse = PhoneLoginResponse | EmailLoginResponse;

WebBrowser.maybeCompleteAuthSession();

const LoginScreen = () => {
  const [loginMode, setLoginMode] = useState<'phone' | 'email'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { t } = useLanguage();
  const { initializeNotifications, requestPermission } = useNotifications();

  // Firebase phone auth states
  // const recaptchaVerifier = useRef(null);
  const [otpCode, setOtpCode] = useState('');
  // const [verificationId, setVerificationId] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);

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
        // Send id_token to backend
        axios.post(`${API_URL}/auth/google`, { token: id_token })
          .then(async (res) => {
            if (res.data.success && res.data.token && res.data.user) {
              // Store user info and token
              await AsyncStorage.setItem('userId', res.data.user.id);
              // await AsyncStorage.setItem('userToken', res.data.token);
              
              // Initialize notifications after successful login
              await initializeNotifications(res.data.user.id);
              
              Alert.alert('Success', 'Logged in with Google!');
              router.replace('/(tabs)');
            } else if (res.data.redirectToRegister && res.data.email) {
              // Redirect to signup with email prefilled
              router.push({ pathname: '/signup', params: { email: res.data.email } });
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

  const sendOTP = async () => {
    if (!phoneNumber || phoneNumber.length !== 10) {
      Alert.alert(t('error'), t('pleaseEnterAValid10DigitPhoneNumber'));
      return;
    }

    setIsLoading(true);
    try {
      const success = await otpService.sendPhoneOTP(phoneNumber);
      
      if (success) {
        setOtpSent(true);
        Alert.alert('Success', 'OTP sent to your phone!');
      } else {
        Alert.alert('Error', 'Failed to send OTP');
      }
    } catch (error: any) {
      console.error('Firebase OTP error:', error);
      Alert.alert('Error', error.message || 'Failed to send OTP');
    }
    setIsLoading(false);
  };

  const verifyOTP = async () => {
    if (!otpCode) {
      Alert.alert('Error', 'Please enter the OTP sent to your phone');
      return;
    }

    setIsLoading(true);
    try {
      const success = await otpService.verifyPhoneOTP(otpCode, phoneNumber);
      
      if (success) {
        // Check if user exists, if not redirect to registration
        try {
          const response = await axios.post(`${API_URL}/auth/firebase-login`, {
            idToken: 'temp-token', // We'll handle this properly later
            phoneNumber: `+91${phoneNumber}`
          });
          
          if (response.data.success && response.data.user) {
            // Store user info
            await AsyncStorage.setItem('userId', response.data.user.id);
            
            // Initialize notifications after successful login
            await initializeNotifications(response.data.user.id);
            
            Alert.alert('Success', 'Phone authentication successful!');
            router.replace('/(tabs)');
          } else {
            // User doesn't exist, redirect to registration
            router.push({
              pathname: '/signup',
              params: { phoneNumber }
            });
          }
        } catch (error) {
          // User doesn't exist, redirect to registration
          router.push({
            pathname: '/signup',
            params: { phoneNumber }
          });
        }
      } else {
        Alert.alert('Error', 'Invalid OTP');
      }
    } catch (error: any) {
      console.error('Phone OTP verification error:', error);
      Alert.alert('Error', error.message || 'Invalid OTP');
    }
    setIsLoading(false);
  };

  const handleLogin = async () => {
    setIsLoading(true);
    if (loginMode === 'phone') {
      if (!otpSent) {
        await sendOTP();
      } else {
        await verifyOTP();
      }
    } else {
      await handleEmailLogin();
    }
    setIsLoading(false);
  };

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('error'), t('pleaseEnterEmailAndPassword'));
      return;
    }

    try {
      const response = await axios.post<EmailLoginResponse>(`${API_URL}/auth/login`, {
        email,
        password,
      });

      if (response.data.success && response.data.token && response.data.user) {
        // Store token and userId
        await AsyncStorage.setItem('userId', response.data.user.id);
        // await AsyncStorage.setItem('userToken', response.data.token); // if you want to store token
        
        // Initialize notifications after successful login
        await initializeNotifications(response.data.user.id);
        
        Alert.alert(t('success'), t('loginSuccessful'));
        
        // Add a small delay to ensure AsyncStorage is written before navigation
        setTimeout(() => {
        router.replace('/(tabs)');
        }, 100);
      } else {
        Alert.alert(t('error'), response.data.message || t('loginFailed'));
      }
    } catch (error) {
      console.error('Login error:', error);
      handleApiError(error);
    }
  };

  const handleApiError = (error: any) => {
    console.error('API Error:', error);
    const axiosError = error as AxiosError<ApiResponse>;
    const message =
      (axiosError.response?.data as any)?.message ||
      t('anErrorOccurred');
    Alert.alert(t('error'), message);
  };

  const isButtonDisabled = () => {
    if (isLoading) return true;
    if (loginMode === 'phone') {
      if (!otpSent) return !phoneNumber;
      return !otpCode;
    }
    if (loginMode === 'email') return !email || !password;
    return true;
  };

  const getButtonText = () => {
    if (isLoading) return t('loading');
    if (loginMode === 'phone') {
      return otpSent ? 'Verify OTP' : 'Send OTP';
    }
    return t('continue');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/dms-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.welcomeText}>{t('welcomeBack')}</Text>
          <Text style={styles.subtitle}>{t('loginToContinueShopping')}</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.modeSelector}>
            <TouchableOpacity
              style={[styles.modeButton, loginMode === 'phone' && styles.modeButtonActive]}
              onPress={() => setLoginMode('phone')}
            >
              <Text style={[styles.modeButtonText, loginMode === 'phone' && styles.modeButtonTextActive]}>
                {t('phone')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, loginMode === 'email' && styles.modeButtonActive]}
              onPress={() => setLoginMode('email')}
            >
              <Text style={[styles.modeButtonText, loginMode === 'email' && styles.modeButtonTextActive]}>
                {t('email')}
              </Text>
            </TouchableOpacity>
          </View>

          {loginMode === 'phone' ? (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('phoneNumber')}</Text>
                <View style={styles.phoneInputContainer}>
                  <Text style={styles.countryCode}>+91</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t('enterYourPhoneNumber')}
                    keyboardType="phone-pad"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    maxLength={10}
                    editable={!otpSent}
                  />
                </View>
              </View>
              
              {otpSent && (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>OTP Code</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter OTP"
                    keyboardType="number-pad"
                    value={otpCode}
                    onChangeText={setOtpCode}
                    maxLength={6}
                  />
                </View>
              )}
            </>
          ) : (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('emailAddress')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('enterYourEmail')}
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('password')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('enterYourPassword')}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            </>
          )}

          <TouchableOpacity
            style={[styles.loginButton, isButtonDisabled() && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isButtonDisabled()}
          >
            <Text style={styles.loginButtonText}>
              {getButtonText()}
            </Text>
          </TouchableOpacity>

          {loginMode === 'phone' && otpSent && (
            <TouchableOpacity 
              style={styles.resendButton}
              onPress={() => {
                setOtpSent(false);
                setOtpCode('');
                // setVerificationId(null);
              }}
            >
              <Text style={styles.resendButtonText}>Change Phone Number</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.forgotPasswordButton}>
            <Text style={styles.forgotPasswordText}>{t('forgotPassword')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.socialContainer}>
          <Text style={styles.orText}>or sign in with</Text>
          <View style={styles.socialButtons}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => promptAsync()}
            >
              <AntDesign name="google" size={20} color="#EA4335" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialButton}
              disabled
            >
              <FontAwesome name="facebook" size={20} color="#1877F2" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => setLoginMode('email')}
            >
              <AntDesign name="mail" size={20} color="#10B981" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {t('dontHaveAnAccount')}{' '}
            <TouchableOpacity onPress={() => router.push('/signup')}>
              <Text style={styles.signUpText}>{t('signUp')}</Text>
            </TouchableOpacity>
          </Text>
        </View>
      </ScrollView>

      {/* Firebase reCAPTCHA modal */}
      {/* FirebaseRecaptchaVerifierModal removed due to compatibility issues */}
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
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
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
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '400',
  },
  formContainer: {
    width: '100%',
  },
  modeSelector: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
    overflow: 'hidden',
    backgroundColor: '#F9FAFB',
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  modeButtonActive: {
    backgroundColor: '#10B981',
  },
  modeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  modeButtonTextActive: {
    color: '#FFFFFF',
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
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  countryCode: {
    paddingLeft: 14,
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 14,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  loginButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  resendButton: {
    alignSelf: 'center',
    marginTop: 10,
  },
  resendButtonText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '500',
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginTop: 10,
  },
  forgotPasswordText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '500',
  },
  socialContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  orText: {
    color: '#6B7280',
    fontSize: 11,
    marginBottom: 12,
    fontWeight: '400',
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    width: 44,
    height: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
  footerText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '400',
  },
  signUpText: {
    color: '#10B981',
    fontWeight: '600',
  },
});

export default LoginScreen;