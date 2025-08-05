import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  interpolate
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  width: customWidth, 
  height, 
  borderRadius = 8,
  style 
}) => {
  const animatedValue = useSharedValue(0);

  React.useEffect(() => {
    animatedValue.value = withRepeat(
      withTiming(1, { duration: 1000 }),
      -1,
      true
    );
    
    return () => {
      animatedValue.value = 0;
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(animatedValue.value, [0, 0.5, 1], [0.3, 0.7, 0.3]);
    return { opacity };
  });

  // Handle string widths by converting to numbers
  const getWidth = () => {
    if (typeof customWidth === 'string') {
      if (customWidth.includes('%')) {
        const percentage = parseFloat(customWidth.replace('%', ''));
        return (width * percentage) / 100;
      }
      return width; // fallback to full width
    }
    return customWidth || width;
  };

  return (
    <Animated.View style={[animatedStyle, style]}>
      <View
        style={[
          styles.skeleton,
          {
            width: getWidth(),
            height: height || 20,
            borderRadius,
          },
        ]}
      >
        <LinearGradient
          colors={['#f0f0f0', '#e0e0e0', '#f0f0f0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.gradient,
            {
              width: getWidth(),
              height: height || 20,
              borderRadius,
            },
          ]}
        />
      </View>
    </Animated.View>
  );
};

const ProductCardSkeleton: React.FC<{ cardWidth?: number }> = ({ cardWidth }) => {
  const width = cardWidth || (Dimensions.get('window').width - 48) / 2;
  const imageHeight = width;

  return (
    <View style={[styles.productCardSkeleton, { width }]}>
      <SkeletonLoader width="100%" height={imageHeight} borderRadius={8} />
      <View style={styles.productInfoSkeleton}>
        <SkeletonLoader width="80%" height={12} style={{ marginBottom: 4 }} />
        <SkeletonLoader width="60%" height={10} style={{ marginBottom: 8 }} />
        <SkeletonLoader width="40%" height={14} />
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
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
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

export { SkeletonLoader, ProductCardSkeleton, HorizontalProductSkeleton, GridProductSkeleton };
export default SkeletonLoader; 