import { Dimensions, Platform, StatusBar } from 'react-native';

const { width, height } = Dimensions.get('window');

// Device dimensions
export const DEVICE_WIDTH = width;
export const DEVICE_HEIGHT = height;

// Status bar height
export const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

// Safe area insets (approximate values for different devices)
export const SAFE_AREA_TOP = Platform.OS === 'ios' ? 44 : STATUS_BAR_HEIGHT;
export const SAFE_AREA_BOTTOM = Platform.OS === 'ios' ? 34 : 0;

// Responsive font sizes
export const getResponsiveFontSize = (size: number) => {
  const scale = DEVICE_WIDTH / 375; // Base width (iPhone X)
  return Math.round(size * scale);
};

// Responsive dimensions
export const getResponsiveWidth = (percentage: number) => {
  return (DEVICE_WIDTH * percentage) / 100;
};

export const getResponsiveHeight = (percentage: number) => {
  return (DEVICE_HEIGHT * percentage) / 100;
};

// Device type detection
export const isSmallDevice = DEVICE_WIDTH < 375;
export const isMediumDevice = DEVICE_WIDTH >= 375 && DEVICE_WIDTH < 414;
export const isLargeDevice = DEVICE_WIDTH >= 414;

// Common spacing values
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Responsive spacing
export const getResponsiveSpacing = (baseSpacing: number) => {
  if (isSmallDevice) return baseSpacing * 0.8;
  if (isLargeDevice) return baseSpacing * 1.2;
  return baseSpacing;
}; 