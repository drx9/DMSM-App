import { useEffect, useRef } from 'react';
import { StyleSheet, Animated } from 'react-native';

import { ThemedText } from '@/components/ThemedText';

export function HelloWave() {
  const rotationAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(rotationAnimation, {
          toValue: 25,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(rotationAnimation, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
      4 // Run the animation 4 times
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const animatedStyle = {
    transform: [{ 
      rotate: rotationAnimation.interpolate({
        inputRange: [0, 25],
        outputRange: ['0deg', '25deg'],
      })
    }],
  };

  return (
    <Animated.View style={animatedStyle}>
      <ThemedText style={styles.text}>👋</ThemedText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 28,
    lineHeight: 32,
    marginTop: -6,
  },
});
