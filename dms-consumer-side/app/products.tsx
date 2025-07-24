import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from './context/LanguageContext';
import { useCart } from './context/CartContext';
import { useWishlist } from './context/WishlistContext';
import { useAppDispatch, useAppSelector } from '../src/store/hooks';
import { fetchProducts } from '../src/store/slices/productsSlice';
import { searchProducts } from '../src/utils/searchUtils';

import ProductCard from '../components/ProductCard';
import SearchWithFilters from '../components/SearchWithFilters';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getWishlist } from './services/wishlistService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from './config';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  rating: number;
  reviewCount: number;
  discount: number;
  isOutOfStock: boolean;
}

interface GetProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  sort?: string;
  order?: string;
  filters?: string;
}

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image: string;
  rating: number;
  reviewCount: number;
  discount: number;
  isOutOfStock: boolean;
  onPress?: () => void;
  onAddToCart?: () => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (wishlisted: boolean) => void;
  cardWidth?: number;
}

const ProductsScreen = () => {
  const { t } = useLanguage();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { addToCart } = useCart();
  const { wishlistIds, add, remove } = useWishlist();

  const params = useLocalSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  // Local state for search and filters
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'rating_desc' | 'newest'>('name_asc');
  const [filterBy, setFilterBy] = useState<'all' | 'in_stock' | 'on_sale' | 'new_arrivals'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [offerId, setOfferId] = useState<string | null>(null);
  const [niche, setNiche] = useState<string | null>(null);

  useEffect(() => {
    // If params are present, set filters accordingly
    if (params.category) setSelectedCategory(params.category as string);
    if (params.offer) setOfferId(params.offer as string);
    if (params.niche) setNiche(params.niche as string);
  }, [params]);

  // Fetch categories first
  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/categories`);
      setCategories(response.data.categories || response.data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Map frontend sort options to backend parameters
  const getSortParams = (sortOption: string) => {
    switch (sortOption) {
      case 'name_asc':
        return { sort: 'name', order: 'ASC' };
      case 'name_desc':
        return { sort: 'name', order: 'DESC' };
      case 'price_asc':
        return { sort: 'price', order: 'ASC' };
      case 'price_desc':
        return { sort: 'price', order: 'DESC' };
      case 'rating_desc':
        return { sort: 'rating', order: 'DESC' };
      case 'newest':
        return { sort: 'createdAt', order: 'DESC' };
      default:
        return { sort: 'createdAt', order: 'DESC' };
    }
  };

  // Fetch products from backend with search term and filters
  const fetchProducts = async (searchTerm: string) => {
    setLoading(true);
    setError(null);
    try {
      const reqParams: any = { limit: 100 };
      
      // Add search parameter
      if (searchTerm && searchTerm.trim()) {
        reqParams.search = searchTerm.trim();
      }
      
      // Add category parameter
      if (selectedCategory) {
        const category = categories.find(c => 
          c.name.toLowerCase() === selectedCategory.toLowerCase()
        );
        if (category) {
          reqParams.category = category.id;
        }
      }

      // Add sort parameters
      const { sort, order } = getSortParams(sortBy);
      reqParams.sort = sort;
      reqParams.order = order;

      // Add other filters
      if (filterBy === 'in_stock') {
        reqParams.filters = JSON.stringify({ inStock: true });
      } else if (filterBy === 'on_sale') {
        reqParams.filters = JSON.stringify({ discount: true });
      }

      if (offerId) reqParams.offer = offerId;
      if (niche) reqParams.niche = niche;

      console.log('Fetching products with params:', reqParams);
      const response = await axios.get(`${API_URL}/products`, { params: reqParams });
      
      setProducts((response.data.products || []).map((item: any) => ({
        ...item,
        price: Number(item.price),
        discount: Number(item.discount) || 0,
      })));
    } catch (err: any) {
      console.error('Failed to fetch products:', err);
      setError('Failed to fetch products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Update useEffect to refetch when sort changes
  useEffect(() => {
    fetchProducts(query);
  }, [query, selectedCategory, offerId, niche, sortBy, filterBy]); // Added sortBy and filterBy

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts(query).finally(() => setRefreshing(false));
  }, [query, selectedCategory, offerId, niche]);

  const handleProductPress = (productId: string) => {
    router.push({
      pathname: '/product/[id]',
      params: { id: productId },
    });
  };

  const handleToggleWishlist = async (product: any, wishlisted: boolean) => {
    if (wishlisted) add(product.id, product);
    else remove(product.id);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Products</Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#CB202D" />
      </View>
    );
  };

  if (loading && products.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#CB202D" />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show loading indicator at the top if products are being fetched
  const renderLoadingIndicator = () => {
    if (loading && products.length > 0) {
      return (
        <View style={styles.refreshLoading}>
          <ActivityIndicator size="small" color="#CB202D" />
          <Text style={styles.refreshText}>Refreshing...</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderLoadingIndicator()}
      <SearchWithFilters
        query={query}
        sortBy={sortBy}
        filterBy={filterBy}
        selectedCategory={selectedCategory}
        onSearchChange={setQuery}
        onSortChange={setSortBy}
        onFilterChange={setFilterBy}
        onCategoryChange={setSelectedCategory}
      />
      <FlatList
        data={products}
        renderItem={({ item }) => (
          <ProductCard
            {...item}
            image={item.image || ''}
            onPress={() => handleProductPress(item.id)}
            onAddToCart={() => addToCart(item.id)}
            isWishlisted={wishlistIds.includes(item.id)}
            onToggleWishlist={(wish) => handleToggleWishlist(item, wish)}
            // cardWidth removed for 2-column grid
          />
        )}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.productRow}
        contentContainerStyle={styles.productList}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => fetchProducts(query)} />
        }
        ListHeaderComponent={
          products.length > 0 ? (
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsCount}>
                {products.length} product{products.length !== 1 ? 's' : ''} found
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {error ? (
              <>
                <Text style={styles.errorText}>Error loading products</Text>
                <Text style={styles.errorSubtext}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => fetchProducts(query)}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.emptyText}>No products found</Text>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  headerSpacer: {
    width: 40,
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
  productList: {
    padding: 16,
  },
  productRow: {
    justifyContent: 'space-between',
  },
  resultsHeader: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 8,
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  refreshLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    gap: 8,
  },
  refreshText: {
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    color: '#CB202D',
    fontWeight: '600',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#CB202D',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProductsScreen; 