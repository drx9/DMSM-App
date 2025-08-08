import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class OTPService {
  private confirmation: FirebaseAuthTypes.ConfirmationResult | null = null;
  private testMode = false; // Enable test mode for development

  // Check if we're in test mode
  private async checkTestMode(): Promise<boolean> {
    try {
      const testMode = await AsyncStorage.getItem('testMode');
      return testMode === 'true';
    } catch {
      return false;
    }
  }

  // Send OTP with rate limiting handling
  async sendPhoneOTP(phoneNumber: string): Promise<boolean> {
    try {
      console.log('[OTP Service] Sending OTP to:', phoneNumber);
      
      // Check if we're in test mode
      const isTestMode = await this.checkTestMode();
      
      if (isTestMode) {
        return this.sendTestOTP(phoneNumber);
      }

      // Format phone number
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      
      // Try Firebase first
      try {
        this.confirmation = await auth().signInWithPhoneNumber(formattedPhone);
        console.log('[OTP Service] Firebase OTP sent successfully');
        Alert.alert('OTP Sent', 'SMS OTP has been sent to your phone number.');
        return true;
      } catch (firebaseError: any) {
        console.error('[OTP Service] Firebase error:', firebaseError);
        
        // Handle specific Firebase errors
        if (firebaseError.code === 'auth/too-many-requests') {
          Alert.alert(
            'Rate Limit Exceeded', 
            'Too many OTP requests. Please wait a few minutes or use test mode for development.',
            [
              { text: 'Wait', style: 'cancel' },
              { 
                text: 'Use Test Mode', 
                onPress: async () => {
                  await this.enableTestMode();
                  // Automatically send test OTP after enabling test mode
                  setTimeout(() => {
                    this.sendTestOTP(phoneNumber);
                  }, 500);
                }
              }
            ]
          );
          return false;
        } else if (firebaseError.code === 'auth/invalid-phone-number') {
          Alert.alert('Error', 'Invalid phone number format.');
          return false;
        } else if (firebaseError.code === 'auth/quota-exceeded') {
          Alert.alert('Error', 'SMS quota exceeded. Please try again later.');
          return false;
        } else {
          // Fallback to test mode for other errors
          console.log('[OTP Service] Falling back to test mode');
          return this.sendTestOTP(phoneNumber);
        }
      }
    } catch (error) {
      console.error('[OTP Service] OTP send error:', error);
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
      return false;
    }
  }

  // Test OTP functionality for development
  private async sendTestOTP(phoneNumber: string): Promise<boolean> {
    try {
      // Generate a test OTP
      const testOTP = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store test OTP for verification
      await AsyncStorage.setItem('testOTP', testOTP);
      await AsyncStorage.setItem('testOTPPhone', phoneNumber);
      await AsyncStorage.setItem('testOTPTime', Date.now().toString());
      
      console.log(`[OTP Service] Test OTP generated: ${testOTP}`);
      
      Alert.alert(
        'Test Mode - OTP Sent', 
        `Your test OTP is: ${testOTP}\n\nThis is a development OTP. In production, you would receive this via SMS.`,
        [
          { text: 'OK' },
          { 
            text: 'Disable Test Mode', 
            onPress: () => this.disableTestMode()
          }
        ]
      );
      
      return true;
    } catch (error) {
      console.error('[OTP Service] Test OTP error:', error);
      return false;
    }
  }

  // Verify OTP with test mode support
  async verifyPhoneOTP(otp: string): Promise<{ success: boolean; idToken?: string }> {
    try {
      console.log('[OTP Service] Verifying OTP');
      
      // Check if we're in test mode
      const isTestMode = await this.checkTestMode();
      
      if (isTestMode) {
        return this.verifyTestOTP(otp);
      }

      // Try Firebase verification
      if (!this.confirmation) {
        Alert.alert('Error', 'No OTP confirmation found. Please request OTP again.');
        return { success: false };
      }

      try {
        const result = await this.confirmation.confirm(otp);
        
        if (result?.user) {
          console.log('[OTP Service] Firebase OTP verified successfully');
          const idToken = await result.user.getIdToken();
          await auth().signOut();
          return { success: true, idToken };
        } else {
          Alert.alert('Error', 'Invalid OTP code');
          return { success: false };
        }
      } catch (firebaseError: any) {
        console.error('[OTP Service] Firebase verification error:', firebaseError);
        
        if (firebaseError.code === 'auth/invalid-verification-code') {
          Alert.alert('Error', 'Invalid OTP code. Please check and try again.');
        } else if (firebaseError.code === 'auth/invalid-verification-id') {
          Alert.alert('Error', 'OTP session expired. Please request a new OTP.');
        } else {
          Alert.alert('Error', 'Failed to verify OTP. Please try again.');
        }
        
        return { success: false };
      }
    } catch (error) {
      console.error('[OTP Service] OTP verification error:', error);
      Alert.alert('Error', 'Failed to verify OTP. Please try again.');
      return { success: false };
    }
  }

  // Verify test OTP
  private async verifyTestOTP(otp: string): Promise<{ success: boolean; idToken?: string }> {
    try {
      const storedOTP = await AsyncStorage.getItem('testOTP');
      const storedPhone = await AsyncStorage.getItem('testOTPPhone');
      const storedTime = await AsyncStorage.getItem('testOTPTime');
      
      console.log('[OTP Service] Test OTP verification - stored data:', { storedOTP, storedPhone, storedTime });
      
      if (!storedOTP || !storedPhone || !storedTime) {
        Alert.alert('Error', 'No test OTP found. Please request a new one.');
        return { success: false };
      }
      
      // Check if OTP is expired (5 minutes)
      const timeDiff = Date.now() - parseInt(storedTime);
      if (timeDiff > 5 * 60 * 1000) {
        await AsyncStorage.multiRemove(['testOTP', 'testOTPPhone', 'testOTPTime']);
        Alert.alert('Error', 'Test OTP expired. Please request a new one.');
        return { success: false };
      }
      
      if (storedOTP === otp) {
        console.log('[OTP Service] Test OTP verified successfully');
        // Clear test OTP
        await AsyncStorage.multiRemove(['testOTP', 'testOTPPhone', 'testOTPTime']);
        
        // For test mode, we'll use a special token that the backend can recognize
        // This will be handled differently in the login flow
        const cleanPhone = storedPhone.replace(/\D/g, ''); // Remove non-digits
        const testIdToken = `test_mode_token_${Date.now()}_${cleanPhone}`;
        console.log('[OTP Service] Generated test token:', testIdToken);
        return { success: true, idToken: testIdToken };
      } else {
        console.log('[OTP Service] Test OTP mismatch:', { provided: otp, stored: storedOTP });
        Alert.alert('Error', 'Invalid test OTP. Please try again.');
        return { success: false };
      }
    } catch (error) {
      console.error('[OTP Service] Test OTP verification error:', error);
      return { success: false };
    }
  }

  // Enable test mode
  async enableTestMode(): Promise<void> {
    try {
      await AsyncStorage.setItem('testMode', 'true');
      console.log('[OTP Service] Test mode enabled');
      Alert.alert('Test Mode Enabled', 'You can now use test OTPs for development.');
    } catch (error) {
      console.error('[OTP Service] Failed to enable test mode:', error);
    }
  }

  // Disable test mode
  async disableTestMode(): Promise<void> {
    try {
      await AsyncStorage.removeItem('testMode');
      console.log('[OTP Service] Test mode disabled');
      Alert.alert('Test Mode Disabled', 'Real SMS OTPs will be used.');
    } catch (error) {
      console.error('[OTP Service] Failed to disable test mode:', error);
    }
  }

  // Check if test mode is enabled
  async isTestModeEnabled(): Promise<boolean> {
    return await this.checkTestMode();
  }

  // Clear rate limit data (for development)
  async clearRateLimitData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        'testOTP', 
        'testOTPPhone', 
        'testOTPTime',
        'rateLimitData'
      ]);
      console.log('[OTP Service] Rate limit data cleared');
    } catch (error) {
      console.error('[OTP Service] Failed to clear rate limit data:', error);
    }
  }
}

export default new OTPService(); 