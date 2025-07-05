import axios from 'axios';
import { API_URL } from '../config';

export const getWishlist = async (userId: string) => {
    const res = await axios.get(`${API_URL}/wishlist/${userId}`);
    return res.data;
};

export const addToWishlist = async (userId: string, productId: string) => {
    const res = await axios.post(`${API_URL}/wishlist/add`, { userId, productId });
    return res.data;
};

export const removeFromWishlist = async (userId: string, productId: string) => {
    const res = await axios.post(`${API_URL}/wishlist/remove`, { userId, productId });
    return res.data;
}; 