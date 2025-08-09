import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Alert,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useLanguage } from '../context/LanguageContext';
import { useRouter } from 'expo-router';
import productService, { Product } from '../../services/productService';
import { API_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LocationSelectionScreen from '../location/LocationSelectionScreen';
import AddressManagerModal, { Address } from '../../components/AddressManagerModal';
import ProductCard from '../../components/ProductCard';
import { useCart } from '../context/CartContext';
import Toast from 'react-native-root-toast';
import SearchWithFilters from '../../components/SearchWithFilters';
import ErrorBoundary from '../components/ErrorBoundary';
import { HorizontalProductSkeleton, GridProductSkeleton, SkeletonLoader } from '../../components/SimpleSkeletonLoader';

// Suppress text rendering errors globally
if (__DEV__) {
  const originalError = console.error;
  const originalWarn = console.warn;
  
  console.error = (...args) => {
    const message = args.join(' ');
    if (message.includes('Text strings must be rendered within a <Text> component') ||
        message.includes('Invariant Violation') ||
        message.includes('Warning:')) {
      return;
    }
    originalError(...args);
  };
  
  console.warn = (...args) => {
    const message = args.join(' ');
    if (message.includes('Text strings must be rendered within a <Text> component') ||
        message.includes('Invariant Violation')) {
      return;
    }
    originalWarn(...args);
  };
  
  if ((global as any).ErrorUtils) {
    const originalHandler = (global as any).ErrorUtils.setGlobalHandler;
    (global as any).ErrorUtils.setGlobalHandler = (callback: any) => {
      const wrappedCallback = (error: any, isFatal: any) => {
        if (error.message && error.message.includes('Text strings must be rendered within a <Text> component')) {
          console.warn('Suppressed text rendering error:', error.message);
          return;
        }
        callback(error, isFatal);
      };
      originalHandler(wrappedCallback);
    };
  }
}

const { width } = Dimensions.get('window');
const PRODUCT_CARD_WIDTH = (width - 32 - 20) / 3;
const FREE_DELIVERY_THRESHOLD = 399;

// Custom hook for home data management
const useHomeData = () => {
  const [state, setState] = useState({
    loading: true,
    refreshing: false,
    error: null as string | null,
    selectedCategory: 'for-you',
    categoryProducts: {} as { [key: string]: Product[] },
    recommendedProducts: [] as Product[],
    newArrivals: [] as Product[],
    frequentlyBought: [] as Product[],
    highestPurchase: [] as Product[],
    activeOffers: [] as any[],
    currentBanner: 0,
    user: null as any,
    userAddress: '',
    cartTotal: 0,
    userId: null as string | null,
    addresses: [] as Address[],
    primaryAddress: null as Address | null,
    hasSetAddressOnce: null as boolean | null,
    showLocationScreen: false,
    showAddressModal: false,
    showLocationSelector: false,
  });

  const updateState = useCallback((updates: Partial<typeof state>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  return { state, updateState };
};

// Custom hook for API calls
const useHomeAPI = (updateState: (updates: any) => void) => {
  const fetchData = useCallback(async () => {
    try {
      updateState({ loading: true, error: null });
      console.log('Fetching products from:', `${API_URL}/products`);
      
      const res = await productService.getProducts({ 
        limit: 100,
        sort: 'created_at_desc'
      });
      
      const mappedProducts = (res.products || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: parseFloat(item.price) || 0,
        discount: parseFloat(item.discount) || 0,
        stock: parseInt(item.stock) || 0,
        images: Array.isArray(item.images) ? item.images : [item.image || 'https://via.placeholder.com/150'],
        rating: parseFloat(item.rating) || 0,
        reviewCount: parseInt(item.reviewCount) || 0,
        isOutOfStock: Boolean(item.isOutOfStock),
        isActive: item.isActive !== false,
        category: item.category,
      }));
      
      updateState({ 
        categoryProducts: { 'for-you': mappedProducts },
        error: null,
        loading: false 
      });
    } catch (err: any) {
      console.error('FETCH ERROR:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch products';
      updateState({ error: errorMessage, loading: false });
    }
  }, [updateState]);

  const fetchCategoryProducts = useCallback(async (categoryId: string) => {
    try {
      const categoriesRes = await axios.get(`${API_URL}/categories`);
      const categories = categoriesRes.data.categories || categoriesRes.data;
      const category = categories.find((c: any) => 
        c.name.toLowerCase() === categoryId.toLowerCase()
      );
      
      if (!category) {
        console.error(`Category not found: ${categoryId}`);
        return [];
      }

      const res = await productService.getProducts({ 
        category: category.id,
        limit: 100,
        sort: 'created_at_desc'
      });
      
      return (res.products || []).map((item: any) => ({
        id: item.id || `product-${Math.random()}`,
        name: item.name || 'Product',
        description: item.description || '',
        price: parseFloat(item.price) || 0,
        discount: Math.min(100, Math.max(0, parseFloat(item.discount) || 0)),
        stock: parseInt(item.stock) || 0,
        images: Array.isArray(item.images) ? item.images : [item.image || 'https://via.placeholder.com/150'],
        rating: parseFloat(item.rating) || 0,
        reviewCount: parseInt(item.reviewCount) || 0,
        isOutOfStock: Boolean(item.isOutOfStock),
        isActive: item.isActive !== false,
        category: item.category || '',
      }));
    } catch (err) {
      console.error(`Error fetching ${categoryId} products:`, err);
      return [];
    }
  }, []);

  const fetchRecommendedProducts = useCallback(async () => {
    try {
      const res = await productService.getProducts({ 
        limit: 100,
        sort: 'rating_desc'
      });
      
      const products = (res.products || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: parseFloat(item.price) || 0,
        discount: parseFloat(item.discount) || 0,
        stock: parseInt(item.stock) || 0,
        images: Array.isArray(item.images) ? item.images : [item.image || 'https://via.placeholder.com/150'],
        rating: parseFloat(item.rating) || 0,
        reviewCount: parseInt(item.reviewCount) || 0,
        isOutOfStock: Boolean(item.isOutOfStock),
        isActive: item.isActive !== false,
        category: item.category,
      }));

      updateState({ recommendedProducts: products });
    } catch (err) {
      console.error('Error fetching recommended products:', err);
      updateState({ recommendedProducts: [] });
    }
  }, [updateState]);

  const fetchAllCategoryProducts = useCallback(async () => {
    updateState({ loading: true });
    try {
      const categories = ['groceries', 'cosmetics', 'dairy', 'bakery'];
      const productsMap: { [key: string]: Product[] } = {};
      
      await Promise.all(
        categories.map(async (category) => {
          productsMap[category] = await fetchCategoryProducts(category);
        })
      );
      
      updateState({ categoryProducts: productsMap });
      await fetchRecommendedProducts();
    } catch (err) {
      console.error('Error fetching all products:', err);
      updateState({ error: 'Failed to fetch products' });
    } finally {
      updateState({ loading: false });
    }
  }, [fetchCategoryProducts, fetchRecommendedProducts, updateState]);

  const fetchExtraSections = useCallback(async () => {
    try {
      const [newArrivalsRes, freqRes, highRes] = await Promise.all([
        productService.getProducts({ limit: 9, sort: 'created_at_desc' }),
        productService.getProducts({ limit: 9, sort: 'frequently_bought_desc' }),
        productService.getProducts({ limit: 9, sort: 'purchase_count_desc' })
      ]);
      
      console.log('Fetched sections data:', {
        newArrivals: newArrivalsRes.products?.length || 0,
        frequentlyBought: freqRes.products?.length || 0,
        highestPurchase: highRes.products?.length || 0
      });
      
      updateState({
        newArrivals: newArrivalsRes.products || [],
        frequentlyBought: freqRes.products || [],
        highestPurchase: highRes.products || []
      });
    } catch (err) {
      console.error('Error fetching extra sections:', err);
      updateState({
        newArrivals: [],
        frequentlyBought: [],
        highestPurchase: []
      });
    }
  }, [updateState]);

  const fetchUserData = useCallback(async () => {
    try {
      // Prefer AuthContext user id; fallback to stored userId
      const uid = await AsyncStorage.getItem('userId');
      updateState({ userId: uid });
      
      if (uid) {
        // Fetch profile if possible (token may be absent in test mode)
        let userData: any = null;
        const token = await AsyncStorage.getItem('userToken');
        try {
          if (token) {
            const userRes = await axios.get(`${API_URL}/auth/user/me`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            userData = userRes.data;
          }
        } catch (e) {
          userData = null;
        }
        
        const addrRes = await axios.get(`${API_URL}/addresses/${uid}`);
        const addresses = addrRes.data || [];
        const primary = addresses.find((a: Address) => a.isDefault) || addresses[0] || null;
        
        updateState({ user: userData, addresses, primaryAddress: primary });
        if (primary) await AsyncStorage.setItem('userAddress', JSON.stringify(primary));
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  }, [updateState]);

  const fetchCartTotal = useCallback(async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;
      const res = await axios.get(`${API_URL}/cart/total/${userId}`);
      updateState({ cartTotal: res.data.total || 0 });
    } catch (err) {
      updateState({ cartTotal: 0 });
    }
  }, [updateState]);

  const fetchActiveOffers = useCallback(async () => {
    try {
      console.log('🔍 Fetching active offers from:', `${API_URL}/offers/active`);
      const res = await axios.get(`${API_URL}/offers/active`);
      console.log('📦 Raw offers response:', res.data);
      
      const offersData = Array.isArray(res.data) ? res.data : (res.data.offers || []);
      console.log('✅ Processed offers data:', offersData);
      console.log('📊 Number of offers:', offersData.length);
      
      if (offersData.length > 0) {
        console.log('🎯 First offer details:', {
          id: offersData[0].id,
          name: offersData[0].name,
          banner_image: offersData[0].banner_image,
          isActive: offersData[0].isActive,
          startDate: offersData[0].startDate,
          endDate: offersData[0].endDate
        });
      }
      
      updateState({ activeOffers: offersData });
    } catch (error: any) {
      console.error('❌ Error fetching active offers:', error);
      console.error('🔍 Error response:', error.response?.data);
      updateState({ activeOffers: [] });
    }
  }, [updateState]);

  return {
    fetchData,
    fetchCategoryProducts,
    fetchRecommendedProducts,
    fetchAllCategoryProducts,
    fetchExtraSections,
    fetchUserData,
    fetchCartTotal,
    fetchActiveOffers
  };
};

// Memoized helper functions
const useHomeHelpers = () => {
  const calculatePrice = useCallback((price: number | undefined, discount: number | undefined) => {
    const safePrice = price || 0;
    const safeDiscount = discount || 0;
    const calculatedPrice = safePrice - (safePrice * safeDiscount / 100);
    return isNaN(calculatedPrice) ? '0.00' : calculatedPrice.toFixed(2);
  }, []);

  const getProductWeight = useCallback((description: string | undefined) => {
    const weight = description?.match(/\d+\s*(?:ml|g|kg|pcs)/i)?.[0];
    return weight || '500g';
  }, []);

  const getProductName = useCallback((name: string | undefined) => {
    return name || 'Product';
  }, []);

  const getCurrentDateTime = useCallback(() => {
    const now = new Date();
    const day = now.getDate();
    const month = now.toLocaleDateString('en-US', { month: 'short' });
    const hours = now.getHours();
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return {
      date: `${day} ${month}`,
      time: `8 AM - 8 ${period}`
    };
  }, []);

  return {
    calculatePrice,
    getProductWeight,
    getProductName,
    getCurrentDateTime
  };
};

// Memoized ProductCard component for grid layout
const MemoizedProductCard = React.memo(({ 
  product, 
  onPress, 
  onAddToCart, 
  calculatePrice, 
  getProductWeight, 
  getProductName 
}: any) => (
  <View style={styles.productCardWrapper}>
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <View style={styles.productCard}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: product.images[0] || 'https://via.placeholder.com/150' }}
            style={styles.productImage}
            resizeMode="cover"
          />
          {product.discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{Number(product.discount || 0)}% OFF</Text>
            </View>
          )}
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {getProductName(product.name)}
          </Text>
          <Text style={styles.productWeight}>
            {getProductWeight(product.description)}
          </Text>
          <View style={styles.priceRow}>
            <Text style={styles.currentPrice}>
              ₹{calculatePrice(product.price, product.discount)}
            </Text>
            {product.discount > 0 && (
              <Text style={styles.originalPrice}>₹{Number(product.price || 0).toFixed(2)}</Text>
            )}
          </View>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={(e) => {
            e.stopPropagation && e.stopPropagation();
            onAddToCart(product.id);
          }}
        >
          <Text style={styles.addButtonText}>ADD +</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  </View>
));

