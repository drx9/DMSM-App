import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { API_URL } from '../config'; // Import from central config
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

interface ApiResponse {
  success: boolean;
  message?: string;
  token?: string;
}

const VerifyOTPScreen = () => {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const router = useRouter();
  const { userId } = useLocalSearchParams();
  const { t } = useLanguage();

  const userIdString = Array.isArray(userId) ? userId[0] : userId;

  // Test connection on component mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('Testing connection to backend...');
        const response = await api.get('/health');
        console.log('Connection test response:', response.data);
      } catch (error) {
        console.error('Connection test failed:', error);
      }
    };
    testConnection();
  }, []);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert(t('error'), t('pleaseEnterAValid6DigitOTP'));
      return;
    }

    try {
      setIsLoading(true);
      console.log('Attempting to verify OTP...');
      console.log('Request payload:', { userId: userIdString, otp, type: 'PHONE' });

      const response = await api.post<ApiResponse>(`${API_URL}/auth/verify`, {
        userId: userIdString,
        otp,
        type: 'PHONE'
      });

      console.log('Verification response:', response.data);

      if (response.data.token) {
        // Registration successful, redirect to login
        router.replace('/login');
      } else {
        Alert.alert(t('error'), t('invalidOrExpiredOTP'));
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          message: error.message,
          code: error.code,
          response: error.response?.data,
          status: error.response?.status,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            data: error.config?.data,
            headers: error.config?.headers
          }
        });
      }
      Alert.alert(t('error'), t('failedToVerifyOTP'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setIsLoading(true);
      console.log('Attempting to resend OTP...');
      console.log('Request payload:', { userId: userIdString });

      const response = await api.post<ApiResponse>(`${API_URL}/auth/resend-otp`, { userId: userIdString });

      console.log('Resend OTP response:', response.data);

      if (response.data.success) {
        setTimer(30);
        Alert.alert(t('success'), t('otpHasBeenResentSuccessfully'));
      } else {
        Alert.alert(t('error'), response.data.message || t('failedToResendOTP'));
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          message: error.message,
          code: error.code,
          response: error.response?.data,
          status: error.response?.status,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            data: error.config?.data,
            headers: error.config?.headers
          }
        });
      }
      Alert.alert(t('error'), t('failedToResendOTP'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>{t('verifyOTP')}</Text>
        <Text style={styles.subtitle}>
          {t('enterThe6DigitCodeSentToYourPhoneNumber')}
        </Text>

        <View style={styles.otpContainer}>
          <TextInput
            style={styles.otpInput}
            placeholder={t('enterOTP')}
            keyboardType="number-pad"
            value={otp}
            onChangeText={setOtp}
            maxLength={6}
            autoFocus
          />
        </View>

        <TouchableOpacity
          style={[styles.verifyButton, (!otp || isLoading) && styles.verifyButtonDisabled]}
          onPress={handleVerifyOTP}
          disabled={!otp || isLoading}
        >
          <Text style={styles.verifyButtonText}>
            {isLoading ? t('verifying') : t('verifyOTP')}
          </Text>
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>{t('didntReceiveTheCode')}{' '}</Text>
          <TouchableOpacity
            onPress={handleResendOTP}
            disabled={timer > 0 || isLoading}
          >
            <Text style={[styles.resendButton, timer > 0 && styles.resendButtonDisabled]}>
              {timer > 0 ? `${t('resendIn')} ${timer}s` : t('resendOTP')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 32,
    textAlign: 'center',
  },
  otpContainer: {
    marginBottom: 24,
  },
  otpInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 8,
  },
  verifyButton: {
    backgroundColor: '#FF6B6B',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  verifyButtonDisabled: {
    backgroundColor: '#FFB6B6',
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    fontSize: 12,
    color: '#666666',
  },
  resendButton: {
    fontSize: 12,
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  resendButtonDisabled: {
    color: '#FFB6B6',
  },
});

export default VerifyOTPScreen; 