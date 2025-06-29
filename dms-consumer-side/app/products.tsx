import React, { useState, useCallback, useEffect } from 'react';
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
  const [sortBy, setSortBy] = useState<string>(SORT_OPTIONS[2].value);
  const [filters, setFilters] = useState<FilterOption[]>([]);

  const fetchProducts = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setPage(1);
        setHasMore(true);
      }

      if (!hasMore && !isRefreshing) return;

      setLoading(true);
      // Map frontend sort option to backend
      let sort = 'createdAt';
      let order: 'ASC' | 'DESC' = 'DESC';
      switch (sortBy as string) {
        case 'price_asc':
          sort = 'price'; order = 'ASC'; break;
        case 'price_desc':
          sort = 'price'; order = 'DESC'; break;
        case 'created_at_asc':
          sort = 'createdAt'; order = 'ASC'; break;
        case 'created_at_desc':
          sort = 'createdAt'; order = 'DESC'; break;
        case 'rating_desc':
          sort = 'rating'; order = 'DESC'; break;
        default:
          sort = 'createdAt'; order = 'DESC';
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
        isOutOfStock: product.isOutOfStock ?? product.is_out_of_stock,
        isActive: product.isActive ?? product.is_active,
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
  };

  const handleSort = (sortOption: string) => {
    setSelectedSort(sortOption);
    setSortBy(sortOption as string);
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
    setSortBy(sort as string);
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
    <View style={styles.header}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              sortBy === SORT_OPTIONS[0].value && styles.filterButtonActive,
            ]}
            onPress={() => handleSortChange(SORT_OPTIONS[0].value)}
          >
            <Text style={styles.filterButtonText}>Price: Low to High</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              sortBy === SORT_OPTIONS[1].value && styles.filterButtonActive,
            ]}
            onPress={() => handleSortChange(SORT_OPTIONS[1].value)}
          >
            <Text style={styles.filterButtonText}>Price: High to Low</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filters.includes(FILTER_OPTIONS[0].value) && styles.filterButtonActive,
            ]}
            onPress={() => handleFilterToggle(FILTER_OPTIONS[0].value)}
          >
            <Text style={styles.filterButtonText}>In Stock</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filters.includes(FILTER_OPTIONS[1].value) && styles.filterButtonActive,
            ]}
            onPress={() => handleFilterToggle(FILTER_OPTIONS[1].value)}
          >
            <Text style={styles.filterButtonText}>On Sale</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
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
            />
          )}
          keyExtractor={(item) => item.id}
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
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
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
    fontSize: 16,
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
    fontSize: 16,
    color: '#333333',
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

export default ProductsScreen; 