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
} from 'react-native';
import { useRouter } from 'expo-router';
import axios, { AxiosError } from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { API_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { AntDesign, FontAwesome } from '@expo/vector-icons';

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

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: 'YOUR_EXPO_CLIENT_ID',
    iosClientId: 'YOUR_IOS_CLIENT_ID',
    androidClientId: 'YOUR_ANDROID_CLIENT_ID',
    webClientId: 'YOUR_WEB_CLIENT_ID',
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

  const handleLogin = async () => {
    setIsLoading(true);
    if (loginMode === 'phone') {
      await handlePhoneLogin();
    } else {
      await handleEmailLogin();
    }
    setIsLoading(false);
  };

  const handlePhoneLogin = async () => {
    if (!phoneNumber || phoneNumber.length !== 10) {
      Alert.alert(t('error'), t('pleaseEnterAValid10DigitPhoneNumber'));
      return;
    }

    try {
      const response = await axios.post<PhoneLoginResponse>(`${API_URL}/auth/login`, {
        phoneNumber: phoneNumber,
      });

      if (response.data.success) {
        if (response.data.userExists) {
          router.push({
            pathname: '/verify-otp',
            params: { userId: response.data.userId },
          });
        } else {
          router.push({
            pathname: '/signup',
            params: { phoneNumber: phoneNumber },
          });
        }
      } else {
        Alert.alert(t('error'), response.data.message || t('failedToInitiateLogin'));
      }
    } catch (error) {
      handleApiError(error);
    }
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
    if (loginMode === 'phone') return !phoneNumber;
    if (loginMode === 'email') return !email || !password;
    return true;
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
                />
              </View>
            </View>
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
              {isLoading ? t('loading') : t('continue')}
            </Text>
          </TouchableOpacity>

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