import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
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

import ProductCard from '../components/ProductCard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import productService from './services/productService';
import { PAGINATION, SORT_OPTIONS, FILTER_OPTIONS, SortOption, FilterOption } from './config';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedSort, setSelectedSort] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'created_at_desc' | 'created_at_asc' | 'rating_desc' | undefined>(undefined);
  const [filters, setFilters] = useState<FilterOption[]>([]);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { addToCart } = useCart();

  const fetchProducts = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setPage(1);
        setHasMore(true);
      }

      if (!hasMore && !isRefreshing) return;

      setLoading(true);
      // Map frontend sort option to backend
      let sort: 'price_asc' | 'price_desc' | 'created_at_desc' | 'created_at_asc' | 'rating_desc' = 'created_at_desc';
      let order: 'ASC' | 'DESC' = 'DESC';
      switch (sortBy) {
        case 'price_asc':
          sort = 'price_asc'; order = 'ASC'; break;
        case 'price_desc':
          sort = 'price_desc'; order = 'DESC'; break;
        case 'created_at_asc':
          sort = 'created_at_asc'; order = 'ASC'; break;
        case 'created_at_desc':
          sort = 'created_at_desc'; order = 'DESC'; break;
        case 'rating_desc':
          sort = 'rating_desc'; order = 'DESC'; break;
        default:
          sort = 'created_at_desc'; order = 'DESC';
      }

      const response = await productService.getProducts({
        page: isRefreshing ? 1 : page,
        limit: PAGINATION.DEFAULT_PAGE_SIZE,
        search: searchQuery,
        category: selectedCategory || undefined,
        sort,
        order,
        filters: filters.length > 0 ? filters.join(',') : undefined,
      });

      const formattedProducts = response.products.map((product) => ({
        ...product,
        image: product.images[0] || '',
        price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
        discount: typeof product.discount === 'string' ? parseFloat(product.discount) : product.discount,
        rating: typeof product.rating === 'number' ? product.rating : 0,
        isOutOfStock: product.isOutOfStock ?? product.isOutOfStock,
        isActive: product.isActive ?? product.isActive,
      }));

      setProducts(isRefreshing ? formattedProducts : [...products, ...formattedProducts]);
      setTotalProducts(response.totalProducts);
      setHasMore(page < response.totalPages);
      setPage(isRefreshing ? 2 : page + 1);
    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('Error', 'Failed to fetch products. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts(true);
  }, [searchQuery, selectedCategory, sortBy, filters]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts(true);
  }, []);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchProducts(true);
    }, 400); // 400ms debounce
  };

  const handleSort = (sortOption: string) => {
    setSelectedSort(sortOption);
    setSortBy(sortOption as 'price_asc' | 'price_desc' | 'created_at_desc' | 'created_at_asc' | 'rating_desc' | undefined);
    setShowSortModal(false);
  };

  const handleFilter = (category: string) => {
    setSelectedCategory(category);
    setShowFilterModal(false);
  };

  const handleProductPress = (productId: string) => {
    router.push({
      pathname: '/product/[id]',
      params: { id: productId },
    });
  };

  const handleSortChange = (sort: SortOption) => {
    setSortBy(sort as 'price_asc' | 'price_desc' | 'created_at_desc' | 'created_at_asc' | 'rating_desc' | undefined);
  };

  const handleFilterToggle = (filter: FilterOption) => {
    setFilters((prev) =>
      prev.includes(filter)
        ? prev.filter((f) => f !== filter)
        : [...prev, filter]
    );
  };

  const renderSortModal = () => (
    <Modal
      visible={showSortModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowSortModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Sort By</Text>
            <TouchableOpacity onPress={() => setShowSortModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          {SORT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={styles.sortOption}
              onPress={() => handleSort(option.value)}
            >
              <Text style={styles.sortOptionText}>{option.label}</Text>
              {selectedSort === option.value && (
                <Ionicons name="checkmark" size={24} color="#CB202D" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );

  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter By Category</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <ScrollView>
            {FILTER_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.filterOption}
                onPress={() => handleFilter(option.value)}
              >
                <Text style={styles.filterOptionText}>{option.label}</Text>
                {selectedCategory === option.value && (
                  <Ionicons name="checkmark" size={24} color="#CB202D" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderHeader = () => (
    <View style={styles.searchContainer}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search products..."
        value={searchQuery}
        onChangeText={handleSearch}
        onSubmitEditing={() => fetchProducts(true)}
        returnKeyType="search"
      />
      <TouchableOpacity onPress={() => fetchProducts(true)} style={styles.searchButton}>
        <Ionicons name="search" size={20} color="#FFF" />
      </TouchableOpacity>
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

  return (
    <SafeAreaView style={styles.container}>
      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#CB202D" style={styles.loader} />
      ) : (
        <FlatList
          data={products}
          renderItem={({ item }) => (
            <ProductCard
              {...item}
              onPress={() => handleProductPress(item.id)}
              onAddToCart={() => addToCart(item.id)}
            />
          )}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.productRow}
          contentContainerStyle={styles.productList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={() => fetchProducts()}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No products found</Text>
            </View>
          }
        />
      )}

      {renderSortModal()}
      {renderFilterModal()}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 13,
    marginRight: 6,
  },
  searchButton: {
    backgroundColor: '#CB202D',
    padding: 10,
    borderRadius: 8,
  },
  filterContainer: {
    marginBottom: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#CB202D',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666666',
  },
  productList: {
    padding: 16,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  sortOptionText: {
    fontSize: 12,
    color: '#333333',
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  filterOptionText: {
    fontSize: 12,
    color: '#333333',
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default ProductsScreen; 