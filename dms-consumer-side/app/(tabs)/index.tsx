import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  StatusBar,
  Dimensions,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { useRouter } from 'expo-router';
import categoryService, { Category } from '../../services/categoryService';
import productService, { Product } from '../../services/productService';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const PRODUCT_CARD_WIDTH = (width - 32 - 20) / 3; // 3 cards per row with proper spacing
const FREE_DELIVERY_THRESHOLD = 399;

const HomeScreen = () => {
  console.log('HomeScreen loaded at', new Date().toISOString());
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userAddress, setUserAddress] = useState<string>('');
  const [cartTotal, setCartTotal] = useState(0);
  const insets = useSafeAreaInsets();

  // Get current date and time
  const getCurrentDateTime = () => {
    const now = new Date();
    const day = now.getDate();
    const month = now.toLocaleDateString('en-US', { month: 'short' });
    const hours = now.getHours();
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return {
      date: `${day} ${month}`,
      time: `8 AM - 8 ${period}` // Using fixed delivery window as in the example
    };
  };

  const { date, time } = getCurrentDateTime();

  // Minimal fetch test
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('FETCH TEST START');
      const res = await fetch(`${API_URL}/products`);
      const data = await res.json();
      setPopularProducts(data.products);
      setNewArrivals(data.products);
      setError(null);
    } catch (err) {
      console.error('FETCH TEST ERROR:', err);
      const errorMessage = (err as any)?.message ?? 'Unknown error';
      setError('Fetch failed: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const fetchUserDetails = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        if (userId) {
          const userRes = await axios.get(`${API_URL}/auth/user/${userId}`);
          setUser(userRes.data);
          // Fetch default address
          const addrRes = await axios.get(`${API_URL}/addresses/${userId}`);
          const defaultAddr = addrRes.data.find((a: any) => a.isDefault) || addrRes.data[0];
          if (defaultAddr) {
            setUserAddress(`${defaultAddr.line1}, ${defaultAddr.city}, ${defaultAddr.state}`);
          }
        }
      } catch (err) {
        console.error('Failed to fetch user details:', err);
      }
    };
    fetchUserDetails();
    fetchCartTotal();
  }, []);

  const fetchCartTotal = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;
      const res = await axios.get(`${API_URL}/cart/total/${userId}`);
      setCartTotal(res.data.total || 0);
    } catch (err) {
      setCartTotal(0);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchData().finally(() => setRefreshing(false));
  }, []);

  const handleCategoryPress = (category: Category) => {
    router.push({
      pathname: '/products',
      params: { category: category.id }
    });
  };

  const handleProductPress = (productId: string) => {
    router.push({
      pathname: '/product/[id]',
      params: { id: productId }
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00A86B" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: '#FF6347', fontSize: 14 }}>{error}</Text>
        <TouchableOpacity onPress={fetchData} style={{ marginTop: 16, padding: 12, backgroundColor: '#00A86B', borderRadius: 12 }}>
          <Text style={{ color: 'white', fontWeight: '600' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
<<<<<<< HEAD
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#CB202D" />

      {/* Blinkit Style Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.brandContainer}>
            <Text style={styles.brandText}>DMS</Text>
            <Text style={styles.brandSubtext}>MART</Text>
          </View>
          <View style={styles.deliveryInfo}>
            <Text style={styles.deliveryTime}>10 minutes</Text>
          <View style={styles.locationContainer}>
              <Ionicons name="location" size={16} color="#FFFFFF" />
              <Text style={styles.locationText}>Deliver to</Text>
              <Text style={styles.addressText}>Home - Jodhpur, Rajasthan</Text>
            <Ionicons name="chevron-down" size={16} color="#FFFFFF" />
            </View>
=======
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
            <Text style={styles.appIconText}>P</Text>
          </View>
          <Text style={styles.appIconLabel}>Pay</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.appIcon}>
          <View style={[styles.appIconBg, { backgroundColor: '#C8E6C9' }]}>
            <Text style={styles.appIconText}>G</Text>
          </View>
          <Text style={styles.appIconLabel}>Groceries</Text>
        </TouchableOpacity>
      </View>

      {/* Location and Time Header */}
      <View style={styles.locationHeader}>
        <View style={styles.locationLeft}>
          <View style={styles.homeIconContainer}>
            <Ionicons name="home" size={16} color="#333" />
            <Text style={styles.homeText}>HOME</Text>
            <Text style={styles.addressText}>
              {userAddress || 'Railgate no 1, Chandmari...'}
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#666" />
>>>>>>> 5b1e092b48191a9f44b616b6b96a360b398d3789
          </View>
        </View>
        <View style={styles.dateTimeContainer}>
          <Text style={styles.dateText}>{date}</Text>
          <Text style={styles.timeText}>{time}</Text>
        </View>
      </View>

      {/* Search Bar */}
      <TouchableOpacity
        style={styles.searchContainer}
        onPress={() => router.push('/products')}
      >
        <View style={styles.searchBar}>
<<<<<<< HEAD
          <Ionicons name="search" size={20} color="#666" />
          <Text style={styles.searchText}>Search for products...</Text>
          <TouchableOpacity style={styles.micButton}>
            <Ionicons name="mic" size={20} color="#CB202D" />
          </TouchableOpacity>
=======
          <Ionicons name="search" size={18} color="#666" />
          <Text style={styles.searchText}>Search grocery products</Text>
          <View style={styles.filterIcon}>
            <Ionicons name="options-outline" size={16} color="#00A86B" />
          </View>
>>>>>>> 5b1e092b48191a9f44b616b6b96a360b398d3789
        </View>
      </TouchableOpacity>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 56 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00A86B" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Top Picks Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Top Picks for You</Text>
              <Text style={styles.sectionSubtitle}>Based on what is popular around you</Text>
            </View>
            <TouchableOpacity style={styles.arrowButton}>
              <Ionicons name="arrow-forward" size={16} color="white" />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {popularProducts.slice(0, 6).map((product, index) => (
              <TouchableOpacity
                key={product.id}
                style={styles.topPickCard}
                onPress={() => handleProductPress(product.id)}
              >
<<<<<<< HEAD
                <View style={styles.categoryImageContainer}>
                  <Image source={{ uri: category.image }} style={styles.categoryImage} />
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
=======
                <Image source={{ uri: product.images[0] }} style={styles.topPickImage} />
                <View style={styles.ratingContainer}>
                  <Text style={styles.rating}>4.{Math.floor(Math.random() * 5) + 3}</Text>
                  <Ionicons name="star" size={10} color="#00A86B" />
                </View>
                <Text style={styles.productWeight}>
                  {Math.floor(Math.random() * 10) + 1} x {Math.floor(Math.random() * 200) + 50} g
                </Text>
                <Text style={styles.topPickName} numberOfLines={2}>{product.name}</Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>
                    {Number(product.discount) || Math.floor(Math.random() * 50) + 10}% OFF
                  </Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.currentPrice}>₹{Number(product.price)}</Text>
                  <Text style={styles.originalPrice}>
                    ₹{Math.floor(Number(product.price) * 1.3)}
                  </Text>
                </View>
                <TouchableOpacity style={styles.addButton}>
                  <Ionicons name="add" size={16} color="#00A86B" />
                </TouchableOpacity>
>>>>>>> 5b1e092b48191a9f44b616b6b96a360b398d3789
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

<<<<<<< HEAD
        {/* Featured Products */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Featured Products</Text>
          <View style={styles.productGrid}>
            {featuredProducts.map((product) => (
              <TouchableOpacity 
                key={product.id} 
                style={styles.productCard}
                onPress={() => handleProductPress(product.id)}
              >
                <View style={styles.productImageContainer}>
                  <Image source={{ uri: product.images[0] }} style={styles.productImage} />
                  {product.discount > 0 && (
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>{product.discount}% OFF</Text>
                    </View>
                  )}
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                  <View style={styles.priceContainer}>
                    <Text style={styles.productPrice}>₹{product.price}</Text>
                  </View>
                  <TouchableOpacity style={styles.addButton}>
                  <Text style={styles.addButtonText}>ADD</Text>
                </TouchableOpacity>
                </View>
=======
        {/* Mid Month Festival Banner */}
        <View style={styles.bannerContainer}>
          <View style={styles.festivalBanner}>
            <Text style={styles.bannerTitle}>MID MONTH</Text>
            <Text style={styles.bannerTitle}>FESTIVAL</Text>
            <TouchableOpacity style={styles.viewOffersButton}>
              <Text style={styles.viewOffersText}>Click Here To View All Offers</Text>
              <Ionicons name="sparkles" size={14} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Categories Section */}
        {categories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryContainer}
            >
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryCard}
                  onPress={() => handleCategoryPress(category)}
                >
                  <Image source={{ uri: category.image }} style={styles.categoryImage} />
                  <Text style={styles.categoryName}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* New Arrivals Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>New Arrivals</Text>
          <View style={styles.productGrid}>
            {newArrivals.slice(0, 6).map((product) => (
              <TouchableOpacity
                key={product.id}
                style={styles.gridProductCard}
                onPress={() => handleProductPress(product.id)}
              >
                <Image source={{ uri: product.images[0] }} style={styles.gridProductImage} />
                <Text style={styles.gridProductName} numberOfLines={2}>{product.name}</Text>
                <Text style={styles.gridProductPrice}>₹{Number(product.price)}</Text>
>>>>>>> 5b1e092b48191a9f44b616b6b96a360b398d3789
              </TouchableOpacity>
            ))}
          </View>
        </View>

<<<<<<< HEAD
        {/* Offers Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Best Offers</Text>
          <View style={styles.offersContainer}>
            <TouchableOpacity style={styles.offerCard}>
              <View style={styles.offerContent}>
                <Text style={styles.offerTitle}>First Order</Text>
                <Text style={styles.offerSubtitle}>Get 50% OFF</Text>
                <Text style={styles.offerCode}>Use code: FIRST50</Text>
              </View>
              <View style={styles.offerImageContainer}>
                <Ionicons name="gift" size={40} color="#CB202D" />
        </View>
              </TouchableOpacity>
        </View>
        </View>
=======

>>>>>>> 5b1e092b48191a9f44b616b6b96a360b398d3789
      </ScrollView>

      <View style={styles.stickyDeliveryBar}>
        <Text style={styles.stickyDeliveryText}>
          {cartTotal >= FREE_DELIVERY_THRESHOLD
            ? 'You have free delivery!'
            : `Add ₹${FREE_DELIVERY_THRESHOLD - cartTotal} for FREE delivery`}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
<<<<<<< HEAD
  header: {
    backgroundColor: '#CB202D',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
=======
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
  locationHeader: {
>>>>>>> 5b1e092b48191a9f44b616b6b96a360b398d3789
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
<<<<<<< HEAD
  headerLeft: {
    flex: 1,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  brandText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  brandSubtext: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryTime: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 8,
  },
  locationContainer: {
=======
  locationLeft: {
    flex: 1,
  },
  homeIconContainer: {
>>>>>>> 5b1e092b48191a9f44b616b6b96a360b398d3789
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
<<<<<<< HEAD
  locationText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 4,
  },
  addressText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    flex: 1,
  },
  profileButton: {
    padding: 8,
  },
  profileIconContainer: {
    alignItems: 'center',
    padding: 8,
  },
  profileIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  profileIconText: {
    color: '#FFFFFF',
    fontSize: 10,
    marginTop: 2,
  },
  searchBarContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
=======
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
>>>>>>> 5b1e092b48191a9f44b616b6b96a360b398d3789
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
<<<<<<< HEAD
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchText: {
    flex: 1,
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  micButton: {
=======
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
>>>>>>> 5b1e092b48191a9f44b616b6b96a360b398d3789
    padding: 4,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  section: {
<<<<<<< HEAD
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  categoryContainer: {
    paddingHorizontal: 16,
  },
  categoryCard: {
    alignItems: 'center',
    marginRight: 16,
    width: 80,
  },
  categoryImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryImage: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  categoryName: {
    fontSize: 12,
    color: '#1A1A1A',
    textAlign: 'center',
=======
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  arrowButton: {
    backgroundColor: '#333',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  horizontalScroll: {
    paddingRight: 16,
  },
  topPickCard: {
    width: PRODUCT_CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    position: 'relative',
  },
  topPickImage: {
    width: '100%',
    height: 80,
    resizeMode: 'contain',
    backgroundColor: '#F8F8F8',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'white',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rating: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 2,
  },
  productWeight: {
    fontSize: 9,
    color: '#666',
    paddingHorizontal: 8,
    marginTop: 8,
  },
  topPickName: {
    fontSize: 10,
    color: '#333',
    paddingHorizontal: 8,
    marginTop: 4,
    fontWeight: '500',
    lineHeight: 12,
  },
  discountBadge: {
    backgroundColor: '#00A86B',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginHorizontal: 8,
    marginTop: 6,
  },
  discountText: {
    fontSize: 8,
    color: 'white',
    fontWeight: 'bold',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginTop: 6,
    marginBottom: 8,
  },
  currentPrice: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  originalPrice: {
    fontSize: 10,
    color: '#999',
    textDecorationLine: 'line-through',
    marginLeft: 6,
  },
  addButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#F0F0F0',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00A86B',
  },
  bannerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  festivalBanner: {
    backgroundColor: 'linear-gradient(135deg, #FFB6C1 0%, #87CEEB 100%)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF1493',
    textAlign: 'center',
  },
  viewOffersButton: {
    backgroundColor: '#8A2BE2',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
  },
  viewOffersText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
    marginRight: 6,
  },
  categoryContainer: {
    paddingVertical: 8,
  },
  categoryCard: {
    width: 80,
    alignItems: 'center',
    marginRight: 16,
  },
  categoryImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F8F8F8',
  },
  categoryName: {
    fontSize: 10,
    color: '#333',
    textAlign: 'center',
    marginTop: 6,
    fontWeight: '500',
>>>>>>> 5b1e092b48191a9f44b616b6b96a360b398d3789
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  gridProductCard: {
    width: (width - 48) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
<<<<<<< HEAD
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImageContainer: {
    position: 'relative',
=======
    padding: 8,
>>>>>>> 5b1e092b48191a9f44b616b6b96a360b398d3789
  },
  gridProductImage: {
    width: '100%',
    height: 80,
    resizeMode: 'contain',
    backgroundColor: '#F8F8F8',
    borderRadius: 6,
  },
  gridProductName: {
    fontSize: 10,
    color: '#333',
    marginTop: 8,
    fontWeight: '500',
<<<<<<< HEAD
    color: '#1C1C1C',
    marginBottom: 4,
    paddingHorizontal: 8,
=======
    lineHeight: 12,
>>>>>>> 5b1e092b48191a9f44b616b6b96a360b398d3789
  },
  gridProductPrice: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#00A86B',
    marginTop: 4,
  },
  deliveryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
<<<<<<< HEAD
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#CB202D',
  },
  discountText: {
    fontSize: 12,
    color: '#CB202D',
    fontWeight: '600',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#CB202D',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  productInfo: {
    padding: 8,
  },
  priceContainer: {
    marginBottom: 8,
  },
  addButton: {
    backgroundColor: '#CB202D',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  offersContainer: {
    paddingHorizontal: 16,
  },
  offerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  offerContent: {
    flex: 1,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  offerSubtitle: {
    fontSize: 14,
    color: '#CB202D',
    fontWeight: '600',
    marginBottom: 4,
  },
  offerCode: {
    fontSize: 12,
    color: '#666',
  },
  offerImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
=======
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
  },
  deliveryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#856404',
  },
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
>>>>>>> 5b1e092b48191a9f44b616b6b96a360b398d3789
  },
});

export default HomeScreen;