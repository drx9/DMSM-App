import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { Alert } from 'react-native';
import { checkFirebaseConfig } from './firebaseConfig';

class FirebasePhoneAuthService {
  private confirmation: FirebaseAuthTypes.ConfirmationResult | null = null;

  // Send real SMS OTP to user's phone
  async sendPhoneOTP(phoneNumber: string): Promise<boolean> {
    try {
      console.log('[Firebase Phone Auth] Sending SMS OTP to:', phoneNumber);
      
      // Check Firebase configuration
      if (!checkFirebaseConfig()) {
        return false;
      }
      
      // Format phone number to international format
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      
      // Request SMS OTP from Firebase
      this.confirmation = await auth().signInWithPhoneNumber(formattedPhone);
      
      console.log('[Firebase Phone Auth] SMS OTP sent successfully');
      Alert.alert('OTP Sent', 'SMS OTP has been sent to your phone number. Please check your messages.');
      
      return true;
    } catch (error: any) {
      console.error('[Firebase Phone Auth] SMS OTP error:', error);
      
      // Handle specific Firebase errors
      if (error.code === 'auth/invalid-phone-number') {
        Alert.alert('Error', 'Invalid phone number format. Please enter a valid phone number.');
      } else if (error.code === 'auth/too-many-requests') {
        Alert.alert('Error', 'Too many requests. Please try again later.');
      } else if (error.code === 'auth/quota-exceeded') {
        Alert.alert('Error', 'SMS quota exceeded. Please try again later.');
      } else {
        Alert.alert('Error', 'Failed to send SMS OTP. Please try again.');
      }
      
      return false;
    }
  }

  // Verify the SMS OTP entered by user
  async verifyPhoneOTP(otp: string): Promise<boolean> {
    try {
      console.log('[Firebase Phone Auth] Verifying SMS OTP');
      
      if (!this.confirmation) {
        Alert.alert('Error', 'No OTP confirmation found. Please request OTP again.');
        return false;
      }

      // Confirm the OTP with Firebase
      const result = await this.confirmation.confirm(otp);
      
      if (result?.user) {
        console.log('[Firebase Phone Auth] SMS OTP verified successfully');
        
        // Get the user's ID token for backend verification
        const idToken = await result?.user?.getIdToken();
        console.log('[Firebase Phone Auth] User ID token:', idToken);
        
        // Sign out to clear the session (we'll handle login separately)
        await auth().signOut();
        
        return true;
      } else {
        Alert.alert('Error', 'Invalid OTP code');
        return false;
      }
    } catch (error: any) {
      console.error('[Firebase Phone Auth] OTP verification error:', error);
      
      // Handle specific Firebase errors
      if (error.code === 'auth/invalid-verification-code') {
        Alert.alert('Error', 'Invalid OTP code. Please check and try again.');
      } else if (error.code === 'auth/invalid-verification-id') {
        Alert.alert('Error', 'OTP session expired. Please request a new OTP.');
      } else {
        Alert.alert('Error', 'Failed to verify OTP. Please try again.');
      }
      
      return false;
    }
  }

  // Get current user's phone number (if authenticated)
  async getCurrentUserPhone(): Promise<string | null> {
    try {
      const user = auth().currentUser;
      return user?.phoneNumber || null;
    } catch (error) {
      console.error('[Firebase Phone Auth] Get current user error:', error);
      return null;
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      const user = auth().currentUser;
      return user !== null;
    } catch (error) {
      console.error('[Firebase Phone Auth] Check auth error:', error);
      return false;
    }
  }

  // Sign out user
  async signOut(): Promise<void> {
    try {
      await auth().signOut();
      this.confirmation = null;
      console.log('[Firebase Phone Auth] User signed out');
    } catch (error) {
      console.error('[Firebase Phone Auth] Sign out error:', error);
    }
  }

  // Clean up stored data
  async clearStoredData(): Promise<void> {
    this.confirmation = null;
  }
}

export const firebasePhoneAuthService = new FirebasePhoneAuthService(); 