import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface SimpleSkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

const SimpleSkeletonLoader: React.FC<SimpleSkeletonLoaderProps> = ({ 
  width: customWidth, 
  height, 
  borderRadius = 8,
  style 
}) => {
  const getWidth = () => {
    if (typeof customWidth === 'string') {
      if (customWidth.includes('%')) {
        const percentage = parseFloat(customWidth.replace('%', ''));
        return (width * percentage) / 100;
      }
      return width;
    }
    return customWidth || width;
  };

  return (
    <View
      style={[
        styles.skeleton,
        {
          width: getWidth(),
          height: height || 20,
          borderRadius,
        },
        style
      ]}
    />
  );
};

const ProductCardSkeleton: React.FC<{ cardWidth?: number }> = ({ cardWidth }) => {
  const cardWidthValue = cardWidth || (Dimensions.get('window').width - 48) / 2;
  const imageHeight = cardWidthValue;

  return (
    <View style={[styles.productCardSkeleton, { width: cardWidthValue }]}>
      <SimpleSkeletonLoader width="100%" height={imageHeight} borderRadius={8} />
      <View style={styles.productInfoSkeleton}>
        <SimpleSkeletonLoader width="80%" height={12} style={{ marginBottom: 4 }} />
        <SimpleSkeletonLoader width="60%" height={10} style={{ marginBottom: 8 }} />
        <SimpleSkeletonLoader width="40%" height={14} />
      </View>
    </View>
  );
};

const HorizontalProductSkeleton: React.FC = () => {
  return (
    <View style={styles.horizontalContainer}>
      {[1, 2, 3].map((item) => (
        <ProductCardSkeleton key={item} cardWidth={120} />
      ))}
    </View>
  );
};

const GridProductSkeleton: React.FC = () => {
  return (
    <View style={styles.gridContainer}>
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <ProductCardSkeleton key={item} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#f0f0f0',
  },
  productCardSkeleton: {
    margin: 4,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productInfoSkeleton: {
    padding: 12,
  },
  horizontalContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
});

export { SimpleSkeletonLoader as SkeletonLoader, ProductCardSkeleton, HorizontalProductSkeleton, GridProductSkeleton };
export default SimpleSkeletonLoader; 