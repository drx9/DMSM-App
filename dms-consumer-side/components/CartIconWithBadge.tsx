import React, { useEffect, useState } from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../app/config';

interface Props {
    onPress?: () => void;
}

const CartIconWithBadge: React.FC<Props> = ({ onPress }) => {
    const [cartCount, setCartCount] = useState(0);

    useEffect(() => {
        fetchCartCount();
    }, []);

    const fetchCartCount = async () => {
        try {
            const userId = await AsyncStorage.getItem('userId');
            if (!userId) return;
            const res = await axios.get(`${API_URL}/cart/count/${userId}`);
            setCartCount(res.data.count || 0);
        } catch (err) {
            setCartCount(0);
        }
    };

    return (
        <TouchableOpacity onPress={onPress} style={styles.cartIconWrap}>
            <Ionicons name="cart-outline" size={24} color="#222" />
            {cartCount > 0 && (
                <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{cartCount}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    cartIconWrap: {
        position: 'relative',
        padding: 4,
    },
    cartBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: 'red',
        borderRadius: 8,
        minWidth: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 3,
        zIndex: 1,
    },
    cartBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
});

export default CartIconWithBadge; 