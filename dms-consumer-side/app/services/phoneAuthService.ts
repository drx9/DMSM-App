import { Alert } from 'react-native';
import axios from 'axios';
import { API_URL } from '../config';

class PhoneAuthService {
  // Local OTP storage for testing
  private localOTPs: Map<string, { otp: string; timestamp: number }> = new Map();

  // Simple phone OTP simulation for now
  async sendPhoneOTP(phoneNumber: string): Promise<boolean> {
    try {
      console.log('[Phone Auth] Sending OTP to:', phoneNumber);
      
      // Try backend first
      try {
        const response = await axios.post(`${API_URL}/auth/send-phone-otp`, {
          phoneNumber: `+91${phoneNumber}`
        });
        
        if (response.data.success) {
          console.log('[Phone Auth] OTP sent successfully via backend');
          // Show OTP in alert for testing (backend logs it to console)
          Alert.alert('OTP Sent', 'Check your backend console for the OTP code.\n\nFor testing, you can use any 6-digit number.');
          return true;
        } else {
          console.error('[Phone Auth] Failed to send OTP:', response.data.message);
          return false;
        }
      } catch (backendError) {
        console.log('[Phone Auth] Backend OTP failed, using local fallback');
        
        // Fallback: Generate local OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        this.localOTPs.set(phoneNumber, {
          otp,
          timestamp: Date.now()
        });
        
        console.log(`[Phone Auth] Local OTP generated for ${phoneNumber}: ${otp}`);
        Alert.alert('OTP Sent', `Your OTP is: ${otp}\n\n(This is a test OTP)`);
        
        return true;
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
      
      if (phoneNumber) {
        // Try backend first
        try {
          const response = await axios.post(`${API_URL}/auth/verify-phone-otp`, {
            phoneNumber: `+91${phoneNumber}`,
            otp: otp
          });
          
          if (response.data.success) {
            console.log('[Phone Auth] OTP verified successfully via backend');
            return true;
          } else {
            console.error('[Phone Auth] OTP verification failed:', response.data.message);
            return false;
          }
        } catch (backendError) {
          console.log('[Phone Auth] Backend verification failed, trying local');
          
          // Fallback: Verify local OTP
          const stored = this.localOTPs.get(phoneNumber);
          if (stored) {
            // Check if OTP is expired (5 minutes)
            if (Date.now() - stored.timestamp > 5 * 60 * 1000) {
              this.localOTPs.delete(phoneNumber);
              Alert.alert('Error', 'OTP expired. Please request a new one.');
              return false;
            }
            
            if (stored.otp === otp) {
              this.localOTPs.delete(phoneNumber);
              console.log('[Phone Auth] Local OTP verified successfully');
              return true;
            } else {
              Alert.alert('Error', 'Invalid OTP. Please try again.');
              return false;
            }
          } else {
            Alert.alert('Error', 'No OTP found. Please request a new one.');
            return false;
          }
        }
      } else {
        Alert.alert('Error', 'Phone number is required for OTP verification.');
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
    this.localOTPs.clear();
  }
}

export const phoneAuthService = new PhoneAuthService(); 