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
import { useRouter } from 'expo-router';
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

const ProductsScreen = () => {
  const { t } = useLanguage();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { addToCart } = useCart();
  const { wishlistIds, add, remove } = useWishlist();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Local state for search and filters
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'rating_desc' | 'newest'>('name_asc');
  const [filterBy, setFilterBy] = useState<'all' | 'in_stock' | 'on_sale' | 'new_arrivals'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch products from backend with search term
  const fetchProducts = async (searchTerm: string) => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { limit: 100 };
      if (searchTerm && searchTerm.trim()) params.search = searchTerm.trim();
      const response = await axios.get(`${API_URL}/products`, { params });
      setProducts(response.data.products || []);
    } catch (err: any) {
      setError('Failed to fetch products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch products on mount and when query changes
  useEffect(() => {
    fetchProducts(query);
  }, [query]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts(query).finally(() => setRefreshing(false));
  }, [query]);

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