// Memoized ProductCard component for horizontal slider layout
const MemoizedHorizontalProductCard = React.memo(({ 
  product, 
  onPress, 
  onAddToCart, 
  calculatePrice, 
  getProductWeight, 
  getProductName 
}: any) => (
  <View style={styles.horizontalProductCard}>
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <View style={styles.horizontalProductCardInner}>
        <View style={styles.horizontalImageContainer}>
          <Image
            source={{ uri: product.images[0] || 'https://via.placeholder.com/150' }}
            style={styles.horizontalProductImage}
            resizeMode="cover"
          />
          {product.discount > 0 && (
            <View style={styles.horizontalDiscountBadge}>
              <Text style={styles.horizontalDiscountText}>{Number(product.discount || 0)}% OFF</Text>
            </View>
          )}
        </View>
        <View style={styles.horizontalProductInfo}>
          <Text style={styles.horizontalProductName} numberOfLines={2}>
            {getProductName(product.name)}
          </Text>
          <Text style={styles.horizontalProductWeight}>
            {getProductWeight(product.description)}
          </Text>
          <View style={styles.horizontalPriceRow}>
            <Text style={styles.horizontalCurrentPrice}>
              ₹{calculatePrice(product.price, product.discount)}
            </Text>
            {product.discount > 0 && (
              <Text style={styles.horizontalOriginalPrice}>₹{Number(product.price || 0).toFixed(2)}</Text>
            )}
          </View>
        </View>
        <TouchableOpacity 
          style={styles.horizontalAddButton}
          onPress={(e) => {
            e.stopPropagation && e.stopPropagation();
            onAddToCart(product.id);
          }}
        >
          <Text style={styles.horizontalAddButtonText}>ADD +</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  </View>
));

