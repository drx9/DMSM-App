import type { PropsWithChildren, ReactElement, useRef, useEffect } from 'react';
import { StyleSheet, Animated } from 'react-native';

import { ThemedView } from '@/components/ThemedView';
import { useBottomTabOverflow } from '@/components/ui/TabBarBackground';
import { useColorScheme } from '@/hooks/useColorScheme';

const HEADER_HEIGHT = 250;

type Props = PropsWithChildren<{}>;

export default function ParallaxScrollView({
  children,
}: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const scrollRef = useRef(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const bottom = useBottomTabOverflow();
  
  const headerStyle = {
    transform: [
      {
        translateY: scrollY.interpolate({
          inputRange: [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
          outputRange: [-HEADER_HEIGHT / 2, 0, HEADER_HEIGHT * 0.75],
        }),
      },
      {
        scale: scrollY.interpolate({
          inputRange: [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
          outputRange: [2, 1, 1],
        }),
      },
    ],
  };

  return (
    <ThemedView style={styles.container}>
      <Animated.ScrollView
        ref={scrollRef}
        scrollEventThrottle={16}
        scrollIndicatorInsets={{ bottom }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        contentContainerStyle={{ paddingBottom: bottom }}>
        <Animated.View
          style={[
            styles.header,
            headerStyle,
          ]}>
        </Animated.View>
        <ThemedView style={styles.content}>{children}</ThemedView>
      </Animated.ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: HEADER_HEIGHT,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    padding: 32,
    gap: 16,
    overflow: 'hidden',
  },
});
