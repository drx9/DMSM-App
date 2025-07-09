import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://dmsm-app-production-a35d.up.railway.app/api';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  isVerified: boolean;
  role: string;
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
  phoneNumber?: string;
}

class UserService {
  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('userToken');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private async makeAuthenticatedRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const token = await this.getAuthToken();
    console.log('UserService: Token retrieved:', token ? 'Token exists' : 'No token');

    if (!token) {
      throw new Error('No authentication token found');
    }

    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    const url = `${API_BASE_URL}${endpoint}`;
    console.log('UserService: Making request to:', url);
    console.log('UserService: Request headers:', defaultHeaders);

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    console.log('UserService: Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || `HTTP error! status: ${response.status}`;

      console.log('UserService: Error response:', errorData);

      // Create a more descriptive error message for authentication issues
      if (response.status === 401) {
        throw new Error(`Authentication failed (401): ${errorMessage}`);
      } else if (response.status === 403) {
        throw new Error(`Access denied (403): ${errorMessage}`);
      } else {
        throw new Error(errorMessage);
      }
    }

    return response;
  }

  async getProfile(): Promise<UserProfile> {
    try {
      console.log('UserService: Making request to /user/profile');
      const response = await this.makeAuthenticatedRequest('/user/profile');
      console.log('UserService: Response received:', response.status);
      const data = await response.json();
      console.log('UserService: Response data:', data);
      return data.user;
    } catch (error) {
      console.error('UserService: Error fetching profile:', error);
      throw error;
    }
  }

  async updateProfile(profileData: UpdateProfileData): Promise<UserProfile> {
    try {
      const response = await this.makeAuthenticatedRequest('/user/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });
      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await this.makeAuthenticatedRequest('/user/change-password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }

  async deleteAccount(password: string): Promise<void> {
    try {
      await this.makeAuthenticatedRequest('/user/delete-account', {
        method: 'DELETE',
        body: JSON.stringify({ password }),
      });
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userProfile');
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  }
}

export const userService = new UserService(); 