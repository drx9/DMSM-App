import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  FlatList,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import { API_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';
import { useCart } from '../context/CartContext';

// Cart Item Interface
interface CartItem {
  id: number;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  weight?: string;
  originalPrice?: number;
  discount?: number;
  inStock: boolean;
  salePrice: number;
}

function getValidImageUrl(images: any): string {
  if (Array.isArray(images) && images.length > 0 && typeof images[0] === 'string' && images[0].startsWith('http')) {
    return images[0];
  }
  return 'https://via.placeholder.com/150?text=No+Image';
}

const CartScreen = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [outOfStockItems, setOutOfStockItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userAddress, setUserAddress] = useState<string>('');
  const router = useRouter();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { removeFromCart } = useCart();

  // Free delivery threshold
  const FREE_DELIVERY_THRESHOLD = 399;

  useFocusEffect(
    React.useCallback(() => {
      loadUserDataAndCart();
    }, [])
  );

  const loadUserDataAndCart = async () => {
    try {
      setLoading(true);
      const storedUserId = await AsyncStorage.getItem('userId');
      setUserId(storedUserId);

      if (storedUserId) {
        // Fetch user address
        await fetchUserAddress(storedUserId);
        // Fetch cart items
        await fetchCartItems(storedUserId);
      }
    } catch (error) {
      console.error('Failed to load user data and cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAddress = async (userId: string) => {
    try {
      const addrRes = await axios.get(`${API_URL}/addresses/${userId}`);
      const defaultAddr = addrRes.data.find((a: any) => a.isDefault) || addrRes.data[0];
      if (defaultAddr) {
        setUserAddress(`${defaultAddr.line1}, ${defaultAddr.city}, ${defaultAddr.state}, ${defaultAddr.pincode}`);
      }
    } catch (error) {
      console.error('Failed to fetch address:', error);
      setUserAddress('Railgate no 1, Chandmari, Tezpur, N..., 784001');
    }
  };

  const fetchCartItems = async (userId: string) => {
    try {
      const response = await axios.get(`${API_URL}/cart/${userId}`);
      const items = response.data.map((item: any) => {
        const prod = item.Product || item.product;
        const mrp = Number(prod?.price) || 0;
        const discount = Number(prod?.discount) || 0;
        const salePrice = mrp - (mrp * discount / 100);
        return {
          id: item.id,
          productId: item.productId?.toString() || prod?.id?.toString(),
          name: prod?.name || '',
          mrp,
          salePrice,
          discount,
          quantity: item.quantity,
          image: prod?.images?.[0] || '',
          inStock: prod?.stock > 0 && !prod?.isOutOfStock,
        };
      });

      // Separate in-stock and out-of-stock items
      const inStockItems = items.filter((item: any) => item.inStock);
      const outOfStockItems = items.filter((item: any) => !item.inStock);

      setCartItems(inStockItems);
      setOutOfStockItems(outOfStockItems);
    } catch (error) {
      console.error('Failed to fetch cart items:', error);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadUserDataAndCart().finally(() => setRefreshing(false));
  }, []);

  // Calculate the true MRP (original price) total
  const calculateMRPTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  // Subtotal (discounted price)
  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.salePrice * item.quantity), 0);
  };

  // Discount is the difference between MRP and subtotal
  const mrpTotal = calculateMRPTotal();
  const subtotal = calculateSubtotal();
  const savings = mrpTotal - subtotal;
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : 39;
  const platformFee = 9;
  const totalAmount = subtotal + deliveryFee + platformFee;

  const handleQuantityChange = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      // Update local state immediately for better UX
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.productId === productId ? { ...item, quantity: newQuantity } : item
        )
      );

      // Update on server
      if (userId) {
        await axios.put(`${API_URL}/cart/${userId}/${productId}`, {
          quantity: newQuantity
        });
      }
    } catch (error: any) {
      let message = 'Failed to update quantity.';
      if (error.response && error.response.data && typeof error.response.data.message === 'string') {
        if (error.response.data.message.toLowerCase().includes('stock')) {
          message = 'Not enough stock available.';
        }
      }
      Alert.alert('Error', message);
      // Revert on error
      fetchCartItems(userId!);
    }
  };

  const handleRemoveItem = async (productId: string) => {
    try {
      setCartItems(prevItems => prevItems.filter(item => item.productId !== productId));
      if (userId) {
        await axios.delete(`${API_URL}/cart/${userId}/${productId}`);
      }
      removeFromCart(productId);
    } catch (error) {
      console.error('Failed to remove item:', error);
      fetchCartItems(userId!);
    }
  };

  const handleRemoveOutOfStockItem = async (itemId: number) => {
    try {
      setOutOfStockItems(prevItems => prevItems.filter(item => item.id !== itemId));

      if (userId) {
        await axios.delete(`${API_URL}/cart/${userId}/${itemId}`);
      }
    } catch (error) {
      console.error('Failed to remove out of stock item:', error);
    }
  };

  const renderInStockItem = ({ item }: { item: any }) => (
    <Swipeable
      renderRightActions={() => (
        <TouchableOpacity
          style={styles.swipeRemoveButton}
          onPress={() => handleRemoveItem(item.productId)}
        >
          <Text style={styles.swipeRemoveText}>Remove</Text>
        </TouchableOpacity>
      )}
    >
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.productId } })}
        style={styles.cartItemCard}
      >
        <Image source={{ uri: getValidImageUrl(item.image ? [item.image] : []) }} style={styles.cartItemImage} />
        <View style={styles.cartItemDetails}>
          <Text style={styles.cartItemName} numberOfLines={2}>{item.name}</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.currentPrice}>₹{typeof item.salePrice === 'number' ? item.salePrice.toFixed(2) : 0}</Text>
            {item.discount > 0 && (
              <Text style={styles.originalPrice}>₹{typeof item.mrp === 'number' ? item.mrp.toFixed(2) : 0}</Text>
            )}
          </View>
        </View>
        <View style={styles.rightSection}>
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => {
                if (item.quantity === 1) {
                  handleRemoveItem(item.productId);
                } else {
                  handleQuantityChange(item.productId, item.quantity - 1);
                }
              }}
            >
              <Text style={styles.quantityButtonText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.quantityText}>{item.quantity}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleQuantityChange(item.productId, item.quantity + 1)}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveItem(item.productId)}
          >
            <Ionicons name="trash" size={18} color="#CB202D" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );

  const renderOutOfStockItem = ({ item }: { item: CartItem }) => (
    <View style={[styles.cartItemCard, styles.outOfStockCard]}>
      <Image source={{ uri: getValidImageUrl(item.image ? [item.image] : []) }} style={[styles.cartItemImage, styles.outOfStockImage]} />
      <View style={styles.cartItemDetails}>
        <Text style={styles.cartItemName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.cartItemWeight}>{item.weight}</Text>
        <Text style={styles.outOfStockText}>Out Of Stock</Text>
        <TouchableOpacity onPress={() => router.push('/products')}>
          <Text style={styles.findSimilarText}>Find similar item ›</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveOutOfStockItem(item.id)}
      >
        <Text style={styles.removeButtonText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Cart</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <View style={styles.tab}>
          <Text style={styles.tabText}>DMSM ({cartItems.length + outOfStockItems.length})</Text>
        </View>
      </View>

      {/* Address Section */}
      <View style={styles.addressSection}>
        <Text style={styles.deliverToText}>Deliver to: <Text style={styles.addressName}>Anis...</Text>, 784001</Text>
        <Text style={styles.addressDetails}>{userAddress}</Text>
        <TouchableOpacity style={styles.changeButton}>
          <Text style={styles.changeButtonText}>Change</Text>
        </TouchableOpacity>
      </View>

      {!userId ? (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>Please log in to view your cart.</Text>
        </View>
      ) : cartItems.length === 0 && outOfStockItems.length === 0 ? (
        <View style={styles.emptyCartContainer}>
          <Image
            source={{ uri: 'https://raw.githubusercontent.com/sujal02/Blinkit-Images/main/empty_cart.png' }}
            style={styles.emptyCartImage}
            resizeMode="contain"
          />
          <Text style={styles.emptyCartTitle}>Reordering will be easy</Text>
          <Text style={styles.emptyCartSubtitle}>
            Items you order will show up here so you can buy them again easily.
          </Text>
          <TouchableOpacity
            style={styles.startShoppingButton}
            onPress={() => router.replace('/')}
          >
            <Text style={styles.startShoppingButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Offers Section */}
          <View style={styles.offersContainer}>
            <View style={styles.offerBanner}>
              <Ionicons name="pricetag" size={20} color="#00A86B" />
              <Text style={styles.offerText}>Up to ₹100 Off on order above ₹499</Text>
            </View>

            <View style={styles.bankOfferBanner}>
              <Text style={styles.bankOfferText}>₹150 off on orders above ₹1,499</Text>
              <Text style={styles.bankOfferCondition}>*T&C apply</Text>
            </View>

            {savings > 0 && (
              <View style={styles.savingsBanner}>
                <Text style={styles.savingsText}>₹{Math.round(savings)} ({Math.round((savings / subtotal) * 100)}%) saved so far</Text>
              </View>
            )}

            <TouchableOpacity style={styles.viewAllOffers}>
              <Ionicons name="pricetag-outline" size={16} color="#00A86B" />
              <Text style={styles.viewAllOffersText}>View all offers</Text>
              <Ionicons name="chevron-forward" size={16} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Out of Stock Items */}
          {outOfStockItems.length > 0 && (
            <View>
              <View style={styles.outOfStockHeader}>
                <Text style={styles.outOfStockHeaderText}>
                  {outOfStockItems.length} items in your basket are out of stock
                </Text>
              </View>
              <FlatList
                data={outOfStockItems}
                renderItem={renderOutOfStockItem}
                keyExtractor={(item) => `out-${item.id.toString()}`}
                scrollEnabled={false}
              />
            </View>
          )}

          {/* In Stock Items */}
          {cartItems.length > 0 && (
            <FlatList
              data={cartItems}
              renderItem={renderInStockItem}
              keyExtractor={(item) => item.productId}
              scrollEnabled={false}
            />
          )}

          {/* Try it, Buy it Section */}
          <View style={styles.tryItSection}>
            <View style={styles.tryItHeader}>
              <View>
                <Text style={styles.tryItTitle}>Try it, Buy it!</Text>
                <Text style={styles.tryItSubtitle}>Samples for you</Text>
              </View>
              <Image
                source={{ uri: 'https://raw.githubusercontent.com/sujal02/Blinkit-Images/main/milk.png' }}
                style={styles.tryItIcon}
              />
            </View>

            <View style={styles.sampleCard}>
              <Image
                source={{ uri: 'https://raw.githubusercontent.com/sujal02/Blinkit-Images/main/milk.png' }}
                style={styles.sampleImage}
              />
              <View style={styles.sampleDetails}>
                <Text style={styles.sampleName}>Kwality Vanilla Ice Cream Mix 100 g at ₹20</Text>
                <View style={styles.samplePriceContainer}>
                  <Text style={styles.samplePrice}>₹20</Text>
                  <Text style={styles.sampleOriginalPrice}>60</Text>
                  <View style={styles.sampleDiscount}>
                    <Text style={styles.sampleDiscountText}>66% off</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.sampleAddButton}>
                  <Text style={styles.sampleAddText}>Add</Text>
                  <Ionicons name="add" size={16} color="#1976D2" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Bestsellers Section */}
          <View style={styles.bestsellerSection}>
            <View style={styles.bestsellerHeader}>
              <Text style={styles.bestsellerTitle}>🏆 Bestsellers in your City</Text>
              <Ionicons name="chevron-forward" size={20} color="#FF6B35" />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {[1, 2, 3].map((item) => (
                <View key={item} style={styles.bestsellerCard}>
                  <View style={styles.bestsellerDiscount}>
                    <Text style={styles.bestsellerDiscountText}>{20 + item * 5}% off</Text>
                  </View>
                  <Image
                    source={{ uri: 'https://raw.githubusercontent.com/sujal02/Blinkit-Images/main/potato.png' }}
                    style={styles.bestsellerImage}
                  />
                  <TouchableOpacity style={styles.bestsellerAddButton}>
                    <Ionicons name="add" size={16} color="#333" />
                  </TouchableOpacity>
                  <Text style={styles.bestsellerName}>Sample Product {item}</Text>
                  <Text style={styles.bestsellerWeight}>500 ml</Text>
                  <View style={styles.bestsellerPriceContainer}>
                    <Text style={styles.bestsellerMRP}>MRP-{40 + item * 10}</Text>
                    <Text style={styles.bestsellerPrice}>₹{30 + item * 5}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Quick Picks */}
          <TouchableOpacity style={styles.quickPicksButton}>
            <Text style={styles.quickPicksText}>Quick picks under ₹99</Text>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </TouchableOpacity>

          {/* Open Box Delivery */}
          <View style={styles.openBoxSection}>
            <Text style={styles.openBoxTitle}>📦 Rest assured with Open Box Delivery</Text>
            <Text style={styles.openBoxDescription}>
              The Wishmaster will open the package at your doorstep, kindly check and return for damaged or incorrect item, and report any missing item at the doorstep only.
            </Text>
          </View>

          {/* Price Details */}
          <View style={styles.priceDetailsSection}>
            <Text style={styles.priceDetailsTitle}>Price Details</Text>

            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>MRP ({cartItems.length} item{cartItems.length > 1 ? 's' : ''})</Text>
              <Text style={styles.priceValue}>₹{Math.round(mrpTotal)}</Text>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Product Discount</Text>
              <Text style={[styles.priceValue, styles.discountValue]}>- ₹{Math.round(savings)}</Text>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Platform Fee ℹ️</Text>
              <Text style={styles.priceValue}>₹{platformFee}</Text>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Delivery Fee</Text>
              <Text style={styles.priceValue}>₹{deliveryFee}</Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>₹{totalAmount}</Text>
            </View>

            {savings > 0 && (
              <Text style={styles.savingsNote}>You will save ₹{Math.round(savings)} on this order</Text>
            )}
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      )}

      {/* Bottom Bar */}
      {(cartItems.length > 0 || outOfStockItems.length > 0) && (
        <View style={styles.bottomBar}>
          <Text style={styles.freeDeliveryText}>
            Add items worth ₹{Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal)} more for FREE delivery
          </Text>

          <View style={styles.checkoutSection}>
            <View>
              <Text style={styles.totalText}>{totalAmount}</Text>
              <TouchableOpacity>
                <Text style={styles.viewDetailsText}>View price details</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.continueButton}
              onPress={() => router.push('/checkout')}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  headerRight: {
    width: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#1976D2',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
  },
  addressSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  deliverToText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  addressName: {
    fontWeight: '600',
  },
  addressDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    flex: 1,
  },
  changeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#1976D2',
    borderRadius: 4,
  },
  changeButtonText: {
    color: '#1976D2',
    fontSize: 12,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  offersContainer: {
    padding: 16,
    backgroundColor: '#F8F9FA',
  },
  offerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  offerText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  bankOfferBanner: {
    backgroundColor: '#FFF3C4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  bankOfferText: {
    fontSize: 12,
    color: '#F57C00',
    fontWeight: '500',
  },
  bankOfferCondition: {
    fontSize: 10,
    color: '#F57C00',
    marginTop: 2,
  },
  savingsBanner: {
    backgroundColor: '#C8E6C9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  savingsText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
  },
  viewAllOffers: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  viewAllOffersText: {
    marginLeft: 8,
    marginRight: 4,
    fontSize: 12,
    color: '#00A86B',
    fontWeight: '500',
  },
  outOfStockHeader: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  outOfStockHeaderText: {
    color: '#C62828',
    fontSize: 12,
    fontWeight: '500',
  },
  cartItemCard: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  outOfStockCard: {
    opacity: 0.6,
  },
  cartItemImage: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
  },
  outOfStockImage: {
    opacity: 0.5,
  },
  cartItemDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    lineHeight: 18,
  },
  cartItemWeight: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  originalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
    marginLeft: 8,
  },
  coinReward: {
    fontSize: 11,
    color: '#1976D2',
    marginTop: 4,
  },
  outOfStockText: {
    color: '#F44336',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
  },
  findSimilarText: {
    color: '#1976D2',
    fontSize: 12,
    marginTop: 4,
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    backgroundColor: '#F8F8F8',
  },
  quantityButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 32,
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '500',
    paddingHorizontal: 12,
    minWidth: 32,
    textAlign: 'center',
  },
  removeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    backgroundColor: '#F8F8F8',
  },
  removeButtonText: {
    fontSize: 12,
    color: '#666',
  },
  tryItSection: {
    backgroundColor: '#F0F8FF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  tryItHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tryItTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  tryItSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  tryItIcon: {
    width: 40,
    height: 40,
  },
  sampleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
  },
  sampleImage: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
  sampleDetails: {
    flex: 1,
    marginLeft: 12,
  },
  sampleName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
  },
  samplePriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  samplePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  sampleOriginalPrice: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  sampleDiscount: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  sampleDiscountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  sampleAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1976D2',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 8,
    backgroundColor: '#FFFFFF',
  },
  sampleAddText: {
    color: '#1976D2',
    fontSize: 12,
    fontWeight: '500',
    marginRight: 4,
  },
  bestsellerSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  bestsellerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  bestsellerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  bestsellerCard: {
    width: 120,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    position: 'relative',
  },
  bestsellerDiscount: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 1,
  },
  bestsellerDiscountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  bestsellerImage: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginTop: 16,
  },
  bestsellerAddButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  bestsellerName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  bestsellerWeight: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
  },
  bestsellerPriceContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  bestsellerMRP: {
    fontSize: 10,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 4,
  },
  bestsellerPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  quickPicksButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  quickPicksText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1976D2',
  },
  openBoxSection: {
    backgroundColor: '#F0F8FF',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  openBoxTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  openBoxDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  priceDetailsSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 16,
  },
  priceDetailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  discountValue: {
    color: '#4CAF50',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  savingsNote: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
  },
  bottomBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  freeDeliveryText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  checkoutSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  viewDetailsText: {
    fontSize: 12,
    color: '#1976D2',
    marginTop: 2,
  },
  continueButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyCartImage: {
    width: 200,
    height: 200,
    marginBottom: 24,
  },
  emptyCartTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyCartSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  startShoppingButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  startShoppingButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  swipeRemoveButton: {
    backgroundColor: '#CB202D',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  swipeRemoveText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default CartScreen;