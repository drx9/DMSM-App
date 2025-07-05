import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator } from 'react-native';
import ProductCard from '../components/ProductCard';
import { useWishlist } from './context/WishlistContext';

const WishlistScreen = () => {
    const { wishlistProducts, wishlistIds, remove, fetchWishlist, loading } = useWishlist();

    useEffect(() => { fetchWishlist(); }, []);

    const handleToggleWishlist = (product: any, wishlisted: boolean) => {
        if (!wishlisted) remove(product.id);
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Wishlist</Text>
            {loading ? (
                <ActivityIndicator size="large" color="#CB202D" style={{ marginTop: 40 }} />
            ) : wishlistProducts.length === 0 ? (
                <Text style={styles.empty}>Your wishlist is empty.</Text>
            ) : (
                <FlatList
                    data={wishlistProducts}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <ProductCard
                            {...item}
                            isWishlisted={wishlistIds.includes(item.id)}
                            onToggleWishlist={(wish) => handleToggleWishlist(item, wish)}
                        />
                    )}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#fff' },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
    empty: { fontSize: 16, color: '#999', marginTop: 40, textAlign: 'center' },
});

export default WishlistScreen; 