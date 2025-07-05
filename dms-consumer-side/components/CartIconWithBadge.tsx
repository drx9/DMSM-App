import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../app/context/CartContext';

interface Props {
    onPress?: () => void;
}

const CartIconWithBadge: React.FC<Props> = ({ onPress }) => {
    const { cartCount } = useCart();

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