import React, { createContext, useContext, useState, useEffect } from 'react';
import { getWishlist } from '../services/wishlistService';
import AsyncStorage from '@react-native-async-storage/async-storage';

type WishlistItem = { productId: string, product: any };

const WishlistContext = createContext<any>(null);

export const WishlistProvider = ({ children }: { children: React.ReactNode }) => {
    const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchWishlist = async () => {
        setLoading(true);
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) {
            setWishlist([]);
            setLoading(false);
            return;
        }
        const data = await getWishlist(userId);
        setWishlist(data.map((item: any) => ({ productId: item.productId, product: item.product })));
        setLoading(false);
    };

    useEffect(() => { fetchWishlist(); }, []);

    const add = (productId: string, product: any) => setWishlist((prev) => [...prev, { productId, product }]);
    const remove = (productId: string) => setWishlist((prev) => prev.filter((item) => item.productId !== productId));

    return (
        <WishlistContext.Provider value={{
            wishlist,
            setWishlist,
            add,
            remove,
            fetchWishlist,
            loading,
            wishlistIds: wishlist.map(item => item.productId),
            wishlistProducts: wishlist.map(item => item.product)
        }}>
            {children}
        </WishlistContext.Provider>
    );
};

export const useWishlist = () => useContext(WishlistContext); 