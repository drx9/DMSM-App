import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

interface ProductDetailScreenProps {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  rating: number;
  reviewCount: number;
  discount: number;
  isOutOfStock: boolean;
  reviews: Review[];
}

const ProductDetailScreen = ({
  id,
  name,
  price,
  image,
  description,
  rating,
  reviewCount,
  discount,
  isOutOfStock,
  reviews,
}: ProductDetailScreenProps) => {
  const { t } = useLanguage();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');

  const handleAddToCart = () => {
    // Implement add to cart logic here
    Alert.alert('Success', 'Product added to cart');
  };

  const handleSubmitReview = () => {
    // Implement review submission logic here
    setShowReviewForm(false);
    setReviewRating(0);
    setReviewComment('');
    Alert.alert('Success', 'Review submitted successfully');
  };

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={20}
            color="#FFD700"
          />
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton}>
            <Ionicons name="share-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <Image source={{ uri: image }} style={styles.productImage} />

        <View style={styles.content}>
          <Text style={styles.productName}>{name}</Text>
          
          <View style={styles.priceContainer}>
            <Text style={styles.price}>₹{price}</Text>
            {discount > 0 && (
              <View style={styles.discountContainer}>
                <Text style={styles.originalPrice}>
                  ₹{Math.round(price * (1 + discount / 100))}
                </Text>
                <Text style={styles.discount}>{discount}% OFF</Text>
              </View>
            )}
          </View>

          <View style={styles.ratingContainer}>
            {renderStars(rating)}
            <Text style={styles.reviewCount}>({reviewCount} reviews)</Text>
          </View>

          <Text style={styles.description}>{description}</Text>

          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>Quantity:</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Ionicons name="remove" size={20} color="#333" />
              </TouchableOpacity>
              <Text style={styles.quantity}>{quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(quantity + 1)}
              >
                <Ionicons name="add" size={20} color="#333" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.addToCartButton, isOutOfStock && styles.disabledButton]}
            onPress={handleAddToCart}
            disabled={isOutOfStock}
          >
            <Text style={styles.addToCartText}>
              {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </Text>
          </TouchableOpacity>

          <View style={styles.reviewsSection}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.reviewsTitle}>Customer Reviews</Text>
              <TouchableOpacity
                style={styles.writeReviewButton}
                onPress={() => setShowReviewForm(true)}
              >
                <Text style={styles.writeReviewText}>Write a Review</Text>
              </TouchableOpacity>
            </View>

            {reviews.map((review) => (
              <View key={review.id} style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewerName}>{review.userName}</Text>
                  <Text style={styles.reviewDate}>{review.date}</Text>
                </View>
                {renderStars(review.rating)}
                <Text style={styles.reviewComment}>{review.comment}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {showReviewForm && (
        <View style={styles.reviewFormOverlay}>
          <View style={styles.reviewForm}>
            <View style={styles.reviewFormHeader}>
              <Text style={styles.reviewFormTitle}>Write a Review</Text>
              <TouchableOpacity onPress={() => setShowReviewForm(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.ratingInput}>
              <Text style={styles.ratingLabel}>Rating:</Text>
              <View style={styles.starsInput}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setReviewRating(star)}
                  >
                    <Ionicons
                      name={star <= reviewRating ? 'star' : 'star-outline'}
                      size={30}
                      color="#FFD700"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TextInput
              style={styles.reviewInput}
              placeholder="Write your review..."
              multiline
              value={reviewComment}
              onChangeText={setReviewComment}
            />

            <TouchableOpacity
              style={styles.submitReviewButton}
              onPress={handleSubmitReview}
            >
              <Text style={styles.submitReviewText}>Submit Review</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  backButton: {
    padding: 8,
  },
  shareButton: {
    padding: 8,
  },
  productImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  content: {
    padding: 16,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#CB202D',
  },
  discountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  originalPrice: {
    fontSize: 16,
    color: '#666666',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  discount: {
    fontSize: 14,
    color: '#CB202D',
    backgroundColor: '#FFE4E4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  reviewCount: {
    fontSize: 14,
    color: '#666666',
  },
  description: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
    marginBottom: 16,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  quantityLabel: {
    fontSize: 16,
    color: '#333333',
    marginRight: 16,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
  },
  quantity: {
    fontSize: 16,
    color: '#333333',
    marginHorizontal: 16,
  },
  addToCartButton: {
    backgroundColor: '#CB202D',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  addToCartText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reviewsSection: {
    marginTop: 24,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reviewsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  writeReviewButton: {
    padding: 8,
  },
  writeReviewText: {
    color: '#CB202D',
    fontSize: 14,
  },
  reviewItem: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  reviewDate: {
    fontSize: 14,
    color: '#666666',
  },
  reviewComment: {
    fontSize: 14,
    color: '#333333',
    marginTop: 8,
  },
  reviewFormOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewForm: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
  },
  reviewFormHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  reviewFormTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  ratingInput: {
    marginBottom: 16,
  },
  ratingLabel: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 8,
  },
  starsInput: {
    flexDirection: 'row',
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 8,
    padding: 12,
    height: 120,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  submitReviewButton: {
    backgroundColor: '#CB202D',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitReviewText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProductDetailScreen; 