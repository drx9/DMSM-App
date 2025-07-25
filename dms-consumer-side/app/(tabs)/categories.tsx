import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Image,
  FlatList,
  Dimensions,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '../context/LanguageContext';
import categoryService, { Category } from '../../services/categoryService';
import productService, { Product } from '../../services/productService';
import ProductCard from '../../components/ProductCard';

const { width } = Dimensions.get('window');
const SUB_CATEGORY_CARD_MARGIN = 8;
const SUB_CATEGORY_CARD_WIDTH = (width - (16 * 2) - (SUB_CATEGORY_CARD_MARGIN * (3 - 1))) / 3;

const CategoriesScreen = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { t } = useLanguage();

  // Fetch categories
  useEffect(() => {
    setLoading(true);
    setError(null);
    categoryService.getCategories()
      .then((res) => {
        const topCategories = res.categories.filter((cat) => !cat.parentId);
        setCategories(topCategories);
        setFilteredCategories(topCategories);
        if (topCategories.length > 0) {
          setSelectedCategory(topCategories[0]);
        }
      })
      .catch((err) => {
        setError('Failed to load categories');
      })
      .finally(() => setLoading(false));
  }, []);

  // Fetch products
  useEffect(() => {
    let categoryId = selectedCategory?.id;
    if (categoryId) {
      setProductsLoading(true);
      setProductsError(null);
      productService.getProducts({ category: categoryId })
        .then((res) => {
          setProducts(res.products);
          setFilteredProducts(res.products);
        })
        .catch(() => setProductsError('Failed to load products'))
        .finally(() => setProductsLoading(false));
    } else {
      setProducts([]);
      setFilteredProducts([]);
    }
  }, [selectedCategory]);

  // Search filtering
  useEffect(() => {
    if (!searchQuery) {
      setFilteredCategories(categories);
      setFilteredProducts(products);
      return;
    }
    const q = searchQuery.toLowerCase();
    setFilteredCategories(categories.filter(cat => cat.name.toLowerCase().includes(q)));
    setFilteredProducts(products.filter(prod => prod.name.toLowerCase().includes(q)));
  }, [searchQuery, categories, products]);

  // Quick Actions
  const quickActions = [
    { icon: 'flash-outline' as const, label: 'Flash Sale', color: '#FF6B6B', action: () => filterByQuickAction('flash') },
    { icon: 'gift-outline' as const, label: 'Offers', color: '#4ECDC4', action: () => filterByQuickAction('offer') },
    { icon: 'heart-outline' as const, label: 'Wishlist', color: '#FF8A80', action: () => router.push('/wishlist') },
    { icon: 'star-outline' as const, label: 'Top Rated', color: '#FFD93D', action: () => filterByQuickAction('top') },
  ];

  function filterByQuickAction(type: string) {
    if (type === 'flash') {
      setFilteredProducts(products.filter(p => p.discount && p.discount > 0));
    } else if (type === 'offer') {
      setFilteredProducts(products.filter(p => p.discount && p.discount > 10));
    } else if (type === 'top') {
      setFilteredProducts(products.filter(p => (p.rating || 0) >= 4.5));
    }
  }

  return (
    <SafeAreaView style={[styles.container, { flex: 1, paddingTop: 16 }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Categories</Text>
        <Text style={styles.headerSubtitle}>Discover amazing products</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#10B981" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search categories, subcategories & products"
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* Quick Actions removed as requested */}

      <View style={styles.contentContainer}>
        {/* Left Side: Main Categories List */}
        <View style={styles.mainCategoryContainer}>
          <ScrollView style={styles.mainCategoryList} showsVerticalScrollIndicator={false}>
            {filteredCategories.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="folder-open" size={36} color="#D1D5DB" />
                <Text style={styles.emptyText}>No categories found</Text>
              </View>
            ) : (
              filteredCategories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.mainCategoryItem,
                    selectedCategory?.id === category.id && styles.mainCategoryItemActive,
                    { borderRadius: 12, marginVertical: 4, borderWidth: selectedCategory?.id === category.id ? 2 : 1, borderColor: selectedCategory?.id === category.id ? '#10B981' : '#F3F4F6', backgroundColor: selectedCategory?.id === category.id ? '#F0FDF4' : '#F9FAFB' }
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <View style={styles.mainCategoryContent}>
                    <Text
                      style={[
                        styles.mainCategoryText,
                        selectedCategory?.id === category.id && styles.mainCategoryTextActive,
                        { fontSize: 15 }
                      ]}
                    >
                      {category.name}
                    </Text>
                    {selectedCategory?.id === category.id && (
                      <View style={styles.activeIndicator} />
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>

        {/* Subcategories section removed as requested */}
      </View>

      {/* Products Section */}
      <View style={styles.productsSection}>
        <View style={styles.productsSectionHeader}>
          <Text style={styles.productsHeader}>Featured Products</Text>
          <TouchableOpacity style={styles.viewAllButton} onPress={() => router.push('/products')}>
            <Text style={styles.viewAllText}>View All</Text>
            <Ionicons name="chevron-forward" size={16} color="#10B981" />
          </TouchableOpacity>
        </View>

        {productsLoading ? (
          <View style={styles.productsLoading}>
            <Text style={styles.loadingText}>Loading products...</Text>
          </View>
        ) : productsError ? (
          <View style={styles.productsError}>
            <Text style={styles.errorText}>{productsError}</Text>
          </View>
        ) : filteredProducts.length === 0 ? (
          <View style={styles.noProductsContainer}>
            <Ionicons name="cube" size={48} color="#D1D5DB" />
            <Text style={styles.noProductsText}>No products found</Text>
          </View>
        ) : (
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <ProductCard
                id={item.id}
                name={item.name}
                price={item.price}
                image={item.images?.[0] || ''}
                rating={item.rating || 4.5}
                reviewCount={item.reviewCount || 0}
                discount={item.discount}
                isOutOfStock={item.isOutOfStock}
              />
            )}
            contentContainerStyle={styles.productsListContent}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '500',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  quickActionsContainer: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 16,
  },
  quickActionsList: {
    paddingHorizontal: 20,
  },
  quickActionItem: {
    alignItems: 'center',
    marginRight: 24,
  },
  quickActionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 8,
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
  },
  mainCategoryContainer: {
    width: 140,
    backgroundColor: '#F9FAFB',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  mainCategoryList: {
    flex: 1,
  },
  mainCategoryItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  mainCategoryItemActive: {
    backgroundColor: '#FFFFFF',
    borderRightWidth: 4,
    borderRightColor: '#10B981',
  },
  mainCategoryContent: {
    alignItems: 'center',
  },
  mainCategoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  mainCategoryTextActive: {
    color: '#10B981',
    fontWeight: '700',
  },
  activeIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginTop: 6,
  },
  subCategoryGridContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  subCategoryListContent: {
    paddingBottom: 16,
  },
  subCategoryCard: {
    width: SUB_CATEGORY_CARD_WIDTH,
    marginHorizontal: SUB_CATEGORY_CARD_MARGIN / 2,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  subCategoryCardActive: {
    borderColor: '#10B981',
    borderWidth: 2,
    backgroundColor: '#F0FDF4',
  },
  subCategoryImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  subCategoryImage: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  subCategoryName: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    color: '#374151',
    lineHeight: 14,
  },
  subCategoryActiveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingSpinner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 24,
  },
  loadingLabel: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '500',
  },
  noCategorySelected: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noCategoryText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '500',
  },
  productsSection: {
    backgroundColor: '#FFFFFF',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  productsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  productsHeader: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    marginRight: 4,
  },
  productsLoading: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  productsError: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  noProductsContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  noProductsText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 12,
    fontWeight: '500',
  },
  productsListContent: {
    paddingRight: 20,
  },
});

export default CategoriesScreen;