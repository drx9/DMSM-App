import { Alert } from 'react-native';
import axios from 'axios';
import { API_URL } from '../config';

class PhoneAuthService {
  // Simple phone OTP simulation for now
  async sendPhoneOTP(phoneNumber: string): Promise<boolean> {
    try {
      console.log('[Phone Auth] Sending OTP to:', phoneNumber);
      
      // For now, we'll simulate OTP sending
      // In production, you'd integrate with a real SMS service
      const response = await axios.post(`${API_URL}/auth/send-phone-otp`, {
        phoneNumber: `+91${phoneNumber}`
      });
      
      if (response.data.success) {
        console.log('[Phone Auth] OTP sent successfully');
        return true;
      } else {
        console.error('[Phone Auth] Failed to send OTP:', response.data.message);
        return false;
      }
    } catch (error) {
      console.error('[Phone Auth] OTP send error:', error);
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
      return false;
    }
  }

  async verifyPhoneOTP(otp: string, phoneNumber?: string): Promise<boolean> {
    try {
      console.log('[Phone Auth] Verifying OTP');
      
      // For now, we'll simulate OTP verification
      // In production, you'd verify with your backend
      const response = await axios.post(`${API_URL}/auth/verify-phone-otp`, {
        phoneNumber: phoneNumber ? `+91${phoneNumber}` : undefined,
        otp: otp
      });
      
      if (response.data.success) {
        console.log('[Phone Auth] OTP verified successfully');
        return true;
      } else {
        console.error('[Phone Auth] OTP verification failed:', response.data.message);
        return false;
      }
    } catch (error) {
      console.error('[Phone Auth] OTP verification error:', error);
      Alert.alert('Error', 'Invalid OTP. Please try again.');
      return false;
    }
  }

  // Clean up stored data
  async clearStoredData(): Promise<void> {
    // No data to clear for this simple implementation
  }
}

export const phoneAuthService = new PhoneAuthService(); 