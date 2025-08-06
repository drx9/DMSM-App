import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
    View, 
    Text, 
    ScrollView, 
    TouchableOpacity, 
    Image, 
    StyleSheet, 
    ActivityIndicator, 
    Alert, 
    RefreshControl,
    Dimensions,
    SafeAreaView,
    StatusBar,
    FlatList
} from 'react-native';
import { API_URL } from '../config';
import { useRouter } from 'expo-router';
import { onSocketEvent, offSocketEvent } from '../services/socketService';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { Colors } from '../../constants/Colors';

const { width } = Dimensions.get('window');

interface Offer {
    id: string;
    name: string;
    description: string;
    banner_image?: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
    products?: any[];
}

export default function OffersPage() {
    const [offers, setOffers] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { addToCart } = useCart();

    const fetchActiveOffers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            console.log('🔍 Fetching active offers from:', `${API_URL}/offers/active`);
            const response = await axios.get(`${API_URL}/offers/active`);
            console.log('📦 Offers response:', response.data);
            
            // Handle both array and object responses
            const offersData = Array.isArray(response.data) ? response.data : (response.data.offers || []);
            console.log('✅ Processed offers:', offersData.length);
            
            setOffers(offersData);
        } catch (error: any) {
            console.error('❌ Error fetching offers:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to load offers';
            setError(errorMessage);
            setOffers([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const onRefresh = useCallback(async () => {
        try {
            setRefreshing(true);
            setError(null);
            
            console.log('🔄 Refreshing active offers');
            const response = await axios.get(`${API_URL}/offers/active`);
            
            const offersData = Array.isArray(response.data) ? response.data : (response.data.offers || []);
            setOffers(offersData);
        } catch (error: any) {
            console.error('❌ Error refreshing offers:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to refresh offers';
            setError(errorMessage);
        } finally {
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchActiveOffers();

        // Real-time offer updates
        const handleOffersUpdated = () => {
            console.log('🔄 Offers updated, refetching...');
            fetchActiveOffers();
        };
        
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
    }, [fetchActiveOffers]);

    const handleProductPress = useCallback((productId: string) => {
        try {
        router.push({ pathname: '/product/[id]', params: { id: productId } } as any);
        } catch (error) {
            console.error('❌ Error navigating to product:', error);
        }
    }, [router]);

    const handleAddToCart = useCallback(async (productId: string) => {
        try {
            await addToCart(productId);
            Alert.alert('Success', 'Product added to cart!');
        } catch (error) {
            console.error('❌ Error adding to cart:', error);
            Alert.alert('Error', 'Failed to add product to cart');
        }
    }, [addToCart]);

    const getValidImageUrl = useCallback((images: any, banner_image?: string): string => {
        try {
        if (banner_image && typeof banner_image === 'string' && banner_image.startsWith('http')) {
            return banner_image;
        }
        if (Array.isArray(images) && images.length > 0 && typeof images[0] === 'string' && images[0].startsWith('http')) {
            return images[0];
        }
        // Fallback to a default image
        return 'https://via.placeholder.com/300x200?text=Offer';
        } catch (error) {
            console.error('❌ Error getting image URL:', error);
            return 'https://via.placeholder.com/300x200?text=Offer';
        }
    }, []);

    const formatDate = useCallback((dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch (error) {
            console.error('❌ Error formatting date:', error);
            return 'Invalid Date';
        }
    }, []);

    const renderOfferCard = useCallback(({ item: offer }: { item: Offer }) => (
        <View style={styles.offerCard}>
            {/* Offer Header */}
            <View style={styles.offerHeader}>
                <View style={styles.offerTitleContainer}>
                    <Text style={styles.offerTitle}>{offer.name}</Text>
                    <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>ACTIVE</Text>
                    </View>
                </View>
                {offer.description && (
                    <Text style={styles.offerDescription}>{offer.description}</Text>
                )}
            </View>

            {/* Banner Image */}
            {offer.banner_image && (
                <View style={styles.bannerContainer}>
                    <Image 
                        source={{ uri: getValidImageUrl(undefined, offer.banner_image) }} 
                        style={styles.bannerImage}
                        resizeMode="cover"
                        onError={(error) => {
                            console.log('❌ Banner image failed to load:', error);
                        }}
                        onLoad={() => {
                            console.log('✅ Banner image loaded successfully');
                        }}
                    />
                    <View style={styles.bannerOverlay}>
                        <Text style={styles.bannerText}>SPECIAL OFFER</Text>
                    </View>
                </View>
            )}

            {/* Offer Details */}
            <View style={styles.offerDetails}>
                <View style={styles.dateContainer}>
                    <Ionicons name="calendar-outline" size={16} color="#666" />
                    <Text style={styles.dateText}>
                        Valid: {formatDate(offer.startDate)} - {formatDate(offer.endDate)}
                    </Text>
                </View>
                
                {offer.products && offer.products.length > 0 ? (
                    <View style={styles.productsSection}>
                        <Text style={styles.productsTitle}>Featured Products</Text>
                        <FlatList
                            data={offer.products.slice(0, 4)} // Limit to 4 products for performance
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(product) => product.id.toString()}
                            renderItem={({ item: product }) => {
                                console.log('🔍 Product data:', JSON.stringify(product, null, 2));
                                
                                // Handle different price formats
                                let originalPrice = 0;
                                if (typeof product.price === 'number') {
                                    originalPrice = product.price;
                                } else if (typeof product.price === 'string') {
                                    originalPrice = parseFloat(product.price) || 0;
                                } else if (product.price !== null && product.price !== undefined) {
                                    originalPrice = parseFloat(product.price.toString()) || 0;
                                }
                                
                                const extraDiscount = product.OfferProduct?.extraDiscount || 0;
                                const discountedPrice = originalPrice - (originalPrice * extraDiscount / 100);
                                
                                console.log('💰 Price calculation:', {
                                    originalPrice,
                                    extraDiscount,
                                    discountedPrice
                                });
                                
                                return (
                                    <TouchableOpacity
                                        style={styles.productCard}
                                        onPress={() => handleProductPress(product.id)}
                                        activeOpacity={0.8}
                                    >
                                        <View style={styles.productImageContainer}>
                                            <Image 
                                                source={{ uri: getValidImageUrl(product.images) }} 
                                                style={styles.productImage}
                                                resizeMode="cover"
                                            />
                                            
                                            {/* Discount Badge */}
                                            {extraDiscount > 0 && (
                                                <View style={styles.discountBadge}>
                                                    <Text style={styles.discountText}>
                                                        {extraDiscount}% OFF
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                        
                                        <View style={styles.productInfo}>
                                            <Text style={styles.productName} numberOfLines={2}>
                                                {product.name || 'Product Name'}
                                            </Text>
                                            
                                            {/* Price Display */}
                                            <View style={styles.priceContainer}>
                                                {extraDiscount > 0 ? (
                                                    <>
                                                        <Text style={styles.discountedPrice}>
                                                            ₹{discountedPrice.toFixed(2)}
                                                        </Text>
                                                        <Text style={styles.originalPrice}>
                                                            ₹{originalPrice.toFixed(2)}
                                                        </Text>
                                                    </>
                                                ) : (
                                                    <Text style={styles.discountedPrice}>
                                                        ₹{originalPrice.toFixed(2)}
                                                    </Text>
                                                )}
                                            </View>
                                            
                                            {/* Add to Cart Button */}
                                            <TouchableOpacity 
                                                style={styles.addToCartButton}
                                                onPress={() => handleAddToCart(product.id)}
                                            >
                                                <Ionicons name="add" size={16} color="#fff" />
                                                <Text style={styles.addToCartText}>ADD</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </TouchableOpacity>
                                );
                            }}
                            contentContainerStyle={styles.productsList}
                        />
                    </View>
                ) : (
                    <View style={styles.noProductsContainer}>
                        <Ionicons name="gift-outline" size={48} color="#ccc" />
                        <Text style={styles.noProductsText}>Special offer available!</Text>
                    </View>
                )}
            </View>
        </View>
    ), [getValidImageUrl, formatDate, handleProductPress, handleAddToCart]);

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#fff" />
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#4CAF50" />
                    <Text style={styles.loadingText}>Loading amazing offers...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <View style={styles.centered}>
                    <Ionicons name="alert-circle-outline" size={64} color="#4CAF50" />
                    <Text style={styles.errorText}>Oops! Something went wrong</Text>
                    <Text style={styles.errorSubtext}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchActiveOffers}>
                        <Text style={styles.retryButtonText}>Try Again</Text>
                    </TouchableOpacity>
            </View>
            </SafeAreaView>
        );
    }

    if (!offers || offers.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <View style={styles.centered}>
                    <Ionicons name="pricetag-outline" size={64} color="#ccc" />
                    <Text style={styles.noOffersTitle}>No Active Offers</Text>
                    <Text style={styles.noOffersText}>Check back soon for amazing deals!</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchActiveOffers}>
                    <Text style={styles.retryButtonText}>Refresh</Text>
                </TouchableOpacity>
            </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Special Offers</Text>
                <Text style={styles.headerSubtitle}>Amazing deals just for you</Text>
            </View>

            <FlatList
                data={offers}
                renderItem={renderOfferCard}
                keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContainer}
            refreshControl={
                    <RefreshControl 
                        refreshing={refreshing} 
                        onRefresh={onRefresh}
                        tintColor="#4CAF50"
                        colors={["#4CAF50"]}
                    />
                }
                initialNumToRender={2}
                maxToRenderPerBatch={2}
                windowSize={5}
                removeClippedSubviews={true}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        paddingTop: 40,
        paddingHorizontal: 20,
        paddingBottom: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#666',
    },
    listContainer: {
        padding: 16,
    },
    offerCard: {
        backgroundColor: '#fff',
        borderRadius: 15,
        marginBottom: 20,
        overflow: 'hidden',
    },
    offerHeader: {
        padding: 15,
        paddingBottom: 0,
        backgroundColor: '#FFE6E6',
        borderBottomWidth: 1,
        borderBottomColor: '#FFD7D7',
    },
    offerTitleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    offerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#CB202D',
    },
    activeBadge: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
    },
    activeBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    offerDescription: {
        fontSize: 15,
        color: '#555',
        marginBottom: 10,
    },
    bannerContainer: {
        width: '100%',
        height: 180,
        position: 'relative',
        borderRadius: 15,
        overflow: 'hidden',
    },
    bannerImage: {
        width: '100%',
        height: '100%',
    },
    bannerOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderBottomLeftRadius: 15,
        borderBottomRightRadius: 15,
    },
    bannerText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    offerDetails: {
        padding: 15,
        paddingTop: 0,
        backgroundColor: '#fff',
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    dateText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 5,
    },
    productsSection: {
        marginTop: 10,
    },
    productsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    productsList: {
        gap: 10,
    },
    productCard: {
        width: 160,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#fff',
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#eee',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    productImageContainer: {
        width: '100%',
        height: 120,
        position: 'relative',
    },
    productImage: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
    },
    productInfo: {
        padding: 12,
        flex: 1,
        justifyContent: 'space-between',
    },
    productName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
        marginBottom: 4,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 8,
    },
    discountedPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4CAF50',
        textAlign: 'center',
    },
    originalPrice: {
        fontSize: 14,
        color: '#999',
        textDecorationLine: 'line-through',
        textAlign: 'center',
    },
    discountBadge: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        position: 'absolute',
        top: 8,
        left: 8,
    },
    discountText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    addToCartButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4CAF50',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    addToCartText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },
    noProductsContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    noProductsText: {
        fontSize: 16,
        color: '#666',
        marginTop: 10,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    errorText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 10,
        marginBottom: 5,
    },
    errorSubtext: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    noOffersTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 10,
        marginBottom: 5,
    },
    noOffersText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
}); 