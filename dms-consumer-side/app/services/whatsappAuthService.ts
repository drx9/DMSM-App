import axios from 'axios';
import { API_URL } from '../config';

export interface WhatsAppOTPResponse {
  success: boolean;
  message: string;
  data?: {
    phoneNumber: string;
    messageId: string;
  };
  error?: any;
}

export interface WhatsAppVerifyResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: string;
    name: string;
    phoneNumber: string;
    email?: string;
    role: string;
    isVerified: boolean;
  };
  error?: any;
}

export interface WhatsAppRegisterResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: string;
    name: string;
    phoneNumber: string;
    role: string;
    isVerified: boolean;
  };
  error?: any;
}

class WhatsAppAuthService {
  private baseURL = `${API_URL}/whatsapp`;

  // Send OTP via WhatsApp
  async sendOTP(phoneNumber: string): Promise<WhatsAppOTPResponse> {
    try {
      const response = await axios.post(`${this.baseURL}/send-otp`, {
        phoneNumber
      });

      return response.data;
    } catch (error: any) {
      console.error('WhatsApp send OTP error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send OTP',
        error: error.response?.data || error.message
      };
    }
  }

  // Verify OTP and login
  async verifyOTP(phoneNumber: string, otp: string): Promise<WhatsAppVerifyResponse> {
    try {
      const response = await axios.post(`${this.baseURL}/verify-otp`, {
        phoneNumber,
        otp
      });

      return response.data;
    } catch (error: any) {
      console.error('WhatsApp verify OTP error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to verify OTP',
        error: error.response?.data || error.message
      };
    }
  }

  // Register new user with WhatsApp OTP
  async register(name: string, phoneNumber: string, otp: string): Promise<WhatsAppRegisterResponse> {
    try {
      const response = await axios.post(`${this.baseURL}/register`, {
        name,
        phoneNumber,
        otp
      });

      return response.data;
    } catch (error: any) {
      console.error('WhatsApp register error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to register user',
        error: error.response?.data || error.message
      };
    }
  }

  // Check if user exists (for registration flow)
  async checkUserExists(phoneNumber: string): Promise<{ exists: boolean; message?: string }> {
    try {
      // Try to send OTP - if user doesn't exist, it will return 404
      const response = await this.sendOTP(phoneNumber);
      
      if (response.success) {
        return { exists: true };
      } else if (response.message?.includes('User not found')) {
        return { exists: false, message: 'User not found. Please register first.' };
      } else {
        return { exists: false, message: response.message };
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { exists: false, message: 'User not found. Please register first.' };
      }
      return { exists: false, message: 'Error checking user existence' };
    }
  }
}

export const whatsappAuthService = new WhatsAppAuthService();
export default whatsappAuthService; 