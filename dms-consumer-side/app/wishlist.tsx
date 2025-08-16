import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator, Platform, StatusBar } from 'react-native';
import ProductCard from '../components/ProductCard';
import { useWishlist } from './context/WishlistContext';
import { Ionicons } from '@expo/vector-icons';

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
                <View style={styles.emptyContainer}>
                    <Ionicons name="heart-outline" size={64} color="#eee" style={{ marginBottom: 12 }} />
                    <Text style={styles.empty}>Your wishlist is empty.</Text>
                </View>
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
                    numColumns={2}
                    columnWrapperStyle={styles.row}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 8,
        paddingTop: Platform.OS === 'ios' ? 32 : 45, // Consistent with other screens
        backgroundColor: '#f9f9f9',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 18,
        textAlign: 'center',
        color: '#CB202D',
        letterSpacing: 1,
        marginTop: 8,
    },
    row: { flex: 1, justifyContent: 'space-between' },
    listContent: { paddingBottom: 24, marginTop: 8 },
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 60 },
    empty: { fontSize: 16, color: '#bbb', textAlign: 'center', marginTop: 4 },
});

export default WishlistScreen; 