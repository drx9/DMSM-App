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
import { useAuth } from '../context/AuthContext';

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
    phone?: string;
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
  const { login } = useAuth();

  // Firebase phone auth states
  // const recaptchaVerifier = useRef(null);
  const [otpCode, setOtpCode] = useState('');
  // const [verificationId, setVerificationId] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [testModeEnabled, setTestModeEnabled] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: '875079305931-f0k3mdqqrrbj9ablfn1gdqp7rn4567iq.apps.googleusercontent.com', // Android client ID
    iosClientId: '875079305931-f0k3mdqqrrbj9ablfn1gdqp7rn4567iq.apps.googleusercontent.com', // Same for now, update when you create iOS client
    androidClientId: '875079305931-f0k3mdqqrrbj9ablfn1gdqp7rn4567iq.apps.googleusercontent.com', // Your Android client ID
    webClientId: '875079305931-f0k3mdqqrrbj9ablfn1gdqp7rn4567iq.apps.googleusercontent.com', // Same for now, update when you create web client
  });

  useEffect(() => {
    checkTestModeStatus();
  }, []);

  const checkTestModeStatus = async () => {
    try {
      const testMode = await AsyncStorage.getItem('testMode');
      setTestModeEnabled(testMode === 'true');
    } catch (error) {
      console.error('Error checking test mode status:', error);
    }
  };

  const toggleTestMode = async () => {
    try {
      if (testModeEnabled) {
        await AsyncStorage.removeItem('testMode');
        setTestModeEnabled(false);
        Alert.alert('Test Mode Disabled', 'Real SMS OTPs will be used.');
      } else {
        await AsyncStorage.setItem('testMode', 'true');
        setTestModeEnabled(true);
        Alert.alert('Test Mode Enabled', 'You can now use test OTPs for development.');
      }
    } catch (error) {
      console.error('Error toggling test mode:', error);
    }
  };

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      if (id_token) {
        // Send id_token to backend
        axios.post(`${API_URL}/auth/google`, { token: id_token })
          .then(async (res) => {
            if (res.data.success && res.data.token && res.data.user) {
              // Store the auth token
              await AsyncStorage.setItem('userToken', res.data.token);
              console.log('✅ Auth token stored successfully');
              
              // Store user info using AuthContext
              await login({
                id: res.data.user.id,
                name: res.data.user.name,
                email: res.data.user.email,
                phone: res.data.user.phone || '',
              });
              
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
      const result = await otpService.verifyPhoneOTP(otpCode);
      
      if (result.success && result.idToken) {
        // Check if this is a test mode token
        const isTestMode = result.idToken.startsWith('test_mode_token_');
        
        if (isTestMode) {
          console.log('Test mode authentication detected');
          // Handle test mode authentication
          await handleTestModeAuthentication(result.idToken, phoneNumber);
        } else {
          // Firebase Phone Auth successful - user is verified
          // Send ID token to backend for user verification/creation
          try {
            const response = await axios.post(`${API_URL}/auth/firebase-login`, {
              idToken: result.idToken,
              phoneNumber: `+91${phoneNumber}` // Send phone number explicitly
            });
            
            console.log('Backend response:', response.data);
            
            if (response.data.success && response.data.user) {
              // User exists - login successful
              console.log('User exists, logging in:', response.data.user);
              
              // Store the auth token if provided
              if (response.data.token) {
                await AsyncStorage.setItem('userToken', response.data.token);
                console.log('✅ Auth token stored successfully');
              }
              
              await login({
                id: response.data.user.id,
                name: response.data.user.name,
                email: response.data.user.email || '',
                phone: response.data.user.phoneNumber || `+91${phoneNumber}`,
              });
              
              // Initialize notifications after successful login
              await initializeNotifications(response.data.user.id);
              
              console.log('✅ Login successful, redirecting to main app');
              Alert.alert('Success', 'Phone authentication successful!');
              router.replace('/(tabs)');
            } else if (response.data.success === false && response.data.reason === 'new_user') {
              // User doesn't exist - redirect to registration
              console.log('User does not exist, redirecting to signup');
              // Store the verified phone number to skip second OTP verification
              await AsyncStorage.setItem('verifiedPhoneNumber', phoneNumber);
              await AsyncStorage.setItem('phoneVerificationTime', Date.now().toString());
              
              console.log('✅ Redirecting to signup with verified phone:', phoneNumber);
              router.push({
                pathname: '/signup',
                params: { phoneNumber }
              });
            } else {
              // Unexpected response
              console.log('Unexpected response:', response.data);
              Alert.alert('Error', 'Unexpected response from server');
            }
          } catch (error: any) {
            console.error('Backend verification error:', error);
            
            // Check if it's a 401 error (invalid token) or other error
            if (error.response?.status === 401) {
              Alert.alert('Error', 'Invalid authentication. Please try again.');
            } else if (error.response?.data?.reason === 'new_user') {
              // User doesn't exist - redirect to registration
              await AsyncStorage.setItem('verifiedPhoneNumber', phoneNumber);
              await AsyncStorage.setItem('phoneVerificationTime', Date.now().toString());
              
              router.push({
                pathname: '/signup',
                params: { phoneNumber }
              });
            } else {
              Alert.alert('Error', 'Failed to verify with server. Please try again.');
            }
          }
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

  // Handle test mode authentication
  const handleTestModeAuthentication = async (testToken: string, phoneNumber: string) => {
    try {
      console.log('Handling test mode authentication for phone:', phoneNumber);
      console.log('Test token:', testToken);
      
      // Check if test mode is enabled
      const testModeEnabled = await AsyncStorage.getItem('testMode');
      if (testModeEnabled !== 'true') {
        Alert.alert('Error', 'Test mode is not enabled. Please enable test mode first.');
        return;
      }
      
      // Extract phone number from test token
      const tokenParts = testToken.split('_');
      const extractedPhone = tokenParts.slice(3).join(''); // Join without underscores
      
      console.log('Test mode: Extracted phone number:', extractedPhone);
      console.log('Test mode: Token parts:', tokenParts);
      
      // Send test mode authentication to backend
      const response = await axios.post(`${API_URL}/auth/firebase-login`, {
        idToken: testToken,
        phoneNumber: `+91${extractedPhone}`
      });
      
      console.log('Test mode backend response:', response.data);
      
      if (response.data.success && response.data.user) {
        // User exists - login successful
        console.log('Test mode: User exists, logging in:', response.data.user);
        
        // Store the auth token if provided
        if (response.data.token) {
          await AsyncStorage.setItem('userToken', response.data.token);
          console.log('✅ Test mode auth token stored successfully');
        }
        
        await login({
          id: response.data.user.id,
          name: response.data.user.name,
          email: response.data.user.email || '',
          phone: response.data.user.phoneNumber || `+91${extractedPhone}`,
        });
        
        // Initialize notifications after successful login
        await initializeNotifications(response.data.user.id);
        
        console.log('✅ Test mode login successful, redirecting to main app');
        Alert.alert('Success', 'Test mode authentication successful!');
        router.replace('/(tabs)');
      } else if (response.data.success === false && response.data.reason === 'new_user') {
        // User doesn't exist - redirect to registration
        console.log('Test mode: User does not exist, redirecting to signup');
        await AsyncStorage.setItem('verifiedPhoneNumber', extractedPhone);
        await AsyncStorage.setItem('phoneVerificationTime', Date.now().toString());
        
        router.push({
          pathname: '/signup',
          params: { phoneNumber: extractedPhone }
        });
      } else {
        Alert.alert('Error', 'Test mode authentication failed');
      }
    } catch (error: any) {
      console.error('Test mode authentication error:', error);
      console.error('Test mode error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      if (error.response?.status === 401) {
        Alert.alert('Error', 'Test mode authentication failed. Please check if test mode is properly configured.');
      } else {
        Alert.alert('Error', 'Test mode authentication failed. Please try again.');
      }
    }
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
        // Store the auth token
        await AsyncStorage.setItem('userToken', response.data.token);
        console.log('✅ Auth token stored successfully');
        
        // Store user info using AuthContext
        await login({
          id: response.data.user.id,
          name: response.data.user.name,
          email: response.data.user.email,
          phone: response.data.user.phone || '',
        });
        
        // Initialize notifications after successful login
        await initializeNotifications(response.data.user.id);
        
        Alert.alert(t('success'), t('loginSuccessful'));
        router.replace('/(tabs)');
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
          
          {/* Test Mode Toggle */}
          <TouchableOpacity 
            style={[styles.testModeButton, testModeEnabled && styles.testModeButtonActive]} 
            onPress={toggleTestMode}
          >
            <Text style={[styles.testModeButtonText, testModeEnabled && styles.testModeButtonTextActive]}>
              {testModeEnabled ? '🧪 Test Mode ON' : '🧪 Test Mode OFF'}
            </Text>
          </TouchableOpacity>
          
          {/* Development Info */}
          {testModeEnabled && (
            <View style={styles.devInfoContainer}>
              <Text style={styles.devInfoText}>
                💡 Test Mode: You'll receive OTP codes in alerts instead of SMS
              </Text>
              <TouchableOpacity 
                style={styles.devSettingsButton}
                onPress={() => {
                  Alert.alert(
                    'Development Settings',
                    'What would you like to do?',
                    [
                      { text: 'Clear Test Data', onPress: () => otpService.clearRateLimitData() },
                      { text: 'Disable Test Mode', onPress: toggleTestMode },
                      { text: 'Cancel', style: 'cancel' }
                    ]
                  );
                }}
              >
                <Text style={styles.devSettingsButtonText}>⚙️ Dev Settings</Text>
              </TouchableOpacity>
            </View>
          )}
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
  testModeButton: {
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  testModeButtonActive: {
    backgroundColor: '#10B981',
  },
  testModeButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1F2937',
  },
  testModeButtonTextActive: {
    color: '#FFFFFF',
  },
  devInfoContainer: {
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  devInfoText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1F2937',
  },
  devSettingsButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  devSettingsButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
});

export default LoginScreen;