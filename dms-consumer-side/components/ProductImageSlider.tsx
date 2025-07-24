import React, { useRef, useState } from 'react';
import { View, Image, ScrollView, StyleSheet, Dimensions } from 'react-native';

interface ProductImageSliderProps {
  images: string[];
}

const { width } = Dimensions.get('window');

const ProductImageSlider: React.FC<ProductImageSliderProps> = ({ images }) => {
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = (event: any) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveIndex(slide);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {images.length > 0 ? images.map((img, idx) => (
          <Image
            key={idx}
            source={{ uri: img }}
            style={styles.image}
            resizeMode="contain"
          />
        )) : (
          <Image
            source={{ uri: 'https://via.placeholder.com/280x200?text=No+Image' }}
            style={styles.image}
            resizeMode="contain"
          />
        )}
      </ScrollView>
      <View style={styles.dotsContainer}>
        {(images.length > 0 ? images : [1]).map((_, idx) => (
          <View
            key={idx}
            style={[styles.dot, activeIndex === idx && styles.activeDot]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: '#fff',
  },
  scrollView: {
    width: '100%',
  },
  image: {
    width: width,
    height: 200,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 3,
  },
  activeDot: {
    backgroundColor: '#4CAF50',
  },
});

export default ProductImageSlider; 