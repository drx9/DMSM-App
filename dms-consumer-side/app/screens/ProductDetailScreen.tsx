import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config';
import ProductCard from '../../components/ProductCard';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { addToWishlist, removeFromWishlist } from '../services/wishlistService';
import Toast from 'react-native-root-toast';
import ProductImageSlider from '../../components/ProductImageSlider';
import AddressManagerModal from '../../components/AddressManagerModal';
import SearchWithFilters from '../../components/SearchWithFilters';
import CartIconWithBadge from '../../components/CartIconWithBadge';

const FREE_DELIVERY_THRESHOLD = 399; // Example value, adjust as needed

interface Variant {
  id: string;
  name: string;
  price: number;
  discount: number;
  stock: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discount: number;
  stock: number;
  images: string[];
  rating: number;
  reviewCount: number;
  isOutOfStock: boolean;
  details?: {
    packOf?: string;
    brand?: string;
    modelName?: string;
    type?: string;
    quantity?: string;
    shelfLife?: string;
    foodPreference?: string;
    flavour?: string;
  };
}

const ProductDetailScreen = () => {
  const { t } = useLanguage();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [cartTotal, setCartTotal] = useState(0);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [boughtTogether, setBoughtTogether] = useState<Product[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const { addToCart } = useCart();
  const { wishlistIds, add, remove, fetchWishlist } = useWishlist();
  const [wishloading, setWishLoading] = useState(false);
  const [wishError, setWishError] = useState<string | null>(null);
  const [localWish, setLocalWish] = useState<string[]>([]);
  const [address, setAddress] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [addressLoading, setAddressLoading] = useState(true);
  const [showAddressModal, setShowAddressModal] = useState(false);

  // Add state for search and filters (to match products.tsx)
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'rating_desc' | 'newest'>('name_asc');
  const [filterBy, setFilterBy] = useState<'all' | 'in_stock' | 'on_sale' | 'new_arrivals'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchProductDetails();
    fetchCartTotal();
    fetchCartCount();
    fetchUserAddresses();
  }, [id]);

  useEffect(() => {
    if (product && wishlistIds) {
      setLocalWish(wishlistIds);
    }
  }, [wishlistIds, product]);

  const fetchProductDetails = async () => {
    try {
      const res = await axios.get(`${API_URL}/products/${id}/details`);
      setProduct(res.data.product);
      setVariants(res.data.variants);
      setSelectedVariant(res.data.variants[0] || null);
      setSimilarProducts(res.data.similarProducts);
      setBoughtTogether(res.data.boughtTogether);
    } catch (err) {
      Alert.alert('Error', 'Failed to load product details');
    }
  };

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

  const fetchCartCount = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;
      const res = await axios.get(`${API_URL}/cart/count/${userId}`);
      setCartCount(res.data.count || 0);
    } catch (err) {
      setCartCount(0);
    }
  };

  const handleAddToCart = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Error', 'Please log in to add items to your cart.');
        return;
      }
      await axios.post(`${API_URL}/cart`, {
        userId,
        productId: product!.id,
        quantity,
      });
      Alert.alert('Success', 'Product added to cart');
      fetchCartTotal();
      fetchCartCount();
    } catch (error) {
      Alert.alert('Error', 'Failed to add product to cart');
    }
  };

  const handleBuyNow = async () => {
    const buyNowItem = {
      id: selectedVariant ? selectedVariant.id : product!.id,
      name: product!.name + (selectedVariant ? ` (${selectedVariant.name})` : ''),
      price: selectedVariant ? selectedVariant.price : product!.price,
      quantity,
      image: product!.images?.[0] || '',
      originalPrice: selectedVariant ? selectedVariant.price : product!.price, // Use actual price as MRP
      discount: selectedVariant ? selectedVariant.discount : product!.discount,
    };
    router.push({ pathname: '/checkout', params: { buyNow: JSON.stringify(buyNowItem) } });
  };

  const renderStars = (rating: number) => (
    <View style={styles.starsContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= rating ? 'star' : 'star-outline'}
          size={14}
          color="#4CAF50"
        />
      ))}
    </View>
  );

  // Add this before the return statement
  const detailsFields = [
    { key: 'packOf', label: 'Pack of' },
    { key: 'brand', label: 'Brand' },
    { key: 'modelName', label: 'Model Name' },
    { key: 'type', label: 'Type' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'shelfLife', label: 'Maximum Shelf Life' },
    { key: 'foodPreference', label: 'Food Preference' },
    { key: 'flavour', label: 'Flavour' },
  ];

  const isWishlisted = product && localWish.includes(product.id);
  const handleToggleWishlist = async () => {
    if (!product) return;
    setWishLoading(true);
    setWishError(null);
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Toast.show('Please login to use wishlist', { duration: 1500 });
        setWishLoading(false);
        return;
      }
      if (isWishlisted) {
        await removeFromWishlist(userId, product.id);
        setLocalWish((prev) => prev.filter(pid => pid !== product.id));
        remove(product.id);
      } else {
        await addToWishlist(userId, product.id);
        setLocalWish((prev) => [...prev, product.id]);
        add(product.id, product);
      }
      await fetchWishlist();
      console.log('Wishlist updated');
    } catch (err: any) {
      setWishError(err.message || 'Failed to update wishlist');
      Toast.show('Failed to update wishlist', { duration: 1500 });
    } finally {
      setWishLoading(false);
    }
  };

  const fetchUserAddresses = async () => {
    setAddressLoading(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        setAddresses([]);
        setAddress(null);
        setAddressLoading(false);
        return;
      }
      const res = await axios.get(`${API_URL}/addresses/${userId}`);
      setAddresses(res.data);
      // Find default/primary address
      const primary = res.data.find((a: any) => a.isDefault) || res.data[0] || null;
      setAddress(primary);
    } catch (err) {
      setAddresses([]);
      setAddress(null);
    } finally {
      setAddressLoading(false);
    }
  };

  const handleSetPrimaryAddress = async (id: string) => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;
      await axios.patch(`${API_URL}/addresses/${id}/set-primary`, { userId });
      await fetchUserAddresses();
      setShowAddressModal(false);
    } catch (err) {}
  };

  // --- UI ---
  if (!product) return <View style={styles.loading}><Text>Loading...</Text></View>;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Search and Cart */}
      <View style={{ zIndex: 10, backgroundColor: '#fff' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 8 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4, marginRight: 8 }}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          {/* Sleek Search Bar: no sort/filter/category, just a pressable input */}
          <TouchableOpacity
            style={{ flex: 1, height: 36, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', borderRadius: 18, paddingHorizontal: 12, marginRight: 8, borderWidth: 1, borderColor: '#eee' }}
            activeOpacity={0.85}
            onPress={() => router.push('/products')}
          >
            <Ionicons name="search" size={18} color="#666" style={{ marginRight: 6 }} />
            <Text style={{ color: '#999', fontSize: 15, flex: 1 }}>Search products...</Text>
          </TouchableOpacity>
          <CartIconWithBadge onPress={() => router.push('/(tabs)/cart')} />
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Product Image Slider */}
        <View style={styles.imageContainer}>
          <ProductImageSlider images={Array.isArray(product?.images) ? product.images : []} />
          {/* Heart/Wishlist Icon */}
          <TouchableOpacity
            style={{ position: 'absolute', top: 16, right: 16, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 20, padding: 8 }}
            onPress={handleToggleWishlist}
            disabled={wishloading}
          >
            {wishloading ? (
              <ActivityIndicator size={20} color={isWishlisted ? '#CB202D' : '#888'} />
            ) : (
              <Ionicons
                name={isWishlisted ? 'heart' : 'heart-outline'}
                size={28}
                color={isWishlisted ? '#CB202D' : '#888'}
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product?.name ?? 'No Name'}</Text>
          <Text style={styles.discountBadge}>{selectedVariant?.discount ?? product?.discount ?? 0}% off</Text>

          <View style={styles.priceRow}>
            <View style={styles.priceSection}>
              <View style={styles.priceTag}>
                <Text style={styles.priceLabel}>Kilos</Text>
                <Text style={styles.price}>
                  ₹{selectedVariant
                    ? (Number(selectedVariant.price) - (Number(selectedVariant.price) * Number(selectedVariant.discount) / 100)).toFixed(2)
                    : (Number(product?.price) - (Number(product?.price) * Number(product?.discount) / 100)).toFixed(2)}
                </Text>
              </View>
              {((selectedVariant && (selectedVariant.discount ?? 0) > 0) || (!selectedVariant && (product?.discount ?? 0) > 0)) && (
                <>
                  <Text style={styles.mrpLabel}>MRP</Text>
                  <Text style={styles.originalPrice}>
                    ₹{selectedVariant ? Number(selectedVariant.price || 0).toFixed(2) : Number(product?.price || 0).toFixed(2)}
                  </Text>
                </>
              )}
            </View>
            <TouchableOpacity style={styles.addButton} onPress={handleAddToCart}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Free Delivery Progress */}
        {cartTotal < FREE_DELIVERY_THRESHOLD && (
          <View style={styles.deliverySection}>
            <Text style={styles.deliveryText}>
              Add ₹{FREE_DELIVERY_THRESHOLD - cartTotal} for FREE delivery
            </Text>
            <TouchableOpacity>
              <Ionicons name="chevron-up" size={20} color="#333" />
            </TouchableOpacity>
          </View>
        )}

        {/* Expiry and Social Proof */}
        <View style={styles.infoCard}>
          <Text style={styles.expiryTitle}>Expiry Date 31 Dec 2025</Text>
          <Text style={styles.manufactureDate}>Manufactured date 01 Apr 2025</Text>
        </View>

        <View style={styles.socialProof}>
          <Ionicons name="trending-up" size={16} color="#4CAF50" />
          <Text style={styles.socialProofText}>3,000+ people ordered this in the last 15 days</Text>
        </View>

        {/* Variant Selection */}
        {variants.length > 0 && (
          <View style={styles.variantsSection}>
            <Text style={styles.sectionTitle}>Select Variant</Text>
            {variants.map((variant, index) => {
              const salePrice = variant.price - (variant.price * variant.discount) / 100;
              return (
                <TouchableOpacity
                  key={variant.id}
                  style={[
                    styles.variantCard,
                    selectedVariant?.id === variant.id && styles.selectedVariantCard
                  ]}
                  onPress={() => setSelectedVariant(variant)}
                >
                  <View style={styles.variantLeft}>
                    <View style={[styles.radioButton, selectedVariant?.id === variant.id && styles.selectedRadio]}>
                      {selectedVariant?.id === variant.id && <View style={styles.radioInner} />}
                    </View>
                    <View>
                      <Text style={styles.discountText}>{variant.discount}% off</Text>
                      <View style={styles.variantPriceContainer}>
                        <View style={styles.priceTag}>
                          <Text style={styles.priceLabel}>Kilos</Text>
                          <Text style={styles.variantPrice}>₹{(Number(salePrice) || 0).toFixed(2)}</Text>
                        </View>
                        {variant.discount > 0 && (
                          <>
                            <Text style={styles.mrpLabel}>MRP</Text>
                            <Text style={styles.variantOriginalPrice}>₹{Number(variant.price || 0).toFixed(2)}</Text>
                          </>
                        )}
                      </View>
                      <Text style={styles.paymentOption}>Or Pay ₹{Math.round(salePrice * 0.9)} + ⚡{Math.round(salePrice * 0.1)}</Text>
                    </View>
                  </View>
                  <View style={styles.variantRight}>
                    <Text style={styles.variantWeight}>{variant.name}</Text>
                    <Text style={styles.variantRate}>@ ₹{(Number(salePrice) / parseFloat(variant.name.replace(/\D/g, '')) * 250 || 0).toFixed(1)}/250g</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Offers Section */}
        <View style={styles.offersSection}>
          <View style={styles.offerItem}>
            <View style={styles.offerIcon}>
              <Ionicons name="pricetag" size={16} color="#4CAF50" />
            </View>
            <Text style={styles.offerText}>Buy More, Save More: Buy worth ₹499 save 10% (Minimum 2 items)</Text>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </View>

          <View style={styles.offerItem}>
            <View style={styles.offerIcon}>
              <Ionicons name="card" size={16} color="#4CAF50" />
            </View>
            <View style={styles.offerTextContainer}>
              <Text style={styles.offerText}>Bank Offer: 100% Cashback upto 500Rs on Axis Bank SuperMoney Rupay CC UPI transactions on super.money UPI</Text>
              <Text style={styles.termsText}>T&C</Text>
            </View>
          </View>

          <View style={styles.offerItem}>
            <View style={styles.offerIcon}>
              <Ionicons name="card" size={16} color="#4CAF50" />
            </View>
            <View style={styles.offerTextContainer}>
              <Text style={styles.offerText}>Bank Offer: 5% cashback on DMSM Axis Bank Credit Card upto ₹4,000 per statement quarter</Text>
              <Text style={styles.termsText}>T&C</Text>
            </View>
          </View>

          <View style={styles.offerItem}>
            <View style={styles.offerIcon}>
              <Ionicons name="card" size={16} color="#4CAF50" />
            </View>
            <View style={styles.offerTextContainer}>
              <Text style={styles.offerText}>Bank Offer: 5% cashback on Axis Bank DMSM Debit Card upto ₹750</Text>
              <Text style={styles.termsText}>T&C</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.moreOffers}>
            <Text style={styles.moreOffersText}>+ 1 more offer</Text>
          </TouchableOpacity>
        </View>

        {/* Product Details */}
        <View style={styles.productDetails}>
          <Text style={styles.sectionTitle}>Product Details</Text>
          <View style={styles.detailsGrid}>
            {detailsFields.map(field => (
              <View style={styles.detailRow} key={field.key}>
                <Text style={styles.detailLabel}>{field.label}</Text>
                <Text style={styles.detailValue}>{product!.details && (product!.details as any)[field.key] ? (product!.details as any)[field.key] : ''}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Similar Products */}
        <View style={styles.similarSection}>
          <Text style={styles.sectionTitle}>Similar Products</Text>
          <FlatList
            data={similarProducts}
            horizontal
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <ProductCard id={item.id} name={item.name ?? 'No Name'} price={item.price ?? 0} image={Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : 'https://via.placeholder.com/150?text=No+Image'} rating={item.rating ?? 0} reviewCount={item.reviewCount ?? 0} discount={item.discount ?? 0} isOutOfStock={item.isOutOfStock ?? false} onPress={() => router.push(`/product/${item.id}`)} onAddToCart={() => addToCart(item.id)} />
            )}
            showsHorizontalScrollIndicator={false}
          />
        </View>

        {/* Delivery Info (below similar products) */}
        <View style={styles.deliveryInfo}>
          <View style={styles.deliveryAddress}>
            {addressLoading ? (
              <Text style={styles.deliveryLabel}>Loading address...</Text>
            ) : address ? (
              <Text style={styles.deliveryLabel}>
                Deliver to: <Text style={styles.deliveryName}>{address.line1}, {address.postalCode}</Text> HOME
              </Text>
            ) : (
              <Text style={styles.deliveryLabel}>No address set</Text>
            )}
            <TouchableOpacity onPress={() => setShowAddressModal(true)}>
              <Text style={styles.changeButton}>Change</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.deliveryFullAddress}>{address ? `${address.line1}, ${address.city}, ${address.state}` : ''}</Text>

          <View style={styles.sellerInfo}>
            <Text style={styles.sellerText}>Sold by <Text style={styles.sellerName}>Dhunumunu supermarket</Text></Text>
            <View style={styles.ratingContainer}>
              <Text style={styles.rating}>4.8</Text>
              <Ionicons name="star" size={12} color="#4CAF50" />
            </View>
          </View>

          <Text style={styles.deliveryDate}>Delivery by</Text>
          <Text style={styles.deliveryDateValue}>27 Jun, Friday</Text>

          <View style={styles.deliveryFeatures}>
            <Text style={styles.featureText}>• Schedule Your Delivery</Text>
            <Text style={styles.featureText}>• Cash on Delivery</Text>
            <Text style={styles.featureText}>• Easy Doorstep Return</Text>
          </View>

          <TouchableOpacity>
            <Text style={styles.viewDetailsButton}>View Details</Text>
          </TouchableOpacity>
        </View>

        {/* Bought Together */}
        <View style={styles.similarSection}>
          <Text style={styles.sectionTitle}>Bought Together</Text>
          <FlatList
            data={boughtTogether}
            horizontal
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <ProductCard id={item.id} name={item.name ?? 'No Name'} price={item.price ?? 0} image={Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : 'https://via.placeholder.com/150?text=No+Image'} rating={item.rating ?? 0} reviewCount={item.reviewCount ?? 0} discount={item.discount ?? 0} isOutOfStock={item.isOutOfStock ?? false} onPress={() => router.push(`/product/${item.id}`)} onAddToCart={() => addToCart(item.id)} />
            )}
            showsHorizontalScrollIndicator={false}
          />
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Delivery Bar with Free Delivery and Buttons in one line */}
      <View style={styles.bottomDeliveryBar}>
        {cartTotal < FREE_DELIVERY_THRESHOLD ? (
          <View style={styles.deliveryProgressContainer}>
            <Text style={styles.bottomDeliveryText}>
              Add ₹{FREE_DELIVERY_THRESHOLD - cartTotal} for FREE delivery
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min((cartTotal / FREE_DELIVERY_THRESHOLD) * 100, 100)}%` }
                ]}
              />
            </View>
          </View>
        ) : (
          <View style={styles.deliveryProgressContainer}>
            <Text style={styles.bottomDeliveryText}>
              🎉 You have FREE delivery!
            </Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.addToCartButton}
            onPress={handleAddToCart}
            activeOpacity={0.8}
          >
            <Text style={styles.addToCartButtonText}>Add to Cart</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.buyNowButton}
            onPress={handleBuyNow}
            activeOpacity={0.9}
          >
            <Text style={styles.buyNowButtonText}>Buy Now</Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* Address Manager Modal */}
      <AddressManagerModal
        visible={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        addresses={addresses}
        onSetPrimary={handleSetPrimaryAddress}
        onAdd={async (addr) => {
          const userId = await AsyncStorage.getItem('userId');
          if (!userId) return;
          await axios.post(`${API_URL}/addresses`, { ...addr, userId });
          await fetchUserAddresses();
        }}
        onEdit={async (id, addr) => {
          await axios.put(`${API_URL}/addresses/${id}`, addr);
          await fetchUserAddresses();
        }}
        onDelete={async (id) => {
          await axios.delete(`${API_URL}/addresses/${id}`);
          await fetchUserAddresses();
        }}
        loading={addressLoading}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 4,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchPlaceholder: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  cartIconWrap: {
    position: 'relative',
    padding: 4,
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  scrollContainer: {
    flex: 1,
  },
  imageContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    alignItems: 'center',
  },
  productImage: {
    width: 280,
    height: 200,
    resizeMode: 'contain',
    marginBottom: 16,
  },
  imageDots: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 2,
  },
  activeDot: {
    backgroundColor: '#4CAF50',
  },
  productInfo: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  discountBadge: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceTag: {
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  priceLabel: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  price: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  mrpLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 4,
  },
  originalPrice: {
    fontSize: 12,
    color: '#666',
    textDecorationLine: 'line-through',
  },
  addButton: {
    borderWidth: 1,
    borderColor: '#8B4513',
    borderRadius: 4,
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  addButtonText: {
    color: '#8B4513',
    fontSize: 14,
    fontWeight: '600',
  },
  deliverySection: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  deliveryText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 8,
  },
  expiryTitle: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    marginBottom: 4,
  },
  manufactureDate: {
    fontSize: 12,
    color: '#666',
  },
  socialProof: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
  },
  socialProofText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    fontWeight: '500',
  },
  starsContainer: {
    flexDirection: 'row',
  },
  variantsSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  variantCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  selectedVariantCard: {
    borderColor: '#4CAF50',
    backgroundColor: '#FFFFFF',
  },
  variantLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedRadio: {
    borderColor: '#4CAF50',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
  },
  discountText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 4,
  },
  variantPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  variantPrice: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  variantOriginalPrice: {
    fontSize: 12,
    color: '#666',
    textDecorationLine: 'line-through',
  },
  paymentOption: {
    fontSize: 12,
    color: '#666',
  },
  variantRight: {
    alignItems: 'flex-end',
  },
  variantWeight: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    marginBottom: 4,
  },
  variantRate: {
    fontSize: 12,
    color: '#666',
  },
  offersSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 8,
  },
  offerItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  offerIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  offerTextContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  offerText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    lineHeight: 20,
  },
  termsText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
    marginLeft: 8,
  },
  moreOffers: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  moreOffersText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  productDetails: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 8,
  },
  detailsGrid: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
  },
  similarSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 8,
  },
  deliveryInfo: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 8,
  },
  deliveryAddress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  deliveryLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  deliveryName: {
    fontWeight: '600',
  },
  changeButton: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  deliveryFullAddress: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
  },
  sellerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sellerText: {
    fontSize: 14,
    color: '#333',
  },
  sellerName: {
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  rating: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginRight: 4,
  },
  deliveryDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  deliveryDateValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    marginBottom: 16,
  },
  deliveryFeatures: {
    marginBottom: 16,
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  viewDetailsButton: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 80,
  },

  bottomDeliveryBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  deliveryProgressContainer: {
    marginBottom: 12,
  },
  bottomDeliveryText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  addToCartButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderColor: '#CB202D',
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#CB202D',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  addToCartButtonText: {
    color: '#CB202D',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  buyNowButton: {
    flex: 1,
    backgroundColor: '#CB202D',
    borderColor: '#CB202D',
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#CB202D',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buyNowButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default ProductDetailScreen;