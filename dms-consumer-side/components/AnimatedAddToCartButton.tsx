import React, { useState, useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AnimatedAddToCartButtonProps {
  onPress: () => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'outline';
  text?: string;
  showIcon?: boolean;
  style?: any;
}

const AnimatedAddToCartButton: React.FC<AnimatedAddToCartButtonProps> = ({
  onPress,
  disabled = false,
  size = 'medium',
  variant = 'primary',
  text = 'ADD +',
  showIcon = true,
  style,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    setIsPressed(true);
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const handlePress = () => {
    // Bounce animation when pressed
    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(bounceAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onPress();
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 };
      case 'large':
        return { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24 };
      default: // medium
        return { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 };
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: '#F0F0F0',
          borderColor: '#E0E0E0',
          borderWidth: 1,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: '#00A86B',
          borderWidth: 1.5,
        };
      default: // primary
        return {
          backgroundColor: '#00A86B',
          borderColor: '#00A86B',
          borderWidth: 0,
        };
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'outline':
        return '#00A86B';
      case 'secondary':
        return '#333333';
      default:
        return '#FFFFFF';
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'outline':
        return '#00A86B';
      case 'secondary':
        return '#333333';
      default:
        return '#FFFFFF';
    }
  };

  return (
    <Animated.View
      style={[
        {
          transform: [
            { scale: scaleAnim },
            {
              translateY: bounceAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -2],
              }),
            },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.button,
          getSizeStyles(),
          getVariantStyles(),
          disabled && styles.disabled,
          style,
        ]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
        disabled={disabled}
      >
        <View style={styles.content}>
          {showIcon && (
            <Ionicons
              name="add-circle-outline"
              size={size === 'small' ? 16 : size === 'large' ? 20 : 18}
              color={getIconColor()}
              style={styles.icon}
            />
          )}
          <Text
            style={[
              styles.text,
              {
                color: getTextColor(),
                fontSize: size === 'small' ? 12 : size === 'large' ? 16 : 14,
                fontWeight: size === 'small' ? '500' : '600',
              },
            ]}
          >
            {text}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 4,
  },
  text: {
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});

export default AnimatedAddToCartButton;
