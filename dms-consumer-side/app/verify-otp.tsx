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
  SafeAreaView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError } from 'axios';
import { 
  getResponsiveFontSize, 
  getResponsiveWidth, 
  getResponsiveHeight,
  SAFE_AREA_TOP,
  SPACING 
} from '../utils/deviceUtils';

const API_URL = 'http://192.168.2.100:3000/api';

interface ApiResponse {
  success: boolean;
  message?: string;
  userId?: string;
  token?: string;
}

const VerifyOTPScreen = () => {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const router = useRouter();
  const { userId } = useLocalSearchParams();

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
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.post<ApiResponse>(`${API_URL}/auth/verify`, {
        userId,
        otp,
        type: 'PHONE'
      });

      if (response.data.success) {
        // Store the token in AsyncStorage
        if (response.data.token) {
          await AsyncStorage.setItem('userToken', response.data.token);
          console.log('VerifyOTP: Token stored successfully');
        } else {
          console.log('VerifyOTP: No token received from server');
        }
        
        // Navigate to main app
        console.log('VerifyOTP: Navigating to main app');
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      const axiosError = error as AxiosError<ApiResponse>;
      Alert.alert(
        'Error',
        axiosError.response?.data?.message || 'Failed to verify OTP. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setIsLoading(true);
      await axios.post<ApiResponse>(`${API_URL}/auth/resend-otp`, { userId });
      setTimer(30);
      Alert.alert('Success', 'OTP has been resent successfully');
    } catch (error) {
      console.error('Resend OTP error:', error);
      const axiosError = error as AxiosError<ApiResponse>;
      Alert.alert(
        'Error',
        axiosError.response?.data?.message || 'Failed to resend OTP. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to your phone number
        </Text>

        <View style={styles.otpContainer}>
          <TextInput
            style={styles.otpInput}
            placeholder="Enter OTP"
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
            {isLoading ? 'Verifying...' : 'Verify OTP'}
          </Text>
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive the code? </Text>
          <TouchableOpacity
            onPress={handleResendOTP}
            disabled={timer > 0 || isLoading}
          >
            <Text style={[styles.resendButton, timer > 0 && styles.resendButtonDisabled]}>
              {timer > 0 ? `Resend in ${timer}s` : 'Resend OTP'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
    justifyContent: 'center',
    paddingTop: SAFE_AREA_TOP + SPACING.xl,
  },
  title: {
    fontSize: getResponsiveFontSize(24),
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: getResponsiveFontSize(16),
    color: '#666666',
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  otpContainer: {
    marginBottom: SPACING.lg,
  },
  otpInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    fontSize: getResponsiveFontSize(20),
    textAlign: 'center',
    letterSpacing: 8,
  },
  verifyButton: {
    backgroundColor: '#FF6B6B',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  verifyButtonDisabled: {
    backgroundColor: '#FFB6B6',
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: getResponsiveFontSize(16),
    fontWeight: 'bold',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    fontSize: getResponsiveFontSize(14),
    color: '#666666',
  },
  resendButton: {
    fontSize: getResponsiveFontSize(14),
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  resendButtonDisabled: {
    color: '#FFB6B6',
  },
});

export default VerifyOTPScreen; 