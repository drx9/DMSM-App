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

const { width } = Dimensions.get('window');
// Calculate width for 3 cards in the Mega Diwali Sale section, considering padding and margins
const MEGA_SALE_CARD_WIDTH = (width - 16 * 2 - 12 * 2) / 3; // (total width - 2*horizontal padding - 2*marginRight) / 3 cards

const HomeScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const { t } = useLanguage();
  const router = useRouter();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [categoriesResponse, productsResponse] = await Promise.all([
        categoryService.getCategories(),
        productService.getProducts({ limit: 6, sort: 'FEATURED' })
      ]);
      setCategories(categoriesResponse.categories);
      setFeaturedProducts(productsResponse.products);
    } catch (error) {
      Alert.alert('Error', 'Failed to load data. Please try again.');
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#CB202D" />

      {/* Top Header (Blinkit style) */}
      <View style={styles.topHeader}>
        <View style={styles.topHeaderLeft}>
          <Text style={styles.blinkitText}>DMSM</Text>
          <Text style={styles.minutesText}>10 minutes</Text>
          <View style={styles.locationContainer}>
            <Text style={styles.locationText}>HOME - Sujal Dave, Ratanada, Jodhpur (Raj)</Text>
            <Ionicons name="chevron-down" size={16} color="#FFFFFF" />
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
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <Text style={styles.searchText}>Search products...</Text>
          <TouchableOpacity>
            <Ionicons name="mic-outline" size={20} color="#666" style={styles.micIcon} />
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
        {/* Featured Products */}
        <View style={styles.productGridSection}>
          <Text style={styles.sectionTitle}>Featured Products</Text>
          <View style={styles.productGrid}>
            {featuredProducts.map((product) => (
              <TouchableOpacity 
                key={product.id} 
                style={styles.productCard}
                onPress={() => handleProductPress(product.id)}
              >
                <Image source={{ uri: product.images[0] }} style={styles.productImage} />
                <TouchableOpacity style={styles.addButtton}>
                  <Text style={styles.addButtonText}>ADD</Text>
                </TouchableOpacity>
                <Text style={styles.productName}>{product.name}</Text>
                <View style={styles.productDetailsRow}>
                  <Text style={styles.productPrice}>₹{product.price}</Text>
                  {product.discount > 0 && (
                    <Text style={styles.discountText}>{product.discount}% OFF</Text>
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
                <Image source={{ uri: category.image }} style={styles.categoryImage} />
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
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
  topHeader: {
    backgroundColor: '#CB202D', // Zomato Red
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topHeaderLeft: {
    alignItems: 'flex-start',
  },
  blinkitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  minutesText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginRight: 4,
  },
  profileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2, // Border as seen in image
    borderColor: '#FFD700', // Gold-like color for border
    position: 'relative',
  },
  profileIcon: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  profileIconText: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 3,
  },
  searchBarContainer: {
    backgroundColor: '#CB202D', // Zomato Red
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    elevation: 3, // For Android shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchText: {
    flex: 1,
    color: '#666',
    fontSize: 16,
  },
  micIcon: {
    marginLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: '#E0E0E0',
    paddingLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1C',
    marginBottom: 10,
  },
  productGridSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    width: (width / 2) - 24, // Two cards per row with padding
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 16,
    overflow: 'hidden',
    padding: 12,
  },
  productImage: {
    width: '100%',
    height: 120,
    resizeMode: 'contain',
    marginBottom: 8,
  },
  addButtton: {
    backgroundColor: '#4CAF50',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1C',
    marginBottom: 4,
  },
  productDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1C1C1C',
  },
  discountText: {
    color: '#CB202D',
    fontSize: 12,
  },
  categoryContainer: {
    paddingVertical: 10,
  },
  categoryCard: {
    width: 100,
    height: 100,
    backgroundColor: '#F0F8FF', // Light blue background
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    padding: 8,
  },
  categoryImage: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
    marginBottom: 5,
  },
  categoryName: {
    fontSize: 12,
    textAlign: 'center',
    color: '#333333',
  },
});

export default HomeScreen;
