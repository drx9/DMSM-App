import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { addToWishlist, removeFromWishlist } from '../app/services/wishlistService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-root-toast';
import { useCart } from '../app/context/CartContext';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image: string;
  rating: number;
  reviewCount: number;
  discount?: number;
  isOutOfStock?: boolean;
  onPress?: () => void;
  onAddToCart?: () => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (wishlisted: boolean) => void;
  cardWidth?: number;
}

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // 2 columns with padding

const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  price,
  image,
  rating,
  reviewCount,
  discount,
  isOutOfStock = false,
  onPress,
  onAddToCart,
  isWishlisted = false,
  onToggleWishlist,
  cardWidth,
}) => {
  const router = useRouter();
  const { addToCart } = useCart();
  const [wishlisted, setWishlisted] = React.useState(isWishlisted);
  React.useEffect(() => { setWishlisted(isWishlisted); }, [isWishlisted]);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push({
        pathname: '/product/[id]',
        params: { id }
      });
    }
  };

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart();
    } else {
      addToCart(id).then(() => {
        alert('Added to cart!');
      });
    }
  };

  const handleWishlist = async () => {
    const userId = await AsyncStorage.getItem('userId');
    if (!userId) return Toast.show('Login required', { duration: 1500 });
    if (wishlisted) {
      await removeFromWishlist(userId, id);
      setWishlisted(false);
      Toast.show('Product removed from wishlist', { duration: 1500 });
      onToggleWishlist && onToggleWishlist(false);
    } else {
      await addToWishlist(userId, id);
      setWishlisted(true);
      Toast.show('Product added to wishlist', { duration: 1500 });
      onToggleWishlist && onToggleWishlist(true);
    }
  };

  const safePrice = Number(price) || 0;
  const safeDiscount = Math.max(0, Math.min(100, Number(discount) || 0));
  const salePrice = safePrice - (safePrice * safeDiscount) / 100;

  const computedCardWidth = cardWidth || (width - 48) / 2;

  return (
    <TouchableOpacity
      style={[styles.container, { width: computedCardWidth }]}
      onPress={handlePress}
      disabled={isOutOfStock}
    >
      <View style={[styles.imageContainer, { height: computedCardWidth }]}>
        <Image
          source={{ uri: image }}
          style={styles.image}
          resizeMode="cover"
        />
        {safeDiscount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{safeDiscount}% OFF</Text>
          </View>
        )}
        {isOutOfStock && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        )}
        {/* Wishlist Heart Button */}
        <TouchableOpacity
          style={styles.wishlistButton}
          onPress={e => { e.stopPropagation && e.stopPropagation(); handleWishlist(); }}
        >
          <Ionicons name={wishlisted ? 'heart' : 'heart-outline'} size={22} color={wishlisted ? '#CB202D' : '#fff'} />
        </TouchableOpacity>
        {/* Cart Icon Button */}
        {!isOutOfStock && (
          <TouchableOpacity
            style={styles.cartIconButton}
            onPress={handleAddToCart}
          >
            <Ionicons name="cart" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.detailsContainer}>
        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>

        <View style={styles.priceContainer}>
          <Text style={styles.price}>₹{Number(salePrice).toFixed(2)}</Text>
          {safeDiscount > 0 && (
            <Text style={styles.originalPrice}>₹{Number(safePrice).toFixed(2)}</Text>
          )}
        </View>

        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.rating}>{(typeof rating === 'number' ? rating : 0).toFixed(1)}</Text>
          <Text style={styles.reviewCount}>({reviewCount})</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  outOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  detailsContainer: {
    padding: 12,
  },
  name: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    color: '#333333',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
  },
  originalPrice: {
    fontSize: 12,
    color: '#999999',
    textDecorationLine: 'line-through',
    marginLeft: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 12,
    color: '#333333',
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 10,
    color: '#999999',
    marginLeft: 4,
  },
  cartIconButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#CB202D',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    elevation: 4,
  },
  wishlistButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 3,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProductCard; 