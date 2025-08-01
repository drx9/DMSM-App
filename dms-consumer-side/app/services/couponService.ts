import axios from 'axios';
import { API_URL } from '../config';

export async function applyCoupon({ code, userId, cartTotal }: { code: string; userId: string; cartTotal: number }) {
  const res = await axios.post(`${API_URL}/coupons/apply`, { code, userId, cartTotal });
  return res.data;
} 

export const validateCoupon = async (code: string, userId: string) => {
  try {
    const response = await axios.post(`${API_URL}/coupons/validate`, { code, userId });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Default export for Expo Router
export default {
  applyCoupon,
  validateCoupon
}; 