import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { Alert } from 'react-native';

class FirebaseAuthService {
  // Phone OTP methods
  async sendPhoneOTP(phoneNumber: string): Promise<boolean> {
    try {
      console.log('[Firebase Auth] Sending phone OTP to:', phoneNumber);
      
      // Format phone number to international format if needed
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      
      const confirmation = await auth().signInWithPhoneNumber(formattedPhone);
      
      // Store confirmation for later verification
      await this.storeConfirmation(confirmation);
      
      console.log('[Firebase Auth] Phone OTP sent successfully');
      return true;
    } catch (error) {
      console.error('[Firebase Auth] Phone OTP error:', error);
      Alert.alert('Error', 'Failed to send phone OTP. Please try again.');
      return false;
    }
  }

  async verifyPhoneOTP(otp: string): Promise<boolean> {
    try {
      console.log('[Firebase Auth] Verifying phone OTP');
      
      const confirmation = await this.getStoredConfirmation();
      if (!confirmation) {
        Alert.alert('Error', 'No OTP confirmation found. Please request OTP again.');
        return false;
      }

      const result = await confirmation.confirm(otp);
      
      if (result.user) {
        console.log('[Firebase Auth] Phone OTP verified successfully');
        // Sign out to clear the session
        await auth().signOut();
        return true;
      } else {
        Alert.alert('Error', 'Invalid OTP code');
        return false;
      }
    } catch (error) {
      console.error('[Firebase Auth] Phone OTP verification error:', error);
      Alert.alert('Error', 'Invalid OTP code. Please try again.');
      return false;
    }
  }

  // Email OTP methods
  async sendEmailOTP(email: string): Promise<boolean> {
    try {
      console.log('[Firebase Auth] Sending email OTP to:', email);
      
      const actionCodeSettings = {
        url: 'https://dmsm-app-production-a35d.up.railway.app/verify-email',
        handleCodeInApp: true,
        iOS: {
          bundleId: 'com.dmsm.dmsconsumerside',
        },
        android: {
          packageName: 'com.dmsm.dmsconsumerside',
          installApp: true,
        },
        dynamicLinkDomain: 'your-dynamic-link-domain.page.link', // Optional
      };

      await auth().sendSignInLinkToEmail(email, actionCodeSettings);
      
      // Store email for later verification
      await this.storeEmail(email);
      
      console.log('[Firebase Auth] Email OTP sent successfully');
      return true;
    } catch (error) {
      console.error('[Firebase Auth] Email OTP error:', error);
      Alert.alert('Error', 'Failed to send email OTP. Please try again.');
      return false;
    }
  }

  async verifyEmailOTP(emailLink: string): Promise<boolean> {
    try {
      console.log('[Firebase Auth] Verifying email OTP');
      
      const storedEmail = await this.getStoredEmail();
      if (!storedEmail) {
        Alert.alert('Error', 'No email found. Please request OTP again.');
        return false;
      }

      const result = await auth().signInWithEmailLink(storedEmail, emailLink);
      
      if (result.user) {
        console.log('[Firebase Auth] Email OTP verified successfully');
        // Sign out to clear the session
        await auth().signOut();
        return true;
      } else {
        Alert.alert('Error', 'Invalid email verification link');
        return false;
      }
    } catch (error) {
      console.error('[Firebase Auth] Email OTP verification error:', error);
      Alert.alert('Error', 'Invalid email verification link. Please try again.');
      return false;
    }
  }

  // Helper methods for storing/retrieving confirmation and email
  private async storeConfirmation(confirmation: FirebaseAuthTypes.ConfirmationResult): Promise<void> {
    // Store in AsyncStorage or secure storage
    // For now, we'll use a simple approach
    global.firebaseConfirmation = confirmation;
  }

  private async getStoredConfirmation(): Promise<FirebaseAuthTypes.ConfirmationResult | null> {
    return global.firebaseConfirmation || null;
  }

  private async storeEmail(email: string): Promise<void> {
    // Store in AsyncStorage
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    await AsyncStorage.setItem('firebaseEmail', email);
  }

  private async getStoredEmail(): Promise<string | null> {
    // Get from AsyncStorage
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    return await AsyncStorage.getItem('firebaseEmail');
  }

  // Clean up stored data
  async clearStoredData(): Promise<void> {
    global.firebaseConfirmation = null;
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    await AsyncStorage.removeItem('firebaseEmail');
  }
}

export const firebaseAuthService = new FirebaseAuthService(); 