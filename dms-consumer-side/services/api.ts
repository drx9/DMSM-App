import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../app/config';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically add JWT token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('🔐 API Request: Token added to headers');
      } else {
        console.log('⚠️ API Request: No token found');
      }
    } catch (error) {
      console.error('❌ API Request: Error getting token:', error);
    }
    return config;
  },
  (error) => {
    console.error('❌ API Request Interceptor Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config.url);
    return response;
  },
  async (error) => {
    console.error('❌ API Response Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.response?.data?.message || error.message
    });

    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      console.log('🔐 Token expired or invalid, clearing storage');
      try {
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('user');
        // You might want to redirect to login here
      } catch (storageError) {
        console.error('❌ Error clearing storage:', storageError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
