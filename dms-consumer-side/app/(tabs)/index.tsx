import React, { useState, useEffect, useRef } from 'react';
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
  Alert,
  Modal
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
import SearchWithFilters from '../../components/SearchWithFilters';

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
  const [currentBanner, setCurrentBanner] = useState(0);
  const bannerScrollRef = useRef<ScrollView>(null);
  const [hasSetAddressOnce, setHasSetAddressOnce] = useState<boolean | null>(null);
  // Remove modal-related state and logic
  const [viewMoreModalVisible, setViewMoreModalVisible] = useState(false);
  const [modalProducts, setModalProducts] = useState<Product[]>([]);
  const [modalTitle, setModalTitle] = useState('');
  const [modalFilterType, setModalFilterType] = useState<'top-picks' | 'new-arrivals' | 'category' | null>(null);
  const [modalQuery, setModalQuery] = useState('');
  const [modalSortBy, setModalSortBy] = useState<'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'rating_desc' | 'newest'>('name_asc');
  const [modalFilterBy, setModalFilterBy] = useState<'all' | 'in_stock' | 'on_sale' | 'new_arrivals'>('all');

  // Remove modal-related functions
  const openViewMoreModal = (type: 'top-picks' | 'new-arrivals' | 'category', products: Product[], title: string) => {
    setModalProducts(products);
    setModalTitle(title);
    setModalFilterType(type);
    setViewMoreModalVisible(true);
    setModalQuery('');
    setModalSortBy('name_asc');
    setModalFilterBy('all');
  };

  const filterAndSortModalProducts = () => {
    let filtered = [...modalProducts];
    if (modalQuery) {
      filtered = filtered.filter(p => p.name.toLowerCase().includes(modalQuery.toLowerCase()));
    }
    if (modalFilterBy === 'in_stock') filtered = filtered.filter(p => !p.isOutOfStock);
    if (modalFilterBy === 'on_sale') filtered = filtered.filter(p => p.discount > 0);
    if (modalFilterBy === 'new_arrivals') filtered = filtered.slice(0, 10); // or use a flag
    switch (modalSortBy) {
      case 'name_asc': filtered.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'name_desc': filtered.sort((a, b) => b.name.localeCompare(a.name)); break;
      case 'price_asc': filtered.sort((a, b) => a.price - b.price); break;
      case 'price_desc': filtered.sort((a, b) => b.price - a.price); break;
      case 'rating_desc': filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      case 'newest': break; // implement if you have a date field
    }
    return filtered;
  };


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
      // Use productService.getProducts for unified fetching
      const res = await productService.getProducts({ limit: 100 });
      // Map products: ensure price/discount are numbers, handle images
      const mappedProducts = (res.products || []).map((item: any) => ({
        ...item,
        price: Number(item.price),
        discount: Number(item.discount) || 0,
        images: Array.isArray(item.images) ? item.images : [item.image || ''],
      }));
      // For now, just slice for popular/new arrivals (could sort/filter if needed)
      setPopularProducts(mappedProducts.slice(0, 6));
      setNewArrivals(mappedProducts.slice(0, 6));
      setError(null);
    } catch (err) {
      console.error('FETCH TEST ERROR:', err);
      const errorMessage = (err as any)?.message ?? 'Unknown error';
      setError('Fetch failed: ' + errorMessage);
      setPopularProducts([]);
      setNewArrivals([]);
    } finally {
      setLoading(false);
    }
  };


  const [categoryProducts, setCategoryProducts] = useState<{ [categoryId: string]: Product[] }>({});
  const [mostBought, setMostBought] = useState<Product[]>([]);


  useEffect(() => {
    AsyncStorage.getItem('hasSetAddressOnce').then(val => {
      setHasSetAddressOnce(val === 'true');
    });
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


  // Banner carousel auto-scroll (optional, can be commented out if not desired)
  useEffect(() => {
    if (activeOffers.length > 1) {
      const interval = setInterval(() => {
        setCurrentBanner(prev => {
          const nextIndex = (prev + 1) % activeOffers.length;
          bannerScrollRef.current?.scrollTo({
            x: nextIndex * (width - 32),
            animated: true,
          });
          return nextIndex;
        });
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [activeOffers.length]);


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
      await AsyncStorage.setItem('hasSetAddressOnce', 'true'); // Set flag when address is added
      setHasSetAddressOnce(true);
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
    await AsyncStorage.setItem('hasSetAddressOnce', 'true'); // Set flag when address is set via map
    setHasSetAddressOnce(true);
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
        onRequestLocation={() => {
          setShowAddressModal(false);
          router.push({ pathname: '/location/location-select', params: { userId } });
        }}
      />

      {showLocationSelector && (
        <LocationSelectionScreen
          onLocationSelected={async (address: any) => {
            setShowLocationSelector(false);
            await handleAddAddress(address);
            await AsyncStorage.setItem('hasSetAddressOnce', 'true');
            setHasSetAddressOnce(true);
            // Optionally refresh addresses here
          }}
          userId={userId}
          savedAddress={null}
          onBack={() => setShowLocationSelector(false)}
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00A86B" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Sale Banner Carousel */}
        <View style={styles.bannerContainer}>
        {activeOffers.length > 0 ? (
          <View style={styles.bannerCarouselContainer}>
            <ScrollView
              ref={bannerScrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={e => {
                const index = Math.round(e.nativeEvent.contentOffset.x / (width - 32));
                setCurrentBanner(index);
              }}
              style={styles.bannerCarousel}
              contentContainerStyle={{ alignItems: 'center' }}
            >
              {activeOffers.map((offer, idx) => (
                <View key={offer.id} style={[styles.carouselBanner, { width: width - 32 }]}> 
                  <Text style={styles.bannerTitle}>{offer.name}</Text>
                  <Text style={styles.bannerDesc}>{offer.description}</Text>
                  <TouchableOpacity style={styles.viewOffersButton} onPress={handleViewAllOffers}>
                    <Text style={styles.viewOffersText}>View All Offers</Text>
                    <Ionicons name="sparkles" size={14} color="#FF6B35" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            {/* Dot Indicators */}
            <View style={styles.carouselIndicators}>
              {activeOffers.map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.carouselDot,
                    currentBanner === idx && styles.carouselDotActive,
                  ]}
                />
              ))}
            </View>
          </View>
        ) : (
            <Text style={styles.noOffersText}>No active offers right now.</Text>
        )}
      </View>

        {/* Category Chips Section */}
        <View style={styles.categoryChipsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryChipsScroll}
            >
            <TouchableOpacity style={styles.categoryChip}>
              <Text style={styles.categoryChipText}>For You</Text>
              <View style={styles.categoryChipIndicator} />
                </TouchableOpacity>
            <TouchableOpacity style={[styles.categoryChip, styles.categoryChipActive]}>
              <Text style={[styles.categoryChipText, styles.categoryChipTextActive]}>Groceries</Text>
              <View style={[styles.categoryChipIndicator, styles.categoryChipIndicatorActive]} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.categoryChip}>
              <Text style={styles.categoryChipText}>Cosmetics</Text>
              <View style={styles.categoryChipIndicator} />
              </TouchableOpacity>
            <TouchableOpacity style={styles.categoryChip}>
              <Text style={styles.categoryChipText}>Bakery</Text>
              <View style={styles.categoryChipIndicator} />
                </TouchableOpacity>
            <TouchableOpacity style={styles.categoryChip}>
              <Text style={styles.categoryChipText}>Pharmacy</Text>
              <View style={styles.categoryChipIndicator} />
            </TouchableOpacity>
          </ScrollView>
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
});

export default HomeScreen;
