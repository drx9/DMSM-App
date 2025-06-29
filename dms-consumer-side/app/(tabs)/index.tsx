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

const { width } = Dimensions.get('window');
// Calculate width for 3 cards in the Mega Diwali Sale section, considering padding and margins
const MEGA_SALE_CARD_WIDTH = (width - 16 * 2 - 12 * 2) / 3; // (total width - 2*horizontal padding - 2*marginRight) / 3 cards
const PRODUCT_CARD_WIDTH = (width - 16 * 2 - 12 * 2) / 2; // 2 cards per row

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
  }, []);

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
        <ActivityIndicator size="large" color="#CB202D" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: 'red', fontSize: 16 }}>{error}</Text>
        <TouchableOpacity onPress={fetchData} style={{ marginTop: 16, padding: 12, backgroundColor: '#CB202D', borderRadius: 8 }}>
          <Text style={{ color: 'white' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
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
          </View>
        </View>
        <TouchableOpacity style={styles.profileIconContainer}>
          <Image
            source={{ uri: 'https://raw.githubusercontent.com/sujal02/Blinkit-Images/main/profile_placeholder.png' }}
            style={styles.profileIcon}
          />
          <Text style={styles.profileIconText}>15x15</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <TouchableOpacity
        style={styles.searchBarContainer}
        onPress={() => router.push('/products')}
      >
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" />
          <Text style={styles.searchText}>Search for products...</Text>
          <TouchableOpacity style={styles.micButton}>
            <Ionicons name="mic" size={20} color="#CB202D" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#CB202D" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Popular Products */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Products</Text>
          <View style={styles.productGrid}>
            {popularProducts.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={styles.productCard}
                onPress={() => handleProductPress(product.id)}
              >
                <Image source={{ uri: product.images[0] }} style={styles.productImage} />
                <Text style={styles.productName}>{product.name}</Text>
                <View style={styles.productDetailsRow}>
                  <Text style={styles.productPrice}>₹{Number(product.price)}</Text>
                  {Number(product.discount) > 0 && (
                    <Text style={styles.discountText}>{Number(product.discount)}% OFF</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        {/* New Arrivals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>New Arrivals</Text>
          <View style={styles.productGrid}>
            {newArrivals.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={styles.productCard}
                onPress={() => handleProductPress(product.id)}
              >
                <Image source={{ uri: product.images[0] }} style={styles.productImage} />
                <Text style={styles.productName}>{product.name}</Text>
                <View style={styles.productDetailsRow}>
                  <Text style={styles.productPrice}>₹{Number(product.price)}</Text>
                  {Number(product.discount) > 0 && (
                    <Text style={styles.discountText}>{Number(product.discount)}% OFF</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        {/* Categories */}
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
                <View style={styles.categoryImageContainer}>
                  <Image source={{ uri: category.image }} style={styles.categoryImage} />
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

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
              </TouchableOpacity>
            ))}
          </View>
        </View>

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
      </ScrollView>
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
  },
  header: {
    backgroundColor: '#CB202D',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
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
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
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
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
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
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  section: {
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
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    width: PRODUCT_CARD_WIDTH,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImageContainer: {
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 120,
    resizeMode: 'contain',
    marginBottom: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1C',
    marginBottom: 4,
    paddingHorizontal: 8,
  },
  productDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  },
});

export default HomeScreen;
