import { useLocalSearchParams } from 'expo-router';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import { useEffect, useState } from 'react';
import productService from '../services/productService';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discount: number;
  stock: number;
  image: string; // Main product image
  images: string[]; // Additional product images
  rating: number;
  reviewCount: number;
  isOutOfStock: boolean;
  reviews: Array<{
    id: string;
    userId: string;
    userName: string;
    rating: number;
    comment: string;
    date: string;
  }>;
}

export default function ProductDetail() {
  const { id } = useLocalSearchParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await productService.getProductById(id as string);
        // Set the first image as the main image if available
        const productData = {
          ...data,
          image: data.images?.[0] || '',
          reviews: [] // Add empty reviews array
        };
        setProduct(productData);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#CB202D" />
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error || 'Product not found'}</Text>
      </View>
    );
  }

  return <ProductDetailScreen {...product} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
}); 