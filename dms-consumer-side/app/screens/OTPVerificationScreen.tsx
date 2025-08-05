import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { firebaseAuthService } from '../services/firebaseAuthService';
import { useLanguage } from '../context/LanguageContext';
import { API_URL } from '../config';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OTPVerificationScreenProps {
  verificationType: 'phone' | 'email';
  contactInfo: string; // phone number or email
  userData: {
    name: string;
    password: string;
    dateOfBirth?: string;
    gender?: string;
  };
}

const OTPVerificationScreen = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { t } = useLanguage();
  
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [verificationType, setVerificationType] = useState<'phone' | 'email'>('phone');
  const [contactInfo, setContactInfo] = useState('');
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    // Get data from params
    const type = params.type as 'phone' | 'email';
    const contact = params.contact as string;
    const data = params.userData ? JSON.parse(params.userData as string) : null;
    
    setVerificationType(type);
    setContactInfo(contact);
    setUserData(data);
    
    // Start countdown for resend
    setCountdown(60);
  }, [params]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000) as any;
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 4) {
      Alert.alert('Error', 'Please enter a valid OTP code');
      return;
    }

    setIsLoading(true);
    try {
      let isVerified = false;
      
      if (verificationType === 'phone') {
        isVerified = await firebaseAuthService.verifyPhoneOTP(otp);
      } else {
        // For email, we need to handle the verification link
        Alert.alert('Info', 'Please check your email and click the verification link');
        return;
      }

      if (isVerified) {
        // Register user in backend
        await registerUserInBackend();
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      Alert.alert('Error', 'Failed to verify OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const registerUserInBackend = async () => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        ...userData,
        [verificationType === 'phone' ? 'phoneNumber' : 'email']: contactInfo,
        isVerified: true, // Mark as verified since Firebase verified it
      });

      if (response.data.success) {
        Alert.alert('Success', 'Registration successful!', [
          {
            text: 'OK',
            onPress: () => {
              // Clear stored data
              firebaseAuthService.clearStoredData();
              // Navigate to login
              router.replace('/login');
            }
          }
        ]);
      } else {
        Alert.alert('Error', response.data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Backend registration error:', error);
      Alert.alert('Error', 'Failed to complete registration. Please try again.');
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    
    setIsResending(true);
    try {
      let success = false;
      
      if (verificationType === 'phone') {
        success = await firebaseAuthService.sendPhoneOTP(contactInfo);
      } else {
        success = await firebaseAuthService.sendEmailOTP(contactInfo);
      }

      if (success) {
        setCountdown(60);
        Alert.alert('Success', 'OTP sent successfully!');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const formatContactInfo = (contact: string, type: 'phone' | 'email') => {
    if (type === 'phone') {
      // Mask phone number
      return `${contact.substring(0, 3)}****${contact.substring(7)}`;
    }
    // Mask email
    const [local, domain] = contact.split('@');
    return `${local.substring(0, 2)}***@${domain}`;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Verify {verificationType === 'phone' ? 'Phone' : 'Email'}</Text>
          <Text style={styles.subtitle}>
            We've sent a verification code to:
          </Text>
          <Text style={styles.contactInfo}>
            {formatContactInfo(contactInfo, verificationType)}
          </Text>
        </View>

        <View style={styles.otpContainer}>
          <Text style={styles.label}>Enter Verification Code</Text>
          <TextInput
            style={styles.otpInput}
            value={otp}
            onChangeText={setOtp}
            placeholder="Enter OTP"
            keyboardType="numeric"
            maxLength={6}
            autoFocus
          />
        </View>

        <TouchableOpacity
          style={[styles.verifyButton, isLoading && styles.disabledButton]}
          onPress={handleVerifyOTP}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.verifyButtonText}>Verify & Register</Text>
          )}
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive the code?</Text>
          <TouchableOpacity
            style={[styles.resendButton, (countdown > 0 || isResending) && styles.disabledButton]}
            onPress={handleResendOTP}
            disabled={countdown > 0 || isResending}
          >
            {isResending ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Text style={styles.resendButtonText}>
                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Back to Registration</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
  },
  contactInfo: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
  otpContainer: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  otpInput: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 15,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 5,
  },
  verifyButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  resendText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  resendButton: {
    padding: 10,
  },
  resendButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    alignItems: 'center',
    padding: 15,
  },
  backButtonText: {
    color: '#666',
    fontSize: 16,
  },
});

export default OTPVerificationScreen; 