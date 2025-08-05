import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config';
import Toast from 'react-native-root-toast';

const { width, height } = Dimensions.get('window');

interface Product {
  id: string;
  name: string;
  price: number;
  mrp: number;
  discount: number;
  images: string[];
  description: string;
  expiryDate: string;
  manufacturedDate: string;
  orderCount: number;
  rating: number;
  reviewCount: number;
  isOutOfStock: boolean;
  category: string;
  weight: string;
  unit: string;
}

const ProductDetailScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { addToCart } = useCart();
  const { wishlistIds, add, remove } = useWishlist();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [cartTotal, setCartTotal] = useState(0);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const imageScrollViewRef = useRef<ScrollView>(null);

  const FREE_DELIVERY_THRESHOLD = 399;

  useEffect(() => {
    fetchProduct();
    fetchCartTotal();
  }, [params.id]);

  useEffect(() => {
    if (product) {
      setIsWishlisted(wishlistIds.includes(product.id));
    }
  }, [product, wishlistIds]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/products/${params.id}`);
      setProduct(response.data);
    } catch (error) {
      console.error('Error fetching product:', error);
      Alert.alert('Error', 'Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const fetchCartTotal = async () => {
    try {
      const cartItems = await AsyncStorage.getItem('cartItems');
      if (cartItems) {
        const items = JSON.parse(cartItems);
        const total = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
        setCartTotal(total);
      }
    } catch (error) {
      console.error('Error fetching cart total:', error);
    }
  };

  const handleImageScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / width);
    setCurrentImageIndex(index);
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    try {
      await addToCart(product.id);
      await fetchCartTotal();
      Toast.show('Added to cart!', { duration: 1500 });
    } catch (error) {
      Toast.show('Failed to add to cart', { duration: 1500 });
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    
    try {
      await addToCart(product.id);
      router.push('/cart');
    } catch (error) {
      Toast.show('Failed to add to cart', { duration: 1500 });
    }
  };

  const handleToggleWishlist = async () => {
    if (!product) return;
    
    const userId = await AsyncStorage.getItem('userId');
    if (!userId) {
      Toast.show('Login required', { duration: 1500 });
      return;
    }

    try {
      if (isWishlisted) {
        await remove(product.id);
        setIsWishlisted(false);
        Toast.show('Removed from wishlist', { duration: 1500 });
      } else {
        await add(product.id);
        setIsWishlisted(true);
        Toast.show('Added to wishlist', { duration: 1500 });
      }
    } catch (error) {
      Toast.show('Failed to update wishlist', { duration: 1500 });
    }
  };

  const formatPrice = (price: number) => {
    return `₹${price.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#CB202D" />
          <Text style={styles.loadingText}>Loading product details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Product not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const salePrice = (Number(product.price) || 0) - ((Number(product.price) || 0) * (Number(product.discount) || 0) / 100);
  const remainingForFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - cartTotal);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          
          <View style={styles.searchContainer}>
            <Text style={styles.searchText}>Search for products</Text>
          </View>
          
          <TouchableOpacity onPress={() => router.push('/cart')} style={styles.cartButton}>
            <Ionicons name="bag" size={24} color="#333" />
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>1</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} ref={scrollViewRef}>
        {/* Product Images */}
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleImageScroll}
            scrollEventThrottle={16}
            ref={imageScrollViewRef}
          >
                         {(product.images || []).map((image, index) => (
               <View key={index} style={styles.imageWrapper}>
                 <Image
                   source={{ uri: image }}
                   style={styles.productImage}
                   resizeMode="contain"
                 />
               </View>
             ))}
          </ScrollView>
          
                     {/* Image Indicators */}
           <View style={styles.imageIndicators}>
             {(product.images || []).map((_, index) => (
               <View
                 key={index}
                 style={[
                   styles.indicator,
                   index === currentImageIndex ? styles.activeIndicator : styles.inactiveIndicator
                 ]}
               />
             ))}
           </View>
        </View>

        {/* Product Details */}
        <View style={styles.productDetails}>
          <View style={styles.productHeader}>
            <Text style={styles.productName}>{product.name}</Text>
            <TouchableOpacity onPress={handleToggleWishlist} style={styles.wishlistButton}>
              <Ionicons
                name={isWishlisted ? "heart" : "heart-outline"}
                size={24}
                color={isWishlisted ? "#CB202D" : "#666"}
              />
            </TouchableOpacity>
          </View>

                     {(Number(product.discount) || 0) > 0 && (
             <Text style={styles.discountText}>{(Number(product.discount) || 0).toFixed(0)}.00% off</Text>
           )}

          <View style={styles.priceContainer}>
            <View style={styles.priceInfo}>
              <Text style={styles.currentPrice}>{formatPrice(salePrice)}</Text>
                           {(Number(product.mrp) || 0) > salePrice && (
               <Text style={styles.mrpPrice}>MRP {formatPrice(Number(product.mrp) || 0)}</Text>
             )}
            </View>
            <TouchableOpacity style={styles.addButton}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          {/* Delivery Info */}
          {remainingForFreeDelivery > 0 && (
            <View style={styles.deliveryInfo}>
              <Text style={styles.deliveryText}>
                Add {formatPrice(remainingForFreeDelivery)} for FREE delivery
              </Text>
              <Ionicons name="chevron-up" size={16} color="#666" />
            </View>
          )}

                     {/* Product Info */}
           <View style={styles.productInfo}>
             {product.expiryDate && (
               <Text style={styles.infoText}>Expiry Date {formatDate(product.expiryDate)}</Text>
             )}
             {product.manufacturedDate && (
               <Text style={styles.infoText}>Manufactured date {formatDate(product.manufacturedDate)}</Text>
             )}
           </View>

          {/* Popularity */}
          <View style={styles.popularityContainer}>
            <Ionicons name="trending-up" size={16} color="#4CAF50" />
            <Text style={styles.popularityText}>
              {(product.orderCount || 0).toLocaleString()}+ people ordered this in the last 15 days
            </Text>
          </View>

                     {/* Product Description */}
           <View style={styles.descriptionContainer}>
             <Text style={styles.descriptionTitle}>Product Description</Text>
             <Text style={styles.descriptionText}>{product.description || 'No description available'}</Text>
           </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={styles.bottomBar}>
        {remainingForFreeDelivery > 0 && (
          <Text style={styles.bottomDeliveryText}>
            Add {formatPrice(remainingForFreeDelivery)} for FREE delivery
          </Text>
        )}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}>
            <Text style={styles.addToCartText}>Add to Cart</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buyNowButton} onPress={handleBuyNow}>
            <Text style={styles.buyNowText}>Buy Now</Text>
          </TouchableOpacity>
        </View>
    </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'android' ? 8 : 0,
  },
  backButton: {
    padding: 4,
  },
  searchContainer: {
    flex: 1,
    marginHorizontal: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchText: {
    fontSize: 14,
    color: '#999',
  },

  cartButton: {
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#CB202D',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    height: 300,
    position: 'relative',
  },
  imageWrapper: {
    width: width,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  productImage: {
    width: '80%',
    height: '80%',
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#4CAF50',
  },
  inactiveIndicator: {
    backgroundColor: '#E0E0E0',
  },
  productDetails: {
    padding: 16,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  productName: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 16,
  },
  wishlistButton: {
    padding: 4,
  },
  discountText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  priceInfo: {
    flex: 1,
  },
  currentPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  mrpPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  deliveryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  deliveryText: {
    fontSize: 14,
    color: '#333',
  },
  productInfo: {
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  popularityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  popularityText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  descriptionContainer: {
    marginBottom: 100, // Space for bottom bar
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    padding: 16,
  },
  bottomDeliveryText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  addToCartButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CB202D',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addToCartText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#CB202D',
  },
  buyNowButton: {
    flex: 1,
    backgroundColor: '#CB202D',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buyNowText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ProductDetailScreen;