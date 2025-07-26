import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { API_URL } from '../config';
import { useRouter } from 'expo-router';
import { onSocketEvent, offSocketEvent } from '../services/socketService';
import axios from 'axios';

export default function OffersPage() {
    const [offers, setOffers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    const fetchActiveOffers = async () => {
        try {
            setLoading(true);
            
            console.log('Fetching active offers from:', `${API_URL}/offers/active`);
            const response = await axios.get(`${API_URL}/offers/active`);
            console.log('Offers response:', response.data);
            
            // Handle both array and object responses
            const offersData = Array.isArray(response.data) ? response.data : (response.data.offers || []);
            setOffers(offersData);
        } catch (error) {
            console.error('Error fetching offers:', error);
            setOffers([]);
            Alert.alert('Error', 'Failed to load offers. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = React.useCallback(async () => {
        try {
            setRefreshing(true);
            console.log('Refreshing active offers from:', `${API_URL}/offers/active`);
            const response = await axios.get(`${API_URL}/offers/active`);
            console.log('Refreshed offers response:', response.data);
            
            const offersData = Array.isArray(response.data) ? response.data : (response.data.offers || []);
            setOffers(offersData);
        } catch (error) {
            console.error('Error refreshing offers:', error);
            setOffers([]);
        } finally {
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchActiveOffers();

        // Real-time offer updates
        function handleOffersUpdated() {
            console.log('Offers updated, refetching...');
            fetchActiveOffers();
        }
        
        onSocketEvent('offers_updated', handleOffersUpdated);
        onSocketEvent('offer_created', handleOffersUpdated);
        onSocketEvent('offer_updated', handleOffersUpdated);
        onSocketEvent('offer_deleted', handleOffersUpdated);
        
        return () => {
            offSocketEvent('offers_updated', handleOffersUpdated);
            offSocketEvent('offer_created', handleOffersUpdated);
            offSocketEvent('offer_updated', handleOffersUpdated);
            offSocketEvent('offer_deleted', handleOffersUpdated);
        };
    }, []);

    const handleProductPress = (productId: string) => {
        router.push({ pathname: '/product/[id]', params: { id: productId } } as any);
    };

    function getValidImageUrl(images: any, banner_image?: string): string {
        if (banner_image && typeof banner_image === 'string' && banner_image.startsWith('http')) {
            return banner_image;
        }
        if (Array.isArray(images) && images.length > 0 && typeof images[0] === 'string' && images[0].startsWith('http')) {
            return images[0];
        }
        // Fallback to a default image
        return 'https://via.placeholder.com/300x200?text=Offer';
    }

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#CB202D" />
                <Text style={styles.loadingText}>Loading offers...</Text>
            </View>
        );
    }

    if (!offers || offers.length === 0) {
        return (
            <View style={styles.centered}>
                <Text style={styles.noOffers}>No active offers right now.</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchActiveOffers}>
                    <Text style={styles.retryButtonText}>Refresh</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView 
            style={styles.container} 
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            {offers.map((offer) => (
                <View key={offer.id} style={styles.offerSection}>
                    {/* Show sale name and description above the banner if they exist */}
                    {offer.name && <Text style={styles.offerTitle}>{offer.name}</Text>}
                    {offer.description && <Text style={styles.offerDesc}>{offer.description}</Text>}
                    
                    {/* Show offer banner if available */}
                    {offer.banner_image && (
                        <Image 
                            source={{ uri: getValidImageUrl(undefined, offer.banner_image) }} 
                            style={styles.bannerImage}
                        />
                    )}
                    
                    {/* Show products if available */}
                    {offer.products && offer.products.length > 0 && (
                        <View style={styles.productGrid}>
                            {offer.products.map((product: any) => (
                                <TouchableOpacity
                                    key={product.id}
                                    style={styles.productCard}
                                    onPress={() => handleProductPress(product.id)}
                                >
                                    <Image 
                                        source={{ uri: getValidImageUrl(product.images) }} 
                                        style={styles.productImage} 
                                    />
                                    <Text style={styles.productName} numberOfLines={2}>
                                        {product.name || 'Product Name'}
                                    </Text>
                                    {product.OfferProduct?.customOfferText && (
                                        <Text style={styles.productOfferText}>
                                            {product.OfferProduct.customOfferText}
                                        </Text>
                                    )}
                                    <Text style={styles.productPrice}>
                                        ₹{typeof product.price === 'number' ? product.price.toFixed(2) : '0.00'}
                                        {product.OfferProduct?.extraDiscount > 0 && (
                                            <Text style={styles.productDiscount}>
                                                {' '}-{product.OfferProduct.extraDiscount}%
                                            </Text>
                                        )}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                    
                    {/* Show offer details if no products */}
                    {(!offer.products || offer.products.length === 0) && (
                        <View style={styles.offerDetails}>
                            <Text style={styles.offerDetailsText}>
                                {offer.description || 'Special offer available!'}
                            </Text>
                            {offer.startDate && offer.endDate && (
                                <Text style={styles.offerDates}>
                                    Valid from {new Date(offer.startDate).toLocaleDateString()} to {new Date(offer.endDate).toLocaleDateString()}
                                </Text>
                            )}
                        </View>
                    )}
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
        padding: 20,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    noOffers: {
        fontSize: 18,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#CB202D',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
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
        elevation: 2,
    },
    offerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#CB202D',
        marginBottom: 8,
    },
    offerDesc: {
        fontSize: 16,
        color: '#333',
        marginBottom: 16,
        lineHeight: 22,
    },
    bannerImage: {
        width: '100%',
        height: 150,
        borderRadius: 12,
        marginBottom: 16,
        backgroundColor: '#f0f0f0',
    },
    productGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    productCard: {
        width: '46%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
        elevation: 2,
    },
    productImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginBottom: 8,
        backgroundColor: '#f0f0f0',
    },
    productName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
        marginBottom: 4,
        lineHeight: 18,
    },
    productOfferText: {
        fontSize: 12,
        color: '#4CAF50',
        marginBottom: 4,
        textAlign: 'center',
        fontWeight: '500',
    },
    productPrice: {
        fontSize: 16,
        color: '#CB202D',
        fontWeight: 'bold',
    },
    productDiscount: {
        fontSize: 14,
        color: '#4CAF50',
        fontWeight: '600',
    },
    offerDetails: {
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 8,
        alignItems: 'center',
    },
    offerDetailsText: {
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
        marginBottom: 8,
    },
    offerDates: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
}); 