import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  TextInput,
  ActivityIndicator,
  Image,
  FlatList,
  Keyboard,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from 'axios';
import { API_URL } from './config';

const { width } = Dimensions.get('window');

const CATEGORY_ICONS = {
  groceries: <Ionicons name="cart" size={40} color="#00A86B" />,
  cosmetics: <Ionicons name="color-palette" size={40} color="#E91E63" />,
  dairy: <MaterialCommunityIcons name="cow" size={40} color="#FFB300" />,
  bakery: <MaterialCommunityIcons name="bread-slice" size={40} color="#A0522D" />,
};

const MAIN_CATEGORIES = [
  { key: 'groceries', label: 'Groceries', icon: CATEGORY_ICONS.groceries },
  { key: 'cosmetics', label: 'Cosmetics', icon: CATEGORY_ICONS.cosmetics },
  { key: 'dairy', label: 'Dairy', icon: CATEGORY_ICONS.dairy },
  { key: 'bakery', label: 'Bakery', icon: CATEGORY_ICONS.bakery },
];

const CategoriesScreen = () => {
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [categorySuggestions, setCategorySuggestions] = useState<any[]>([]);
  const [productSuggestions, setProductSuggestions] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Fetch suggestions as user types
  useEffect(() => {
    if (search.trim().length === 0) {
      setCategorySuggestions([]);
      setProductSuggestions([]);
      return;
    }
    const fetchSuggestions = async () => {
      setSearching(true);
      try {
        // Fetch categories
        const catRes = await axios.get(`${API_URL}/categories`);
        const cats = catRes.data.categories || catRes.data || [];
        setCategorySuggestions(
          cats.filter((c: any) => c.name.toLowerCase().startsWith(search.toLowerCase()))
        );
        // Fetch products
        const prodRes = await axios.get(`${API_URL}/products`, {
          params: { q: search, limit: 4 }
        });
        setProductSuggestions(prodRes.data.products?.slice(0, 4) || []);
      } catch (err) {
        setCategorySuggestions([]);
        setProductSuggestions([]);
      } finally {
        setSearching(false);
      }
    };
    const timeout = setTimeout(fetchSuggestions, 200);
    return () => clearTimeout(timeout);
  }, [search]);

  // Fetch featured products for selected category
  useEffect(() => {
    if (!selectedCategory) {
      setFeaturedProducts([]);
      return;
    }
    const fetchFeatured = async () => {
      setLoadingFeatured(true);
      try {
        const prodRes = await axios.get(`${API_URL}/products`, {
          params: { category: selectedCategory, limit: 8 }
        });
        setFeaturedProducts(prodRes.data.products || []);
      } catch (err) {
        setFeaturedProducts([]);
      } finally {
        setLoadingFeatured(false);
      }
    };
    fetchFeatured();
  }, [selectedCategory]);

  const handleCategoryPress = (categoryKey: string) => {
    setSelectedCategory(categoryKey);
  };

  const handleProductPress = (productId: string) => {
    router.push({ pathname: '/product/[id]', params: { id: productId } } as any);
  };

  const handleSuggestionCategoryPress = (cat: any) => {
    setSearch('');
    setSelectedCategory(cat.name.toLowerCase());
  };

  const handleSuggestionProductPress = (prod: any) => {
    setSearch('');
    handleProductPress(prod.id);
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}> 
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Categories</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <Ionicons name="search" size={20} color="#888" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search categories or products..."
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          onSubmitEditing={Keyboard.dismiss}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={20} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      {/* Dropdown Suggestions */}
      {search.trim().length > 0 && (
        <View style={styles.dropdownSuggestions}>
          {searching && <ActivityIndicator size="small" color="#00A86B" style={{ marginVertical: 8 }} />}
          {/* Category Suggestions */}
          {categorySuggestions.map((cat: any) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.dropdownItem}
              onPress={() => handleSuggestionCategoryPress(cat)}
            >
              <Ionicons name="grid" size={22} color="#00A86B" style={{ marginRight: 10 }} />
              <View>
                <Text style={styles.dropdownText}>{cat.name}</Text>
                <Text style={styles.dropdownSubText}>in Categories</Text>
              </View>
            </TouchableOpacity>
          ))}
          {/* Product Suggestions */}
          {productSuggestions.map((prod: any) => (
            <TouchableOpacity
              key={prod.id}
              style={styles.dropdownItem}
              onPress={() => handleSuggestionProductPress(prod)}
            >
              {prod.images && prod.images[0] ? (
                <Image source={{ uri: prod.images[0] }} style={styles.dropdownImage} />
              ) : (
                <Ionicons name="cube" size={22} color="#FF6B35" style={{ marginRight: 10 }} />
              )}
              <Text style={styles.dropdownText}>{prod.name}</Text>
            </TouchableOpacity>
          ))}
          {categorySuggestions.length === 0 && productSuggestions.length === 0 && !searching && (
            <Text style={styles.noResultsText}>No results found.</Text>
          )}
        </View>
      )}

      {/* Main Categories Grid (icons only, no pills, no highlight, no sidebar) */}
      <View style={styles.categoriesGridIconsOnly}>
        {MAIN_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={styles.categoryIconCard}
            onPress={() => handleCategoryPress(cat.key)}
          >
            <View style={styles.categoryIconContainer}>{cat.icon}</View>
            <Text style={styles.categoryName}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Featured Products for Selected Category */}
      {selectedCategory && (
        <View style={styles.featuredProductsSection}>
          <Text style={styles.featuredTitle}>Featured in {MAIN_CATEGORIES.find(c => c.key === selectedCategory)?.label}</Text>
          {loadingFeatured ? (
            <ActivityIndicator size="large" color="#00A86B" style={{ marginVertical: 24 }} />
          ) : featuredProducts.length > 0 ? (
            <FlatList
              data={featuredProducts}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.productCard} onPress={() => handleProductPress(item.id)}>
                  <Image source={{ uri: item.images?.[0] || 'https://via.placeholder.com/100' }} style={styles.productImage} />
                  <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.productPrice}>₹{item.price}</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={{ paddingHorizontal: 8 }}
            />
          ) : (
            <Text style={styles.noResultsText}>No featured products found.</Text>
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  dropdownSuggestions: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    borderRadius: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    zIndex: 100,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownSubText: {
    fontSize: 12,
    color: '#888',
  },
  dropdownImage: {
    width: 32,
    height: 32,
    borderRadius: 6,
    marginRight: 10,
    backgroundColor: '#F3F4F6',
  },
  noResultsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginVertical: 8,
  },
  scrollView: {
    flex: 1,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: 8,
  },
  categoryCard: {
    width: (width - 64) / 2,
    backgroundColor: '#FFF',
    margin: 12,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedCategoryCard: {
    borderColor: '#00A86B',
    borderWidth: 2,
  },
  categoryIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  featuredProductsSection: {
    marginTop: 24,
    marginBottom: 24,
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 16,
    marginBottom: 12,
  },
  productCard: {
    width: 120,
    backgroundColor: '#FFF',
    marginRight: 12,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F3F4F6',
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 15,
    color: '#00A86B',
    fontWeight: 'bold',
  },
  categoriesGridIconsOnly: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  categoryIconCard: {
    width: 90,
    alignItems: 'center',
    margin: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedCategoryIconCard: {
    borderColor: '#00A86B',
    borderWidth: 2,
  },
});

export default CategoriesScreen; 