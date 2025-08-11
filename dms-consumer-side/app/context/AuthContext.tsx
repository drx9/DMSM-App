import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { API_URL } from '../config';

// AuthContext for user authentication management

interface User {
  id: string;
  phone: string;
  name?: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (userData: User, token?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  checkAuthStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Check for JWT token and stored user first
      const token = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('user');
      const testMode = await AsyncStorage.getItem('testMode');

      if (token && userData) {
        try {
          // Validate token with backend using the working endpoint
          const parsedUser = JSON.parse(userData);
          const response = await fetch(`${API_URL}/auth/user/${parsedUser.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            setUser(parsedUser);
            console.log('✅ User authenticated with valid token:', parsedUser.id);
            return true;
          } else {
            // Token is invalid, clear storage
            console.log('❌ Invalid token, clearing storage');
            await logout();
            return false;
          }
        } catch (error) {
          console.error('Error validating token:', error);
          // Network error, but we have local data - allow offline access
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          console.log('✅ User authenticated offline:', parsedUser.id);
          return true;
        }
      } else if (userData && testMode === 'true') {
        // In test mode, allow auth with stored user even if token is missing
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        console.log('🧪 Test mode: authenticating with stored user only:', parsedUser.id);
        return true;
      } else if (userData && !token) {
        // Offline/lenient mode: allow screens to proceed with stored user if token missing
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        console.log('⚠️ No token found, proceeding with stored user (offline/lenient):', parsedUser.id);
        return true;
      } else {
        console.log('❌ No token or user data found');
        setUser(null);
        return false;
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setUser(null);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userData: User, token?: string) => {
    try {
      setUser(userData);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      if (token) {
        await AsyncStorage.setItem('userToken', token);
      }
      console.log('✅ User logged in and stored:', userData.id);
    } catch (error) {
      console.error('Error saving user to storage:', error);
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('userToken');
      console.log('✅ User logged out and storage cleared');
    } catch (error) {
      console.error('Error removing user from storage:', error);
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser as User);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      console.log('✅ User data updated:', updatedUser.id);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    updateUser,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 