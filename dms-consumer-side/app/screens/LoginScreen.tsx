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

const API_URL = 'http://192.168.2.101:3000/api';

interface ApiResponse {
  success: boolean;
  message?: string;
  userId?: string;
  userExists?: boolean;
}

const LoginScreen = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { t } = useLanguage();

  const handleLogin = async () => {
    if (!phoneNumber || phoneNumber.length !== 10) {
      Alert.alert(t('error'), t('pleaseEnterAValid10DigitPhoneNumber'));
      return;
    }

    try {
      setIsLoading(true);
      console.log('Attempting to login with phone number:', phoneNumber);
      const response = await axios.post<ApiResponse>(`${API_URL}/auth/login`, {
        phoneNumber: phoneNumber,
      });

      console.log('Login response:', response.data);

      if (response.data.success) {
        if (response.data.userExists) {
          // Navigate to OTP verification screen
          router.push({
            pathname: '/verify-otp',
            params: { userId: response.data.userId }
          });
        } else {
          // Navigate to signup screen with phone number
          router.push({
            pathname: '/signup',
            params: { phoneNumber: phoneNumber }
          });
        }
      } else {
        Alert.alert(t('error'), response.data.message || t('failedToInitiateLogin'));
      }
    } catch (error) {
      console.error('Login error:', error);
      const axiosError = error as AxiosError<ApiResponse>;
      console.error('Detailed error:', {
        message: axiosError.message,
        code: axiosError.code,
        response: axiosError.response?.data,
        status: axiosError.response?.status,
        config: {
          url: axiosError.config?.url,
          method: axiosError.config?.method,
          data: axiosError.config?.data,
          headers: axiosError.config?.headers
        }
      });
      Alert.alert(
        t('error'),
        axiosError.response?.data?.message || t('failedToInitiateLogin')
      );
    } finally {
      setIsLoading(false);
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
          <Text style={styles.welcomeText}>{t('welcomeBack')}</Text>
          <Text style={styles.subtitle}>{t('loginToContinueShopping')}</Text>
        </View>

        <View style={styles.formContainer}>
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

          <TouchableOpacity
            style={[
              styles.loginButton,
              (!phoneNumber || isLoading) && styles.loginButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={!phoneNumber || isLoading}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? t('sendingOTP') : t('continue')}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('or')}</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.googleButton}>
            <Image
              source={{uri:'https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png'}}
              style={styles.googleIcon}
            />
            <Text style={styles.googleButtonText}>{t('continueWithGoogle')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {t('dontHaveAnAccount')}{' '}
            <Text style={styles.signUpText}>{t('signUp')}</Text>
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
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  countryCode: {
    fontSize: 16,
    color: '#1A1A1A',
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#1A1A1A',
  },
  loginButton: {
    backgroundColor: '#FF6B6B',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  loginButtonDisabled: {
    backgroundColor: '#FFB6B6',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#666666',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 24,
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  googleButtonText: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#666666',
  },
  signUpText: {
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
});

export default LoginScreen;