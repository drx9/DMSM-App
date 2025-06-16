import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '../context/LanguageContext';

// Mock Cart Item Data
interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

const mockCartItems: CartItem[] = [
  { id: 1, name: 'Amul Taaza Toned Fresh Milk', price: 27, quantity: 1, image: 'https://raw.githubusercontent.com/sujal02/Blinkit-Images/main/milk.png' },
  { id: 2, name: 'Potata (Aloo)', price: 37, quantity: 2, image: 'https://raw.githubusercontent.com/sujal02/Blinkit-Images/main/potato.png' },
  { id: 3, name: 'Hybrid Tomato', price: 37, quantity: 1, image: 'https://raw.githubusercontent.com/sujal02/Blinkit-Images/main/tomato.png' },
];

const CartScreen = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>(mockCartItems); // Start with mock data
  const router = useRouter();
  const { t } = useLanguage();

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleQuantityChange = (itemId: number, newQuantity: number) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity > 0 ? newQuantity : 1 } : item
      )
    );
  };

  const handleRemoveItem = (itemId: number) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItemCard}>
      <Image source={{ uri: item.image }} style={styles.cartItemImage} />
      <View style={styles.cartItemDetails}>
        <Text style={styles.cartItemName}>{item.name}</Text>
        <Text style={styles.cartItemPrice}>₹{item.price}</Text>
        <View style={styles.cartItemQuantityControl}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleQuantityChange(item.id, item.quantity - 1)}
            disabled={item.quantity === 1}
          >
            <Text style={styles.quantityButtonText}>-</Text>
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
      <TouchableOpacity 
        style={styles.removeButton}
        onPress={() => handleRemoveItem(item.id)}
      >
        <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bag</Text>
      </View>

      {cartItems.length === 0 ? (
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
        <View style={styles.cartContent}>
          <FlatList
            data={cartItems}
            renderItem={renderCartItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.cartListContent}
            showsVerticalScrollIndicator={false}
          />

          {/* Cart Summary */}
          <View style={styles.cartSummary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryText}>Item Total</Text>
              <Text style={styles.summaryText}>₹{calculateTotal().toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryText}>Delivery Charges</Text>
              <Text style={styles.summaryText}>₹0.00</Text>
            </View>
            <View style={styles.summaryRowTotal}>
              <Text style={styles.summaryTotalText}>Grand Total</Text>
              <Text style={styles.summaryTotalText}>₹{calculateTotal().toFixed(2)}</Text>
            </View>
            <TouchableOpacity style={styles.checkoutButton}>
              <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
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
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1C',
  },
  // Empty Cart Styles
  emptyCartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyCartImage: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  emptyCartTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1C1C1C',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyCartSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  startShoppingButton: {
    backgroundColor: '#CB202D',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  startShoppingButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Cart with Items Styles
  cartContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  cartListContent: {
    paddingVertical: 16,
  },
  cartItemCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cartItemImage: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    marginRight: 12,
    borderRadius: 4,
  },
  cartItemDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1C',
    marginBottom: 4,
  },
  cartItemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1C1C1C',
    marginBottom: 8,
  },
  cartItemQuantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 5,
  },
  quantityButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#CB202D',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    color: '#1C1C1C',
  },
  removeButton: {
    marginLeft: 12,
    padding: 8,
  },
  cartSummary: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 16,
    color: '#666666',
  },
  summaryRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  summaryTotalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1C',
  },
  checkoutButton: {
    backgroundColor: '#4CAF50', // Green color for checkout
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  checkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CartScreen; 