import { View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@react-navigation/native';

// This is a shim for web and Android where the tab bar is generally opaque.
export default function TabBarBackground() {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      {/* You can add a BlurView here if you want a translucent effect on iOS */}
      {/* <BlurView intensity={100} style={StyleSheet.absoluteFill} /> */}
    </View>
  );
}

export function useBottomTabOverflow() {
  return 0;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Default background for the tab bar
  },
});
