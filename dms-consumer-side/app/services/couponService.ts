import axios from 'axios';
import { API_URL } from '../config';

export async function applyCoupon({ code, userId, cartTotal }: { code: string; userId: string; cartTotal: number }) {
  const res = await axios.post(`${API_URL}/coupons/apply`, { code, userId, cartTotal });
  return res.data;
} 