import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config';

interface CartItem {
    id: string;
    quantity: number;
}

interface CartContextType {
    cart: CartItem[];
    addToCart: (id: string) => Promise<void>;
    removeFromCart: (id: string) => Promise<void>;
    cartCount: number;
    refreshCartFromBackend: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [userId, setUserId] = useState<string | null>(null);

    // Fetch cart from backend and update context + AsyncStorage
    const refreshCartFromBackend = async () => {
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) return;
        try {
            const res = await axios.get(`${API_URL}/cart/${userId}`);
            console.log('[CartContext] Backend cart response:', res.data);
            // Map backend cart items to { id, quantity }
            const items = res.data.map((item: any) => ({
                id: item.Product?.id?.toString() || item.productId?.toString() || item.id?.toString(),
                quantity: item.quantity,
            }));
            setCart(items);
            await AsyncStorage.setItem('cartItems', JSON.stringify(items));
            console.log('[CartContext] Cart set to:', items);
            if (items.length === 0) {
                await AsyncStorage.removeItem('cartItems');
                console.log('[CartContext] Cart is empty, removed from AsyncStorage');
            }
        } catch (err) {
            setCart([]);
            await AsyncStorage.removeItem('cartItems');
            console.log('[CartContext] Error fetching cart, set cart to empty');
        }
    };

    // Watch for userId changes and reset cart
    useEffect(() => {
        const getUserIdAndResetCart = async () => {
            const uid = await AsyncStorage.getItem('userId');
            setUserId(uid);
            setCart([]);
            await AsyncStorage.removeItem('cartItems');
            if (uid) await refreshCartFromBackend();
        };
        getUserIdAndResetCart();
    }, []);

    useEffect(() => {
        if (userId === null) return;
        setCart([]);
        AsyncStorage.removeItem('cartItems');
        if (userId) refreshCartFromBackend();
    }, [userId]);

    // Save cart to AsyncStorage on change
    useEffect(() => {
        AsyncStorage.setItem('cartItems', JSON.stringify(cart));
    }, [cart]);

    // Add to cart: call backend, then refresh
    const addToCart = async (id: string) => {
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) return;
        try {
            // Check if item already exists in cart
            const existing = cart.find(item => item.id === id);
            const newQuantity = existing ? existing.quantity + 1 : 1;
            await axios.post(`${API_URL}/cart`, { userId, productId: id, quantity: newQuantity });
            await refreshCartFromBackend();
            console.log('[CartContext] addToCart called, refreshed cart');
        } catch (err) {
            // handle error
        }
    };

    // Remove from cart: call backend, then refresh
    const removeFromCart = async (id: string) => {
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) return;
        try {
            await axios.delete(`${API_URL}/cart/${userId}/${id}`);
            await refreshCartFromBackend();
            console.log('[CartContext] removeFromCart called, refreshed cart');
        } catch (err) {
            // handle error
        }
    };

    const cartCount = cart.length;

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, cartCount, refreshCartFromBackend }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used within a CartProvider');
    return context;
}; 