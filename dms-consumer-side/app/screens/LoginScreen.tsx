import React, { useState } from 'react';
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

const LoginScreen = () => {
  const [loginMode, setLoginMode] = useState<'phone' | 'email'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { t } = useLanguage();

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

      if (response.data.success && response.data.token) {
        // TODO: Store token securely
        // await AsyncStorage.setItem('userToken', response.data.token);
        Alert.alert(t('success'), t('loginSuccessful'));
        router.replace('/(tabs)');
      } else {
        Alert.alert(t('error'), response.data.message || t('loginFailed'));
      }
    } catch (error) {
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
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginTop: 8,
  },
  formContainer: {
    width: '100%',
  },
  modeSelector: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 24,
    overflow: 'hidden',
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  modeButtonActive: {
    backgroundColor: '#007AFF',
  },
  modeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  modeButtonTextActive: {
    color: '#FFFFFF',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  countryCode: {
    paddingLeft: 16,
    fontSize: 16,
    color: '#666666',
  },
  loginButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  loginButtonDisabled: {
    backgroundColor: '#A9A9A9',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginTop: 12,
  },
  forgotPasswordText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 14,
    color: '#666666',
  },
  signUpText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
});

export default LoginScreen;