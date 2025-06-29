import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
<<<<<<< HEAD
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const CartScreen = () => {
  const [cartItems, setCartItems] = useState([
    {
      id: '1',
      name: 'Fresh Tomatoes',
      price: 45,
      quantity: 2,
      image: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400',
      unit: '500g',
    },
    {
      id: '2',
      name: 'Organic Bananas',
      price: 30,
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400',
      unit: '1kg',
    },
    {
      id: '3',
      name: 'Fresh Milk',
      price: 60,
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400',
      unit: '1L',
    },
  ]);

  const router = useRouter();

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      Alert.alert(
        'Remove Item',
        'Do you want to remove this item from cart?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => {
              setCartItems(cartItems.filter(item => item.id !== itemId));
            },
          },
        ]
      );
      return;
    }

    setCartItems(cartItems.map(item =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    ));
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateDeliveryFee = () => {
    const subtotal = calculateSubtotal();
    return subtotal > 500 ? 0 : 40;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateDeliveryFee();
  };

  const handleCheckout = () => {
    Alert.alert(
      'Checkout',
      'Proceed to checkout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Proceed', onPress: () => console.log('Proceeding to checkout') },
      ]
    );
  };

  if (cartItems.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#CB202D" />
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Cart</Text>
        </View>

        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="cart-outline" size={80} color="#CCCCCC" />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Add some items to get started</Text>
          <TouchableOpacity 
            style={styles.shopNowButton}
            onPress={() => router.push('/(tabs)')}
          >
            <Text style={styles.shopNowButtonText}>Shop Now</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
=======
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

// Cart Item Interface
interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  weight?: string;
  originalPrice?: number;
  discount?: number;
  inStock: boolean;
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

  // Free delivery threshold
  const FREE_DELIVERY_THRESHOLD = 399;

  useEffect(() => {
    loadUserDataAndCart();
  }, []);

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
      const items = response.data.map((item: any) => ({
        id: item.id,
        name: item.Product?.name || '',
        price: item.Product?.price || 0,
        quantity: item.quantity,
        image: item.Product?.images?.[0] || '',
        weight: `${Math.floor(Math.random() * 500) + 50} g`,
        originalPrice: Math.floor((item.Product?.price || 0) * 1.4),
        discount: Math.floor(Math.random() * 30) + 10,
        inStock: Math.random() > 0.3, // 30% chance of being out of stock
      }));

      // Separate in-stock and out-of-stock items
      const inStockItems = items.filter((item: CartItem) => item.inStock);
      const outOfStockItems = items.filter((item: CartItem) => !item.inStock);

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

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const calculateTotalSavings = () => {
    return cartItems.reduce((sum, item) => {
      const originalPrice = item.originalPrice || item.price * 1.4;
      return sum + (originalPrice - item.price) * item.quantity;
    }, 0);
  };

  const handleQuantityChange = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      // Update local state immediately for better UX
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );

      // Update on server
      if (userId) {
        await axios.put(`${API_URL}/cart/${userId}/${itemId}`, {
          quantity: newQuantity
        });
      }
    } catch (error) {
      console.error('Failed to update quantity:', error);
      // Revert on error
      fetchCartItems(userId!);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    try {
      setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));

      if (userId) {
        await axios.delete(`${API_URL}/cart/${userId}/${itemId}`);
      }
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

  const renderInStockItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItemCard}>
      <Image source={{ uri: item.image }} style={styles.cartItemImage} />
      <View style={styles.cartItemDetails}>
        <Text style={styles.cartItemName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.cartItemWeight}>{item.weight}</Text>
        <View style={styles.priceContainer}>
          <Text style={styles.currentPrice}>₹{item.price}</Text>
          <Text style={styles.originalPrice}>₹{item.originalPrice}</Text>
        </View>
        <Text style={styles.coinReward}>Or Pay ₹{item.price - 2} + 🪙 2</Text>
      </View>
      <View style={styles.rightSection}>
        <View style={styles.quantityControls}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleQuantityChange(item.id, item.quantity - 1)}
            disabled={item.quantity === 1}
          >
            <Text style={styles.quantityButtonText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.quantityText}>{item.quantity}</Text>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleQuantityChange(item.id, item.quantity + 1)}
          >
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderOutOfStockItem = ({ item }: { item: CartItem }) => (
    <View style={[styles.cartItemCard, styles.outOfStockCard]}>
      <Image source={{ uri: item.image }} style={[styles.cartItemImage, styles.outOfStockImage]} />
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
>>>>>>> 5b1e092b48191a9f44b616b6b96a360b398d3789

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const subtotal = calculateSubtotal();
  const savings = calculateTotalSavings();
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : 39;
  const platformFee = 9;
  const totalAmount = subtotal + deliveryFee + platformFee;

  return (
<<<<<<< HEAD
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#CB202D" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Cart</Text>
        <TouchableOpacity style={styles.clearButton}>
          <Text style={styles.clearButtonText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Cart Items */}
        <View style={styles.itemsContainer}>
          {cartItems.map((item) => (
            <View key={item.id} style={styles.cartItem}>
              <Image source={{ uri: item.image }} style={styles.itemImage} />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemUnit}>{item.unit}</Text>
                <Text style={styles.itemPrice}>₹{item.price}</Text>
              </View>
              <View style={styles.quantityContainer}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => updateQuantity(item.id, item.quantity - 1)}
                >
                  <Ionicons name="remove" size={16} color="#CB202D" />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{item.quantity}</Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => updateQuantity(item.id, item.quantity + 1)}
                >
                  <Ionicons name="add" size={16} color="#CB202D" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Delivery Info */}
        <View style={styles.deliveryInfo}>
          <View style={styles.deliveryRow}>
            <Ionicons name="time-outline" size={20} color="#CB202D" />
            <Text style={styles.deliveryText}>Delivery in 10 minutes</Text>
          </View>
          <View style={styles.deliveryRow}>
            <Ionicons name="location-outline" size={20} color="#CB202D" />
            <Text style={styles.deliveryText}>Deliver to: Home - Jodhpur, Rajasthan</Text>
=======
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
              keyExtractor={(item) => item.id.toString()}
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
              <Text style={styles.priceValue}>₹{Math.round(subtotal + savings)}</Text>
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
>>>>>>> 5b1e092b48191a9f44b616b6b96a360b398d3789
          </View>
        </View>

        {/* Price Breakdown */}
        <View style={styles.priceBreakdown}>
          <Text style={styles.breakdownTitle}>Price Details</Text>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Subtotal</Text>
            <Text style={styles.breakdownValue}>₹{calculateSubtotal()}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Delivery Fee</Text>
            <Text style={styles.breakdownValue}>
              {calculateDeliveryFee() === 0 ? 'FREE' : `₹${calculateDeliveryFee()}`}
            </Text>
          </View>
          {calculateDeliveryFee() > 0 && (
            <View style={styles.savingsInfo}>
              <Text style={styles.savingsText}>
                Add ₹{500 - calculateSubtotal()} more for FREE delivery
              </Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{calculateTotal()}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Checkout Button */}
      <View style={styles.checkoutContainer}>
        <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
          <Text style={styles.checkoutButtonText}>
            Proceed to Checkout • ₹{calculateTotal()}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
<<<<<<< HEAD
  header: {
    backgroundColor: '#CB202D',
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 32,
  },
  shopNowButton: {
    backgroundColor: '#CB202D',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopNowButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  itemsContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  cartItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
=======
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
>>>>>>> 5b1e092b48191a9f44b616b6b96a360b398d3789
  },
  itemInfo: {
    flex: 1,
<<<<<<< HEAD
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  itemUnit: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 4,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
  },
  deliveryInfo: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  deliveryText: {
    fontSize: 14,
    color: '#1A1A1A',
    marginLeft: 8,
  },
  priceBreakdown: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#666666',
  },
  breakdownValue: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  savingsInfo: {
    backgroundColor: '#FFF5F5',
    padding: 8,
    borderRadius: 6,
    marginVertical: 8,
  },
  savingsText: {
    fontSize: 12,
    color: '#CB202D',
    textAlign: 'center',
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#CB202D',
  },
  checkoutContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  checkoutButton: {
    backgroundColor: '#CB202D',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
=======
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
>>>>>>> 5b1e092b48191a9f44b616b6b96a360b398d3789
  },
});

export default CartScreen;