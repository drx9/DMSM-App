import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

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
  login: (userData: User) => Promise<void>;
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
      
      // Check for userId in AsyncStorage (current implementation)
      const userId = await AsyncStorage.getItem('userId');
      
      if (userId) {
        // Also check for user data in AsyncStorage
        const userData = await AsyncStorage.getItem('user');
        
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          console.log('✅ User authenticated from storage:', parsedUser.id);
          return true;
        } else {
          // If we have userId but no user data, try to fetch user data
          try {
            // You can add an API call here to fetch user data if needed
            // For now, create a basic user object from userId
            const basicUser: User = {
              id: userId,
              phone: '', // Will be filled when user data is fetched
            };
            setUser(basicUser);
            await AsyncStorage.setItem('user', JSON.stringify(basicUser));
            console.log('✅ User authenticated with basic data:', userId);
            return true;
          } catch (error) {
            console.error('Error fetching user data:', error);
            // If we can't fetch user data, clear the userId and require re-login
            await AsyncStorage.removeItem('userId');
            setUser(null);
            return false;
          }
        }
      } else {
        console.log('❌ No userId found in storage');
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

  const login = async (userData: User) => {
    try {
      setUser(userData);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.setItem('userId', userData.id);
      console.log('✅ User logged in and stored:', userData.id);
    } catch (error) {
      console.error('Error saving user to storage:', error);
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('userId');
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