const HomeScreen = () => {
  const { state, updateState } = useHomeData();
  const { 
    fetchData, 
    fetchAllCategoryProducts, 
    fetchExtraSections, 
    fetchUserData, 
    fetchCartTotal, 
    fetchActiveOffers 
  } = useHomeAPI(updateState);
  const { calculatePrice, getProductWeight, getProductName, getCurrentDateTime } = useHomeHelpers();
  
  const { t } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addToCart } = useCart();
  const bannerScrollRef = useRef<ScrollView>(null);

  // Lazy loading state
  const [sectionsLoaded, setSectionsLoaded] = useState({
    newArrivals: false,
    frequentlyBought: false,
    highestPurchase: false
  });

  // Memoized values
  const { date, time } = useMemo(() => getCurrentDateTime(), [getCurrentDateTime]);
  
  const getProductsToShow = useMemo(() => {
    const products = state.selectedCategory === 'for-you' 
      ? state.recommendedProducts 
      : (state.categoryProducts[state.selectedCategory] || []);
    return products.slice(0, 9);
  }, [state.selectedCategory, state.recommendedProducts, state.categoryProducts]);

  // Focus effect for API calls
  useFocusEffect(
    useCallback(() => {
      const initializeData = async () => {
        try {
          console.log('[HomeScreen] Starting data initialization...');
          
          // Get hasSetAddressOnce
          try {
            const hasSetOnce = await AsyncStorage.getItem('hasSetAddressOnce');
            updateState({ hasSetAddressOnce: hasSetOnce === 'true' });
          } catch (err) {
            console.error('[HomeScreen] Error getting hasSetAddressOnce:', err);
          }
          
          // Fetch all data in parallel
          await Promise.all([
            fetchUserData(),
            fetchData(),
            fetchCartTotal(),
            fetchActiveOffers(),
            fetchAllCategoryProducts()
          ]);
          
          // Lazy load sections after a delay
          setTimeout(() => {
            fetchExtraSections();
            setSectionsLoaded(prev => ({ ...prev, newArrivals: true }));
          }, 1000);
          
          setTimeout(() => {
            setSectionsLoaded(prev => ({ ...prev, frequentlyBought: true }));
          }, 2000);
          
          setTimeout(() => {
            setSectionsLoaded(prev => ({ ...prev, highestPurchase: true }));
          }, 3000);
          
          console.log('[HomeScreen] Data initialization completed');
        } catch (error) {
          console.error('[HomeScreen] Critical error in data initialization:', error);
        }
      };
      
      initializeData();
    }, [fetchUserData, fetchData, fetchCartTotal, fetchActiveOffers, fetchAllCategoryProducts, fetchExtraSections, updateState])
  );

  // Banner carousel auto-scroll
  useFocusEffect(
    useCallback(() => {
      if (state.activeOffers.length > 1) {
        const interval = setInterval(() => {
          updateState({ currentBanner: (state.currentBanner + 1) % state.activeOffers.length });
          bannerScrollRef.current?.scrollTo({
            x: ((state.currentBanner + 1) % state.activeOffers.length) * (width - 32),
            animated: true,
          });
        }, 4000);
        return () => clearInterval(interval);
      }
    }, [state.activeOffers.length, state.currentBanner, updateState])
  );

  // Memoized handlers
  const onRefresh = useCallback(() => {
    updateState({ refreshing: true });
    fetchAllCategoryProducts().finally(() => updateState({ refreshing: false }));
  }, [fetchAllCategoryProducts, updateState]);

  const handleCategoryPress = useCallback((category: string) => {
    updateState({ selectedCategory: category });
  }, [updateState]);

  const handleProductPress = useCallback((productId: string) => {
    router.push({
      pathname: '/product/[id]',
      params: { id: productId }
    });
  }, [router]);

  const handleAddToCart = useCallback(async (productId: string) => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Toast.show('Please login to add items to cart', {
          duration: Toast.durations.LONG,
          position: Toast.positions.BOTTOM,
          shadow: true,
          animation: true,
          hideOnPress: true,
          delay: 0,
        });
        return;
      }

      await addToCart(productId);
      Toast.show('Added to cart!', {
        duration: Toast.durations.SHORT,
        position: Toast.positions.BOTTOM,
        shadow: true,
        animation: true,
        hideOnPress: true,
        delay: 0,
      });
    } catch (error) {
      Toast.show('Failed to add to cart. Please try again.', {
        duration: Toast.durations.LONG,
        position: Toast.positions.BOTTOM,
        shadow: true,
        animation: true,
        hideOnPress: true,
        delay: 0,
      });
    }
  }, [addToCart]);

  const handleViewMore = useCallback(() => {
    router.push({
      pathname: '/products',
      params: { 
        category: state.selectedCategory === 'for-you' ? undefined : state.selectedCategory
      }
    });
  }, [router, state.selectedCategory]);

  const handleViewAllOffers = useCallback(() => {
    console.log('Navigating to offers page');
    router.push('/offers' as any);
  }, [router]);

  // Address handlers
  const handleSetPrimary = useCallback(async (id: string) => {
    try {
      await axios.post(`${API_URL}/addresses/set-default/${id}`);
      const updated = state.addresses.map(a => ({ ...a, isDefault: a.id === id }));
      const primary = updated.find(a => a.isDefault) || updated[0] || null;
      updateState({ addresses: updated, primaryAddress: primary });
      if (primary) await AsyncStorage.setItem('userAddress', JSON.stringify(primary));
    } catch (err: any) {
      Alert.alert('Error', 'Failed to set primary address.');
    }
  }, [state.addresses, updateState]);

  const handleAddAddress = useCallback(async (address: Omit<Address, 'id' | 'isDefault'>) => {
    try {
      const uid = state.userId || (await AsyncStorage.getItem('userId'));
      const res = await axios.post(`${API_URL}/addresses`, { ...address, userId: uid });
      updateState({ addresses: [...state.addresses, res.data] });
      await AsyncStorage.setItem('hasSetAddressOnce', 'true');
      updateState({ hasSetAddressOnce: true });
      if (state.addresses.length === 0) {
        await handleSetPrimary(res.data.id);
      }
    } catch (err: any) {
      Alert.alert('Error', 'Failed to add address.');
    }
  }, [state.userId, state.addresses, updateState, handleSetPrimary]);

  const handleEditAddress = useCallback(async (id: string, address: Omit<Address, 'id' | 'isDefault'>) => {
    try {
      await axios.put(`${API_URL}/addresses/${id}`, address);
      updateState({
        addresses: state.addresses.map(a => (a.id === id ? { ...a, ...address } : a))
      });
    } catch (err: any) {
      Alert.alert('Error', 'Failed to edit address.');
    }
  }, [state.addresses, updateState]);

  const handleDeleteAddress = useCallback(async (id: string) => {
    try {
      await axios.delete(`${API_URL}/addresses/${id}`);
      const updated = state.addresses.filter(a => a.id !== id);
      updateState({ addresses: updated });
      if (state.primaryAddress?.id === id) {
        const newPrimary = updated[0] || null;
        updateState({ primaryAddress: newPrimary });
        if (newPrimary) await handleSetPrimary(newPrimary.id);
        else await AsyncStorage.removeItem('userAddress');
      }
    } catch (err: any) {
      Alert.alert('Error', 'Failed to delete address.');
    }
  }, [state.addresses, state.primaryAddress, updateState, handleSetPrimary]);

  // Loading and error states
  if (state.loading) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

        {/* Top App Icons Row */}
        <View style={styles.appIconsContainer}>
          <TouchableOpacity style={styles.appIcon}>
            <View style={[styles.appIconBg, { backgroundColor: '#E3F2FD' }]}>
              <Text style={styles.appIconText}>D</Text>
            </View>
            <Text style={styles.appIconLabel}>DMSM</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.appIcon}>
            <View style={[styles.appIconBg, { backgroundColor: '#FFF3C4' }]}>
              <Ionicons name="wallet" size={24} color="#FF6B35" />
            </View>
            <Text style={styles.appIconLabel}>DMSM Pay</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.appIcon}>
            <View style={[styles.appIconBg, { backgroundColor: '#E8F5E8' }]}>
              <Ionicons name="sparkles" size={24} color="#4CAF50" />
            </View>
            <Text style={styles.appIconLabel}>New</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.appIcon}>
            <View style={[styles.appIconBg, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="grid" size={24} color="#9C27B0" />
            </View>
            <Text style={styles.appIconLabel}>Categories</Text>
          </TouchableOpacity>
        </View>

        {/* Location and Time Header Skeleton */}
        <View style={styles.locationHeader}>
          <View style={styles.locationLeft}>
            <View style={styles.homeIconContainer}>
              <Ionicons name="home" size={16} color="#333" />
              <Text style={styles.homeText}>HOME</Text>
              <SkeletonLoader width={width * 0.6} height={12} style={{ marginLeft: 6 }} />
              <Ionicons name="chevron-forward" size={16} color="#666" />
            </View>
          </View>
          <View style={styles.dateTimeContainer}>
            <Text style={styles.dateText}>Loading...</Text>
            <Text style={styles.timeText}>Loading...</Text>
          </View>
        </View>

        {/* Search Bar Skeleton */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#666" />
            <SkeletonLoader width="70%" height={16} style={{ marginLeft: 8 }} />
            <View style={styles.filterIcon}>
              <Ionicons name="options-outline" size={16} color="#00A86B" />
            </View>
          </View>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Banner Skeleton */}
          <View style={[styles.bannerContainer, { height: 120, marginBottom: 8 }]}>
            <SkeletonLoader width="100%" height={120} borderRadius={12} />
          </View>
          
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <SkeletonLoader width={150} height={40} borderRadius={8} />
          </View>

          {/* Category Chips Skeleton */}
          <View style={styles.categoryChipsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryChipsScroll}>
              {[1, 2, 3, 4, 5].map((item) => (
                <SkeletonLoader key={item} width={80} height={32} borderRadius={16} style={{ marginRight: 12 }} />
              ))}
            </ScrollView>
          </View>

          {/* Products Grid Skeleton */}
          <View style={styles.productsGridContainer}>
            <GridProductSkeleton />
          </View>

          {/* Horizontal Sections Skeleton */}
          <View style={styles.productsGridContainer}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, marginLeft: 8, marginRight: 8 }}>
              <SkeletonLoader width={120} height={18} />
              <SkeletonLoader width={80} height={14} />
            </View>
            <HorizontalProductSkeleton />
          </View>

          <View style={styles.productsGridContainer}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, marginLeft: 8, marginRight: 8 }}>
              <SkeletonLoader width={180} height={18} />
              <SkeletonLoader width={80} height={14} />
            </View>
            <HorizontalProductSkeleton />
          </View>

          <View style={styles.productsGridContainer}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, marginLeft: 8, marginRight: 8 }}>
              <SkeletonLoader width={140} height={18} />
              <SkeletonLoader width={80} height={14} />
            </View>
            <HorizontalProductSkeleton />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (state.error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: '#FF6347', fontSize: 14 }}>{state.error || 'An error occurred'}</Text>
        <TouchableOpacity onPress={fetchAllCategoryProducts} style={{ marginTop: 16, padding: 12, backgroundColor: '#00A86B', borderRadius: 12 }}>
          <Text style={{ color: 'white', fontWeight: '600' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* Top App Icons Row */}
      <View style={styles.appIconsContainer}>
        <TouchableOpacity style={styles.appIcon}>
          <View style={[styles.appIconBg, { backgroundColor: '#E3F2FD' }]}>
            <Text style={styles.appIconText}>D</Text>
          </View>
          <Text style={styles.appIconLabel}>DMSM</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.appIcon}
          onPress={() => router.push('/dmsm-pay' as any)}
        >
          <View style={[styles.appIconBg, { backgroundColor: '#FFF3C4' }]}>
            <Ionicons name="wallet" size={24} color="#FF6B35" />
          </View>
          <Text style={styles.appIconLabel}>DMSM Pay</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.appIcon}
          onPress={() => router.push('/products?sort=newest' as any)}
        >
          <View style={[styles.appIconBg, { backgroundColor: '#E8F5E8' }]}>
            <Ionicons name="sparkles" size={24} color="#4CAF50" />
          </View>
          <Text style={styles.appIconLabel}>New</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.appIcon}
          onPress={() => router.push('/categories' as any)}
        >
          <View style={[styles.appIconBg, { backgroundColor: '#F3E5F5' }]}>
            <Ionicons name="grid" size={24} color="#9C27B0" />
          </View>
          <Text style={styles.appIconLabel}>Categories</Text>
        </TouchableOpacity>
      </View>

      {/* Location and Time Header */}
      <TouchableOpacity onPress={() => updateState({ showAddressModal: true })}>
        <View style={styles.locationHeader}>
          <View style={styles.locationLeft}>
            <View style={styles.homeIconContainer}>
              <Ionicons name="home" size={16} color="#333" />
              <Text style={styles.homeText}>HOME</Text>
              <Text style={styles.addressText}>
                {state.primaryAddress ? `${state.primaryAddress.line1 || ''}, ${state.primaryAddress.city || ''}, ${state.primaryAddress.state || ''}` : 'No address set'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#666" />
            </View>
          </View>
          <View style={styles.dateTimeContainer}>
            <Text style={styles.dateText}>{date}</Text>
            <Text style={styles.timeText}>{time}</Text>
          </View>
        </View>
      </TouchableOpacity>

      <AddressManagerModal
        visible={state.showAddressModal}
        onClose={() => updateState({ showAddressModal: false })}
        addresses={state.addresses}
        onSetPrimary={handleSetPrimary}
        onAdd={handleAddAddress}
        onEdit={handleEditAddress}
        onDelete={handleDeleteAddress}
        loading={false}
        onRequestLocation={() => {
          updateState({ showAddressModal: false });
          router.push({ pathname: '/location/location-select', params: { userId: state.userId } });
        }}
      />

      {state.showLocationSelector && (
        <LocationSelectionScreen
          onLocationSelected={async (address: any) => {
            updateState({ showLocationSelector: false });
            await handleAddAddress(address);
            await AsyncStorage.setItem('hasSetAddressOnce', 'true');
            updateState({ hasSetAddressOnce: true });
          }}
          userId={state.userId}
          savedAddress={null}
          onBack={() => updateState({ showLocationSelector: false })}
        />
      )}

      {/* Search Bar */}
      <TouchableOpacity
        style={styles.searchContainer}
        onPress={() => router.push('/products')}
      >
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#666" />
          <Text style={styles.searchText}>Search grocery products</Text>
          <View style={styles.filterIcon}>
            <Ionicons name="options-outline" size={16} color="#00A86B" />
          </View>
        </View>
      </TouchableOpacity>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 56 }}
        refreshControl={
          <RefreshControl refreshing={state.refreshing} onRefresh={onRefresh} tintColor="#00A86B" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Sale Banner Carousel */}
        <View style={{ height: 180, marginBottom: 8, marginHorizontal: 16 }}>
          {state.activeOffers.length > 0 && state.activeOffers[0].banner_image ? (
            <TouchableOpacity onPress={handleViewAllOffers} activeOpacity={0.9} style={{ flex: 1 }}>
              <Image 
                source={{ 
                  uri: state.activeOffers[0].banner_image,
                  headers: {
                    'Accept': 'image/*',
                  },
                  cache: 'reload'
                }} 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  borderRadius: 12, 
                  resizeMode: 'cover'
                }}
                onError={(error: any) => {
                  console.log('❌ Banner image failed to load:', error);
                  console.log('🖼️ Image URL:', state.activeOffers[0].banner_image);
                }}
                onLoad={() => {
                  console.log('✅ Banner image loaded successfully');
                  console.log('🖼️ Image URL:', state.activeOffers[0].banner_image);
                }}
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleViewAllOffers} activeOpacity={0.9} style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF8E1', borderRadius: 12 }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: '#FFB300', fontWeight: 'bold', fontSize: 18, marginBottom: 4 }}>
                  {state.activeOffers.length === 0 ? 'No Active Offers' : 'Special Offers Available'}
                </Text>
                <Text style={{ color: '#FFB300', fontSize: 14 }}>
                  Tap to view all offers
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Category Chips Section */}
        <View style={styles.categoryChipsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryChipsScroll}
          >
            <TouchableOpacity
              style={[styles.categoryChip, state.selectedCategory === 'for-you' && styles.categoryChipActive]}
              onPress={() => handleCategoryPress('for-you')}
            >
              <Text style={[styles.categoryChipText, state.selectedCategory === 'for-you' && styles.categoryChipTextActive]}>
                For You
              </Text>
              <View style={[styles.categoryChipIndicator, state.selectedCategory === 'for-you' && styles.categoryChipIndicatorActive]} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.categoryChip, state.selectedCategory === 'groceries' && styles.categoryChipActive]}
              onPress={() => handleCategoryPress('groceries')}
            >
              <Text style={[styles.categoryChipText, state.selectedCategory === 'groceries' && styles.categoryChipTextActive]}>
                Groceries
              </Text>
              <View style={[styles.categoryChipIndicator, state.selectedCategory === 'groceries' && styles.categoryChipIndicatorActive]} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.categoryChip, state.selectedCategory === 'cosmetics' && styles.categoryChipActive]}
              onPress={() => handleCategoryPress('cosmetics')}
            >
              <Text style={[styles.categoryChipText, state.selectedCategory === 'cosmetics' && styles.categoryChipTextActive]}>
                Cosmetics
              </Text>
              <View style={[styles.categoryChipIndicator, state.selectedCategory === 'cosmetics' && styles.categoryChipIndicatorActive]} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.categoryChip, state.selectedCategory === 'dairy' && styles.categoryChipActive]}
              onPress={() => handleCategoryPress('dairy')}
            >
              <Text style={[styles.categoryChipText, state.selectedCategory === 'dairy' && styles.categoryChipTextActive]}>
                Dairy
              </Text>
              <View style={[styles.categoryChipIndicator, state.selectedCategory === 'dairy' && styles.categoryChipIndicatorActive]} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.categoryChip, state.selectedCategory === 'bakery' && styles.categoryChipActive]}
              onPress={() => handleCategoryPress('bakery')}
            >
              <Text style={[styles.categoryChipText, state.selectedCategory === 'bakery' && styles.categoryChipTextActive]}>
                Bakery
              </Text>
              <View style={[styles.categoryChipIndicator, state.selectedCategory === 'bakery' && styles.categoryChipIndicatorActive]} />
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Products Grid */}
        <View style={styles.productsGridContainer}>
          {getProductsToShow.length > 0 ? (
            <>
              <View style={styles.productsGrid}>
                {getProductsToShow.filter(product => product && product.id).map((product) => (
                  <MemoizedProductCard
                    key={product.id}
                    product={product}
                    onPress={() => handleProductPress(product.id)}
                    onAddToCart={handleAddToCart}
                    calculatePrice={calculatePrice}
                    getProductWeight={getProductWeight}
                    getProductName={getProductName}
                  />
                ))}
              </View>
              
              <TouchableOpacity 
                style={styles.viewMoreButton}
                onPress={handleViewMore}
              >
                <Text style={styles.viewMoreText}>View More</Text>
                <Ionicons name="arrow-forward" size={16} color="#00A86B" />
              </TouchableOpacity>
            </>
          ) : (
            <GridProductSkeleton />
          )}
        </View>

        {/* Lazy Loaded Sections */}
        {sectionsLoaded.newArrivals ? (
          <View style={styles.productsGridContainer}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, marginLeft: 8, marginRight: 8 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold' }}>New Arrival</Text>
              <TouchableOpacity onPress={() => router.push({ pathname: '/products', params: { section: 'new-arrival' } })}>
                <Text style={{ color: '#00A86B', fontWeight: '600' }}>View More</Text>
              </TouchableOpacity>
            </View>
            {state.newArrivals.length > 0 ? (
              <FlatList
                data={state.newArrivals.filter(product => product && product.id)}
                keyExtractor={(item) => item.id.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item: product }) => (
                  <MemoizedHorizontalProductCard
                    product={product}
                    onPress={() => handleProductPress(product.id)}
                    onAddToCart={handleAddToCart}
                    calculatePrice={calculatePrice}
                    getProductWeight={getProductWeight}
                    getProductName={getProductName}
                  />
                )}
                contentContainerStyle={{ paddingLeft: 8, paddingRight: 8 }}
                style={{ minHeight: 200 }}
              />
            ) : (
              <HorizontalProductSkeleton />
            )}
          </View>
        ) : (
          <View style={styles.productsGridContainer}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, marginLeft: 8, marginRight: 8 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold' }}>New Arrival</Text>
            </View>
            <HorizontalProductSkeleton />
          </View>
        )}

        {sectionsLoaded.frequentlyBought ? (
          <View style={styles.productsGridContainer}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, marginLeft: 8, marginRight: 8 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Frequently Bought Together</Text>
              <TouchableOpacity onPress={() => router.push({ pathname: '/products', params: { section: 'frequently-bought' } })}>
                <Text style={{ color: '#00A86B', fontWeight: '600' }}>View More</Text>
              </TouchableOpacity>
            </View>
            {state.frequentlyBought.length > 0 ? (
              <FlatList
                data={state.frequentlyBought.filter(product => product && product.id)}
                keyExtractor={(item) => item.id.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item: product }) => (
                  <MemoizedHorizontalProductCard
                    product={product}
                    onPress={() => handleProductPress(product.id)}
                    onAddToCart={handleAddToCart}
                    calculatePrice={calculatePrice}
                    getProductWeight={getProductWeight}
                    getProductName={getProductName}
                  />
                )}
                contentContainerStyle={{ paddingLeft: 8, paddingRight: 8 }}
                style={{ minHeight: 200 }}
              />
            ) : (
              <HorizontalProductSkeleton />
            )}
          </View>
        ) : (
          <View style={styles.productsGridContainer}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, marginLeft: 8, marginRight: 8 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Frequently Bought Together</Text>
            </View>
            <HorizontalProductSkeleton />
          </View>
        )}

        {sectionsLoaded.highestPurchase ? (
          <View style={styles.productsGridContainer}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, marginLeft: 8, marginRight: 8 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Highest Purchase</Text>
              <TouchableOpacity onPress={() => router.push({ pathname: '/products', params: { section: 'highest-purchase' } })}>
                <Text style={{ color: '#00A86B', fontWeight: '600' }}>View More</Text>
              </TouchableOpacity>
            </View>
            {state.highestPurchase.length > 0 ? (
              <FlatList
                data={state.highestPurchase.filter(product => product && product.id)}
                keyExtractor={(item) => item.id.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item: product }) => (
                  <MemoizedHorizontalProductCard
                    product={product}
                    onPress={() => handleProductPress(product.id)}
                    onAddToCart={handleAddToCart}
                    calculatePrice={calculatePrice}
                    getProductWeight={getProductWeight}
                    getProductName={getProductName}
                  />
                )}
                contentContainerStyle={{ paddingLeft: 8, paddingRight: 8 }}
                style={{ minHeight: 200 }}
              />
            ) : (
              <HorizontalProductSkeleton />
            )}
          </View>
        ) : (
          <View style={styles.productsGridContainer}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, marginLeft: 8, marginRight: 8 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Highest Purchase</Text>
            </View>
            <HorizontalProductSkeleton />
          </View>
        )}

      </ScrollView>

      {state.cartTotal < FREE_DELIVERY_THRESHOLD && (
        <View style={styles.stickyDeliveryBar}>
          <Text style={styles.stickyDeliveryText}>
            Add ₹{Math.max(0, FREE_DELIVERY_THRESHOLD - (state.cartTotal || 0))} for FREE delivery
          </Text>
        </View>
      )}
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
    backgroundColor: '#FFFFFF',
  },
  // App Icons
  appIconsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
  },
  appIcon: {
    alignItems: 'center',
  },
  appIconBg: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  appIconText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  appIconLabel: {
    fontSize: 11,
    color: '#333',
    fontWeight: '500',
  },
  // Location Header
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  locationLeft: {
    flex: 1,
  },
  homeIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  homeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 6,
  },
  addressText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    flex: 1,
  },
  dateTimeContainer: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  timeText: {
    fontSize: 9,
    color: 'white',
  },
  // Search Bar
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
  },
  filterIcon: {
    padding: 4,
  },
  // Category Chips
  categoryChipsContainer: {
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryChipsScroll: {
    paddingHorizontal: 16,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
  },
  categoryChipActive: {
    backgroundColor: '#00A86B',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  categoryChipIndicator: {
    height: 3,
    width: 20,
    backgroundColor: 'transparent',
    marginTop: 4,
    borderRadius: 2,
  },
  categoryChipIndicatorActive: {
    backgroundColor: '#fff',
  },
  // Banner
  bannerContainer: {
    minHeight: 140,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    borderWidth: 2,
    borderColor: '#FFB300',
    marginBottom: 8,
  },
  bannerCarouselContainer: {
    marginTop: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  bannerCarousel: {
    width: '100%',
    maxHeight: 180,
  },
  carouselBanner: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    minHeight: 140,
    position: 'relative',
    overflow: 'hidden',
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  bannerDesc: {
    fontSize: 14,
    color: '#FFE5D9',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
  },
  viewOffersButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  viewOffersText: {
    color: '#FF6B35',
    fontSize: 13,
    fontWeight: 'bold',
    marginRight: 6,
  },
  carouselIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  carouselDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D0D0D0',
    marginHorizontal: 3,
  },
  carouselDotActive: {
    backgroundColor: '#FF6B35',
    width: 20,
    borderRadius: 10,
  },
  noOffersText: {
    color: '#FFB300',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Scroll View
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  // Sticky Delivery Bar
  stickyDeliveryBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    zIndex: 100,
  },
  stickyDeliveryText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  productsGridContainer: {
    padding: 8,
    backgroundColor: '#fff',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  productCardWrapper: {
    width: '33.333%',
    padding: 4,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f8f8f8',
  },
  productInfo: {
    padding: 8,
    paddingBottom: 40,
  },
  productName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
    minHeight: 32,
  },
  productWeight: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  currentPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  originalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
    marginLeft: 4,
  },
  discountBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#FF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderTopLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  discountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  addButton: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#00A86B',
    borderRadius: 4,
    paddingVertical: 6,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#00A86B',
    fontSize: 12,
    fontWeight: '600',
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  viewMoreText: {
    fontSize: 14,
    color: '#00A86B',
    fontWeight: '600',
    marginRight: 4,
  },
  // Horizontal Product Card Styles
  horizontalProductCard: {
    width: 120,
    marginHorizontal: 4,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  horizontalProductCardInner: {
    flex: 1,
  },
  horizontalImageContainer: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
  },
  horizontalProductImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f8f8f8',
  },
  horizontalDiscountBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#FF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderTopLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  horizontalDiscountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  horizontalProductInfo: {
    padding: 8,
    paddingBottom: 40,
  },
  horizontalProductName: {
    fontSize: 11,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
    minHeight: 28,
  },
  horizontalProductWeight: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
  },
  horizontalPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  horizontalCurrentPrice: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  horizontalOriginalPrice: {
    fontSize: 10,
    color: '#999',
    textDecorationLine: 'line-through',
    marginLeft: 4,
  },
  horizontalAddButton: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#00A86B',
    borderRadius: 4,
    paddingVertical: 6,
    alignItems: 'center',
  },
  horizontalAddButtonText: {
    color: '#00A86B',
    fontSize: 11,
    fontWeight: '600',
  },
});

export default HomeScreen;
