import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { API_URL } from '../config';
import { useRouter } from 'expo-router';

export default function OffersPage() {
    const [offers, setOffers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetch(`${API_URL}/offers/active`)
            .then(res => res.json())
            .then(data => {
                setOffers(data || []);
                setLoading(false);
            })
            .catch(() => setOffers([]));
    }, []);

    const handleProductPress = (productId: string) => {
        router.push({ pathname: '/product/[id]', params: { id: productId } });
    };

    function getValidImageUrl(images: any): string {
        if (Array.isArray(images) && images.length > 0 && typeof images[0] === 'string' && images[0].startsWith('http')) {
            return images[0];
        }
        return 'https://via.placeholder.com/150?text=No+Image';
    }

    if (loading) {
        return (
            <View style={styles.centered}><ActivityIndicator size="large" color="#CB202D" /></View>
        );
    }

    if (!offers.length) {
        return (
            <View style={styles.centered}><Text style={styles.noOffers}>No active offers right now.</Text></View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            {offers.map((offer) => (
                <View key={offer.id} style={styles.offerSection}>
                    <Text style={styles.offerTitle}>{offer.name}</Text>
                    <Text style={styles.offerDesc}>{offer.description}</Text>
                    <View style={styles.productGrid}>
                        {offer.products.map((product: any) => (
                            <TouchableOpacity
                                key={product.id}
                                style={styles.productCard}
                                onPress={() => handleProductPress(product.id)}
                            >
                                <Image source={{ uri: getValidImageUrl(product.images) }} style={styles.productImage} />
                                <Text style={styles.productName}>{product.name ?? 'No Name'}</Text>
                                {product.OfferProduct?.customOfferText ? (
                                    <Text style={styles.productOfferText}>{product.OfferProduct.customOfferText}</Text>
                                ) : null}
                                <Text style={styles.productPrice}>
                                    ₹{typeof product.price === 'number' ? product.price : 0}
                                    {product.OfferProduct?.extraDiscount > 0 && (
                                        <Text style={styles.productDiscount}>  -{product.OfferProduct.extraDiscount}%</Text>
                                    )}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    noOffers: {
        fontSize: 16,
        color: '#666',
        marginTop: 32,
    },
    offerSection: {
        marginBottom: 32,
        backgroundColor: '#F8F8FF',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    offerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#CB202D',
        marginBottom: 4,
    },
    offerDesc: {
        fontSize: 14,
        color: '#333',
        marginBottom: 12,
    },
    productGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    productCard: {
        width: '46%',
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 10,
        marginBottom: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
    },
    productImage: {
        width: 90,
        height: 90,
        borderRadius: 8,
        marginBottom: 8,
        backgroundColor: '#eee',
    },
    productName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
        marginBottom: 2,
    },
    productOfferText: {
        fontSize: 12,
        color: '#4CAF50',
        marginBottom: 2,
        textAlign: 'center',
    },
    productPrice: {
        fontSize: 15,
        color: '#CB202D',
        fontWeight: 'bold',
    },
    productDiscount: {
        fontSize: 13,
        color: '#4CAF50',
        fontWeight: '600',
    },
}); 