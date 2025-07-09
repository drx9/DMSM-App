import React, { useState, useEffect } from 'react';
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
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { useRouter } from 'expo-router';
import categoryService, { Category } from '../../services/categoryService';
import productService, { Product } from '../../services/productService';
import { API_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LocationSelectionScreen from '../location/LocationSelectionScreen';
import AddressManagerModal, { Address } from '../../components/AddressManagerModal';
import { useFocusEffect } from '@react-navigation/native';
import ProductCard from '../../components/ProductCard';
import { useCart } from '../context/CartContext';

const { width } = Dimensions.get('window');
const PRODUCT_CARD_WIDTH = (width - 32 - 20) / 3; // 3 cards per row with proper spacing
const FREE_DELIVERY_THRESHOLD = 399;

const NALBARI_BOUNDS = {
  northeast: { lat: 26.464, lng: 91.468 },
  southwest: { lat: 26.420, lng: 91.410 },
};

function isWithinNalbari(lat: number, lng: number) {
  return (
    lat >= NALBARI_BOUNDS.southwest.lat &&
    lat <= NALBARI_BOUNDS.northeast.lat &&
    lng >= NALBARI_BOUNDS.southwest.lng &&
    lng <= NALBARI_BOUNDS.northeast.lng
  );
}

const HomeScreen = () => {
  console.log('HomeScreen loaded at', new Date().toISOString());
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userAddress, setUserAddress] = useState<string>('');
  const [cartTotal, setCartTotal] = useState(0);
  const insets = useSafeAreaInsets();
  const [showLocationScreen, setShowLocationScreen] = useState(false);
  const [userLocation, setUserLocation] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [primaryAddress, setPrimaryAddress] = useState<Address | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const { addToCart } = useCart();
  const [activeOffers, setActiveOffers] = useState<any[]>([]);

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
    const fetchAddresses = async () => {
      const uid = await AsyncStorage.getItem('userId');
      setUserId(uid);
      if (!uid) return;
      try {
        const res = await axios.get(`${API_URL}/addresses/${uid}`);
        setAddresses(res.data);
        const primary = res.data.find((a: Address) => a.isDefault) || res.data[0] || null;
        setPrimaryAddress(primary);
        if (primary) await AsyncStorage.setItem('userAddress', JSON.stringify(primary));
      } catch (err: any) {
        setAddresses([]);
        setPrimaryAddress(null);
        console.log('Error fetching addresses:', err?.response?.data || err.message || err);
      }
    };
    fetchAddresses();
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
    axios.get(`${API_URL}/offers/active`).then(res => {
      setActiveOffers(res.data || []);
    }).catch(() => setActiveOffers([]));
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

  const handleSetPrimary = async (id: string) => {
    try {
      await axios.post(`${API_URL}/addresses/set-default/${id}`);
      const updated = addresses.map(a => ({ ...a, isDefault: a.id === id }));
      setAddresses(updated);
      const primary = updated.find(a => a.isDefault) || updated[0] || null;
      setPrimaryAddress(primary);
      if (primary) await AsyncStorage.setItem('userAddress', JSON.stringify(primary));
    } catch (err: any) {
      Alert.alert('Error', 'Failed to set primary address.');
    }
  };

  const handleAddAddress = async (address: Omit<Address, 'id' | 'isDefault'>) => {
    try {
      const uid = userId || (await AsyncStorage.getItem('userId'));
      const res = await axios.post(`${API_URL}/addresses`, { ...address, userId: uid });
      setAddresses(prev => [...prev, res.data]);
      if (addresses.length === 0) {
        // If first address, set as primary
        await handleSetPrimary(res.data.id);
      }
    } catch (err: any) {
      Alert.alert('Error', 'Failed to add address.');
    }
  };

  const handleEditAddress = async (id: string, address: Omit<Address, 'id' | 'isDefault'>) => {
    try {
      await axios.put(`${API_URL}/addresses/${id}`, address);
      setAddresses(prev => prev.map(a => (a.id === id ? { ...a, ...address } : a)));
    } catch (err: any) {
      Alert.alert('Error', 'Failed to edit address.');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/addresses/${id}`);
      const updated = addresses.filter(a => a.id !== id);
      setAddresses(updated);
      if (primaryAddress?.id === id) {
        const newPrimary = updated[0] || null;
        setPrimaryAddress(newPrimary);
        if (newPrimary) await handleSetPrimary(newPrimary.id);
        else await AsyncStorage.removeItem('userAddress');
      }
    } catch (err: any) {
      Alert.alert('Error', 'Failed to delete address.');
    }
  };

  const handleRequestLocation = () => {
    setShowAddressModal(false);
    setShowLocationSelector(true);
  };

  const handleLocationSelected = async (address: any) => {
    setShowLocationSelector(false);
    await handleAddAddress(address);
  };

  useFocusEffect(
    React.useCallback(() => {
      // When the tab is focused, close the address modal if open
      setShowAddressModal(false);
    }, [])
  );

  // Handler for View All Offers
  const handleViewAllOffers = () => {
    router.push('/offers' as any);
  };

  if (showLocationScreen) {
    return (
      <LocationSelectionScreen
        onLocationSelected={(address: any) => {
          setUserLocation(address);
          setShowLocationScreen(false);
        }}
        savedAddress={userLocation}
      />
    );
  }

  if (!primaryAddress && !showLocationSelector) {
    // If no address exists, force location selector
    setShowLocationSelector(true);
    return null;
  }

  if (showLocationSelector) {
    return (
      <LocationSelectionScreen
        onLocationSelected={handleLocationSelected}
        userId={userId}
        onBack={() => setShowLocationSelector(false)}
      />
    );
  }

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
      <TouchableOpacity onPress={() => setShowAddressModal(true)}>
        <View style={styles.locationHeader}>
          <View style={styles.locationLeft}>
            <View style={styles.homeIconContainer}>
              <Ionicons name="home" size={16} color="#333" />
              <Text style={styles.homeText}>HOME</Text>
              <Text style={styles.addressText}>
                {primaryAddress ? `${primaryAddress.line1}, ${primaryAddress.city}, ${primaryAddress.state}` : 'No address set'}
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
        visible={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        addresses={addresses}
        onSetPrimary={handleSetPrimary}
        onAdd={handleAddAddress}
        onEdit={handleEditAddress}
        onDelete={handleDeleteAddress}
        loading={false}
        onRequestLocation={handleRequestLocation}
      />

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
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                price={product.price}
                image={product.images[0]}
                rating={4.5}
                reviewCount={123}
                discount={20}
                isOutOfStock={false}
                onPress={() => handleProductPress(product.id)}
                onAddToCart={() => addToCart(product.id)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Festival/Offer Banner (dynamic) */}
        {activeOffers.length > 0 && (
          <View style={styles.bannerContainer}>
            <View style={styles.festivalBanner}>
              <Text style={styles.bannerTitle}>{activeOffers[0].name}</Text>
              <Text style={styles.bannerDesc}>{activeOffers[0].description}</Text>
              <TouchableOpacity style={styles.viewOffersButton} onPress={handleViewAllOffers}>
                <Text style={styles.viewOffersText}>View All Offers</Text>
                <Ionicons name="sparkles" size={14} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        )}

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
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                price={product.price}
                image={product.images[0]}
                rating={4.5}
                reviewCount={123}
                discount={20}
                isOutOfStock={false}
                onPress={() => handleProductPress(product.id)}
                onAddToCart={() => addToCart(product.id)}
              />
            ))}
          </View>
        </View>


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
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
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
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  section: {
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
  bannerDesc: {
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 4,
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
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridProductCard: {
    width: (width - 48) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 8,
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
    lineHeight: 12,
  },
  gridProductPrice: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#00A86B',
    marginTop: 4,
  },
  deliveryBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },
});

export default HomeScreen;